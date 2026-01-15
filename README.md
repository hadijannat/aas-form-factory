# AAS Form Factory

![CI](https://github.com/hadijannat/aas-form-factory/actions/workflows/ci.yml/badge.svg)
![Coverage](https://img.shields.io/badge/coverage-%E2%89%A570%25-brightgreen)

Dynamic form generation for IDTA Submodel Templates with Asset Administration Shell (AAS) v3.0 JSON output.

## Overview

AAS Form Factory parses official IDTA Submodel Template JSON files and renders a fully dynamic form UI for AAS Submodel Instances. It enforces cardinality and XSD value types, supports multilingual properties, and exports validated AAS JSON.

## Key Features

- Parse IDTA Submodel Templates and extract all SubmodelElements
- Render all 13 AAS SubmodelElement types
- Enforce cardinality (One, ZeroToOne, OneToMany, ZeroToMany)
- Validate inputs against XSD valueTypes (xs:string, xs:integer, xs:anyURI, xs:date, etc.)
- Export valid AAS JSON (Spec Part 1 v3.0) with schema validation
- Multi-language properties with add/remove language entries
- Optional BaSyx integration for create/read/update

## Quick Start

See `QUICKSTART.md` for a 5‑minute setup.

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000

## Project Structure

```
src/
├── app/                    # Next.js routes
├── components/             # UI + form components
├── lib/
│   ├── api/                # BaSyx client
│   ├── exporters/          # AAS JSON export
│   ├── importers/          # Submodel instance import
│   ├── parser/             # Template parser
│   └── renderer/           # Form renderer + validation
└── types/                  # AAS v3.0 types
```

## Supported Templates

| Template | IDTA ID |
|----------|---------|
| Digital Nameplate | IDTA 02006-2-0 |
| Contact Information | IDTA 02002-1-0 |
| Technical Data | IDTA 02003-1-2 |
| Handover Documentation | IDTA 02004-1-2 |
| Carbon Footprint | IDTA 02023-1-0 |

## Scripts

```bash
pnpm dev          # Start dev server
pnpm lint         # ESLint
pnpm type-check   # TypeScript strict check
pnpm test         # Vitest (watch)
pnpm test:ci      # Vitest (run once)
```

## BaSyx Integration

Start BaSyx via Docker Compose:

```bash
docker compose -f docker/docker-compose.yml up -d
```

Integration test (requires BaSyx running):

```bash
BASYX_INTEGRATION=1 pnpm vitest run -- src/lib/api/basyx-client.integration.test.ts
```

## Environment Variables

```bash
BASYX_REGISTRY_URL=http://localhost:4000
BASYX_ENVIRONMENT_URL=http://localhost:4001
```

## Architecture

```
Template JSON
   │
   ▼
Parser → UI Tree → Form Renderer → Form Values
                               │
                               ▼
                        AAS JSON Exporter
                               │
                               ▼
                        BaSyx Client (optional)
```

## Documentation

- `QUICKSTART.md` - 5‑minute setup
- `DEVELOPER_GUIDE.md` - architecture + extension guide
