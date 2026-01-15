# IDTA Form Studio

A dynamic form generator for IDTA Submodel Templates with Asset Administration Shell (AAS) V3.0 compliance.

## Overview

IDTA Form Studio automatically generates user-friendly forms from standardized IDTA Submodel Templates, enabling non-technical users to create valid AAS Submodel Instances without knowledge of the underlying JSON structure.

**Key Features:**
- Dynamic form rendering from any IDTA template
- Complete AAS V3.0 type system (13 SubmodelElement types)
- Export to valid AAS JSON and AASX packages
- Docker-based BaSyx integration for persistence
- Industrial-grade UI with dark mode support

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm (or npm/yarn)
- Docker & Docker Compose (for BaSyx integration)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/aas-form-factory.git
cd aas-form-factory

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

### With BaSyx Backend

```bash
# Start BaSyx services
docker-compose up -d

# Verify services are running
curl http://localhost:4000/registry/api/v3.0/shell-descriptors
curl http://localhost:4001/aas-environment/api/v3.0/submodels
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Template selector home
│   └── templates/[id]/    # Dynamic form pages
├── components/
│   ├── form/              # AAS form components
│   ├── layout/            # App layout components
│   └── ui/                # shadcn/ui primitives
├── lib/
│   ├── parser/            # Template parser
│   ├── catalog/           # json-render catalog
│   ├── renderer/          # Form renderer
│   ├── exporters/         # JSON/AASX export
│   └── api/               # BaSyx client
└── types/
    └── aas.ts             # AAS V3.0 type definitions
```

## Usage

### Loading a Template

```typescript
import { fetchTemplate, parseSubmodelTemplate } from '@/lib/parser';

// Fetch and parse a template
const template = await fetchTemplate('IDTA-02006-3-0');
const parsed = parseSubmodelTemplate(template);
```

### Rendering a Form

```tsx
import { IDTAFormRenderer } from '@/lib/renderer';

<IDTAFormRenderer
  template={parsed}
  initialValues={{}}
  onSubmit={(values) => console.log(values)}
/>
```

### Exporting Data

```typescript
import { exportToSubmodel } from '@/lib/exporters/aas-exporter';
import { createAASXPackage } from '@/lib/exporters/aasx-exporter';

// Export to JSON
const result = exportToSubmodel(template, formValues);
console.log(result.json);

// Export to AASX package
const aasx = await createAASXPackage(result.submodel);
```

### Saving to BaSyx

```typescript
import { basyxClient } from '@/lib/api/basyx-client';

// Create a new submodel instance
await basyxClient.createSubmodel(result.submodel);

// List all submodels
const submodels = await basyxClient.listSubmodels();
```

## Supported Templates

| Template | IDTA ID | Status |
|----------|---------|--------|
| Digital Nameplate | IDTA 02006-3-0 | Supported |
| Contact Information | IDTA 02002-1-0 | Supported |
| Technical Data | IDTA 02003-1-2 | Supported |
| Handover Documentation | IDTA 02004-2-0 | Supported |
| Carbon Footprint | IDTA 02029-1-0 | Planned |

## AAS Element Types

The form generator supports all 13 AAS V3.0 SubmodelElement types:

| Element Type | Input Component |
|--------------|-----------------|
| Property | TextInput, NumberInput, DateInput, etc. |
| MultiLanguageProperty | MultiLanguageInput |
| SubmodelElementCollection | SMCContainer |
| SubmodelElementList | ArrayContainer |
| Range | RangeInput |
| File | FileInput |
| Blob | FileInput |
| ReferenceElement | ReferenceInput |
| Entity | EntityContainer |
| Operation | Read-only display |
| Capability | Read-only display |
| BasicEventElement | Read-only display |
| RelationshipElement | Read-only display |

## Configuration

### Environment Variables

```bash
# BaSyx Registry URL
BASYX_REGISTRY_URL=http://localhost:4000/registry/api/v3.0

# BaSyx AAS Environment URL
BASYX_ENV_URL=http://localhost:4001/aas-environment/api/v3.0
```

### Docker Services

| Service | Port | Description |
|---------|------|-------------|
| BaSyx Registry | 4000 | AAS Shell Descriptor Registry |
| BaSyx Environment | 4001 | Submodel Repository |
| MongoDB | 27017 | Persistence layer |

## Development

```bash
# Run development server
pnpm dev

# Run tests
pnpm test

# Type check
pnpm type-check

# Build for production
pnpm build
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    IDTA FORM STUDIO                      │
├─────────────────────────────────────────────────────────┤
│  Template Fetch → Parser → UI Tree → Form Renderer      │
│                                           ↓              │
│                                      Form Values         │
│                                           ↓              │
│                        AAS Exporter → JSON/AASX         │
│                                           ↓              │
│                                    BaSyx Client         │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                    DOCKER STACK                          │
│  BaSyx Registry (4000) ← → BaSyx Environment (4001)     │
│                              ↓                           │
│                         MongoDB (27017)                  │
└─────────────────────────────────────────────────────────┘
```

## API Reference

### Template Parser

```typescript
parseSubmodelTemplate(submodel: Submodel): ParsedTemplate
findElementByPath(template: ParsedTemplate, path: string): ParsedElement | undefined
extractSemanticIds(template: ParsedTemplate): string[]
getRequiredElements(template: ParsedTemplate): ParsedElement[]
```

### Exporter

```typescript
exportToSubmodel(template: ParsedTemplate, values: Record<string, unknown>, options?: ExportOptions): ExportResult
validateSubmodel(submodel: Submodel): string[]
createAASXPackage(submodel: Submodel): Promise<Blob>
```

### BaSyx Client

```typescript
basyxClient.createSubmodel(submodel: Submodel): Promise<void>
basyxClient.getSubmodel(id: string): Promise<Submodel>
basyxClient.listSubmodels(): Promise<Submodel[]>
basyxClient.updateSubmodel(id: string, submodel: Submodel): Promise<void>
basyxClient.deleteSubmodel(id: string): Promise<void>
```

## Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run with coverage
pnpm test:coverage
```

## License

MIT
