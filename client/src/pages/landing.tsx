import type { ComponentType } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { getQueryFn } from "@/lib/queryClient";
import {
  ArrowRightLeft,
  ShieldCheck,
  Zap,
  Eye,
  Users,
  Tag,
  Trash2,
  Lock,
  ServerOff,
  ExternalLink,
  LogIn,
  AlertTriangle,
} from "lucide-react";
import logoImg from "@assets/Color_logo_with_background_1771246173380.png";

export default function Landing() {
  const { data: authStatus } = useQuery<{
    authenticated: boolean;
    user?: { displayName?: string; email?: string };
    tenantId?: string;
  }>({
    queryKey: ["/api/auth/status"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const [, setLocation] = useLocation();

  useEffect(() => {
    if (authStatus?.authenticated) {
      setLocation("/converter");
    }
  }, [authStatus, setLocation]);

  const urlParams = new URLSearchParams(window.location.search);
  const authError = urlParams.get("auth_error");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <a
              href="https://intunestuff.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3"
              data-testid="link-header-logo"
            >
              <img
                src={logoImg}
                alt="IntuneStuff Logo"
                className="h-10 w-auto rounded"
              />
            </a>
            <div className="flex items-center gap-3">
              <a
                href="https://intunestuff.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-sidebar-foreground/60 hover:text-primary transition-colors hidden sm:inline-flex items-center gap-1"
                data-testid="link-main-site"
              >
                intunestuff.com
                <ExternalLink className="h-3 w-3" />
              </a>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <section className="bg-sidebar text-sidebar-foreground">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl font-light leading-tight text-sidebar-foreground">
                Intune Policy
                <br />
                <span className="font-semibold">Converter Tool</span>
              </h2>
              <p className="text-sidebar-foreground/70 text-base leading-relaxed max-w-md">
                A web-based tool for IT administrators to convert deprecated
                Microsoft Intune Administrative Template policies to the newer
                Settings Catalog format — directly in your tenant.
              </p>
              {authError && (
                <Card className="border-destructive bg-destructive/10">
                  <CardContent className="p-3">
                    <p className="text-sm text-destructive">
                      Sign-in failed: {decodeURIComponent(authError)}
                    </p>
                  </CardContent>
                </Card>
              )}
              <div className="flex items-center gap-3 flex-wrap">
                <a href="/api/auth/login">
                  <Button size="lg" data-testid="button-sign-in">
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign in with Microsoft
                  </Button>
                </a>
                <a href="#features">
                  <Button variant="outline" size="lg" className="border-sidebar-foreground/20 text-sidebar-foreground bg-transparent" data-testid="button-learn-more">
                    Learn More
                  </Button>
                </a>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <VersionBadge label="v1.0" />
                <span className="text-xs text-sidebar-foreground/50">
                  Web App | Admin consent required
                </span>
              </div>
            </div>
            <div className="flex justify-center">
              <a
                href="https://intunestuff.com"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-hero-logo"
              >
                <img
                  src={logoImg}
                  alt="IntuneStuff - Microsoft Cloud & Enterprise Mobility"
                  className="w-56 sm:w-72 h-auto rounded-md"
                />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-16 sm:py-20 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-semibold mb-2">
              Powerful Features
            </h3>
            <div className="w-12 h-0.5 bg-primary mx-auto mt-3" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard
              icon={ArrowRightLeft}
              title="Policy Conversion"
              description="Convert Administrative Template policies to Settings Catalog format with intelligent setting mapping using Microsoft's definition search."
            />
            <FeatureCard
              icon={Eye}
              title="Conversion Preview"
              description="Preview which settings will transfer successfully before committing. See high, medium, and low confidence matches."
            />
            <FeatureCard
              icon={Users}
              title="Assignment Management"
              description="View, copy, and manage policy assignments including groups (include/exclude), filters, and all-users/all-devices targeting."
            />
            <FeatureCard
              icon={Tag}
              title="Scope Tags"
              description="Manage role scope tags on converted policies. Create new scope tags or assign existing ones to control administrative visibility."
            />
            <FeatureCard
              icon={Zap}
              title="Direct Tenant Integration"
              description="Connects directly to your Microsoft 365 tenant via Graph API. No data is stored — everything runs live against your environment."
            />
            <FeatureCard
              icon={Trash2}
              title="Clean Up"
              description="Delete old Administrative Template policies and their assignments after successful conversion to keep your tenant tidy."
            />
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-semibold mb-2">
              How It Works
            </h3>
            <div className="w-12 h-0.5 bg-primary mx-auto mt-3" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StepCard step={1} title="Sign In" description="Click 'Sign in with Microsoft' and grant admin consent for your organization. No app registration needed." />
            <StepCard step={2} title="Select" description="Browse your Administrative Template policies and select one to convert." />
            <StepCard step={3} title="Preview" description="Preview the conversion to see which settings will map successfully to Settings Catalog." />
            <StepCard step={4} title="Convert" description="Create the new Settings Catalog policy with optional assignment and scope tag transfer." />
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-semibold mb-2">
              Admin Consent
            </h3>
            <div className="w-12 h-0.5 bg-primary mx-auto mt-3" />
          </div>
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="p-6 space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  When you sign in for the first time, a Global Administrator will need to consent to the following delegated permissions on behalf of your organization. This is a one-time process.
                </p>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Required Permissions:</p>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    <PermissionItem name="DeviceManagementConfiguration.ReadWrite.All" description="Read & create policies" />
                    <PermissionItem name="Group.Read.All" description="Resolve group names" />
                    <PermissionItem name="DeviceManagementRBAC.ReadWrite.All" description="Manage scope tags" />
                  </ul>
                </div>
                <p className="text-xs text-muted-foreground">
                  These permissions allow the tool to read your existing Administrative Template policies and create new Settings Catalog policies in your tenant. No app registration is required on your end.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="privacy" className="py-16 sm:py-20 bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-semibold mb-2">
              Privacy & Security
            </h3>
            <div className="w-12 h-0.5 bg-primary mx-auto mt-3" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <PrivacyCard
              icon={ServerOff}
              title="No Data Storage"
              description="We do not store, log, or persist any data from your tenant. All operations are performed live through Microsoft Graph API and nothing is cached on our servers."
            />
            <PrivacyCard
              icon={Lock}
              title="Secure Authentication"
              description="Authentication is handled entirely by Microsoft's identity platform. Your credentials never pass through our servers — only secure OAuth2 tokens."
            />
            <PrivacyCard
              icon={ShieldCheck}
              title="Transparent Operations"
              description="Every action the tool performs is a direct Microsoft Graph API call to your own tenant. You can audit all activity in your Azure AD sign-in and audit logs."
            />
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mx-auto">
            <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200" data-testid="text-disclaimer-title">Important - Please Read</h4>
                    <ul className="list-disc pl-4 space-y-1 text-xs text-amber-800 dark:text-amber-200">
                      <li>A new Settings Catalog policy will be created with matched settings</li>
                      <li>The original Administrative Template policy will not be deleted automatically</li>
                      <li>Some settings may not have a direct mapping and will be skipped</li>
                      <li>Always review the new policy in the Intune portal before assigning it to groups</li>
                    </ul>
                    <p className="text-xs text-amber-700 dark:text-amber-300 pt-1" data-testid="text-disclaimer-risk">
                      This is a free community tool provided as-is with no warranty. Use at your own risk. Always verify converted policies in your Intune portal before applying them to production environments. The authors are not responsible for any unintended changes to your tenant configuration.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="bg-sidebar text-sidebar-foreground py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h3 className="text-2xl font-semibold mb-3 text-sidebar-foreground">
            Ready to Convert Your Policies?
          </h3>
          <p className="text-sidebar-foreground/60 mb-6 max-w-lg mx-auto">
            Sign in with your Microsoft account to start migrating your deprecated Administrative
            Template policies to the modern Settings Catalog format.
          </p>
          <a href="/api/auth/login">
            <Button size="lg" data-testid="button-sign-in-bottom">
              <LogIn className="h-4 w-4 mr-2" />
              Sign in with Microsoft
            </Button>
          </a>
        </div>
      </section>

      <footer className="border-t bg-background py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <a
              href="https://intunestuff.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
              data-testid="link-footer-logo"
            >
              <img src={logoImg} alt="IntuneStuff" className="h-8 w-auto rounded" />
            </a>
            <p className="text-xs text-muted-foreground text-center">
              Microsoft Cloud & Enterprise Mobility Tools
              <br />
              <span className="text-muted-foreground/60">Community tool provided as-is. Use at your own risk.</span>
            </p>
            <a
              href="https://intunestuff.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
              data-testid="link-footer-site"
            >
              intunestuff.com
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function VersionBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
      {label}
    </span>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <Card data-testid={`card-feature-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center h-9 w-9 rounded-md bg-primary/10 dark:bg-primary/20 shrink-0 mt-0.5">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-1">{title}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PrivacyCard({
  icon: Icon,
  title,
  description,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <Card data-testid={`card-privacy-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center h-9 w-9 rounded-md bg-primary/10 dark:bg-primary/20 shrink-0 mt-0.5">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-1">{title}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PermissionItem({ name, description }: { name: string; description: string }) {
  return (
    <li className="flex items-start gap-2">
      <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
      <span>
        <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">{name}</code>
        <span className="text-xs text-muted-foreground ml-1.5">-- {description}</span>
      </span>
    </li>
  );
}

function StepCard({ step, title, description }: { step: number; title: string; description: string }) {
  return (
    <Card data-testid={`card-step-${step}`}>
      <CardContent className="p-5 text-center">
        <div className="flex items-center justify-center h-10 w-10 rounded-md bg-primary text-primary-foreground font-bold text-sm mx-auto mb-3">
          {step}
        </div>
        <h4 className="text-sm font-semibold mb-1">{title}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}
