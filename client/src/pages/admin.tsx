import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Users,
  ArrowRightLeft,
  Building2,
  Activity,
  Lock,
  RefreshCw,
} from "lucide-react";

interface AnalyticsSummary {
  totalSignIns: number;
  totalConversions: number;
  uniqueTenants: number;
  uniqueUsers: number;
  recentEvents: Array<{
    id: number;
    eventType: string;
    tenantId: string | null;
    userEmail: string | null;
    userDisplayName: string | null;
    policyName: string | null;
    metadata: Record<string, any>;
    createdAt: string;
  }>;
  signInsByDay: Array<{ date: string; count: number }>;
  conversionsByDay: Array<{ date: string; count: number }>;
  topTenants: Array<{ tenantId: string; signIns: number; conversions: number }>;
}

export default function AdminDashboard() {
  const [adminKey, setAdminKey] = useState(() => {
    return localStorage.getItem("adminKey") || "";
  });
  const [keyInput, setKeyInput] = useState("");
  const [authenticated, setAuthenticated] = useState(() => !!localStorage.getItem("adminKey"));

  const { data, isLoading, isError, refetch } = useQuery<AnalyticsSummary>({
    queryKey: ["/api/admin/analytics", adminKey],
    queryFn: async () => {
      const res = await fetch(`/api/admin/analytics?key=${encodeURIComponent(adminKey)}`);
      if (!res.ok) {
        if (res.status === 403) {
          setAuthenticated(false);
          localStorage.removeItem("adminKey");
          throw new Error("Invalid admin key");
        }
        throw new Error("Failed to fetch analytics");
      }
      return res.json();
    },
    enabled: authenticated && !!adminKey,
    refetchInterval: 30000,
  });

  const handleLogin = () => {
    if (keyInput.trim()) {
      localStorage.setItem("adminKey", keyInput.trim());
      setAdminKey(keyInput.trim());
      setAuthenticated(true);
      setKeyInput("");
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 justify-center">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Admin Access</h2>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
              className="space-y-3"
            >
              <Input
                type="password"
                placeholder="Enter admin key"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                data-testid="input-admin-key"
              />
              <Button type="submit" className="w-full" data-testid="button-admin-login">
                Access Dashboard
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h1 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Analytics Dashboard
            </h1>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
                data-testid="button-refresh-analytics"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  localStorage.removeItem("adminKey");
                  setAdminKey("");
                  setAuthenticated(false);
                }}
                data-testid="button-admin-logout"
              >
                Log Out
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {isError ? (
          <Card className="border-destructive">
            <CardContent className="p-4 text-center text-sm text-destructive">
              Failed to load analytics. Check your admin key.
            </CardContent>
          </Card>
        ) : isLoading || !data ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-5 h-24 animate-pulse bg-muted/30" />
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={Users}
                label="Total Sign-Ins"
                value={data.totalSignIns}
                testId="stat-sign-ins"
              />
              <StatCard
                icon={ArrowRightLeft}
                label="Total Conversions"
                value={data.totalConversions}
                testId="stat-conversions"
              />
              <StatCard
                icon={Building2}
                label="Unique Tenants"
                value={data.uniqueTenants}
                testId="stat-tenants"
              />
              <StatCard
                icon={Activity}
                label="Unique Users"
                value={data.uniqueUsers}
                testId="stat-users"
              />
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold mb-3">Sign-Ins (Last 30 Days)</h3>
                  {data.signInsByDay.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No data yet</p>
                  ) : (
                    <div className="space-y-1">
                      {data.signInsByDay.map((day) => (
                        <div key={day.date} className="flex items-center gap-2 text-xs">
                          <span className="w-20 text-muted-foreground shrink-0">
                            {new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                          <div className="flex-1 bg-muted rounded-sm overflow-hidden h-4">
                            <div
                              className="h-full bg-primary/60 rounded-sm"
                              style={{
                                width: `${Math.max(
                                  5,
                                  (day.count / Math.max(...data.signInsByDay.map((d) => d.count))) * 100
                                )}%`,
                              }}
                            />
                          </div>
                          <span className="w-6 text-right font-medium">{day.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold mb-3">Conversions (Last 30 Days)</h3>
                  {data.conversionsByDay.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No data yet</p>
                  ) : (
                    <div className="space-y-1">
                      {data.conversionsByDay.map((day) => (
                        <div key={day.date} className="flex items-center gap-2 text-xs">
                          <span className="w-20 text-muted-foreground shrink-0">
                            {new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                          <div className="flex-1 bg-muted rounded-sm overflow-hidden h-4">
                            <div
                              className="h-full bg-emerald-500/60 rounded-sm"
                              style={{
                                width: `${Math.max(
                                  5,
                                  (day.count / Math.max(...data.conversionsByDay.map((d) => d.count))) * 100
                                )}%`,
                              }}
                            />
                          </div>
                          <span className="w-6 text-right font-medium">{day.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {data.topTenants.length > 0 && (
              <Card>
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold mb-3">Top Tenants</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-muted-foreground border-b">
                          <th className="pb-2 pr-4">Tenant ID</th>
                          <th className="pb-2 pr-4 text-right">Sign-Ins</th>
                          <th className="pb-2 text-right">Conversions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.topTenants.map((tenant) => (
                          <tr key={tenant.tenantId} className="border-b border-border/50" data-testid={`row-tenant-${tenant.tenantId}`}>
                            <td className="py-2 pr-4">
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{tenant.tenantId}</code>
                            </td>
                            <td className="py-2 pr-4 text-right">{tenant.signIns}</td>
                            <td className="py-2 text-right">{tenant.conversions}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold mb-3">Recent Events</h3>
                {data.recentEvents.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No events recorded yet</p>
                ) : (
                  <div className="space-y-2">
                    {data.recentEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-start gap-3 p-2.5 rounded-md bg-muted/30"
                        data-testid={`event-row-${event.id}`}
                      >
                        <Badge
                          variant={event.eventType === "sign_in" ? "secondary" : "default"}
                          className="shrink-0 text-[10px]"
                        >
                          {event.eventType === "sign_in" ? "Sign In" : "Conversion"}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {event.userDisplayName && (
                              <span className="text-sm font-medium">{event.userDisplayName}</span>
                            )}
                            {event.userEmail && (
                              <span className="text-xs text-muted-foreground">{event.userEmail}</span>
                            )}
                          </div>
                          {event.policyName && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              Policy: {event.policyName}
                            </p>
                          )}
                          {event.tenantId && (
                            <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                              Tenant: {event.tenantId}
                            </p>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {new Date(event.createdAt).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  testId,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  testId: string;
}) {
  return (
    <Card data-testid={testId}>
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-md bg-primary/10 dark:bg-primary/20 shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{value.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
