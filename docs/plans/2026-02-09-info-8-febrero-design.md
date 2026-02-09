# Informe publico 8 de febrero - dashboard

## Objetivo
Construir una ruta publica `/info/8-febrero` con un dashboard resumen del 08 de febrero 2026.
Debe mostrar KPIs, ranking por entrevistador, analisis textual y accesos rapidos a WhatsApp.

## Alcance
- Ruta publica fuera de layouts protegidos.
- Datos cargados desde CSV estatico en `public/`.
- Tabla de registros con telefono clickeable y mensaje predefinido editable.

## Arquitectura
- `src/app/info/8-febrero/page.tsx` renderiza un componente UI dedicado.
- `src/ui/reports/info/InfoFeb8Dashboard.tsx` hace fetch del CSV, parsea y arma el layout.
- Sin dependencias de backend ni auth.

## Componentes
- Header con titulo, subtitulo y badge de fecha.
- KPIs: total de registros, entrevistadores activos, top 1 y top 2.
- Tabla de resultados por entrevistador (orden descendente).
- Cards de analisis: objetivo, alto desempeno, desempeno medio.
- Seccion WhatsApp con input de mensaje y tabla de registros.

## Data flow
- `fetch` a `/registros_2026-02-09-_1_ (1).csv`.
- Parseo por `;` y filtrado de lineas vacias.
- Calculo de resumenes por entrevistador en memoria.
- Mensaje de WhatsApp configurado por el usuario en el input.

## Errores y estados
- Loading simple en la tabla de registros.
- Error si el CSV no carga.
- Empty state si no hay resultados.

## Testing
- Verificar carga del CSV en local.
- Click en telefono abre WhatsApp con `+51` y texto predefinido.
- Layout responsive en mobile y desktop.
