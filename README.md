# IntuneStuff Policy Converter

A community web application for IT administrators to convert deprecated Microsoft Intune **Administrative Template** policies to the newer **Settings Catalog** format — directly in your tenant through the Microsoft Graph API.

**No app registration required.** Just sign in with your Microsoft account and grant admin consent. The tool works with any organization.

Live at [admintemplate.intunestuff.com](https://admintemplate.intunestuff.com) | Built by [IntuneStuff](https://intunestuff.com)

---

## Features

- **Policy Conversion** — Convert Administrative Template policies to Settings Catalog format with intelligent setting mapping
- **Conversion Preview** — Preview which settings will transfer (high / medium / low confidence) before committing
- **Resilient Conversion** — Settings that cannot be mapped or are rejected by the Graph API are skipped; the policy is still created with all valid settings
- **Assignment Management** — View, copy, and manage group assignments (include / exclude), filters, and all-users / all-devices targeting
- **Scope Tag Management** — Create, assign, and manage role scope tags on converted policies
- **Direct Tenant Integration** — Connects live to your Microsoft 365 tenant via delegated Graph API permissions
- **Post-Conversion Summary** — See exactly which settings were successfully converted and which were skipped
- **Cleanup Tools** — Delete old Administrative Template policies and assignments after migration
- **Security Copilot Agent** — Perform all conversion operations through natural language in Microsoft Security Copilot

---

## How It Works

1. **Sign In** — Click "Sign in with Microsoft" and grant admin consent for your organization (one-time setup by a Global Administrator)
2. **Select** — Browse your Administrative Template policies and select one to convert
3. **Preview** — Preview the conversion to see which settings will map successfully to Settings Catalog
4. **Convert** — Create the new Settings Catalog policy with optional assignment and scope tag transfer
5. **Clean Up** — Delete the old Administrative Template policy after successful conversion

The app uses **delegated permissions** via OAuth2 authorization code flow with admin consent. All actions are performed as the signed-in user — the tool never has standing access to your tenant.

---

## Privacy & Security

> **We do not store, log, or retain any data from your tenant.**

- All operations are performed live through the Microsoft Graph API — nothing is cached or persisted on the server.
- Your sign-in is handled entirely by Microsoft's OAuth2 flow. We never see or store your password.
- The tool uses **delegated permissions** — every Graph API call runs in the context of the signed-in user with their existing Intune role.
- You can audit all activity in your Azure AD sign-in and audit logs.
- Sessions are server-side only and contain your access/refresh tokens. They are destroyed on logout.

---

## Admin Consent

When signing in for the first time, a Global Administrator needs to consent to the following delegated permissions on behalf of your organization. This is a **one-time process**.

| Permission | Purpose |
|------------|---------|
| `DeviceManagementConfiguration.ReadWrite.All` | Read existing Administrative Template policies, search Settings Catalog definitions, and create new Settings Catalog policies |
| `Group.Read.All` | Resolve Azure AD group IDs to display names when viewing / copying assignments |
| `DeviceManagementRBAC.ReadWrite.All` | Read, create, and assign role scope tags to converted policies |

No app registration is required on your end. The tool uses a multi-tenant Azure AD application managed by IntuneStuff.

---

## API Endpoints

All endpoints require authentication (session-based or Bearer token).

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/auth/login` | Redirect to Microsoft OAuth2 login with admin consent |
| `GET` | `/api/auth/callback` | OAuth2 callback (exchanges code for tokens) |
| `POST` | `/api/auth/logout` | Sign out and destroy session |
| `GET` | `/api/auth/status` | Check authentication status and user info |
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

## Security Copilot Integration

The tool includes a Microsoft Security Copilot agent that lets IT administrators perform all conversion operations through natural language conversation. See [`security-copilot/SETUP.md`](security-copilot/SETUP.md) for setup instructions.

---

## Tech Stack

- **Frontend** — React, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query
- **Backend** — Express 5, TypeScript, Microsoft Graph API (Beta)
- **Database** — PostgreSQL with Drizzle ORM (sessions, analytics)
- **Auth** — Multi-tenant OAuth2 authorization code flow with admin consent (delegated permissions)
- **Routing** — Wouter (client-side)

---

## Self-Hosting

To run your own instance, you need to create a **multi-tenant Azure AD application** with the delegated permissions listed above and configure a redirect URI pointing to your instance.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AZURE_CLIENT_ID` | Yes | Your multi-tenant Azure AD application (client) ID |
| `AZURE_CLIENT_SECRET` | Yes | The client secret for your Azure AD application |
| `SESSION_SECRET` | Yes | A random string used for signing session cookies |
| `DATABASE_URL` | Yes | PostgreSQL connection string for sessions and analytics |
| `APP_DOMAIN` | No | Custom domain for the app (defaults to the Replit URL) |
| `ADMIN_KEY` | No | Secret key to access the analytics dashboard at `/admin` |

### Quick Start

```bash
git clone https://github.com/JoeryVandenBosch/AdminTemplateConverter.git
cd AdminTemplateConverter

npm install

# Set environment variables
export AZURE_CLIENT_ID=your-client-id
export AZURE_CLIENT_SECRET=your-client-secret
export SESSION_SECRET=your-session-secret
export DATABASE_URL=your-postgres-connection-string

# Push database schema
npm run db:push

# Start in development mode
npm run dev

# Or build and run in production
npm run build
npm start
```

---

## FAQ

**Q: Does this tool store any data from my tenant?**
A: No. All operations are performed live through the Microsoft Graph API. Nothing is stored, cached, or logged on the server.

**Q: Do I need to create an app registration?**
A: No. The hosted version at admintemplate.intunestuff.com uses a multi-tenant app managed by IntuneStuff. Just sign in and grant admin consent. If you self-host, you will need your own Azure AD app registration.

**Q: What happens if a setting can't be matched?**
A: The conversion preview shows you exactly which settings can be mapped and which cannot. During conversion, settings that are rejected by the Graph API are automatically skipped — the policy is still created with all valid settings.

**Q: Can I undo a conversion?**
A: The original Administrative Template policy is not modified during conversion. A new Settings Catalog policy is created alongside it. You can delete either policy at any time.

**Q: What permissions does the signed-in user need?**
A: The user needs an Intune Administrator role (or equivalent) to read and create policies. A Global Administrator is needed for the initial admin consent.

**Q: Is the Graph API Beta endpoint stable?**
A: Some Settings Catalog APIs are only available on the Beta endpoint. While Microsoft may make changes to Beta APIs, the core functionality used by this tool has been stable.

---

## License

This project is provided as-is for the IntuneStuff community. See the [IntuneStuff website](https://intunestuff.com) for more tools and resources.

---

## Support

For questions, feedback, or issues:
- Visit [intunestuff.com](https://intunestuff.com)
- Open an issue on the [GitHub repository](https://github.com/JoeryVandenBosch/AdminTemplateConverter)
