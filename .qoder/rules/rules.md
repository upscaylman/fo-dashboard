# FO Metaux Dashboard - Copilot Instructions

## Project Overview
This is a professional dashboard application for FO Metaux (French metalworkers union) built with React, TypeScript, and Supabase. The system manages document generation, electronic signatures, user roles, and real-time collaboration.

## Architecture & Key Components

### Core Structure
```
src/
├── components/           # UI components organized by feature
├── context/             # React context providers (Auth, Theme, Toast, etc.)
├── hooks/               # Custom React hooks for business logic
├── lib/                 # Core utilities and Supabase integration
├── pages/               # Main application pages
├── docease/             # Document generation system (separate app)
├── signease/            # Electronic signature system (separate app)
└── public/              # Static assets and templates
```

### Authentication System
- **Supabase Auth** with custom OAuth handling
- **Role-based access control** with 4 levels: `super_admin`, `secretary_general`, `secretary`, `secretary_federal`
- **Real-time role updates** via PostgreSQL triggers
- **Impersonation feature** for super admins to view other users' perspectives
- **Session persistence** using custom storage to handle OneDrive sync issues

### Critical Patterns

#### 1. Role-Based Access Control
```typescript
// Check permissions in components
const { can, hasRole, isReadOnly } = usePermissions();

// Protect UI elements
<Protected permission="documents.create">
  <CreateDocumentButton />
</Protected>

// Handle read-only mode during impersonation
{isReadOnly && (
  <div className="overlay-read-only">
    {/* Visual indicators only, no interactions */}
  </div>
)}
```

#### 2. Real-Time Data Sync
```typescript
// Subscribe to database changes
const channel = supabase
  .channel('documents-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'shared_documents'
  }, (payload) => {
    // Handle real-time updates
  })
  .subscribe();
```

#### 3. Context Providers Order
```tsx
// Correct provider wrapping order (critical!)
<ThemeProvider>
  <ToastProvider>
    <AuthProvider>
      <BookmarkProvider>
        <MobileMenuProvider>
          <AppContent />
        </MobileMenuProvider>
      </BookmarkProvider>
    </AuthProvider>
  </ToastProvider>
</ThemeProvider>
```

## Development Workflow

### Environment Setup
1. Copy `.env.example` to `.env.local`
2. Configure Supabase credentials
3. Run `npm install`
4. Start with `npm run dev`

### Database Migrations
- SQL migration files in root (MIGRATION_*.sql)
- Run migrations in Supabase SQL editor
- Key tables: `users`, `shared_documents`, `notifications`, `active_sessions`

### Testing Authentication
Use test files:
- `test-login.html` - Test login flow
- `test-supabase.html` - Test database connection
- `test-realtime.ps1` - Test real-time subscriptions

## Component Patterns

### UI Component Structure
```tsx
// Card components with standardized headers
<Card>
  <CardHeader 
    title="Section Title"
    subtitle="Description"
    action={<ActionButton />}
  />
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

### Form Handling
```tsx
// Use controlled components with proper validation
const [formData, setFormData] = useState({});
const { invalidFields, validateAndMarkInvalidFields } = useValidation();

<input 
  className={invalidFields.has('fieldName') ? 'error-class' : ''}
  onChange={(e) => handleInputChange('fieldName', e.target.value)}
/>
```

## Integration Points

### External Applications
- **DocEase** (`/docease`) - Document generation with n8n workflow integration
- **SignEase** (`/signease`) - Electronic signatures with PDF processing
- Both are separate React apps embedded in the main dashboard

### Supabase Storage
- `shared-documents` bucket for file uploads
- Public URLs for document sharing
- Storage quota monitoring (1GB limit)

### Real-time Features
- User presence tracking
- Document change notifications
- Role change alerts
- Live chat assistant (Google Gemini)

## Coding Conventions

### TypeScript
- Strict typing required
- Use interfaces for props and state
- Prefer `useCallback` and `useMemo` for performance

### Styling
- Tailwind CSS with custom color palette
- Dark mode support via `dark:` variants
- Responsive design with mobile-first approach

### Error Handling
```typescript
try {
  const { data, error } = await supabase.operation();
  if (error) throw new Error(error.message);
  // Success handling
} catch (error) {
  addToast('User-friendly error message', 'error');
  console.error('Debug info:', error);
}
```

## Deployment
- **Netlify** for frontend hosting
- **Supabase** for backend/database
- Environment variables configured in Netlify dashboard
- PWA support with service worker

## Common Gotchas
1. **OAuth callbacks** - Hash routing issues, manual session handling required
2. **OneDrive sync** - Custom localStorage wrapper to prevent sync conflicts  
3. **Role impersonation** - Ensure real user permissions are checked for critical actions
4. **Real-time subscriptions** - Clean up channels on component unmount
5. **File uploads** - Validate file types and sizes before Supabase upload

## Debugging Tips
- Check browser console for Supabase connection logs
- Use Supabase dashboard to monitor real-time connections
- Test database queries in Supabase SQL editor first
- Monitor network tab for failed API requests