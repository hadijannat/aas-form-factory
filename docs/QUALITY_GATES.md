# Quality Gates

## Performance (Lighthouse FCP)

- Target: First Contentful Paint (FCP) < 1.5s on 3G

Run:

```bash
pnpm install
pnpm lhci:autorun
```

Notes:
- Uses `.lighthouserc.cjs` with mobile throttling.
- Builds production bundle before running.

## Accessibility (axe-core)

Run Playwright a11y test:

```bash
pnpm exec playwright install --with-deps
pnpm test:a11y
```

Pass criteria:
- 0 `critical` violations (axe-core)

## Responsive Breakpoints

Run Playwright responsive test:

```bash
pnpm test:responsive
```

Pass criteria:
- No horizontal overflow at 640 / 768 / 1024 widths

## Cross-browser

Automated (recommended):

```bash
pnpm test:e2e
```

Playwright projects:
- Chromium (Chrome/Edge family)
- Firefox
- WebKit (Safari)

Manual spot checks (if needed):
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

Checklist:
- Home page loads
- Template selection works
- Form renders and validates
- Export JSON works
