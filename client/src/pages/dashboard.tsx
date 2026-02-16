import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
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
  ChevronRight,
  Loader2,
  FileText,
  Clock,
  Zap,
  Info,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import type {
  AdminTemplatePolicy,
  DefinitionValue,
  TenantInfo,
  ConversionResult,
  PolicyAssignment,
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

function PolicyDetail({ policy, onClose, onConvert }: PolicyDetailProps) {
  const { data: settings, isLoading } = useQuery<DefinitionValue[]>({
    queryKey: ["/api/policies", policy.id, "settings"],
  });

  const { data: assignments } = useQuery<PolicyAssignment[]>({
    queryKey: ["/api/policies", policy.id, "assignments"],
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
        {assignments && assignments.length > 0 && (
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {assignments.length} assignment{assignments.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <Separator />

      <ScrollArea className="flex-1 min-h-0 max-h-[400px]">
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

  const convertMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/policies/convert", {
        policyId: policy.id,
        newName,
        newDescription,
        includeAssignments,
      });
      return (await res.json()) as ConversionResult;
    },
    onSuccess: (data) => {
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

  const isConverting = convertMutation.isPending;

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
          <div className="space-y-4 py-2">
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
                Copy group assignments to the new policy
              </label>
            </div>

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
          <div className="space-y-4 py-2">
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
              <ScrollArea className="max-h-[200px]">
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
              </ScrollArea>
            )}

            {result.error && (
              <Card className="bg-destructive/5 border-destructive/20">
                <CardContent className="p-3">
                  <p className="text-sm text-destructive">{result.error}</p>
                </CardContent>
              </Card>
            )}
          </div>

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
