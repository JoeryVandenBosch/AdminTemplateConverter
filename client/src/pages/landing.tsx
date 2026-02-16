import type { ComponentType } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ArrowRightLeft,
  Shield,
  ShieldCheck,
  Zap,
  Eye,
  Users,
  Tag,
  Trash2,
  Lock,
  ServerOff,
  FileText,
  ExternalLink,
} from "lucide-react";
import logoImg from "@assets/Color_logo_with_background_1771246173380.png";

export default function Landing() {
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
              <div className="flex items-center gap-3 flex-wrap">
                <Link href="/converter">
                  <Button size="lg" data-testid="button-launch-converter">
                    Launch Converter
                  </Button>
                </Link>
                <a href="#features">
                  <Button variant="outline" size="lg" className="border-sidebar-foreground/20 text-sidebar-foreground bg-transparent" data-testid="button-learn-more">
                    Learn More
                  </Button>
                </a>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Badge label="v1.0" />
                <span className="text-xs text-sidebar-foreground/50">
                  Web App | Azure AD App Registration Required
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
              Setup Requirements
            </h3>
            <div className="w-12 h-0.5 bg-primary mx-auto mt-3" />
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Azure App Registration
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                This tool requires an Azure AD (Entra ID) App Registration with
                application-level permissions. It uses the OAuth2 client credentials
                flow — no user sign-in is needed.
              </p>
              <div className="space-y-2 pl-1">
                <p className="text-sm font-medium">Required API Permissions (Application):</p>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <PermissionItem name="DeviceManagementConfiguration.ReadWrite.All" description="Read & create policies" />
                  <PermissionItem name="Group.Read.All" description="Resolve group names for assignments" />
                  <PermissionItem name="DeviceManagementRBAC.ReadWrite.All" description="Manage scope tags" />
                </ul>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Step-by-Step Setup
              </h4>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="font-semibold text-foreground shrink-0">1.</span>
                  Go to <span className="font-medium text-foreground">Azure Portal &gt; App Registrations &gt; New Registration</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-foreground shrink-0">2.</span>
                  Name it (e.g., "IntuneStuff Policy Converter") and register
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-foreground shrink-0">3.</span>
                  Go to <span className="font-medium text-foreground">API Permissions &gt; Add &gt; Microsoft Graph &gt; Application</span> and add the required permissions listed
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-foreground shrink-0">4.</span>
                  Click <span className="font-medium text-foreground">Grant admin consent</span> for your organization
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-foreground shrink-0">5.</span>
                  Go to <span className="font-medium text-foreground">Certificates & Secrets &gt; New client secret</span> and copy the value
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-foreground shrink-0">6.</span>
                  Note your <span className="font-medium text-foreground">Application (client) ID</span> and <span className="font-medium text-foreground">Directory (tenant) ID</span> from the Overview page
                </li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section id="privacy" className="py-16 sm:py-20 bg-background">
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
              title="Your Credentials Stay Yours"
              description="Your Azure credentials (Tenant ID, Client ID, Client Secret) are used only for authenticating API calls. They are never shared, logged, or transmitted to third parties."
            />
            <PrivacyCard
              icon={ShieldCheck}
              title="Transparent Operations"
              description="Every action the tool performs is a direct Microsoft Graph API call to your own tenant. You can audit all activity in your Azure AD sign-in and audit logs."
            />
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h3 className="text-2xl font-semibold mb-2">
              How It Works
            </h3>
            <div className="w-12 h-0.5 bg-primary mx-auto mt-3" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StepCard step={1} title="Connect" description="Enter your Azure App Registration credentials to connect to your Microsoft 365 tenant." />
            <StepCard step={2} title="Select" description="Browse your Administrative Template policies and select one to convert." />
            <StepCard step={3} title="Preview" description="Preview the conversion to see which settings will map successfully to Settings Catalog." />
            <StepCard step={4} title="Convert" description="Create the new Settings Catalog policy with optional assignment and scope tag transfer." />
          </div>
        </div>
      </section>

      <section className="bg-sidebar text-sidebar-foreground py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h3 className="text-2xl font-semibold mb-3 text-sidebar-foreground">
            Ready to Convert Your Policies?
          </h3>
          <p className="text-sidebar-foreground/60 mb-6 max-w-lg mx-auto">
            Launch the converter to start migrating your deprecated Administrative
            Template policies to the modern Settings Catalog format.
          </p>
          <Link href="/converter">
            <Button size="lg" data-testid="button-launch-converter-bottom">
              Launch Converter
            </Button>
          </Link>
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
            <p className="text-xs text-muted-foreground">
              Microsoft Cloud & Enterprise Mobility Tools
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

function Badge({ label }: { label: string }) {
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
        <span className="text-xs text-muted-foreground ml-1.5">— {description}</span>
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
