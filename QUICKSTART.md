# Quickstart (5 minutes)

## Prerequisites

- Node.js 20+
- pnpm

## 1) Install dependencies

```bash
pnpm install
```

## 2) Run the app

```bash
pnpm dev
```

Open http://localhost:3000

## 3) Load a template

Select a template from the home page. The form is generated from the IDTA template JSON.

## Optional: BaSyx backend

```bash
docker compose -f docker/docker-compose.yml up -d
```

This enables create/read/update against BaSyx AAS Environment.
