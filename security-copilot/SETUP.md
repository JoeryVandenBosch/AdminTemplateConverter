# IntuneStuff Policy Converter - Security Copilot Agent Setup Guide

## Overview

This Security Copilot agent allows IT administrators to convert deprecated Intune Administrative Template policies to Settings Catalog format directly from the Microsoft Security Copilot interface using natural language.

This is a **community plugin** — it works with any Microsoft 365 tenant. End users do not need to register their own Azure AD app.

## Prerequisites

- Microsoft Security Copilot access (M365 E5 or standalone SCU capacity)
- A user with **Intune Administrator** role (or equivalent) in your tenant
- The IntuneStuff Policy Converter app hosted at `admintemplate.intunestuff.com`

---

## Option A: Install from the Security Store

Once the plugin is published to the Microsoft Security Store, any organization can install it without needing credentials:

1. Open **Microsoft Security Copilot**
2. Click the **Sources** icon in the prompt bar
3. Go to **Security Store**
4. Search for **IntuneStuff** or **Admin Template Converter**
5. Click **Install**
6. Sign in with your Microsoft account when prompted — admin consent is granted automatically
7. The agent is ready to use

---

## Option B: Manual Upload (Publisher Testing)

Use this approach to test the plugin in your own tenant before submitting to the store. **Only the person uploading the plugin needs the Client ID and Secret** — other users in the workspace just sign in with their Microsoft account.

### Step 1: Upload the API Plugin

1. Open **Microsoft Security Copilot**
2. Click the **Sources** icon in the prompt bar
3. Scroll to the **Custom** section and click **Upload plugin**
4. Choose **Anyone in this workspace** (or **Just me** for testing)
5. Select **Security Copilot plugin**
6. Upload `api-plugin.yaml` (or paste the URL: `https://admintemplate.intunestuff.com/security-copilot/api-plugin.yaml`)
7. When prompted for OAuth configuration, fill in:
   - **Client ID**: Your IntuneStuff multi-tenant Azure AD app Client ID (`AZURE_CLIENT_ID`)
   - **Client Secret**: Your IntuneStuff app Client Secret (`AZURE_CLIENT_SECRET`)
   - **Authorization Content Type**: `application/x-www-form-urlencoded` (pre-filled)
   - **Resource**: `https://graph.microsoft.com`
8. Turn on the plugin toggle

> **Note**: The Client ID and Secret here are the **publisher's app credentials** — the same ones used by the IntuneStuff web app. End users who use the plugin in your workspace do not need to know these values.

### Step 2: Upload the Agent Manifest

1. In **Manage plugins** > **Custom**, click **Upload plugin** again
2. Choose **Anyone in this workspace**
3. Select **Security Copilot plugin**
4. Upload `agent-manifest.yaml` (or paste the URL: `https://admintemplate.intunestuff.com/security-copilot/agent-manifest.yaml`)
5. Complete setup if prompted
6. The agent will appear in **Active agents**

### Step 3: Test the Agent

1. In Security Copilot, click **Prompts** in the prompt bar
2. Navigate to **See all system capabilities**
3. Search for "IntuneStuff" or "Admin Template Converter"
4. Try one of the suggested prompts:
   - "List all my Administrative Template policies that need to be converted"
   - "Preview the conversion for a specific policy to see what will transfer"
   - "Convert an Administrative Template policy to Settings Catalog format"

---

## Agent Capabilities

| Capability | Description |
|------------|-------------|
| **List Policies** | Shows all Administrative Template policies in your tenant |
| **View Settings** | Displays configured settings for any policy |
| **Preview Conversion** | Analyzes which settings will convert before doing anything |
| **Convert Policy** | Creates a new Settings Catalog policy with mapped settings |
| **Manage Assignments** | View, transfer, or remove policy assignments |
| **Manage Scope Tags** | List, create, delete, and assign scope tags |
| **Search Groups** | Find Azure AD groups by name |
| **Delete Policies** | Clean up old Administrative Template policies after conversion |

## Example Conversations

**User**: "Show me all my Administrative Template policies"
**Agent**: Lists all policies with names, IDs, and dates

**User**: "Preview the conversion for policy [ID]"
**Agent**: Shows matched/unmatched settings and conversion confidence

**User**: "Convert policy [ID] with name 'My Converted Policy' and include assignments"
**Agent**: Executes conversion, reports results, transfers assignments

**User**: "Delete the old policy [ID]"
**Agent**: Confirms deletion and removes the deprecated policy

---

## Publishing to the Microsoft Security Store

To make this plugin available to any organization through the Security Store:

### Prerequisites for Store Submission

- A **Microsoft Partner Center** account ([partner.microsoft.com](https://partner.microsoft.com/dashboard))
- A **SaaS offer** with "Microsoft Security services" integration selected

### Submission Steps

1. **Create a SaaS offer** in Microsoft Partner Center
2. Under **Plan & pricing**, select "Microsoft Security services" as the integration type
3. **Package the plugin** as a ZIP file containing:
   - `api-plugin.yaml`
   - `agent-manifest.yaml`
   - `openapi-spec.yaml`
4. Upload the ZIP in the **Technical Configuration** section
5. **Fill in offer metadata**:
   - **Search summary**: "Convert deprecated Intune Administrative Template policies to Settings Catalog"
   - **Description**: List all tasks the agent supports (listing, previewing, converting, assignments, scope tags, cleanup)
   - **Publisher**: IntuneStuff
   - **Privacy Policy URL**: `https://admintemplate.intunestuff.com/#privacy`
   - **Terms of Use URL**: `https://admintemplate.intunestuff.com/#terms`
6. **Certification notes**: Include test credentials (Client ID + Client Secret) so Microsoft reviewers can validate the plugin. These are NOT exposed to end users.
7. **Submit for review** — Microsoft will validate security, capabilities, and Responsible AI compliance

### Certification Checklist

- [x] Agent generates multi-step plans autonomously (not a simple prompt-response wrapper)
- [x] Integrates with Microsoft Security products (Microsoft Intune)
- [x] Clear IT admin / security use case
- [x] Includes privacy policy and terms of use URLs
- [x] OAuth authentication configured for multi-tenant (`/common/` endpoints)
- [x] OpenAPI specification is publicly accessible and serves with CORS headers
- [x] Responsible AI disclaimer included in agent instructions
- [x] Publisher contact email provided

---

## Files Included

| File | Purpose |
|------|---------|
| `openapi-spec.yaml` | OpenAPI 3.0 specification describing all API endpoints |
| `api-plugin.yaml` | Security Copilot API plugin manifest (registers the API with OAuth) |
| `agent-manifest.yaml` | Security Copilot agent manifest (the conversational agent with skills) |

## Troubleshooting

- **Authentication errors**: Ensure admin consent has been granted in your tenant (happens automatically on first sign-in via the web app)
- **API connection issues**: Verify `admintemplate.intunestuff.com` is accessible from your network
- **Missing skills**: Make sure both the API plugin and agent manifest are uploaded and enabled
- **Permission denied**: The signed-in user needs Intune Administrator or equivalent role
- **"Resource" field during manual setup**: Enter `https://graph.microsoft.com`
- **OAuth configuration prompt**: Only appears during manual upload (Option B). Store installs handle this automatically.

## Disclaimer

This is a community tool provided by IntuneStuff. All conversions are performed at your own risk. Always test in a non-production environment first and verify converted policies in the Intune portal before deploying to production.
