# Developer Guide

## Architecture

The core flow:

1. **Template Fetch + Parse**
   - `src/lib/parser/` fetches IDTA templates and converts them to a normalized UI tree.
2. **Renderer**
   - `src/lib/renderer/IDTAFormRenderer.tsx` renders the UI tree into React form fields.
   - `src/lib/renderer/validation.ts` enforces XSD valueType rules and cardinality.
3. **Export**
   - `src/lib/exporters/aas-exporter.ts` converts form values to AAS v3.0 JSON.
   - JSON is validated against the official schema in `src/lib/schemas/aas.json`.
4. **Import (Round-trip)**
   - `src/lib/importers/submodel-importer.ts` converts submodel instances back to form values.
5. **Integration**
   - `src/lib/api/basyx-client.ts` talks to BaSyx AAS Environment.

## Key Modules

- Parser: `src/lib/parser/`
- Renderer: `src/lib/renderer/`
- Exporter: `src/lib/exporters/`
- Importer: `src/lib/importers/`
- BaSyx client: `src/lib/api/`

## Adding a New SubmodelElement Type

1. Add parser support in `src/lib/parser/template-parser.ts`.
2. Add renderer components in `src/components/form/` and register in `src/components/form/registry.ts`.
3. Add export handling in `src/lib/exporters/aas-exporter.ts`.
4. Add validation rules in `src/lib/renderer/validation.ts` if needed.
5. Add tests for parser + renderer + exporter.

## Testing

```bash
pnpm test       # watch mode
pnpm test:ci    # run once
pnpm type-check
```

### Integration Test (BaSyx)

```bash
BASYX_INTEGRATION=1 pnpm vitest run -- src/lib/api/basyx-client.integration.test.ts
```

Requires Docker services:

```bash
docker compose -f docker/docker-compose.yml up -d
```

## Environment Variables

```bash
BASYX_REGISTRY_URL=http://localhost:4000
BASYX_ENVIRONMENT_URL=http://localhost:4001
```

## Code Style

- TypeScript strict mode; avoid `any` in core logic.
- Prefer small pure functions for parser/exporter/validation logic.
- Add focused unit tests for edge cases (cardinality, list export, valueType validation).
