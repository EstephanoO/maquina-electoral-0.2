# Build Optimization Report (Next.js 16 + Bun)

Contexto
- Framework: Next.js 16 (App Router)
- Runtime/package manager: Bun
- CI: GitHub Actions
- Deploy: Vercel
- Monorepo: si
- Tests: no
- Scripts actuales: `build: next build`, `lint: eslint`

Resultado de build local (para baseline)
- `next build` compilo en ~71s, luego quedo en "Running TypeScript..." hasta timeout (120s).
- Conclusión: el cuello de botella principal esta en TypeScript/Lint dentro de `next build`.

1) Diagnostico rapido (causas tipicas y senales)

P0 (mas probable)
- Linting/Typecheck dentro de `next build`
  - Senal: "Linting and checking validity of types" / "Running TypeScript"
- Collecting page data / Generating static pages
  - Senal: "Collecting page data", "Generating static pages"

P1 (probable)
- Tracing
  - Senal: "Tracing"
- Minifying / Optimizing
  - Senal: "Minifying", "Creating an optimized production build"

P2 (posible)
- Compiling lento por cold cache
  - Senal: "Compiled successfully" tarda mucho comparado a builds siguientes

Como medir antes/despues
- Vercel: Build Duration + Build Logs
- GitHub Actions: duracion del job + timestamps entre steps
- Metricas clave:
  - tiempo total
  - tiempo entre "Compiled successfully" y fin (typecheck/lint)

2) Plan "Quick Wins" (solo seguro)

Limpieza de basura/artifacts (solo upload, no runtime)
- Excluir del upload en Vercel: `.next`, `.turbo`, `.vercel`, `node_modules`, `coverage`, `**/*.log`, `.DS_Store`, `playwright-report`, `tmp`, `dist`, `out`, `.github`.

Caching
- Bun: cache de `~/.bun/install/cache` y opcional `node_modules`.
- Next: `.next/cache`.
- Install deterministico: `bun install --frozen-lockfile`.

Ajustes de repo seguros
- `vercelignore` para reducir upload y analisis.
- Separar lint/typecheck del build y correr en CI como jobs independientes.

3) Recomendaciones de configuracion (snippets)

next.config.ts (seguro, sin cambiar runtime)
```ts
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
```

package.json (separar responsabilidades)
```json
{
  "scripts": {
    "build": "next build",
    "lint": "eslint",
    "typecheck": "tsc --noEmit"
  }
}
```

GitHub Actions (Bun + cache + jobs separados)
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: "latest"
      - uses: actions/cache@v4
        with:
          path: |
            ~/.bun/install/cache
            node_modules
          key: bun-${{ runner.os }}-${{ hashFiles('**/bun.lockb') }}
      - run: bun install --frozen-lockfile
      - run: bun run lint

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - uses: actions/cache@v4
        with:
          path: |
            ~/.bun/install/cache
            node_modules
          key: bun-${{ runner.os }}-${{ hashFiles('**/bun.lockb') }}
      - run: bun install --frozen-lockfile
      - run: bun run typecheck

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - uses: actions/cache@v4
        with:
          path: |
            ~/.bun/install/cache
            node_modules
            .next/cache
          key: next-${{ runner.os }}-${{ hashFiles('**/bun.lockb', '**/*.[jt]s', '**/*.[jt]sx', '**/*.ts', '**/*.tsx') }}
      - run: bun install --frozen-lockfile
      - run: time bun run build
```

vercelignore (reducir upload)
```
**/.next
**/.turbo
**/.vercel
**/node_modules
**/coverage
**/playwright-report
**/*.log
**/.DS_Store
**/tmp
**/dist
**/out
**/.github
```

Vercel settings (seguro)
- `NEXT_TELEMETRY_DISABLED=1`

4) Checklist de verificacion (no rompimos nada)

Comandos
- `bun run lint`
- `bun run typecheck` (si se agrega)
- `bun run build`

Rutas a verificar
- SSR/SSG criticas: `/info/cesar-vasquez`, dashboards, console.

Senales de build intactas
- El conteo de paginas generadas no cambia.
- No aparecen errores de typescript.

Plan de rollback
1) Revertir `next.config.ts` (eslint ignore).
2) Revertir cambios de scripts y workflows.
3) Remover `vercelignore` si fuese necesario.

5) Lista priorizada P0/P1/P2

P0 (impacto alto, riesgo muy bajo)
- Separar lint/typecheck del build
  - Archivos: `next.config.ts`, `.github/workflows/*.yml`, `package.json`
  - Medicion: tiempo entre "Compiled successfully" y fin

P1 (impacto medio, riesgo muy bajo)
- Cache Bun + `.next/cache` en CI
  - Archivos: `.github/workflows/*.yml`
  - Medicion: tiempo total del job de build

P1 (impacto medio, riesgo bajo)
- `vercelignore` para reducir upload
  - Archivos: `.vercelignore`
  - Medicion: tiempo en "Fetching project files" en Vercel

P2 (impacto bajo, riesgo muy bajo)
- `NEXT_TELEMETRY_DISABLED=1`
  - Archivos: Vercel env vars
  - Medicion: logs mas limpios
