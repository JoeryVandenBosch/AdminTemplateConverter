import { log } from "./index";

const GRAPH_BASE_URL = "https://graph.microsoft.com/beta";

async function graphRequest(
  accessToken: string,
  url: string,
  method: string = "GET",
  body?: any
): Promise<any> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  const options: RequestInit = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorText = await response.text();
    log(`Graph API error: ${response.status} - ${errorText}`, "graph");
    throw new Error(
      `Graph API request failed: ${response.status} - ${errorText}`
    );
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function graphRequestAllPages(accessToken: string, url: string): Promise<any[]> {
  const results: any[] = [];
  let nextUrl: string | null = url;

  while (nextUrl) {
    const data = await graphRequest(accessToken, nextUrl);
    if (data.value) {
      results.push(...data.value);
    }
    nextUrl = data["@odata.nextLink"] || null;
  }

  return results;
}

export async function getTenantInfo(accessToken: string): Promise<{
  connected: boolean;
  tenantId?: string;
  displayName?: string;
  error?: string;
}> {
  try {
    const data = await graphRequest(
      accessToken,
      "https://graph.microsoft.com/v1.0/organization"
    );
    const org = data.value?.[0];
    return {
      connected: true,
      tenantId: org?.id,
      displayName: org?.displayName,
    };
  } catch (error: any) {
    return {
      connected: false,
      error: error.message,
    };
  }
}

export async function getAdminTemplatePolicies(accessToken: string): Promise<any[]> {
  const policies = await graphRequestAllPages(
    accessToken,
    `${GRAPH_BASE_URL}/deviceManagement/groupPolicyConfigurations`
  );

  const policiesWithCounts = await Promise.all(
    policies.map(async (policy: any) => {
      try {
        const defValues = await graphRequestAllPages(
          accessToken,
          `${GRAPH_BASE_URL}/deviceManagement/groupPolicyConfigurations/${policy.id}/definitionValues`
        );
        return {
          ...policy,
          settingsCount: defValues.length,
        };
      } catch {
        return {
          ...policy,
          settingsCount: 0,
        };
      }
    })
  );

  return policiesWithCounts;
}

export async function getPolicySettings(accessToken: string, policyId: string): Promise<any[]> {
  const definitionValues = await graphRequestAllPages(
    accessToken,
    `${GRAPH_BASE_URL}/deviceManagement/groupPolicyConfigurations/${policyId}/definitionValues`
  );

  const settingsWithDetails = await Promise.all(
    definitionValues.map(async (defValue: any) => {
      try {
        const [definition, presentationValues] = await Promise.all([
          graphRequest(
            accessToken,
            `${GRAPH_BASE_URL}/deviceManagement/groupPolicyConfigurations/${policyId}/definitionValues/${defValue.id}/definition`
          ),
          graphRequestAllPages(
            accessToken,
            `${GRAPH_BASE_URL}/deviceManagement/groupPolicyConfigurations/${policyId}/definitionValues/${defValue.id}/presentationValues?$expand=presentation`
          ),
        ]);

        let definitionFile = null;
        try {
          definitionFile = await graphRequest(
            accessToken,
            `${GRAPH_BASE_URL}/deviceManagement/groupPolicyDefinitions/${definition.id}/definitionFile`
          );
        } catch {
          log(`Could not fetch definition file for ${definition.id}`, "graph");
        }

        return {
          ...defValue,
          definition: {
            ...definition,
            definitionFile,
          },
          presentationValues,
        };
      } catch (err: any) {
        log(
          `Failed to get details for definition value ${defValue.id}: ${err.message}`,
          "graph"
        );
        return {
          ...defValue,
          definition: null,
          presentationValues: [],
        };
      }
    })
  );

  return settingsWithDetails;
}

export async function getPolicyAssignments(
  accessToken: string,
  policyId: string
): Promise<any[]> {
  try {
    return await graphRequestAllPages(
      accessToken,
      `${GRAPH_BASE_URL}/deviceManagement/groupPolicyConfigurations/${policyId}/assignments`
    );
  } catch {
    return [];
  }
}

export async function searchSettingsCatalogDefinitions(
  accessToken: string,
  searchTerm: string
): Promise<any[]> {
  try {
    const cleanTerm = searchTerm.replace(/'/g, "''");
    const data = await graphRequest(
      accessToken,
      `${GRAPH_BASE_URL}/deviceManagement/configurationSettings?$filter=contains(displayName,'${encodeURIComponent(cleanTerm)}')&$top=50`
    );
    return data.value || [];
  } catch (err: any) {
    log(
      `Settings catalog search failed for "${searchTerm}": ${err.message}`,
      "graph"
    );
    return [];
  }
}

export async function getSettingDefinitionDetails(
  accessToken: string,
  settingDefinitionId: string
): Promise<any | null> {
  try {
    const data = await graphRequest(
      accessToken,
      `${GRAPH_BASE_URL}/deviceManagement/configurationSettings('${encodeURIComponent(settingDefinitionId)}')`
    );
    return data;
  } catch (err: any) {
    log(
      `Failed to get definition details for ${settingDefinitionId}: ${err.message}`,
      "graph"
    );
    return null;
  }
}

export async function findMatchingSettingDefinition(
  accessToken: string,
  displayName: string,
  categoryPath: string,
  classType: string,
  definitionFile?: any
): Promise<{ definition: any; confidence: "high" | "medium" | "low" } | null> {
  try {
    const cleanName = displayName.replace(/['"]/g, "");

    const results = await searchSettingsCatalogDefinitions(accessToken, cleanName);

    if (results.length > 0) {
      const exactMatch = results.find(
        (r: any) =>
          r.displayName?.toLowerCase() === cleanName.toLowerCase()
      );
      if (exactMatch) {
        return { definition: exactMatch, confidence: "high" };
      }

      const scopePrefix = classType === "user" ? "user_" : "device_";
      const scopeMatches = results.filter(
        (r: any) =>
          r.id?.toLowerCase().startsWith(scopePrefix) ||
          r.settingDefinitionId?.toLowerCase().startsWith(scopePrefix)
      );

      if (scopeMatches.length > 0) {
        const nameMatch = scopeMatches.find(
          (r: any) =>
            r.displayName?.toLowerCase().includes(cleanName.toLowerCase()) ||
            cleanName.toLowerCase().includes(r.displayName?.toLowerCase() || "")
        );
        if (nameMatch) {
          return { definition: nameMatch, confidence: "medium" };
        }
        return { definition: scopeMatches[0], confidence: "low" };
      }

      return { definition: results[0], confidence: "low" };
    }

    const pathParts = categoryPath.split("\\").filter(Boolean);
    if (pathParts.length > 0) {
      const lastCategory = pathParts[pathParts.length - 1];
      const categoryResults =
        await searchSettingsCatalogDefinitions(accessToken, lastCategory);
      const categoryMatch = categoryResults.find(
        (r: any) =>
          r.displayName?.toLowerCase().includes(cleanName.toLowerCase())
      );
      if (categoryMatch) {
        return { definition: categoryMatch, confidence: "medium" };
      }
    }

    if (definitionFile?.fileName) {
      const admxName = definitionFile.fileName
        .replace(/\.admx$/i, "")
        .toLowerCase();
      const admxResults = await searchSettingsCatalogDefinitions(accessToken, admxName);
      const admxMatch = admxResults.find(
        (r: any) =>
          r.displayName?.toLowerCase().includes(cleanName.toLowerCase())
      );
      if (admxMatch) {
        return { definition: admxMatch, confidence: "medium" };
      }
    }

    return null;
  } catch (err: any) {
    log(
      `Failed to find matching definition for "${displayName}": ${err.message}`,
      "graph"
    );
    return null;
  }
}

export async function createSettingsCatalogPolicy(
  accessToken: string,
  name: string,
  description: string,
  settings: any[]
): Promise<any> {
  const policyBody = {
    name,
    description,
    platforms: "windows10",
    technologies: "mdm",
    settings,
    templateReference: {
      templateId: "",
      templateFamily: "none",
    },
  };

  return graphRequest(
    accessToken,
    `${GRAPH_BASE_URL}/deviceManagement/configurationPolicies`,
    "POST",
    policyBody
  );
}

export async function assignSettingsCatalogPolicy(
  accessToken: string,
  policyId: string,
  assignments: any[]
): Promise<void> {
  await graphRequest(
    accessToken,
    `${GRAPH_BASE_URL}/deviceManagement/configurationPolicies/${policyId}/assign`,
    "POST",
    { assignments }
  );
}

export async function resolveGroupNames(
  accessToken: string,
  groupIds: string[]
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  const uniqueIds = Array.from(new Set(groupIds));

  await Promise.all(
    uniqueIds.map(async (id) => {
      try {
        const group = await graphRequest(
          accessToken,
          `https://graph.microsoft.com/v1.0/groups/${id}?$select=id,displayName`
        );
        result[id] = group.displayName || id;
      } catch {
        result[id] = id;
      }
    })
  );

  return result;
}

export async function searchGroups(accessToken: string, query: string): Promise<any[]> {
  try {
    const cleanQuery = query.replace(/'/g, "''");
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/groups?$search="displayName:${encodeURIComponent(cleanQuery)}"&$select=id,displayName,description,groupTypes,mailEnabled,securityEnabled&$top=20&$count=true`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          ConsistencyLevel: "eventual",
        },
      }
    );
    if (!response.ok) {
      const errorText = await response.text();
      log(`Group search API error: ${response.status} - ${errorText}`, "graph");
      return [];
    }
    const data = await response.json();
    return data.value || [];
  } catch (err: any) {
    log(`Group search failed for "${query}": ${err.message}`, "graph");
    return [];
  }
}

export async function getAssignmentFilters(accessToken: string): Promise<any[]> {
  try {
    return await graphRequestAllPages(
      accessToken,
      `${GRAPH_BASE_URL}/deviceManagement/assignmentFilters?$select=id,displayName,description,platform,rule,assignmentFilterManagementType`
    );
  } catch (err: any) {
    log(`Failed to fetch assignment filters: ${err.message}`, "graph");
    return [];
  }
}

export async function resolveFilterNames(
  accessToken: string,
  filterIds: string[]
): Promise<Record<string, { displayName: string; platform: string; rule: string }>> {
  const result: Record<string, { displayName: string; platform: string; rule: string }> = {};
  const uniqueIds = Array.from(new Set(filterIds));

  await Promise.all(
    uniqueIds.map(async (id) => {
      try {
        const filter = await graphRequest(
          accessToken,
          `${GRAPH_BASE_URL}/deviceManagement/assignmentFilters/${id}?$select=id,displayName,platform,rule`
        );
        result[id] = {
          displayName: filter.displayName || id,
          platform: filter.platform || "",
          rule: filter.rule || "",
        };
      } catch {
        result[id] = { displayName: id, platform: "", rule: "" };
      }
    })
  );

  return result;
}

export async function deleteAdminTemplatePolicyAssignments(
  accessToken: string,
  policyId: string
): Promise<void> {
  await graphRequest(
    accessToken,
    `${GRAPH_BASE_URL}/deviceManagement/groupPolicyConfigurations/${policyId}/assign`,
    "POST",
    { assignments: [] }
  );
}

export async function deleteAdminTemplatePolicy(
  accessToken: string,
  policyId: string
): Promise<void> {
  await graphRequest(
    accessToken,
    `${GRAPH_BASE_URL}/deviceManagement/groupPolicyConfigurations/${policyId}`,
    "DELETE"
  );
}

export async function getRoleScopeTags(accessToken: string): Promise<any[]> {
  try {
    return await graphRequestAllPages(
      accessToken,
      `${GRAPH_BASE_URL}/deviceManagement/roleScopeTags?$select=id,displayName,description,isBuiltIn`
    );
  } catch (err: any) {
    log(`Failed to fetch role scope tags: ${err.message}`, "graph");
    return [];
  }
}

export async function createRoleScopeTag(
  accessToken: string,
  displayName: string,
  description: string
): Promise<any> {
  return graphRequest(
    accessToken,
    `${GRAPH_BASE_URL}/deviceManagement/roleScopeTags`,
    "POST",
    {
      "@odata.type": "#microsoft.graph.roleScopeTag",
      displayName,
      description,
      isBuiltIn: false,
    }
  );
}

export async function deleteRoleScopeTag(accessToken: string, tagId: string): Promise<void> {
  await graphRequest(
    accessToken,
    `${GRAPH_BASE_URL}/deviceManagement/roleScopeTags/${tagId}`,
    "DELETE"
  );
}

export async function updatePolicyScopeTags(
  accessToken: string,
  policyId: string,
  roleScopeTagIds: string[]
): Promise<void> {
  await graphRequest(
    accessToken,
    `${GRAPH_BASE_URL}/deviceManagement/groupPolicyConfigurations/${policyId}`,
    "PATCH",
    { roleScopeTagIds }
  );
}

export async function updateSettingsCatalogPolicyScopeTags(
  accessToken: string,
  policyId: string,
  roleScopeTagIds: string[]
): Promise<void> {
  await graphRequest(
    accessToken,
    `${GRAPH_BASE_URL}/deviceManagement/configurationPolicies/${policyId}`,
    "PATCH",
    { roleScopeTagIds }
  );
}

export function buildSettingsCatalogSetting(
  matchedDefinition: any,
  enabled: boolean,
  presentationValues: any[]
): any {
  const settingDefId =
    matchedDefinition.id ||
    matchedDefinition.settingDefinitionId;

  const children: any[] = [];

  const options = matchedDefinition.options || matchedDefinition.choiceSettingOptions || [];
  const optionValues = options.map((o: any) => o.itemId || o.value || o.name);

  for (const pv of presentationValues) {
    const odataType = pv["@odata.type"] || "";
    const label = pv.presentation?.label || "value";
    const childId = `${settingDefId}_${label.toLowerCase().replace(/[^a-z0-9_]/g, "_")}`;

    if (
      odataType.includes("Text") ||
      odataType.includes("groupPolicyPresentationValueText")
    ) {
      children.push({
        "@odata.type":
          "#microsoft.graph.deviceManagementConfigurationSimpleSettingInstance",
        settingDefinitionId: childId,
        simpleSettingValue: {
          "@odata.type":
            "#microsoft.graph.deviceManagementConfigurationStringSettingValue",
          value: String(pv.value || ""),
        },
      });
    } else if (
      odataType.includes("Decimal") ||
      odataType.includes("LongDecimal") ||
      odataType.includes("groupPolicyPresentationValueDecimal") ||
      odataType.includes("groupPolicyPresentationValueLongDecimal")
    ) {
      children.push({
        "@odata.type":
          "#microsoft.graph.deviceManagementConfigurationSimpleSettingInstance",
        settingDefinitionId: childId,
        simpleSettingValue: {
          "@odata.type":
            "#microsoft.graph.deviceManagementConfigurationIntegerSettingValue",
          value: Number(pv.value || 0),
        },
      });
    } else if (
      odataType.includes("Boolean") ||
      odataType.includes("groupPolicyPresentationValueBoolean")
    ) {
      children.push({
        "@odata.type":
          "#microsoft.graph.deviceManagementConfigurationChoiceSettingInstance",
        settingDefinitionId: childId,
        choiceSettingValue: {
          "@odata.type":
            "#microsoft.graph.deviceManagementConfigurationChoiceSettingValue",
          value: pv.value ? `${childId}_true` : `${childId}_false`,
        },
      });
    } else if (
      odataType.includes("List") ||
      odataType.includes("groupPolicyPresentationValueList")
    ) {
      const listValues = pv.values || [];
      if (Array.isArray(listValues)) {
        children.push({
          "@odata.type":
            "#microsoft.graph.deviceManagementConfigurationSimpleSettingCollectionInstance",
          settingDefinitionId: childId,
          simpleSettingCollectionValue: listValues.map((v: any) => ({
            "@odata.type":
              "#microsoft.graph.deviceManagementConfigurationStringSettingValue",
            value: String(v.name || v),
          })),
        });
      }
    } else if (
      odataType.includes("MultiText") ||
      odataType.includes("groupPolicyPresentationValueMultiText")
    ) {
      const multiValues = pv.values || [];
      if (Array.isArray(multiValues)) {
        children.push({
          "@odata.type":
            "#microsoft.graph.deviceManagementConfigurationSimpleSettingCollectionInstance",
          settingDefinitionId: childId,
          simpleSettingCollectionValue: multiValues.map((v: any) => ({
            "@odata.type":
              "#microsoft.graph.deviceManagementConfigurationStringSettingValue",
            value: String(v),
          })),
        });
      }
    }
  }

  let enabledValue: string;
  if (options.length > 0) {
    const enabledOption = options.find(
      (o: any) =>
        (o.displayName || o.name || "").toLowerCase() === "enabled" ||
        (o.itemId || o.value || "").endsWith("_1") ||
        (o.itemId || o.value || "").endsWith("_enabled")
    );
    const disabledOption = options.find(
      (o: any) =>
        (o.displayName || o.name || "").toLowerCase() === "disabled" ||
        (o.itemId || o.value || "").endsWith("_0") ||
        (o.itemId || o.value || "").endsWith("_disabled")
    );

    if (enabled && enabledOption) {
      enabledValue = enabledOption.itemId || enabledOption.value;
    } else if (!enabled && disabledOption) {
      enabledValue = disabledOption.itemId || disabledOption.value;
    } else {
      enabledValue = enabled ? `${settingDefId}_1` : `${settingDefId}_0`;
    }
  } else {
    enabledValue = enabled ? `${settingDefId}_1` : `${settingDefId}_0`;
  }

  return {
    "@odata.type":
      "#microsoft.graph.deviceManagementConfigurationSetting",
    settingInstance: {
      "@odata.type":
        "#microsoft.graph.deviceManagementConfigurationChoiceSettingInstance",
      settingDefinitionId: settingDefId,
      choiceSettingValue: {
        "@odata.type":
          "#microsoft.graph.deviceManagementConfigurationChoiceSettingValue",
        value: enabledValue,
        children,
      },
    },
  };
}
