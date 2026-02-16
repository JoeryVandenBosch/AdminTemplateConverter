# IntuneStuff Policy Converter - Security Copilot Agent Setup Guide

## Overview

This Security Copilot agent allows IT administrators to convert deprecated Intune Administrative Template policies to Settings Catalog format directly from the Microsoft Security Copilot interface using natural language.

## Prerequisites

- Microsoft Security Copilot access (M365 E5 or standalone SCU capacity)
- Azure AD app registration with the following delegated permissions:
  - `DeviceManagementConfiguration.ReadWrite.All`
  - `Group.Read.All`
  - `DeviceManagementRBAC.ReadWrite.All`
  - `offline_access`, `openid`, `profile`, `email`
- The IntuneStuff Policy Converter app deployed at `admintemplate.intunestuff.com`

## Files Included

| File | Purpose |
|------|---------|
| `openapi-spec.yaml` | OpenAPI 3.0 specification describing all API endpoints |
| `api-plugin.yaml` | Security Copilot API plugin manifest (registers the API) |
| `agent-manifest.yaml` | Security Copilot agent manifest (the conversational agent) |

## Setup Steps

### Step 1: Upload the API Plugin

1. Open **Microsoft Security Copilot**
2. Click the **Sources** icon in the prompt bar
3. Scroll to the **Custom** section and click **Upload plugin**
4. Choose **Anyone in this workspace** (or **Just me** for testing)
5. Select **Security Copilot plugin**
6. Upload `api-plugin.yaml`
7. Complete the OAuth setup when prompted:
   - **Client ID**: Your Azure AD app's Client ID
   - **Client Secret**: Your Azure AD app's Client Secret
8. Turn on the plugin toggle

### Step 2: Upload the Agent Manifest

1. In **Manage plugins** > **Custom**, click **Upload plugin** again
2. Choose **Anyone in this workspace**
3. Select **Security Copilot plugin**
4. Upload `agent-manifest.yaml`
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

## Troubleshooting

- **Authentication errors**: Ensure the Azure AD app has the correct delegated permissions and admin consent has been granted
- **API connection issues**: Verify `admintemplate.intunestuff.com` is accessible
- **Missing skills**: Make sure both the API plugin and agent manifest are uploaded and enabled
- **Permission denied**: The signed-in user needs Intune Administrator or equivalent role

## Disclaimer

This is a community tool provided by IntuneStuff. All conversions are performed at your own risk. Always test in a non-production environment first and verify converted policies in the Intune portal before deploying to production.
