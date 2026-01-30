# AGENTS.md

## Estado actual
- Dashboard Analytics Guillermo sin mapa.
- Preview admin con panel fijo: "Configurar archivos" + "Salir".
- Uploads de preview (CSV/JSON/foto/XLSX) solo en memoria, sin persistencia.
- Landings chart consume Google Sheets (TSV) via `/api/landings`.

## Problema abierto
- Grafico "Inversion diaria en landings" no renderiza barras en UI aunque llegan datos.

## Debug actual
- API `/api/landings` devuelve registros con `dateKey`, `facebook`, `banco`.
- En UI se ve: `Registros 17`, `Ultimo 30-DIC.`
- Se agrego logging `console.info("[landings] registros", landingsPayments)`.
- Chart usa `label` (texto) para XAxis y `dateKey` en tooltip.

## Cambios recientes
- `/api/landings` proxy server-side con parser robusto.
- `useLandingsPayments` usa SWR con `refreshInterval: 60000`.
- `DashboardMain` muestra badges de debug en el header del chart.

## Pendientes sugeridos
1. Verificar si el container del chart tiene altura efectiva en el cliente (CSS/layout).
2. Inspeccionar warnings/errores de Recharts en consola del navegador.
3. Probar render con datos estaticos hardcodeados para aislar el problema.
4. Si Recharts falla, evaluar `BarChart` con `stackId` o `ComposedChart`.
5. Si se quiere persistencia de uploads: definir API + storage y reemplazar TSV remoto.
