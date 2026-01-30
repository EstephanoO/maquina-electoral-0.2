# AGENTS.md

## Contexto global
- Ver contexto completo en `AGENTS.md` (raiz).
- Modulo de estado para dominio de eventos.

## Responsabilidades
- Store de eventos (agenda). Puede existir sin dashboard.
- Store de schemas de formulario y respuestas (location obligatoria en tierra).

## Limites
- Sin UI rendering. Store layer only.
- Sin data fetching directo; el fetch vive en `src/app/api/*`.

## Key files
- `src/modules/events/events.store.ts`
- `src/modules/events/forms.store.ts`
- `src/modules/events/responses.store.ts`

## Skills
- .agents/skills/zustand-state-management/SKILL.md
