# Design System - GOBERNA / MAQUINA-ELECTORAL

Este documento es la fuente de verdad para UI/UX del proyecto. Aplica a todas las vistas (console y dashboards) y a los estados compartidos.

## Identidad visual
- Estetica: war room civil, premium sobrio, data-first.
- Tono: serio, confiable, sin ruido visual.
- Direccion: capas suaves, sombras profundas, fondos con gradientes radiales.

## Tipografia
- Sans (UI): Manrope (`--font-manrope`, `--font-sans`).
- Display (titulos): Fraunces (`--font-fraunces`, `--font-display`).
- Regla: titulos con `.heading-display` y tracking leve negativo. Body con line-height 1.5-1.75.
- Evitar: mayusculas con tracking extremo. Referencia: `text-[0.7rem]` y `tracking-[0.2em]` max para labels.

## Color y tokens
Usar tokens de `src/app/globals.css`.

- Base (light):
  - Fondo: `--background` (#f7f7f9)
  - Texto: `--foreground` (#1f2937)
  - Card: `--card` (#ffffff)
  - Muted: `--muted` (#f1f2f4)
  - Muted fg: `--muted-foreground` (#6b7280)

- Base (dark):
  - Fondo: `--background` (#0b111a)
  - Texto: `--foreground` (#f5f0e6)
  - Primario: `--primary` (#d9b766)
  - Muted fg: `--muted-foreground` (#a7b0c3)

- Grises y bordes: `--border`, `--input`, `--ring`.
- Estados: `--destructive`.
- Charts: `--chart-1`..`--chart-5`.

## Superficies y elevacion
- Panel base: `.panel` (usa `--panel`, `--panel-border`, `--shadow-soft`).
- Panel elevado: `.panel-elevated`.
- Cards: `bg-card/70` a `bg-card/85` con borde sutil.
- Blur: usar `backdrop-filter` solo en panels.

## Radios
- Base: `--radius` (0.625rem).
- Escala: `--radius-sm`..`--radius-4xl`.
- Regla: cards 16-28px, botones 10-14px, chips 9999px.

## Layout
- Shells: `.app-shell`, `.console-shell`, `.auth-shell` con gradientes radiales.
- Consola: sidebar fijo en desktop, colapsa a una columna en mobile.
- Dashboards: grid denso, sin scroll horizontal.

## Componentes
- Cards: titulo, subtitulo y contenido; sombra suave; borde visible en ambos temas.
- Badges: evitar contraste bajo en light; usar `text-sky-700`/`text-amber-700` con `bg-*/20`.
- Botones: siempre `focus-visible` claro; no usar emojis.
- Tablas: header sticky con `backdrop-blur`.
- Mapas: overlay de estado (loading/error/empty) y markers visibles.

## Motion
- Animacion principal: `.fade-rise` con `stagger-*`.
- Duraciones: 150-300ms micro; 600-700ms reveal.
- Respetar `prefers-reduced-motion` en interacciones nuevas.

## Accesibilidad (no negociable)
- Contraste minimo 4.5:1 para texto normal.
- Botones solo icono requieren `aria-label`.
- Targets >= 44x44px.
- Estados vacios y error centrados y legibles.

## Data viz
- Charts en cliente con lazy-load (dynamic import).
- Paleta desde tokens `--chart-*` y `--primary`/`--secondary`.
- Si no hay datos: placeholder explicito, no chart vacio.

## Estados compartidos
- Empty/Error/Unauthorized usan layout centrado y max-width.
- LoadingState conserva skeleton y jerarquia clara.

## No hacer
- Tipografias genericas por defecto.
- Badges con contraste bajo en light.
- Layouts sin breakpoints.
- Polling manual con `setInterval` en componentes UI: usar SWR.
