import { z } from "zod";

export interface AdminTemplatePolicy {
  id: string;
  displayName: string;
  description: string | null;
  createdDateTime: string;
  lastModifiedDateTime: string;
  roleScopeTagIds: string[];
  settingsCount?: number;
}

export interface DefinitionValue {
  id: string;
  enabled: boolean;
  configurationType: string;
  definition?: GroupPolicyDefinition;
  presentationValues?: PresentationValue[];
}

export interface GroupPolicyDefinition {
  id: string;
  displayName: string;
  explainText: string | null;
  categoryPath: string;
  classType: "user" | "machine";
  policyType: string;
  supportedOn: string | null;
  groupPolicyCategoryId: string | null;
}

export interface PresentationValue {
  id: string;
  "@odata.type": string;
  value?: string | number | boolean;
  values?: string[];
  label?: string;
  presentation?: {
    id: string;
    label: string;
    "@odata.type": string;
  };
}

export interface SettingsCatalogDefinition {
  id: string;
  displayName: string;
  description: string | null;
  categoryPath?: string;
  settingDefinitionId: string;
  baseUri?: string;
  offsetUri?: string;
  applicability?: {
    platform?: string;
    technologies?: string;
  };
}

export interface ConversionResult {
  policyName: string;
  status: "success" | "partial" | "failed";
  newPolicyId?: string;
  totalSettings: number;
  convertedSettings: number;
  failedSettings: number;
  details: ConversionDetail[];
  error?: string;
}

export interface ConversionDetail {
  settingName: string;
  categoryPath: string;
  status: "converted" | "not_found" | "error";
  originalValue?: string;
  mappedDefinitionId?: string;
  error?: string;
}

export interface PolicyAssignment {
  id: string;
  target: {
    "@odata.type": string;
    groupId?: string;
    deviceAndAppManagementAssignmentFilterId?: string;
    deviceAndAppManagementAssignmentFilterType?: string;
  };
}

export interface ResolvedAssignment {
  id: string;
  targetType: "Included Group" | "Excluded Group" | "All Devices" | "All Users" | "Unknown";
  targetName: string;
  groupId: string | null;
  filterType: string | null;
  filterId: string | null;
  filterDisplayName: string | null;
}

export interface AzureGroup {
  id: string;
  displayName: string;
  description: string | null;
  groupTypes: string[];
  mailEnabled: boolean;
  securityEnabled: boolean;
}

export interface AssignmentFilter {
  id: string;
  displayName: string;
  description: string | null;
  platform: string;
  rule: string;
  assignmentFilterManagementType?: string;
}

export interface TenantInfo {
  connected: boolean;
  tenantId?: string;
  displayName?: string;
  error?: string;
}

export const convertPolicySchema = z.object({
  policyId: z.string(),
  newName: z.string().min(1, "Policy name is required"),
  newDescription: z.string().optional(),
  includeAssignments: z.boolean().default(false),
});

export type ConvertPolicyInput = z.infer<typeof convertPolicySchema>;
