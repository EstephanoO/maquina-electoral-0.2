# Reporte de metricas y KPIs (INFO)

## Objetivo
Definir los indicadores para el flujo global de INFO con asignacion por WhatsApp, estados y archivado, usando SSE para sincronizacion en tiempo real.

## KPIs principales
- **Asignacion efectiva**: % de registros que pasan de libre a asignado por operadora.
- **Tiempo a WhatsApp (TtW)**: tiempo desde la carga del registro hasta el primer click de WhatsApp.
- **Tiempo a Hablado (TtH)**: tiempo desde WhatsApp hasta marcado de Hablado.
- **Tiempo a Respondido (TtR)**: tiempo desde WhatsApp hasta Respondido.
- **Tasa de contacto**: Hablados / WhatsApp.
- **Tasa de respuesta**: Respondidos / Hablados.
- **Tasa de archivo**: Archivados / WhatsApp.

## Operacion por operadora
- **Backlog asignado**: registros asignados a la operadora que siguen sin Hablado.
- **Velocidad de cierre**: (Hablado + Respondido + Archivado) por hora.
- **Carga activa**: cantidad de registros asignados visibles (no archivados).
- **Reasignaciones**: intentos de asignacion fallidos por lock (indicador de friccion).

## Calidad y friccion
- **Colisiones evitadas**: cantidad de intentos de WhatsApp bloqueados por lock.
- **Latencia de sincronizacion**: tiempo entre cambio de estado y recepcion via SSE.
- **Errores de guardado**: tasa de fallas en PATCH de estado/links.

## Dashboard (futuro)
- Resumen diario por operadora (WhatsApp, Hablado, Respondido, Archivado).
- Embudo operativo (Libre -> Asignado -> Hablado -> Respondido/Archivado).
- Distribucion de tiempos (mediana, p90 de TtH y TtR).
- Tabla de actividad reciente con actor, accion y registro.

## Notas de implementacion
- El lock se representa como asignacion exclusiva por `sourceId`.
- SSE debe emitir eventos de **assignment** y **status**.
- Admin ve el total global; operadoras solo sus asignados o libres.
