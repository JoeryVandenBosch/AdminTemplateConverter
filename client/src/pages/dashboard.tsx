import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Settings2,
  Monitor,
  User,
  Users,
  ChevronRight,
  Loader2,
  FileText,
  Clock,
  Zap,
  Info,
  Trash2,
  Plus,
  UserMinus,
  UserPlus,
  Filter,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import type {
  AdminTemplatePolicy,
  DefinitionValue,
  TenantInfo,
  ConversionResult,
  PolicyAssignment,
  ResolvedAssignment,
  AzureGroup,
  AssignmentFilter,
} from "@shared/schema";

function ConnectionStatus() {
  const { data: tenantInfo, isLoading } = useQuery<TenantInfo>({
    queryKey: ["/api/tenant-info"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-md" />
            <div className="flex-1">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const connected = tenantInfo?.connected;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center justify-center h-10 w-10 rounded-md ${
              connected
                ? "bg-emerald-500/10 dark:bg-emerald-500/20"
                : "bg-destructive/10 dark:bg-destructive/20"
            }`}
          >
            {connected ? (
              <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-destructive" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              {connected ? "Connected to Tenant" : "Connection Failed"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {connected
                ? tenantInfo?.displayName || tenantInfo?.tenantId
                : tenantInfo?.error || "Unable to connect to Microsoft Graph"}
            </p>
          </div>
          <Badge variant={connected ? "secondary" : "destructive"}>
            {connected ? "Active" : "Error"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function PolicySkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-md" />
              <div className="flex-1">
                <Skeleton className="h-4 w-48 mb-2" />
                <Skeleton className="h-3 w-72" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface PolicyDetailProps {
  policy: AdminTemplatePolicy;
  onClose: () => void;
  onConvert: () => void;
}

function AssignmentTargetIcon({ targetType }: { targetType: string }) {
  if (targetType === "All Devices") return <Monitor className="h-3.5 w-3.5" />;
  if (targetType === "All Users") return <Users className="h-3.5 w-3.5" />;
  if (targetType === "Excluded Group") return <UserMinus className="h-3.5 w-3.5" />;
  return <UserPlus className="h-3.5 w-3.5" />;
}

function PolicyDetail({ policy, onClose, onConvert }: PolicyDetailProps) {
  const { data: settings, isLoading } = useQuery<DefinitionValue[]>({
    queryKey: ["/api/policies", policy.id, "settings"],
  });

  const { data: resolvedAssignments, isLoading: assignmentsLoading } = useQuery<ResolvedAssignment[]>({
    queryKey: ["/api/policies", policy.id, "assignments", "resolve"],
    queryFn: async () => {
      const res = await apiRequest("POST", `/api/policies/${policy.id}/assignments/resolve`);
      return res.json();
    },
  });

  return (
    <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 flex-wrap">
          <Settings2 className="h-5 w-5 text-primary" />
          <span>{policy.displayName}</span>
        </DialogTitle>
        <DialogDescription>
          {policy.description || "No description provided"}
        </DialogDescription>
      </DialogHeader>

      <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground py-2">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Modified{" "}
          {new Date(policy.lastModifiedDateTime).toLocaleDateString()}
        </span>
        <span className="flex items-center gap-1">
          <FileText className="h-3 w-3" />
          {settings?.length ?? "..."} settings
        </span>
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {resolvedAssignments?.length ?? "..."} assignment{(resolvedAssignments?.length ?? 0) !== 1 ? "s" : ""}
        </span>
      </div>

      <Separator />

      <ScrollArea className="flex-1 min-h-0 max-h-[350px]">
        {isLoading ? (
          <div className="space-y-3 p-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-5 w-5 rounded mt-0.5" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-64 mb-1" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            ))}
          </div>
        ) : settings && settings.length > 0 ? (
          <div className="space-y-1 p-1">
            {settings.map((setting) => (
              <div
                key={setting.id}
                className="flex items-start gap-3 p-2 rounded-md hover-elevate"
                data-testid={`setting-item-${setting.id}`}
              >
                <div className="mt-0.5">
                  {setting.enabled ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight">
                    {setting.definition?.displayName || "Unknown Setting"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {setting.definition?.categoryPath || "Unknown Category"}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="secondary" className="text-[10px]">
                      {setting.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                    {setting.definition?.classType && (
                      <Badge variant="outline" className="text-[10px]">
                        {setting.definition.classType === "machine" ? (
                          <span className="flex items-center gap-1">
                            <Monitor className="h-2.5 w-2.5" />
                            Device
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <User className="h-2.5 w-2.5" />
                            User
                          </span>
                        )}
                      </Badge>
                    )}
                    {setting.presentationValues &&
                      setting.presentationValues.length > 0 && (
                        <Badge variant="outline" className="text-[10px]">
                          {setting.presentationValues.length} value
                          {setting.presentationValues.length !== 1 ? "s" : ""}
                        </Badge>
                      )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Info className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No settings found in this policy
            </p>
          </div>
        )}
      </ScrollArea>

      <Separator />

      <div className="py-2">
        <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
          <Users className="h-3 w-3" /> Assignments
        </p>
        {assignmentsLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-8 w-full rounded-md" />
            ))}
          </div>
        ) : resolvedAssignments && resolvedAssignments.length > 0 ? (
          <div className="space-y-1">
            {resolvedAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="flex items-center gap-2 p-2 rounded-md bg-muted/50"
                data-testid={`assignment-item-${assignment.id}`}
              >
                <div className={`shrink-0 ${assignment.targetType === "Excluded Group" ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}`}>
                  <AssignmentTargetIcon targetType={assignment.targetType} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-tight truncate">{assignment.targetName}</p>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Filter className="h-2.5 w-2.5 shrink-0" />
                    {assignment.filterDisplayName ? (
                      <>
                        <span className="truncate">{assignment.filterDisplayName}</span>
                        {assignment.filterType && assignment.filterType !== "none" && (
                          <Badge variant="outline" className="text-[9px] shrink-0 ml-1">
                            {assignment.filterType === "include" ? "Include" : "Exclude"}
                          </Badge>
                        )}
                      </>
                    ) : (
                      <span className="italic">No filter</span>
                    )}
                  </div>
                </div>
                <Badge
                  variant={assignment.targetType === "Excluded Group" ? "destructive" : "secondary"}
                  className="text-[10px] shrink-0"
                >
                  {assignment.targetType}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic py-1">No assignments</p>
        )}
      </div>

      <Separator />

      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={onClose} data-testid="button-close-detail">
          Close
        </Button>
        <Button onClick={onConvert} data-testid="button-start-convert">
          <ArrowRightLeft className="h-4 w-4 mr-2" />
          Convert to Settings Catalog
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

interface ConversionDialogProps {
  policy: AdminTemplatePolicy;
  onClose: () => void;
}

function GroupSearch({ onSelectGroup, existingGroupIds }: { onSelectGroup: (group: AzureGroup) => void; existingGroupIds: string[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(value), 300);
  };

  const { data: groups, isLoading: searchLoading } = useQuery<AzureGroup[]>({
    queryKey: ["/api/groups/search", debouncedQuery],
    queryFn: async () => {
      const res = await fetch(`/api/groups/search?q=${encodeURIComponent(debouncedQuery)}`);
      if (!res.ok) throw new Error("Failed to search groups");
      return res.json();
    },
    enabled: debouncedQuery.length >= 2,
  });

  const filteredGroups = groups?.filter((g) => !existingGroupIds.includes(g.id));

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search for groups..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-8 text-sm"
          data-testid="input-search-groups"
        />
      </div>
      {searchLoading && debouncedQuery.length >= 2 && (
        <div className="flex items-center gap-2 p-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Searching...
        </div>
      )}
      {filteredGroups && filteredGroups.length > 0 && (
        <ScrollArea className="max-h-[150px]">
          <div className="space-y-1">
            {filteredGroups.map((group) => (
              <div
                key={group.id}
                className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover-elevate"
                onClick={() => {
                  onSelectGroup(group);
                  setSearchQuery("");
                  setDebouncedQuery("");
                }}
                data-testid={`group-result-${group.id}`}
              >
                <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-tight truncate">{group.displayName}</p>
                  {group.description && (
                    <p className="text-xs text-muted-foreground truncate">{group.description}</p>
                  )}
                </div>
                <Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
      {filteredGroups && filteredGroups.length === 0 && debouncedQuery.length >= 2 && !searchLoading && (
        <p className="text-xs text-muted-foreground italic p-2">No groups found</p>
      )}
    </div>
  );
}

function CopiedFilterPicker({ assignmentId, onSelect }: {
  assignmentId: string;
  onSelect: (filterId: string, filterName: string, filterType: "include" | "exclude") => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [filterMode, setFilterMode] = useState<"include" | "exclude">("include");

  const { data: filters, isLoading } = useQuery<AssignmentFilter[]>({
    queryKey: ["/api/filters"],
    enabled: showPicker,
  });

  return (
    <>
      {!showPicker ? (
        <span
          className="italic cursor-pointer hover:underline"
          onClick={() => setShowPicker(true)}
          data-testid={`add-filter-${assignmentId}`}
        >
          No filter (click to add)
        </span>
      ) : (
        <div className="space-y-2 p-2 rounded-md border bg-muted/30 mt-1 w-full">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-xs font-medium flex items-center gap-1">
              <Filter className="h-3 w-3" /> Select Filter
            </p>
            <div className="flex items-center gap-1">
              <Badge
                variant={filterMode === "include" ? "secondary" : "outline"}
                className="text-[10px] cursor-pointer"
                onClick={() => setFilterMode("include")}
                data-testid={`filter-mode-include-${assignmentId}`}
              >
                Include
              </Badge>
              <Badge
                variant={filterMode === "exclude" ? "destructive" : "outline"}
                className="text-[10px] cursor-pointer"
                onClick={() => setFilterMode("exclude")}
                data-testid={`filter-mode-exclude-${assignmentId}`}
              >
                Exclude
              </Badge>
              <Button variant="ghost" size="icon" onClick={() => setShowPicker(false)} data-testid={`close-filter-picker-${assignmentId}`}>
                <XCircle className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          {isLoading ? (
            <div className="flex items-center gap-2 p-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Loading filters...
            </div>
          ) : filters && filters.length > 0 ? (
            <div className="max-h-[150px] overflow-y-auto space-y-1">
                {filters.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center gap-2 p-1.5 rounded-md cursor-pointer hover-elevate text-xs"
                    onClick={() => {
                      onSelect(f.id, f.displayName, filterMode);
                      setShowPicker(false);
                    }}
                    data-testid={`filter-option-${f.id}`}
                  >
                    <SlidersHorizontal className="h-3 w-3 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="leading-tight truncate">{f.displayName}</p>
                      {f.platform && (
                        <p className="text-muted-foreground truncate">{f.platform}</p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic p-1">No assignment filters found in tenant</p>
          )}
        </div>
      )}
    </>
  );
}

function ConversionDialog({ policy, onClose }: ConversionDialogProps) {
  const { toast } = useToast();
  const [newName, setNewName] = useState(
    `${policy.displayName} (Settings Catalog)`
  );
  const [newDescription, setNewDescription] = useState(
    policy.description || ""
  );
  const [includeAssignments, setIncludeAssignments] = useState(false);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [showAddGroups, setShowAddGroups] = useState(false);
  const [extraAssignments, setExtraAssignments] = useState<Array<{
    groupId: string;
    groupName: string;
    type: "include" | "exclude";
    filterId: string | null;
    filterName: string | null;
    filterType: "include" | "exclude" | null;
  }>>([]);
  const [copiedFilterOverrides, setCopiedFilterOverrides] = useState<Record<string, { filterId: string; filterName: string; filterType: "include" | "exclude" }>>({});
  const [removedCopiedFilters, setRemovedCopiedFilters] = useState<Set<string>>(new Set());

  const { data: resolvedAssignments } = useQuery<ResolvedAssignment[]>({
    queryKey: ["/api/policies", policy.id, "assignments", "resolve"],
    queryFn: async () => {
      const res = await apiRequest("POST", `/api/policies/${policy.id}/assignments/resolve`);
      return res.json();
    },
  });

  const { data: settingsPreview, isLoading: previewLoading } = useQuery<{
    totalSettings: number;
    matchedSettings: number;
    failedSettings: number;
    details: Array<{
      settingName: string;
      categoryPath: string;
      originalValue: string;
      status: "matched" | "not_found" | "error";
      confidence?: "high" | "medium" | "low";
      mappedTo?: string;
      error?: string;
    }>;
  }>({
    queryKey: ["/api/policies", policy.id, "preview-conversion"],
    queryFn: async () => {
      const res = await apiRequest("POST", `/api/policies/${policy.id}/preview-conversion`);
      return res.json();
    },
  });

  const hasFilterModifications = Object.keys(copiedFilterOverrides).length > 0 || removedCopiedFilters.size > 0;
  const convertMutation = useMutation({
    mutationFn: async () => {
      const shouldBackendCopyAssignments = includeAssignments && extraAssignments.length === 0 && !hasFilterModifications;
      const res = await apiRequest("POST", "/api/policies/convert", {
        policyId: policy.id,
        newName,
        newDescription,
        includeAssignments: shouldBackendCopyAssignments,
      });
      return (await res.json()) as ConversionResult;
    },
    onSuccess: async (data) => {
      if ((extraAssignments.length > 0 || hasFilterModifications) && data.newPolicyId && (data.status === "success" || data.status === "partial")) {
        try {
          const copiedAssignments = includeAssignments && resolvedAssignments
            ? resolvedAssignments.map((a) => {
                const target: Record<string, any> = a.targetType === "All Devices"
                  ? { "@odata.type": "#microsoft.graph.allDevicesAssignmentTarget" }
                  : a.targetType === "All Users"
                    ? { "@odata.type": "#microsoft.graph.allLicensedUsersAssignmentTarget" }
                    : a.targetType === "Excluded Group"
                      ? { "@odata.type": "#microsoft.graph.exclusionGroupAssignmentTarget", groupId: a.groupId }
                      : { "@odata.type": "#microsoft.graph.groupAssignmentTarget", groupId: a.groupId };

                if (copiedFilterOverrides[a.id]) {
                  target.deviceAndAppManagementAssignmentFilterId = copiedFilterOverrides[a.id].filterId;
                  target.deviceAndAppManagementAssignmentFilterType = copiedFilterOverrides[a.id].filterType;
                } else if (removedCopiedFilters.has(a.id)) {
                  // filter explicitly removed, don't include filter props
                } else if (a.filterId && a.filterType && a.filterType !== "none") {
                  target.deviceAndAppManagementAssignmentFilterId = a.filterId;
                  target.deviceAndAppManagementAssignmentFilterType = a.filterType;
                }

                return { target };
              })
            : [];

          const extraMapped = extraAssignments.map((ea) => {
            const target: Record<string, any> = ea.type === "exclude"
              ? { "@odata.type": "#microsoft.graph.exclusionGroupAssignmentTarget", groupId: ea.groupId }
              : { "@odata.type": "#microsoft.graph.groupAssignmentTarget", groupId: ea.groupId };
            if (ea.filterId && ea.filterType) {
              target.deviceAndAppManagementAssignmentFilterId = ea.filterId;
              target.deviceAndAppManagementAssignmentFilterType = ea.filterType;
            }
            return { target };
          });

          const allAssignments = [...copiedAssignments, ...extraMapped];

          await apiRequest("POST", `/api/settings-catalog/${data.newPolicyId}/assignments`, {
            assignments: allAssignments,
          });

          toast({
            title: "Assignments Updated",
            description: extraAssignments.length > 0
              ? `Added ${extraAssignments.length} extra assignment(s) to the new policy.`
              : "Assignments with modified filters applied to the new policy.",
          });
        } catch (err: any) {
          toast({
            title: "Assignment Warning",
            description: `Policy converted but failed to apply assignments: ${err.message}`,
            variant: "destructive",
          });
        }
      }

      setResult(data);
      if (data.status === "success") {
        toast({
          title: "Conversion Successful",
          description: `Created "${data.policyName}" with ${data.convertedSettings} settings.`,
        });
      } else if (data.status === "partial") {
        toast({
          title: "Partial Conversion",
          description: `Converted ${data.convertedSettings} of ${data.totalSettings} settings. ${data.failedSettings} could not be mapped.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Conversion Failed",
          description: data.error || "An error occurred during conversion.",
          variant: "destructive",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/policies"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Conversion Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteAssignmentsMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/policies/${policy.id}/assignments`);
    },
    onSuccess: () => {
      toast({
        title: "Assignments Deleted",
        description: `All assignments removed from "${policy.displayName}".`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/policies", policy.id, "assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/policies", policy.id, "assignments", "resolve"] });
      queryClient.invalidateQueries({ queryKey: ["/api/policies"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isConverting = convertMutation.isPending;

  const handleAddGroup = (group: AzureGroup) => {
    if (!extraAssignments.find((a) => a.groupId === group.id)) {
      setExtraAssignments([...extraAssignments, {
        groupId: group.id,
        groupName: group.displayName,
        type: "include",
        filterId: null,
        filterName: null,
        filterType: null,
      }]);
    }
  };

  const handleRemoveExtra = (groupId: string) => {
    setExtraAssignments(extraAssignments.filter((a) => a.groupId !== groupId));
  };

  const handleToggleExtraType = (groupId: string) => {
    setExtraAssignments(extraAssignments.map((a) =>
      a.groupId === groupId ? { ...a, type: a.type === "include" ? "exclude" : "include" } : a
    ));
  };

  const handleSetFilter = (groupId: string, filterId: string, filterName: string, filterType: "include" | "exclude") => {
    setExtraAssignments(extraAssignments.map((a) =>
      a.groupId === groupId ? { ...a, filterId, filterName, filterType } : a
    ));
  };

  const handleClearFilter = (groupId: string) => {
    setExtraAssignments(extraAssignments.map((a) =>
      a.groupId === groupId ? { ...a, filterId: null, filterName: null, filterType: null } : a
    ));
  };

  const handleSetCopiedFilter = (assignmentId: string, filterId: string, filterName: string, filterType: "include" | "exclude") => {
    setCopiedFilterOverrides((prev) => ({ ...prev, [assignmentId]: { filterId, filterName, filterType } }));
    setRemovedCopiedFilters((prev) => { const next = new Set(prev); next.delete(assignmentId); return next; });
  };

  const handleClearCopiedFilter = (assignmentId: string) => {
    setCopiedFilterOverrides((prev) => { const next = { ...prev }; delete next[assignmentId]; return next; });
  };

  const handleRemoveCopiedFilter = (assignmentId: string) => {
    setRemovedCopiedFilters((prev) => new Set(prev).add(assignmentId));
    setCopiedFilterOverrides((prev) => { const next = { ...prev }; delete next[assignmentId]; return next; });
  };

  const existingGroupIds = [
    ...(resolvedAssignments?.map((a) => a.groupId).filter(Boolean) as string[] || []),
    ...extraAssignments.map((a) => a.groupId),
  ];

  return (
    <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5 text-primary" />
          Convert to Settings Catalog
        </DialogTitle>
        <DialogDescription>
          Convert "{policy.displayName}" from Administrative Template to
          Settings Catalog format.
        </DialogDescription>
      </DialogHeader>

      {!result ? (
        <>
          <div className="flex-1 min-h-0 max-h-[65vh] overflow-y-auto pr-1">
            <div className="space-y-4 py-2 pr-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="newName">
                  New Policy Name
                </label>
                <Input
                  id="newName"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter a name for the new policy"
                  data-testid="input-new-name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="newDescription">
                  Description (optional)
                </label>
                <Input
                  id="newDescription"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Enter a description"
                  data-testid="input-new-description"
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <p className="text-sm font-medium flex items-center gap-1">
                  <Settings2 className="h-4 w-4" /> Settings Transfer Preview
                </p>

                {previewLoading ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Analyzing settings for matching definitions...
                    </div>
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-10 w-full rounded-md" />
                    ))}
                  </div>
                ) : settingsPreview ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 flex-wrap text-xs">
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {settingsPreview.matchedSettings} matched
                      </span>
                      {settingsPreview.failedSettings > 0 && (
                        <span className="flex items-center gap-1 text-destructive">
                          <XCircle className="h-3.5 w-3.5" />
                          {settingsPreview.failedSettings} not found
                        </span>
                      )}
                      <span className="text-muted-foreground">
                        {settingsPreview.totalSettings} total
                      </span>
                    </div>
                    <div className="space-y-1">
                      {settingsPreview.details.map((detail, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 p-2 rounded-md bg-muted/50"
                          data-testid={`setting-preview-${idx}`}
                        >
                          <div className="shrink-0 mt-0.5">
                            {detail.status === "matched" ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <XCircle className="h-4 w-4 text-destructive" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm leading-tight truncate">{detail.settingName}</p>
                            <p className="text-xs text-muted-foreground truncate">{detail.categoryPath}</p>
                            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                              <Badge variant="outline" className="text-[9px]">
                                {detail.originalValue}
                              </Badge>
                              {detail.status === "matched" && detail.confidence && (
                                <Badge
                                  variant={detail.confidence === "high" ? "secondary" : "outline"}
                                  className={`text-[9px] ${detail.confidence === "high" ? "text-emerald-700 dark:text-emerald-300" : detail.confidence === "medium" ? "text-amber-700 dark:text-amber-300" : "text-orange-700 dark:text-orange-300"}`}
                                >
                                  {detail.confidence} confidence
                                </Badge>
                              )}
                              {detail.status === "matched" && detail.mappedTo && (
                                <span className="text-[10px] text-muted-foreground truncate">
                                  → {detail.mappedTo}
                                </span>
                              )}
                              {detail.status !== "matched" && detail.error && (
                                <span className="text-[10px] text-destructive truncate">
                                  {detail.error}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Failed to load settings preview</p>
                )}
              </div>

              <Separator />

              <div className="space-y-3">
                <p className="text-sm font-medium flex items-center gap-1">
                  <Users className="h-4 w-4" /> Assignments
                </p>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="includeAssignments"
                    checked={includeAssignments}
                    onCheckedChange={(checked) =>
                      setIncludeAssignments(checked === true)
                    }
                    data-testid="checkbox-include-assignments"
                  />
                  <label
                    htmlFor="includeAssignments"
                    className="text-sm cursor-pointer"
                  >
                    Copy existing assignments to the new policy
                  </label>
                </div>

                {includeAssignments && resolvedAssignments && resolvedAssignments.length > 0 && (
                  <div className="space-y-1 pl-6">
                    {resolvedAssignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="p-1.5 rounded-md bg-muted/50 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`shrink-0 ${assignment.targetType === "Excluded Group" ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}`}>
                            <AssignmentTargetIcon targetType={assignment.targetType} />
                          </div>
                          <span className="flex-1 min-w-0 truncate">{assignment.targetName}</span>
                          <Badge
                            variant={assignment.targetType === "Excluded Group" ? "destructive" : "secondary"}
                            className="text-[10px] shrink-0"
                          >
                            {assignment.targetType}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5 pl-6 text-xs text-muted-foreground">
                          <Filter className="h-2.5 w-2.5 shrink-0" />
                          {copiedFilterOverrides[assignment.id] ? (
                            <>
                              <span className="truncate">{copiedFilterOverrides[assignment.id].filterName}</span>
                              <Badge variant="outline" className="text-[9px] shrink-0">
                                {copiedFilterOverrides[assignment.id].filterType === "include" ? "Include" : "Exclude"}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 shrink-0"
                                onClick={() => handleClearCopiedFilter(assignment.id)}
                                data-testid={`clear-copied-filter-${assignment.id}`}
                              >
                                <XCircle className="h-3 w-3" />
                              </Button>
                            </>
                          ) : assignment.filterDisplayName ? (
                            <>
                              <span className="truncate">{assignment.filterDisplayName}</span>
                              {assignment.filterType && assignment.filterType !== "none" && (
                                <Badge variant="outline" className="text-[9px] shrink-0">
                                  {assignment.filterType === "include" ? "Include" : "Exclude"}
                                </Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 shrink-0"
                                onClick={() => handleRemoveCopiedFilter(assignment.id)}
                                data-testid={`remove-copied-filter-${assignment.id}`}
                              >
                                <XCircle className="h-3 w-3" />
                              </Button>
                            </>
                          ) : removedCopiedFilters.has(assignment.id) ? (
                            <span className="italic">Removed</span>
                          ) : (
                            <CopiedFilterPicker
                              assignmentId={assignment.id}
                              onSelect={(fId, fName, fType) => handleSetCopiedFilter(assignment.id, fId, fName, fType)}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Separator className="my-2" />

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="text-sm font-medium">Add Extra Assignments</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddGroups(!showAddGroups)}
                      data-testid="button-toggle-add-groups"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add Group
                    </Button>
                  </div>

                  {showAddGroups && (
                    <GroupSearch onSelectGroup={handleAddGroup} existingGroupIds={existingGroupIds} />
                  )}

                  {extraAssignments.length > 0 && (
                    <div className="space-y-1">
                      {extraAssignments.map((ea) => (
                        <div
                          key={ea.groupId}
                          className="space-y-1 p-1.5 rounded-md bg-muted/50"
                          data-testid={`extra-assignment-${ea.groupId}`}
                        >
                          <div className="flex items-center gap-2 text-sm">
                            <div className={`shrink-0 ${ea.type === "exclude" ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}`}>
                              {ea.type === "exclude" ? <UserMinus className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                            </div>
                            <span className="flex-1 min-w-0 truncate">{ea.groupName}</span>
                            <Badge
                              variant={ea.type === "exclude" ? "destructive" : "secondary"}
                              className="text-[10px] shrink-0 cursor-pointer"
                              onClick={() => handleToggleExtraType(ea.groupId)}
                              data-testid={`toggle-type-${ea.groupId}`}
                            >
                              {ea.type === "exclude" ? "Exclude" : "Include"}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveExtra(ea.groupId)}
                              data-testid={`remove-extra-${ea.groupId}`}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-1 pl-6 text-xs text-muted-foreground">
                            <Filter className="h-2.5 w-2.5 shrink-0" />
                            {ea.filterId && ea.filterName ? (
                              <>
                                <span className="truncate">{ea.filterName}</span>
                                <Badge variant="outline" className="text-[9px] shrink-0">
                                  {ea.filterType === "include" ? "Include" : "Exclude"}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 shrink-0"
                                  onClick={() => handleClearFilter(ea.groupId)}
                                  data-testid={`clear-filter-${ea.groupId}`}
                                >
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              </>
                            ) : (
                              <CopiedFilterPicker
                                assignmentId={ea.groupId}
                                onSelect={(fId, fName, fType) => handleSetFilter(ea.groupId, fId, fName, fType)}
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator className="my-2" />

                <div className="space-y-2">
                  <p className="text-sm font-medium flex items-center gap-1">
                    <Filter className="h-4 w-4" /> Assignment Filters
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Manage filters on copied and extra assignments. Filters control which devices an assignment targets.
                  </p>

                  {(() => {
                    const allItems: Array<{
                      id: string;
                      name: string;
                      source: "copied" | "extra";
                      currentFilterName: string | null;
                      currentFilterType: string | null;
                      hasOverride: boolean;
                      overrideFilterName?: string;
                      overrideFilterType?: string;
                      isRemoved: boolean;
                    }> = [];

                    if (includeAssignments && resolvedAssignments) {
                      resolvedAssignments.forEach((a) => {
                        const override = copiedFilterOverrides[a.id];
                        allItems.push({
                          id: a.id,
                          name: a.targetName,
                          source: "copied",
                          currentFilterName: a.filterDisplayName || null,
                          currentFilterType: a.filterType || null,
                          hasOverride: !!override,
                          overrideFilterName: override?.filterName,
                          overrideFilterType: override?.filterType,
                          isRemoved: removedCopiedFilters.has(a.id),
                        });
                      });
                    }

                    extraAssignments.forEach((ea) => {
                      allItems.push({
                        id: ea.groupId,
                        name: ea.groupName,
                        source: "extra",
                        currentFilterName: ea.filterName,
                        currentFilterType: ea.filterType,
                        hasOverride: false,
                        isRemoved: false,
                      });
                    });

                    if (allItems.length === 0) {
                      return (
                        <p className="text-xs text-muted-foreground italic py-1">
                          Enable "Copy existing assignments" or add extra assignments to manage filters.
                        </p>
                      );
                    }

                    return (
                      <div className="space-y-1">
                        {allItems.map((item) => (
                          <div
                            key={`filter-${item.id}`}
                            className="p-1.5 rounded-md bg-muted/50"
                            data-testid={`filter-mgmt-${item.id}`}
                          >
                            <div className="flex items-center gap-2 text-sm">
                              <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="flex-1 min-w-0 truncate">{item.name}</span>
                              <Badge variant="outline" className="text-[9px] shrink-0">
                                {item.source === "copied" ? "Copied" : "Extra"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1 mt-1 pl-6 text-xs text-muted-foreground">
                              {item.source === "copied" ? (
                                <>
                                  {item.hasOverride ? (
                                    <>
                                      <span className="truncate">{item.overrideFilterName}</span>
                                      <Badge variant="outline" className="text-[9px] shrink-0">
                                        {item.overrideFilterType === "include" ? "Include" : "Exclude"}
                                      </Badge>
                                      <Badge variant="secondary" className="text-[9px] shrink-0">Modified</Badge>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 shrink-0"
                                        onClick={() => handleClearCopiedFilter(item.id)}
                                        data-testid={`filter-revert-${item.id}`}
                                      >
                                        <XCircle className="h-3 w-3" />
                                      </Button>
                                    </>
                                  ) : item.isRemoved ? (
                                    <>
                                      <span className="italic line-through">{item.currentFilterName}</span>
                                      <Badge variant="destructive" className="text-[9px] shrink-0">Removed</Badge>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 shrink-0"
                                        onClick={() => setRemovedCopiedFilters((prev) => { const next = new Set(prev); next.delete(item.id); return next; })}
                                        data-testid={`filter-undo-remove-${item.id}`}
                                      >
                                        <RotateCcw className="h-3 w-3" />
                                      </Button>
                                    </>
                                  ) : item.currentFilterName ? (
                                    <>
                                      <span className="truncate">{item.currentFilterName}</span>
                                      {item.currentFilterType && item.currentFilterType !== "none" && (
                                        <Badge variant="outline" className="text-[9px] shrink-0">
                                          {item.currentFilterType === "include" ? "Include" : "Exclude"}
                                        </Badge>
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 shrink-0"
                                        onClick={() => handleRemoveCopiedFilter(item.id)}
                                        data-testid={`filter-remove-${item.id}`}
                                      >
                                        <XCircle className="h-3 w-3" />
                                      </Button>
                                    </>
                                  ) : (
                                    <CopiedFilterPicker
                                      assignmentId={item.id}
                                      onSelect={(fId, fName, fType) => handleSetCopiedFilter(item.id, fId, fName, fType)}
                                    />
                                  )}
                                </>
                              ) : (
                                <>
                                  {item.currentFilterName ? (
                                    <>
                                      <span className="truncate">{item.currentFilterName}</span>
                                      <Badge variant="outline" className="text-[9px] shrink-0">
                                        {item.currentFilterType === "include" ? "Include" : "Exclude"}
                                      </Badge>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 shrink-0"
                                        onClick={() => handleClearFilter(item.id)}
                                        data-testid={`filter-clear-extra-${item.id}`}
                                      >
                                        <XCircle className="h-3 w-3" />
                                      </Button>
                                    </>
                                  ) : (
                                    <CopiedFilterPicker
                                      assignmentId={item.id}
                                      onSelect={(fId, fName, fType) => handleSetFilter(item.id, fId, fName, fType)}
                                    />
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>

              <Separator />

              <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <div className="text-xs text-amber-800 dark:text-amber-200">
                      <p className="font-medium mb-1">Before converting:</p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        <li>
                          A new Settings Catalog policy will be created with
                          matched settings
                        </li>
                        <li>
                          The original Administrative Template policy will not be
                          deleted
                        </li>
                        <li>
                          Some settings may not have a direct mapping and will be
                          skipped
                        </li>
                        <li>
                          Review the new policy before assigning it to groups
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={onClose} disabled={isConverting} data-testid="button-cancel-convert">
              Cancel
            </Button>
            <Button
              onClick={() => convertMutation.mutate()}
              disabled={isConverting || !newName.trim()}
              data-testid="button-confirm-convert"
            >
              {isConverting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Convert Policy
                </>
              )}
            </Button>
          </DialogFooter>
        </>
      ) : (
        <>
          <ScrollArea className="flex-1 min-h-0 max-h-[60vh]">
            <div className="space-y-4 py-2 pr-3">
              <div className="flex items-center gap-3">
                {result.status === "success" ? (
                  <div className="flex items-center justify-center h-10 w-10 rounded-md bg-emerald-500/10 dark:bg-emerald-500/20">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                ) : result.status === "partial" ? (
                  <div className="flex items-center justify-center h-10 w-10 rounded-md bg-amber-500/10 dark:bg-amber-500/20">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-10 w-10 rounded-md bg-destructive/10 dark:bg-destructive/20">
                    <XCircle className="h-5 w-5 text-destructive" />
                  </div>
                )}
                <div>
                  <p className="font-medium">
                    {result.status === "success"
                      ? "Conversion Complete"
                      : result.status === "partial"
                        ? "Partial Conversion"
                        : "Conversion Failed"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {result.convertedSettings} of {result.totalSettings} settings
                    converted
                  </p>
                </div>
              </div>

              <Progress
                value={
                  result.totalSettings > 0
                    ? (result.convertedSettings / result.totalSettings) * 100
                    : 0
                }
              />

              <div className="grid grid-cols-3 gap-3">
                <Card>
                  <CardContent className="p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {result.convertedSettings}
                    </p>
                    <p className="text-xs text-muted-foreground">Converted</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {result.failedSettings}
                    </p>
                    <p className="text-xs text-muted-foreground">Not Mapped</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <p className="text-2xl font-bold">{result.totalSettings}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </CardContent>
                </Card>
              </div>

              {result.details && result.details.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8">Status</TableHead>
                      <TableHead>Setting</TableHead>
                      <TableHead className="hidden sm:table-cell">Category</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.details.map((detail, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          {detail.status === "converted" ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          ) : detail.status === "not_found" ? (
                            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          ) : (
                            <XCircle className="h-4 w-4 text-destructive" />
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {detail.settingName}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">
                          {detail.categoryPath}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {result.error && (
                <Card className="bg-destructive/5 border-destructive/20">
                  <CardContent className="p-3">
                    <p className="text-sm text-destructive">{result.error}</p>
                  </CardContent>
                </Card>
              )}

              {(result.status === "success" || result.status === "partial") && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Post-Conversion Actions</p>
                    <Card className="bg-destructive/5 dark:bg-destructive/10 border-destructive/20">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-start gap-2">
                            <Trash2 className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                            <div>
                              <p className="text-sm font-medium">Delete Original Assignments</p>
                              <p className="text-xs text-muted-foreground">
                                Remove all group assignments from the original policy to prevent conflicts
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteAssignmentsMutation.mutate()}
                            disabled={deleteAssignmentsMutation.isPending || deleteAssignmentsMutation.isSuccess}
                            data-testid="button-delete-original-assignments"
                          >
                            {deleteAssignmentsMutation.isPending ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                                Deleting...
                              </>
                            ) : deleteAssignmentsMutation.isSuccess ? (
                              <>
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                Deleted
                              </>
                            ) : (
                              <>
                                <Trash2 className="h-3.5 w-3.5 mr-1" />
                                Delete Assignments
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button onClick={onClose} data-testid="button-close-result">
              Done
            </Button>
          </DialogFooter>
        </>
      )}
    </DialogContent>
  );
}

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPolicy, setSelectedPolicy] =
    useState<AdminTemplatePolicy | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showConvert, setShowConvert] = useState(false);

  const {
    data: policies,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<AdminTemplatePolicy[]>({
    queryKey: ["/api/policies"],
  });

  const filteredPolicies = policies?.filter(
    (p) =>
      p.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePolicyClick = (policy: AdminTemplatePolicy) => {
    setSelectedPolicy(policy);
    setShowDetail(true);
    setShowConvert(false);
  };

  const handleConvert = () => {
    setShowDetail(false);
    setShowConvert(true);
  };

  const handleClose = () => {
    setShowDetail(false);
    setShowConvert(false);
    setSelectedPolicy(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-9 w-9 rounded-md bg-primary text-primary-foreground">
                <ArrowRightLeft className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-base font-semibold leading-tight">
                  Intune Policy Converter
                </h1>
                <p className="text-xs text-muted-foreground">
                  Administrative Templates to Settings Catalog
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <ConnectionStatus />

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-lg font-semibold">
                Administrative Template Policies
              </h2>
              <p className="text-sm text-muted-foreground">
                Select a policy to view its settings or convert it to Settings
                Catalog format
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              data-testid="button-refresh"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search policies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              data-testid="input-search"
            />
          </div>

          {isLoading ? (
            <PolicySkeleton />
          ) : isError ? (
            <Card>
              <CardContent className="py-8">
                <div className="flex flex-col items-center text-center">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-destructive/10 dark:bg-destructive/20 mb-3">
                    <ShieldAlert className="h-6 w-6 text-destructive" />
                  </div>
                  <h3 className="font-medium mb-1">
                    Failed to load policies
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                    {(error as Error)?.message ||
                      "Could not connect to Microsoft Graph API. Check your credentials."}
                  </p>
                  <Button variant="outline" onClick={() => refetch()} data-testid="button-retry">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : filteredPolicies && filteredPolicies.length > 0 ? (
            <div className="space-y-2">
              {filteredPolicies.map((policy) => (
                <Card
                  key={policy.id}
                  className="cursor-pointer hover-elevate transition-colors"
                  onClick={() => handlePolicyClick(policy)}
                  data-testid={`card-policy-${policy.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-9 w-9 rounded-md bg-primary/10 dark:bg-primary/20 shrink-0">
                        <Settings2 className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight truncate">
                          {policy.displayName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {policy.description || "No description"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {policy.settingsCount !== undefined && (
                          <Badge variant="secondary" className="text-xs">
                            {policy.settingsCount} setting
                            {policy.settingsCount !== 1 ? "s" : ""}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground hidden sm:block">
                          {new Date(
                            policy.lastModifiedDateTime
                          ).toLocaleDateString()}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : policies && policies.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center text-center">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-muted mb-3">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium mb-1">No policies found</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    No Administrative Template policies were found in your
                    tenant. They may have already been migrated.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="flex flex-col items-center text-center">
                  <Search className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No policies match your search
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Dialog open={showDetail} onOpenChange={(open) => !open && handleClose()}>
        {selectedPolicy && (
          <PolicyDetail
            policy={selectedPolicy}
            onClose={handleClose}
            onConvert={handleConvert}
          />
        )}
      </Dialog>

      <Dialog
        open={showConvert}
        onOpenChange={(open) => !open && handleClose()}
      >
        {selectedPolicy && (
          <ConversionDialog policy={selectedPolicy} onClose={handleClose} />
        )}
      </Dialog>
    </div>
  );
}
