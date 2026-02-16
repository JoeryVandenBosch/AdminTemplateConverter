import type { Express } from "express";
import { createServer, type Server } from "http";
import {
  getTenantInfo,
  getAdminTemplatePolicies,
  getPolicySettings,
  getPolicyAssignments,
  findMatchingSettingDefinition,
  createSettingsCatalogPolicy,
  assignSettingsCatalogPolicy,
  deleteAdminTemplatePolicyAssignments,
  resolveGroupNames,
  searchGroups,
  buildSettingsCatalogSetting,
} from "./graphClient";
import { convertPolicySchema } from "@shared/schema";
import { log } from "./index";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/tenant-info", async (_req, res) => {
    try {
      const info = await getTenantInfo();
      res.json(info);
    } catch (error: any) {
      res.json({ connected: false, error: error.message });
    }
  });

  app.get("/api/policies", async (_req, res) => {
    try {
      const policies = await getAdminTemplatePolicies();
      res.json(policies);
    } catch (error: any) {
      log(`Failed to fetch policies: ${error.message}`, "routes");
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/policies/:id/settings", async (req, res) => {
    try {
      const settings = await getPolicySettings(req.params.id);
      res.json(settings);
    } catch (error: any) {
      log(`Failed to fetch settings: ${error.message}`, "routes");
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/policies/:id/assignments", async (req, res) => {
    try {
      const assignments = await getPolicyAssignments(req.params.id);
      res.json(assignments);
    } catch (error: any) {
      log(`Failed to fetch assignments: ${error.message}`, "routes");
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/policies/:id/assignments/resolve", async (req, res) => {
    try {
      const assignments = await getPolicyAssignments(req.params.id);
      const groupIds = assignments
        .map((a: any) => a.target?.groupId)
        .filter(Boolean);

      const groupNames = groupIds.length > 0 ? await resolveGroupNames(groupIds) : {};

      const resolved = assignments.map((a: any) => {
        const target = a.target || {};
        const odataType = target["@odata.type"] || "";
        let targetType = "Unknown";
        let targetName = "";

        if (odataType.includes("allDevicesAssignmentTarget")) {
          targetType = "All Devices";
          targetName = "All Devices";
        } else if (odataType.includes("allLicensedUsersAssignmentTarget")) {
          targetType = "All Users";
          targetName = "All Licensed Users";
        } else if (odataType.includes("exclusionGroupAssignmentTarget")) {
          targetType = "Excluded Group";
          targetName = target.groupId ? groupNames[target.groupId] || target.groupId : "Unknown Group";
        } else if (odataType.includes("groupAssignmentTarget")) {
          targetType = "Included Group";
          targetName = target.groupId ? groupNames[target.groupId] || target.groupId : "Unknown Group";
        }

        return {
          id: a.id,
          targetType,
          targetName,
          groupId: target.groupId || null,
          filterType: target.deviceAndAppManagementAssignmentFilterType || null,
          filterId: target.deviceAndAppManagementAssignmentFilterId || null,
        };
      });

      res.json(resolved);
    } catch (error: any) {
      log(`Failed to resolve assignments: ${error.message}`, "routes");
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/groups/search", async (req, res) => {
    try {
      const query = (req.query.q as string) || "";
      if (query.length < 2) {
        return res.json([]);
      }
      const groups = await searchGroups(query);
      res.json(groups);
    } catch (error: any) {
      log(`Failed to search groups: ${error.message}`, "routes");
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/policies/:id/assignments", async (req, res) => {
    try {
      await deleteAdminTemplatePolicyAssignments(req.params.id);
      log(`Deleted assignments for policy ${req.params.id}`, "routes");
      res.json({ success: true });
    } catch (error: any) {
      log(`Failed to delete assignments: ${error.message}`, "routes");
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/settings-catalog/:id/assignments", async (req, res) => {
    try {
      const assignments = req.body.assignments;
      if (!Array.isArray(assignments)) {
        return res.status(400).json({ message: "assignments must be an array" });
      }
      await assignSettingsCatalogPolicy(req.params.id, assignments);
      log(`Added ${assignments.length} assignments to settings catalog policy ${req.params.id}`, "routes");
      res.json({ success: true });
    } catch (error: any) {
      log(`Failed to add assignments: ${error.message}`, "routes");
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/policies/convert", async (req, res) => {
    try {
      const parsed = convertPolicySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Invalid request",
          errors: parsed.error.errors,
        });
      }

      const { policyId, newName, newDescription, includeAssignments } =
        parsed.data;

      log(`Starting conversion for policy ${policyId}`, "routes");

      const settings = await getPolicySettings(policyId);

      if (!settings || settings.length === 0) {
        return res.json({
          policyName: newName,
          status: "failed",
          totalSettings: 0,
          convertedSettings: 0,
          failedSettings: 0,
          details: [],
          error: "No settings found in the source policy.",
        });
      }

      const conversionDetails: any[] = [];
      const catalogSettings: any[] = [];

      for (const setting of settings) {
        const definition = setting.definition;
        if (!definition) {
          conversionDetails.push({
            settingName: "Unknown Setting",
            categoryPath: "Unknown",
            status: "error",
            error: "Could not retrieve setting definition",
          });
          continue;
        }

        try {
          const matchResult = await findMatchingSettingDefinition(
            definition.displayName,
            definition.categoryPath || "",
            definition.classType || "machine",
            definition.definitionFile
          );

          if (matchResult) {
            const catalogSetting = buildSettingsCatalogSetting(
              matchResult.definition,
              setting.enabled,
              setting.presentationValues || []
            );
            catalogSettings.push(catalogSetting);
            conversionDetails.push({
              settingName: definition.displayName,
              categoryPath: definition.categoryPath || "Unknown",
              status: "converted",
              mappedDefinitionId:
                matchResult.definition.id ||
                matchResult.definition.settingDefinitionId,
              originalValue: setting.enabled ? "Enabled" : "Disabled",
            });
          } else {
            conversionDetails.push({
              settingName: definition.displayName,
              categoryPath: definition.categoryPath || "Unknown",
              status: "not_found",
              error: "No matching Settings Catalog definition found",
            });
          }
        } catch (err: any) {
          conversionDetails.push({
            settingName: definition.displayName,
            categoryPath: definition.categoryPath || "Unknown",
            status: "error",
            error: err.message,
          });
        }
      }

      const convertedCount = conversionDetails.filter(
        (d) => d.status === "converted"
      ).length;
      const failedCount = conversionDetails.filter(
        (d) => d.status !== "converted"
      ).length;

      if (catalogSettings.length === 0) {
        return res.json({
          policyName: newName,
          status: "failed",
          totalSettings: settings.length,
          convertedSettings: 0,
          failedSettings: settings.length,
          details: conversionDetails,
          error:
            "No settings could be mapped to Settings Catalog definitions. The settings may need to be mapped manually in the Intune portal.",
        });
      }

      try {
        const newPolicy = await createSettingsCatalogPolicy(
          newName,
          newDescription || `Converted from Administrative Template`,
          catalogSettings
        );

        log(
          `Successfully created Settings Catalog policy: ${newPolicy.id}`,
          "routes"
        );

        if (includeAssignments && newPolicy.id) {
          try {
            const sourceAssignments = await getPolicyAssignments(policyId);
            if (sourceAssignments.length > 0) {
              const mappedAssignments = sourceAssignments.map((a: any) => ({
                target: a.target,
              }));
              await assignSettingsCatalogPolicy(
                newPolicy.id,
                mappedAssignments
              );
              log(
                `Copied ${mappedAssignments.length} assignments to new policy`,
                "routes"
              );
            }
          } catch (assignErr: any) {
            log(
              `Failed to copy assignments: ${assignErr.message}`,
              "routes"
            );
          }
        }

        const status = failedCount === 0 ? "success" : "partial";

        return res.json({
          policyName: newName,
          status,
          newPolicyId: newPolicy.id,
          totalSettings: settings.length,
          convertedSettings: convertedCount,
          failedSettings: failedCount,
          details: conversionDetails,
        });
      } catch (err: any) {
        log(
          `Failed to create Settings Catalog policy: ${err.message}`,
          "routes"
        );
        return res.json({
          policyName: newName,
          status: "failed",
          totalSettings: settings.length,
          convertedSettings: convertedCount,
          failedSettings: failedCount,
          details: conversionDetails,
          error: `Policy creation failed: ${err.message}`,
        });
      }
    } catch (error: any) {
      log(`Conversion error: ${error.message}`, "routes");
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
