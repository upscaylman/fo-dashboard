# FO Metaux Dashboard - AI Agent Instructions

## Project Architecture

**Monorepo structure:** React dashboard (root) + two embedded apps:
- **Main Dashboard** (`/`) - React 18 + TypeScript + Vite + Supabase
- **DocEase** (`/docease`) - Document automation with n8n workflows
- **SignEase** (`/signease`) - Electronic signature platform

**Backend:** Supabase (PostgreSQL + Auth + Realtime + Storage)  
**Frontend:** React with strict TypeScript, Tailwind CSS 3, Lucide icons  
**Deployment:** Netlify (frontend) + Supabase (backend)

## Quick Start

```bash
# Setup environment
cp .env.example .env.local  # Add VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY

# Main dashboard
npm install
npm run dev          # → http://localhost:5173

# Sub-applications (separate terminals)
cd docease && npm run start    # n8n workflows + form server
cd signease && npm run dev     # signature app
```

## Critical Patterns (DO NOT MODIFY WITHOUT REVIEW)

### 1. Context Provider Order
**MUST** wrap in this exact sequence in `App.tsx`:
```tsx
<ThemeProvider>
  <ToastProvider>
    <AuthProvider>
      <BookmarkProvider>
        <MobileMenuProvider>
          {/* App content */}
```
❌ Reordering breaks authentication and state management.

### 2. Role-Based Access Control
**Fixed role names** (stored in DB `users.role_level`):
- `super_admin` - Full access + user impersonation
- `secretary_general` - All documents/templates access
- `secretary` - Same as secretary_general (flat hierarchy)
- `secretary_federal` - Own documents only

**Check permissions via:**
```tsx
import { usePermissions } from './hooks/usePermissions';
const { can, hasRole } = usePermissions();

if (!can('documents.delete.all')) return null;
```

**See:** [lib/permissions.ts](lib/permissions.ts) for complete permission matrix.


### 3. Supabase Realtime Subscriptions
**Always cleanup channels on unmount:**
```tsx
useEffect(() => {
  const channel = supabase
    .channel('table-changes')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'shared_documents' 
    }, handler)
    .subscribe();
  
  return () => { channel.unsubscribe(); }; // CRITICAL
}, []);
```

**See patterns in:** [hooks/usePresence.ts](hooks/usePresence.ts), [hooks/useNotifications.ts](hooks/useNotifications.ts)

### 4. Custom LocalStorage Wrapper
OneDrive sync issues require custom storage ([lib/supabase.ts](lib/supabase.ts#L15-L36)):
```tsx
const customStorage = {
  getItem: (key) => { try { return localStorage.getItem(key); } catch { return null; } },
  // ... wrapped in try/catch for OneDrive compatibility
};
```
❌ Don't use raw `localStorage` for auth tokens.

## Database Migrations

**Location:** Root `MIGRATION_*.sql` files  
**Apply via:** Supabase SQL Editor (no local runner)  
**Key tables:** `users`, `shared_documents`, `notifications`, `active_sessions`

**Migration order:**
1. `SUPABASE_SCHEMA.sql` - Create tables
2. `SUPABASE_SEED.sql` - Initial data
3. `MIGRATION_*.sql` - Incremental changes
4. `AUTO_ROLE_TRIGGER.sql` - Role change notifications

## Testing & Debugging

```bash
# Manual integration tests
open test-login.html         # OAuth flow
open test-supabase.html      # Database connection
powershell test-realtime.ps1 # Websocket subscriptions
```

**Supabase Console Checks:**
- Auth → Users (verify OAuth sessions)
- Table Editor → users (check role_level column)
- Logs → Realtime (monitor channel connections)

## Sub-Application Notes

### DocEase (`/docease`)
- **Tech:** n8n + Docxtemplater + Ollama (AI generation)
- **Start:** `.\start.bat` (Windows) or `./scripts/start.sh` (Unix)
- **Workflow:** Form → n8n webhook → Template fill → Email
- **Templates:** `templates/word/*.docx` with `{variable}` syntax

### SignEase (`/signease`)
- **Tech:** React 19 + pdf-lib + pdfjs-dist@4.4.168 (version pinned!)
- **Features:** PDF signing, P12 certificates, eIDAS compliance
- **Critical:** Homothetic signature resizing (aspect ratio locked)

## Code Style Conventions

- **TypeScript:** Strict mode enabled, no `any` types
- **Styling:** Tailwind utility classes only, no global CSS
- **Imports:** Use absolute paths from `src/`
- **Components:** Functional components with hooks, no class components
- **State:** React hooks + Context API (no Redux)

## Common Pitfalls

1. **OAuth Callbacks:** Hash routing requires manual session handling in `AuthContext.tsx`
2. **Role Impersonation:** Super admins enter "observation mode" - all interactions blocked except navigation
3. **File Uploads:** Validate types/sizes before Supabase Storage (`shared-documents` bucket, 1GB limit)
4. **Real-time Channel Leaks:** Always unsubscribe channels or memory leaks occur
5. **Provider Order:** Wrong order = broken auth state propagation

## Key Files Reference

- [App.tsx](App.tsx) - Provider setup + impersonation banner
- [lib/permissions.ts](lib/permissions.ts) - Role hierarchy + permission matrix
- [context/AuthContext.tsx](context/AuthContext.tsx) - Auth + impersonation logic
- [lib/supabase.ts](lib/supabase.ts) - Supabase client with custom storage
- [hooks/usePermissions.ts](hooks/usePermissions.ts) - Permission checking hook
- [netlify.toml](netlify.toml) - SPA redirects + security headers

## When Making Changes

✅ **DO:**
- Run `npm run build` to verify TypeScript compilation
- Test authentication flows with `test-login.html`
- Check Supabase RLS policies for security impacts
- Document new env vars in `.env.example`

❌ **DON'T:**
- Reorder context providers without full testing
- Rename database columns without migration + code updates
- Remove try/catch from localStorage calls (breaks OneDrive sync)
- Change role names without updating `ROLE_PERMISSIONS` object

## Strict Rules
- Never write emoji in UX interface