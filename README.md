# IntuneStuff Policy Converter

A web application for IT administrators to convert deprecated Microsoft Intune **Administrative Template** policies to the newer **Settings Catalog** format — directly in your tenant through the Microsoft Graph API.

Built by [IntuneStuff](https://intunestuff.com) — Microsoft Cloud & Enterprise Mobility.

---

## Features

- **Policy Conversion** — Convert Administrative Template policies to Settings Catalog format with intelligent setting mapping
- **Conversion Preview** — Preview which settings will transfer (high / medium / low confidence) before committing
- **Assignment Management** — View, copy, and manage group assignments (include / exclude), filters, and all-users / all-devices targeting
- **Scope Tag Management** — Create, assign, and manage role scope tags on converted policies
- **Direct Tenant Integration** — Connects live to your Microsoft 365 tenant via Graph API
- **Post-Conversion Summary** — See exactly which settings were successfully converted
- **Cleanup Tools** — Delete old Administrative Template policies and assignments after migration

---

## Privacy & Security

> **We do not store, log, or retain any data from your tenant.**

- All operations are performed live through the Microsoft Graph API — nothing is cached or persisted on the server.
- Your Azure credentials (Tenant ID, Client ID, Client Secret) are used **only** for authenticating API calls to your own tenant. They are never shared, logged, or transmitted to third parties.
- Every action the tool performs is a direct Microsoft Graph API call. You can audit all activity in your Azure AD sign-in and audit logs.
- The application uses **application-level permissions** (client credentials flow) — no user sign-in or delegated access is required.

---

## Prerequisites

- A **Microsoft 365 tenant** with Intune licenses
- An **Azure AD (Entra ID) App Registration** with the required Graph API permissions
- **Admin consent** granted for the app registration
- Node.js 18+ (for self-hosting)

---

## Azure App Registration Setup

Follow these steps to create the App Registration that the converter will use to connect to your tenant.

### Step 1: Create the App Registration

1. Go to the [Azure Portal](https://portal.azure.com)
2. Navigate to **Microsoft Entra ID** → **App registrations**
3. Click **New registration**
4. Enter a name (e.g., `IntuneStuff Policy Converter`)
5. Under "Supported account types", select **Accounts in this organizational directory only**
6. Leave the Redirect URI blank (not needed for client credentials flow)
7. Click **Register**

### Step 2: Note Your IDs

From the app registration **Overview** page, copy:

| Value | Where to find it |
|-------|------------------|
| **Application (client) ID** | Overview page |
| **Directory (tenant) ID** | Overview page |

### Step 3: Create a Client Secret

1. Go to **Certificates & secrets** → **Client secrets**
2. Click **New client secret**
3. Enter a description (e.g., `Policy Converter`)
4. Choose an expiration period
5. Click **Add**
6. **Copy the secret value immediately** — it won't be shown again

### Step 4: Add API Permissions

1. Go to **API permissions**
2. Click **Add a permission** → **Microsoft Graph** → **Application permissions**
3. Add the following permissions:

| Permission | Purpose |
|------------|---------|
| `DeviceManagementConfiguration.ReadWrite.All` | Read existing Administrative Template policies, search Settings Catalog definitions, and create new Settings Catalog policies |
| `Group.Read.All` | Resolve Azure AD group IDs to display names when viewing / copying assignments |
| `DeviceManagementRBAC.ReadWrite.All` | Read, create, and assign role scope tags to converted policies |

4. Click **Grant admin consent for [your organization]**
5. Verify that all permissions show a green checkmark under "Status"

### Step 5: Configure Environment Variables

Set the following environment variables in your hosting environment:

```env
AZURE_TENANT_ID=your-tenant-id-here
AZURE_CLIENT_ID=your-client-id-here
AZURE_CLIENT_SECRET=your-client-secret-here
SESSION_SECRET=any-random-string-for-session-signing
```

---

## How It Works

1. **Connect** — The app authenticates to your tenant using the OAuth2 client credentials flow
2. **Fetch Policies** — It retrieves all Administrative Template (groupPolicyConfigurations) policies via Graph API
3. **Analyze Settings** — For each policy setting, it searches the Settings Catalog definitions using string-based matching with tiered confidence:
   - **High confidence** — Direct display name match found in Settings Catalog
   - **Medium confidence** — Match found by category path or ADMX reference
   - **Low confidence** — Partial or fuzzy match
4. **Preview** — You can preview the conversion before committing to see which settings will transfer
5. **Convert** — Creates a new Settings Catalog policy with the matched settings
6. **Assignments** — Optionally copies group assignments, filters, and targeting from the original policy
7. **Scope Tags** — Manage role scope tags on the converted policy
8. **Clean Up** — Delete the old Administrative Template policy after successful conversion

---

## Self-Hosting

### Quick Start

```bash
# Clone the repository
git clone https://github.com/your-username/intune-policy-converter.git
cd intune-policy-converter

# Install dependencies
npm install

# Set environment variables (see Step 5 above)
export AZURE_TENANT_ID=your-tenant-id
export AZURE_CLIENT_ID=your-client-id
export AZURE_CLIENT_SECRET=your-client-secret
export SESSION_SECRET=your-session-secret

# Start in development mode
npm run dev

# Or build and run in production
npm run build
npm start
```

### Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `AZURE_TENANT_ID` | Yes | Your Azure AD / Entra ID tenant ID |
| `AZURE_CLIENT_ID` | Yes | The Application (client) ID from your App Registration |
| `AZURE_CLIENT_SECRET` | Yes | The client secret value from your App Registration |
| `SESSION_SECRET` | Yes | A random string used for signing sessions |
| `DATABASE_URL` | No | PostgreSQL connection string (optional, for session persistence) |

---

## Tech Stack

- **Frontend** — React, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query
- **Backend** — Express 5, TypeScript, Microsoft Graph API (Beta)
- **Database** — PostgreSQL with Drizzle ORM (optional, for session persistence)
- **Routing** — Wouter (client-side)

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tenant-info` | Fetch connected Azure tenant information |
| `GET` | `/api/policies` | List all Administrative Template policies |
| `GET` | `/api/policies/:id/settings` | Get settings for a specific policy |
| `GET` | `/api/policies/:id/assignments` | Get assignments for a specific policy |
| `POST` | `/api/policies/:id/assignments/resolve` | Resolve assignments with group display names |
| `POST` | `/api/policies/:id/preview-conversion` | Preview conversion results |
| `POST` | `/api/policies/convert` | Convert a policy to Settings Catalog |
| `DELETE` | `/api/policies/:id` | Delete an Administrative Template policy |
| `DELETE` | `/api/policies/:id/assignments` | Delete all assignments from a policy |
| `POST` | `/api/settings-catalog/:id/assignments` | Add assignments to a Settings Catalog policy |
| `GET` | `/api/scope-tags` | List all role scope tags |
| `POST` | `/api/scope-tags` | Create a new scope tag |
| `DELETE` | `/api/scope-tags/:id` | Delete a scope tag |
| `POST` | `/api/settings-catalog/:id/scope-tags` | Update scope tags on a policy |
| `GET` | `/api/groups/search?q=query` | Search Azure AD groups |
| `GET` | `/api/filters` | List Intune assignment filters |

---

## Frequently Asked Questions

**Q: Does this tool store any data from my tenant?**
A: No. All operations are performed live through the Microsoft Graph API. Nothing is stored, cached, or logged on the server.

**Q: What happens if a setting can't be matched?**
A: The conversion preview will show you exactly which settings can be mapped and which cannot. Settings without a match will be flagged so you can manually configure them in the new policy.

**Q: Can I undo a conversion?**
A: The original Administrative Template policy is not modified during conversion. A new Settings Catalog policy is created alongside it. You can delete either policy at any time.

**Q: Why does this use application permissions instead of delegated?**
A: Application permissions (client credentials flow) allow the tool to operate without requiring individual user sign-in, which is simpler for administrative tools. The permissions are scoped to only what's needed for policy management.

**Q: Is the Graph API Beta endpoint stable?**
A: Some Settings Catalog APIs are only available on the Beta endpoint. While Microsoft may make changes to Beta APIs, the core functionality used by this tool has been stable.

---

## License

This project is provided as-is for the IntuneStuff community. See the [IntuneStuff website](https://intunestuff.com) for more tools and resources.

---

## Support

For questions, feedback, or issues:
- Visit [intunestuff.com](https://intunestuff.com)
- Open an issue on the GitHub repository
