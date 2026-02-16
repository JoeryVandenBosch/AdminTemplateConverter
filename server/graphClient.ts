import { log } from "./index";

const GRAPH_BASE_URL = "https://graph.microsoft.com/beta";

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
    return cachedToken.token;
  }

  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error(
      "Missing Azure credentials. Please set AZURE_TENANT_ID, AZURE_CLIENT_ID, and AZURE_CLIENT_SECRET."
    );
  }

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    log(`Token acquisition failed: ${errorText}`, "graph");
    throw new Error(`Failed to acquire access token: ${response.status}`);
  }

  const data = await response.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  log("Access token acquired successfully", "graph");
  return cachedToken.token;
}

async function graphRequest(
  url: string,
  method: string = "GET",
  body?: any
): Promise<any> {
  const token = await getAccessToken();

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
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

async function graphRequestAllPages(url: string): Promise<any[]> {
  const results: any[] = [];
  let nextUrl: string | null = url;

  while (nextUrl) {
    const data = await graphRequest(nextUrl);
    if (data.value) {
      results.push(...data.value);
    }
    nextUrl = data["@odata.nextLink"] || null;
  }

  return results;
}

export async function getTenantInfo(): Promise<{
  connected: boolean;
  tenantId?: string;
  displayName?: string;
  error?: string;
}> {
  try {
    const data = await graphRequest(
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

export async function getAdminTemplatePolicies(): Promise<any[]> {
  const policies = await graphRequestAllPages(
    `${GRAPH_BASE_URL}/deviceManagement/groupPolicyConfigurations`
  );

  const policiesWithCounts = await Promise.all(
    policies.map(async (policy: any) => {
      try {
        const defValues = await graphRequestAllPages(
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

export async function getPolicySettings(policyId: string): Promise<any[]> {
  const definitionValues = await graphRequestAllPages(
    `${GRAPH_BASE_URL}/deviceManagement/groupPolicyConfigurations/${policyId}/definitionValues`
  );

  const settingsWithDetails = await Promise.all(
    definitionValues.map(async (defValue: any) => {
      try {
        const [definition, presentationValues] = await Promise.all([
          graphRequest(
            `${GRAPH_BASE_URL}/deviceManagement/groupPolicyConfigurations/${policyId}/definitionValues/${defValue.id}/definition`
          ),
          graphRequestAllPages(
            `${GRAPH_BASE_URL}/deviceManagement/groupPolicyConfigurations/${policyId}/definitionValues/${defValue.id}/presentationValues?$expand=presentation`
          ),
        ]);

        return {
          ...defValue,
          definition,
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
  policyId: string
): Promise<any[]> {
  try {
    return await graphRequestAllPages(
      `${GRAPH_BASE_URL}/deviceManagement/groupPolicyConfigurations/${policyId}/assignments`
    );
  } catch {
    return [];
  }
}

export async function searchSettingsCatalogDefinitions(
  searchTerm: string
): Promise<any[]> {
  try {
    const encodedSearch = encodeURIComponent(searchTerm);
    const data = await graphRequest(
      `${GRAPH_BASE_URL}/deviceManagement/configurationSettings?$filter=contains(displayName,'${encodedSearch}')&$top=20`
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

export async function findMatchingSettingDefinition(
  displayName: string,
  categoryPath: string,
  classType: string
): Promise<any | null> {
  try {
    const cleanName = displayName.replace(/['"]/g, "");

    const results = await searchSettingsCatalogDefinitions(cleanName);

    if (results.length > 0) {
      const exactMatch = results.find(
        (r: any) =>
          r.displayName?.toLowerCase() === cleanName.toLowerCase()
      );
      if (exactMatch) return exactMatch;

      return results[0];
    }

    const pathParts = categoryPath.split("\\").filter(Boolean);
    if (pathParts.length > 0) {
      const lastCategory = pathParts[pathParts.length - 1];
      const categoryResults =
        await searchSettingsCatalogDefinitions(lastCategory);
      const categoryMatch = categoryResults.find(
        (r: any) =>
          r.displayName?.toLowerCase().includes(cleanName.toLowerCase())
      );
      if (categoryMatch) return categoryMatch;
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
    `${GRAPH_BASE_URL}/deviceManagement/configurationPolicies`,
    "POST",
    policyBody
  );
}

export function buildSettingsCatalogSetting(
  settingDefinitionId: string,
  enabled: boolean,
  presentationValues: any[]
): any {
  const children: any[] = [];

  for (const pv of presentationValues) {
    const odataType = pv["@odata.type"] || "";

    if (
      odataType.includes("groupPolicyPresentationValueText") ||
      odataType.includes("Text")
    ) {
      children.push({
        "@odata.type":
          "#microsoft.graph.deviceManagementConfigurationSimpleSettingInstance",
        settingDefinitionId: `${settingDefinitionId}_${(pv.presentation?.label || "value").toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
        simpleSettingValue: {
          "@odata.type":
            "#microsoft.graph.deviceManagementConfigurationStringSettingValue",
          value: String(pv.value || ""),
        },
      });
    } else if (
      odataType.includes("groupPolicyPresentationValueDecimal") ||
      odataType.includes("Decimal")
    ) {
      children.push({
        "@odata.type":
          "#microsoft.graph.deviceManagementConfigurationSimpleSettingInstance",
        settingDefinitionId: `${settingDefinitionId}_${(pv.presentation?.label || "value").toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
        simpleSettingValue: {
          "@odata.type":
            "#microsoft.graph.deviceManagementConfigurationIntegerSettingValue",
          value: Number(pv.value || 0),
        },
      });
    } else if (
      odataType.includes("groupPolicyPresentationValueBoolean") ||
      odataType.includes("Boolean")
    ) {
      children.push({
        "@odata.type":
          "#microsoft.graph.deviceManagementConfigurationChoiceSettingInstance",
        settingDefinitionId: `${settingDefinitionId}_${(pv.presentation?.label || "value").toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
        choiceSettingValue: {
          value: pv.value
            ? `${settingDefinitionId}_true`
            : `${settingDefinitionId}_false`,
        },
      });
    } else if (
      odataType.includes("groupPolicyPresentationValueList") ||
      odataType.includes("List")
    ) {
      if (pv.values && Array.isArray(pv.values)) {
        children.push({
          "@odata.type":
            "#microsoft.graph.deviceManagementConfigurationSimpleSettingCollectionInstance",
          settingDefinitionId: `${settingDefinitionId}_${(pv.presentation?.label || "list").toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
          simpleSettingCollectionValue: pv.values.map((v: any) => ({
            "@odata.type":
              "#microsoft.graph.deviceManagementConfigurationStringSettingValue",
            value: String(v.name || v),
          })),
        });
      }
    }
  }

  const enabledValue = enabled
    ? `${settingDefinitionId}_1`
    : `${settingDefinitionId}_0`;

  return {
    "@odata.type":
      "#microsoft.graph.deviceManagementConfigurationSetting",
    settingInstance: {
      "@odata.type":
        "#microsoft.graph.deviceManagementConfigurationChoiceSettingInstance",
      settingDefinitionId,
      choiceSettingValue: {
        "@odata.type":
          "#microsoft.graph.deviceManagementConfigurationChoiceSettingValue",
        value: enabledValue,
        children,
      },
    },
  };
}
