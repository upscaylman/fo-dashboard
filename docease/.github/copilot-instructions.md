# DocEase Automation System - AI Agent Instructions

## Project Overview

DocEase is a document automation platform built with n8n workflows that generates customized Word documents with human validation before sending. The system integrates form submission, AI content generation (Ollama), template filling (Docxtemplater), and email delivery.

**Tech Stack:** n8n + Docker + Ollama (gemma2:2b) + Docxtemplater + PostgreSQL  
**Parent Project:** Part of FO Metaux Dashboard monorepo  
**Integration:** Supabase Storage for document tracking + React forms

## Quick Start

```bash
# Windows
.\start.bat              # Start complete Docker stack

# Linux/Mac  
./scripts/start.sh       # Start complete Docker stack

# Access interfaces
# n8n:          http://localhost:5678
# Form proxy:   http://localhost:3000
# Ollama API:   http://localhost:11434
```

## Core Architecture

```
docease/
├── docker/              # Docker Compose + service configs
│   ├── docker-compose.yml
│   └── .env            # Database credentials
├── templates/
│   ├── form/           # Static HTML forms + proxy server
│   ├── formulaire/     # React form application (npm start)
│   ├── word/           # .docx templates with {variables}
│   └── config/         # Template configurations
├── workflows/
│   └── n8n.json        # Main automation workflow
├── scripts/            # PowerShell/Bash utilities
├── mcp-server/         # MCP server for template editing
└── netlify/            # Netlify Functions for webhooks
```

## Critical Patterns (DO NOT MODIFY WITHOUT REVIEW)

### 1. Main n8n Workflow Pipeline
**Flow:** Form → Webhook → Data Prep → AI Gen → Template Fill → Preview → Email

Critical nodes sequence:
1. `Formulaire (Webhook)` - POST endpoint receives form data
2. `Set` - Formats variables for template compatibility  
3. `HTTP Request (Ollama)` - Generates AI content via gemma2:2b
4. `ReadBinaryFile` - Loads `.docx` template from `templates/word/`
5. `Docxtemplater` - Fills template with merged data
6. `Generate HTML Preview` - Creates validation preview
7. `Send Email` - Delivers document via SMTP

**See:** [workflows/n8n.json](workflows/n8n.json) for complete node configuration

### 2. Word Template Variables
**Common variables** (all templates):
```
{civilite}, {nom}, {prenom}, {adresse}, {cp}, {ville}
{statut}, {batiment}, {entreprise}
{email_destinataire}, {nom_exp}, {statut_exp}
{date}, {date_complete}, {heure}
```

**Template-specific:**
- Principal: `{objet}`, `{texte_ia}`, `{number}`
- Convocation: `{civilite_replace}`, `{nom_replace}`, `{lieu}`

❌ **Never** use unsupported syntax like `{#if}` or `{&variable}` - Docxtemplater only supports basic replacements.

### 3. Docker Services Stack
**Port allocations (DO NOT CHANGE):**
- `5678` - n8n workflow interface
- `5432` - PostgreSQL (n8n persistence)
- `11434` - Ollama AI models
- `3000` - Form proxy server (CORS handling)

**Health check order:**
```bash
docker ps                  # All 4 services should be "Up"
curl http://localhost:5678 # n8n responds
curl http://localhost:11434/api/tags # Ollama models loaded
```

### 4. Supabase Integration
Upload workflow results to main dashboard:
```typescript
// After n8n generates document
await supabase.storage
  .from('shared-documents')
  .upload(`docease/${filename}.docx`, fileBuffer);

await supabase.from('shared_documents').insert({
  file_url: publicUrl,
  created_by: userId,
  type: 'docease-generated'
});
```

**See:** Parent dashboard [lib/supabase.ts](../lib/supabase.ts) for client setup

## Testing & Debugging

```powershell
# Test form webhook
.\scripts\test-form-webhook.ps1

# Verify n8n service status
.\scripts\check-n8n-status.ps1

# Complete end-to-end workflow test
.\scripts\test-workflow-complet.ps1

# Diagnose workflow issues
.\scripts\diagnose-workflow.ps1

# Validate template variables
.\scripts\check-template-tags.ps1

# Test webhook modes (TEST/PROD)
.\scripts\test-webhook-modes.ps1
```

**Debugging checklist:**
1. Check Docker containers: `docker ps` (expect 4 running)
2. Review n8n execution logs in UI (http://localhost:5678/executions)
3. Inspect Ollama model: `curl http://localhost:11434/api/tags`
4. Test webhook endpoint: `curl -X POST http://localhost:5678/webhook/[id]`

## Template Management

### Creating New Templates
```powershell
# Generate template structure
.\scripts\create-new-template.ps1

# Fix conditional sections if needed
.\scripts\fix-template-conditional-sections.ps1

# Test dynamic template rendering
.\scripts\test-dynamic-templates.ps1
```

### Template Variable Rules
✅ **DO:**
- Use `{simple_variable}` syntax only
- Test all variables with sample data
- Document new variables in template config
- Keep variable names lowercase with underscores

❌ **DON'T:**
- Use complex expressions `{#if condition}`
- Nest templates or use partials
- Create circular variable references
- Modify core variables (`date`, `nom`, `email_destinataire`)

## Production Deployment

### Cloudflare Tunnel (Recommended)
```powershell
# Initial setup
.\scripts\setup-cloudflare-tunnel.ps1

# Update webhook URLs after tunnel creation
.\scripts\update-webhook-url.ps1
```

### Manual Deployment Steps
1. Configure DNS A/CNAME records pointing to server
2. Update n8n webhook URLs with public domain
3. Set environment variables in `docker/.env`
4. Test public access: `curl https://yourdomain.com/webhook/[id]`
5. Configure firewall rules (allow 5678, 3000 if needed)

### Environment Variables
Required in `docker/.env`:
```bash
POSTGRES_USER=n8n
POSTGRES_PASSWORD=n8n_secure_password
POSTGRES_DB=n8n
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=secure_password
WEBHOOK_URL=https://yourdomain.com  # Production only
```

## Common Pitfalls

1. **Webhook 404 Errors:** Verify webhook path matches n8n node configuration exactly
2. **Template Not Found:** Check file paths use forward slashes `/` even on Windows
3. **Ollama Timeout:** Increase HTTP request timeout to 60s for AI generation
4. **CORS Issues:** Proxy server (port 3000) must run for React forms to work
5. **Variable Missing:** Empty variables render as `{variable_name}` in output - always provide defaults

## Integration with Main Dashboard

DocEase files can be tracked in parent dashboard's Supabase:

```typescript
// After document generation in n8n
// Upload to Supabase Storage
const { data: uploadData } = await supabase.storage
  .from('shared-documents')
  .upload(`docease/${userId}/${filename}.docx`, buffer);

// Log in shared_documents table
await supabase.from('shared_documents').insert({
  file_url: uploadData.path,
  user_id: userId,
  created_by: userId,
  type: 'docease-auto',
  metadata: { workflow: 'principal', ai_generated: true }
});
```

**See:** Parent [INTEGRATION_DOCEASE_STORAGE.md](../docs/INTEGRATION_DOCEASE_STORAGE.md) for complete flow

## Key Files Reference

- [workflows/n8n.json](workflows/n8n.json) - Main automation workflow
- [docker/docker-compose.yml](docker/docker-compose.yml) - Services orchestration
- [templates/word/](templates/word/) - Word template library
- [templates/formulaire/](templates/formulaire/) - React form application
- [scripts/start.bat](scripts/start.bat) - Windows startup script
- [scripts/start.sh](scripts/start.sh) - Unix startup script

## When Making Changes

✅ **DO:**
- Test workflows in n8n UI before exporting JSON
- Backup templates before modifying
- Document new variables in template config
- Run full test suite after changes
- Version control workflow JSON files

❌ **DON'T:**
- Edit workflow JSON manually (use n8n UI)
- Change Docker port mappings (breaks integrations)
- Remove template variables without checking all usages
- Deploy without testing complete flow
- Modify Ollama model without validating output format