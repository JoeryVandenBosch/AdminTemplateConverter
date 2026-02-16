import type { Express, Request } from "express";
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
  deleteAdminTemplatePolicy,
  resolveGroupNames,
  searchGroups,
  getAssignmentFilters,
  resolveFilterNames,
  buildSettingsCatalogSetting,
  getRoleScopeTags,
  createRoleScopeTag,
  deleteRoleScopeTag,
  updateSettingsCatalogPolicyScopeTags,
} from "./graphClient";
import { convertPolicySchema } from "@shared/schema";
import { log } from "./index";
import { requireAuth, refreshTokenIfNeeded } from "./auth";
import { trackEvent, getAnalyticsSummary } from "./analytics";

async function getAccessToken(req: Request): Promise<string> {
  return refreshTokenIfNeeded(req);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/tenant-info", requireAuth, async (req, res) => {
    try {
      const accessToken = await getAccessToken(req);
      const info = await getTenantInfo(accessToken);
      res.json(info);
    } catch (error: any) {
      res.json({ connected: false, error: error.message });
    }
  });

  app.get("/api/policies", requireAuth, async (req, res) => {
    try {
      const accessToken = await getAccessToken(req);
      const policies = await getAdminTemplatePolicies(accessToken);
      res.json(policies);
    } catch (error: any) {
      log(`Failed to fetch policies: ${error.message}`, "routes");
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/policies/:id/settings", requireAuth, async (req, res) => {
    try {
      const accessToken = await getAccessToken(req);
      const settings = await getPolicySettings(accessToken, req.params.id);
      res.json(settings);
    } catch (error: any) {
      log(`Failed to fetch settings: ${error.message}`, "routes");
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/policies/:id/assignments", requireAuth, async (req, res) => {
    try {
      const accessToken = await getAccessToken(req);
      const assignments = await getPolicyAssignments(accessToken, req.params.id);
      res.json(assignments);
    } catch (error: any) {
      log(`Failed to fetch assignments: ${error.message}`, "routes");
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/policies/:id/assignments/resolve", requireAuth, async (req, res) => {
    try {
      const accessToken = await getAccessToken(req);
      const assignments = await getPolicyAssignments(accessToken, req.params.id);
      const groupIds = assignments
        .map((a: any) => a.target?.groupId)
        .filter(Boolean);
      const filterIds = assignments
        .map((a: any) => a.target?.deviceAndAppManagementAssignmentFilterId)
        .filter(Boolean);

      const [groupNames, filterNames] = await Promise.all([
        groupIds.length > 0 ? resolveGroupNames(accessToken, groupIds) : Promise.resolve({} as Record<string, string>),
        filterIds.length > 0 ? resolveFilterNames(accessToken, filterIds) : Promise.resolve({} as Record<string, { displayName: string; platform: string; rule: string }>),
      ]);

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

        const filterId = target.deviceAndAppManagementAssignmentFilterId || null;
        const filterInfo = filterId ? filterNames[filterId] : null;

        return {
          id: a.id,
          targetType,
          targetName,
          groupId: target.groupId || null,
          filterType: target.deviceAndAppManagementAssignmentFilterType || null,
          filterId,
          filterDisplayName: filterInfo?.displayName || null,
        };
      });

      res.json(resolved);
    } catch (error: any) {
      log(`Failed to resolve assignments: ${error.message}`, "routes");
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/filters", requireAuth, async (req, res) => {
    try {
      const accessToken = await getAccessToken(req);
      const filters = await getAssignmentFilters(accessToken);
      res.json(filters);
    } catch (error: any) {
      log(`Failed to fetch assignment filters: ${error.message}`, "routes");
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/groups/search", requireAuth, async (req, res) => {
    try {
      const accessToken = await getAccessToken(req);
      const query = (req.query.q as string) || "";
      if (query.length < 2) {
        return res.json([]);
      }
      const groups = await searchGroups(accessToken, query);
      res.json(groups);
    } catch (error: any) {
      log(`Failed to search groups: ${error.message}`, "routes");
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/policies/:id/assignments", requireAuth, async (req, res) => {
    try {
      const accessToken = await getAccessToken(req);
      await deleteAdminTemplatePolicyAssignments(accessToken, req.params.id);
      log(`Deleted assignments for policy ${req.params.id}`, "routes");
      res.json({ success: true });
    } catch (error: any) {
      log(`Failed to delete assignments: ${error.message}`, "routes");
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/settings-catalog/:id/assignments", requireAuth, async (req, res) => {
    try {
      const accessToken = await getAccessToken(req);
      const assignments = req.body.assignments;
      if (!Array.isArray(assignments)) {
        return res.status(400).json({ message: "assignments must be an array" });
      }
      await assignSettingsCatalogPolicy(accessToken, req.params.id, assignments);
      log(`Added ${assignments.length} assignments to settings catalog policy ${req.params.id}`, "routes");
      res.json({ success: true });
    } catch (error: any) {
      log(`Failed to add assignments: ${error.message}`, "routes");
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/policies/:id/preview-conversion", requireAuth, async (req, res) => {
    try {
      const accessToken = await getAccessToken(req);
      const policyId = req.params.id;
      log(`Starting conversion preview for policy ${policyId}`, "routes");

      const settings = await getPolicySettings(accessToken, policyId);

      if (!settings || settings.length === 0) {
        return res.json({
          totalSettings: 0,
          matchedSettings: 0,
          failedSettings: 0,
          details: [],
        });
      }

      const details: any[] = [];

      for (const setting of settings) {
        const definition = setting.definition;
        if (!definition) {
          details.push({
            settingName: "Unknown Setting",
            categoryPath: "Unknown",
            originalValue: setting.enabled ? "Enabled" : "Disabled",
            status: "error",
            error: "Could not retrieve setting definition",
          });
          continue;
        }

        try {
          const matchResult = await findMatchingSettingDefinition(
            accessToken,
            definition.displayName,
            definition.categoryPath || "",
            definition.classType || "machine",
            definition.definitionFile
          );

          if (matchResult) {
            details.push({
              settingName: definition.displayName,
              categoryPath: definition.categoryPath || "Unknown",
              originalValue: setting.enabled ? "Enabled" : "Disabled",
              status: "matched",
              confidence: matchResult.confidence,
              mappedTo: matchResult.definition.displayName || matchResult.definition.id,
            });
          } else {
            details.push({
              settingName: definition.displayName,
              categoryPath: definition.categoryPath || "Unknown",
              originalValue: setting.enabled ? "Enabled" : "Disabled",
              status: "not_found",
              error: "No matching Settings Catalog definition found",
            });
          }
        } catch (err: any) {
          details.push({
            settingName: definition.displayName,
            categoryPath: definition.categoryPath || "Unknown",
            originalValue: setting.enabled ? "Enabled" : "Disabled",
            status: "error",
            error: err.message,
          });
        }
      }

      const matchedCount = details.filter((d) => d.status === "matched").length;
      const failedCount = details.filter((d) => d.status !== "matched").length;

      res.json({
        totalSettings: settings.length,
        matchedSettings: matchedCount,
        failedSettings: failedCount,
        details,
      });
    } catch (error: any) {
      log(`Preview conversion failed: ${error.message}`, "routes");
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/policies/convert", requireAuth, async (req, res) => {
    try {
      const accessToken = await getAccessToken(req);
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

      const settings = await getPolicySettings(accessToken, policyId);

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
            accessToken,
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
              mappedTo: matchResult.definition.displayName || matchResult.definition.id,
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
          accessToken,
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
            const sourceAssignments = await getPolicyAssignments(accessToken, policyId);
            if (sourceAssignments.length > 0) {
              const mappedAssignments = sourceAssignments.map((a: any) => ({
                target: a.target,
              }));
              await assignSettingsCatalogPolicy(
                accessToken,
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

        trackEvent("conversion", {
          tenantId: req.session.tenantId,
          userEmail: req.session.userEmail,
          userDisplayName: req.session.userDisplayName,
          policyName: newName,
          metadata: {
            status,
            totalSettings: settings.length,
            convertedSettings: convertedCount,
            failedSettings: failedCount,
            newPolicyId: newPolicy.id,
          },
        });

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

  app.delete("/api/policies/:id", requireAuth, async (req, res) => {
    try {
      const accessToken = await getAccessToken(req);
      await deleteAdminTemplatePolicy(accessToken, req.params.id);
      log(`Deleted administrative template policy ${req.params.id}`, "routes");
      res.json({ success: true });
    } catch (error: any) {
      log(`Failed to delete policy: ${error.message}`, "routes");
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/scope-tags", requireAuth, async (req, res) => {
    try {
      const accessToken = await getAccessToken(req);
      const tags = await getRoleScopeTags(accessToken);
      res.json(tags);
    } catch (error: any) {
      log(`Failed to fetch scope tags: ${error.message}`, "routes");
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/scope-tags", requireAuth, async (req, res) => {
    try {
      const accessToken = await getAccessToken(req);
      const { displayName, description } = req.body;
      if (!displayName || typeof displayName !== "string") {
        return res.status(400).json({ message: "displayName is required" });
      }
      const tag = await createRoleScopeTag(accessToken, displayName, description || "");
      log(`Created scope tag: ${displayName}`, "routes");
      res.json(tag);
    } catch (error: any) {
      log(`Failed to create scope tag: ${error.message}`, "routes");
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/scope-tags/:id", requireAuth, async (req, res) => {
    try {
      const accessToken = await getAccessToken(req);
      if (req.params.id === "0") {
        return res.status(400).json({ message: "Cannot delete the built-in Default scope tag" });
      }
      await deleteRoleScopeTag(accessToken, req.params.id);
      log(`Deleted scope tag ${req.params.id}`, "routes");
      res.json({ success: true });
    } catch (error: any) {
      log(`Failed to delete scope tag: ${error.message}`, "routes");
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/settings-catalog/:id/scope-tags", requireAuth, async (req, res) => {
    try {
      const accessToken = await getAccessToken(req);
      const { roleScopeTagIds } = req.body;
      if (!Array.isArray(roleScopeTagIds)) {
        return res.status(400).json({ message: "roleScopeTagIds must be an array" });
      }
      await updateSettingsCatalogPolicyScopeTags(accessToken, req.params.id, roleScopeTagIds);
      log(`Updated scope tags for settings catalog policy ${req.params.id}`, "routes");
      res.json({ success: true });
    } catch (error: any) {
      log(`Failed to update scope tags: ${error.message}`, "routes");
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/analytics", async (req, res) => {
    const rawKey = req.query.key || req.headers["x-admin-key"];
    const adminKey = typeof rawKey === "string" ? rawKey.trim() : Array.isArray(rawKey) ? String(rawKey[0]).trim() : "";
    const expectedKey = (process.env.ADMIN_KEY || "").trim();
    if (!expectedKey || adminKey !== expectedKey) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    try {
      const summary = await getAnalyticsSummary();
      res.json(summary);
    } catch (error: any) {
      log(`Failed to get analytics: ${error.message}`, "routes");
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
