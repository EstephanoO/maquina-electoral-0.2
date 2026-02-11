# Tierra habilitaciones

## Objetivo
Agregar una ruta dedicada para habilitar contactos desde el mapa de Tierra, usando box select y asignacion multiple de operadoras, sin tocar la ruta actual de Tierra y sin duplicar datos. La fuente de verdad sigue siendo `forms` + `forms_operator_access` + `forms_operator_status`.

## Alcance
- Nueva ruta: `/dashboard/somos-peru/habilitaciones`.
- Reuso del mapa y datos de Tierra (`PartyMapDashboard`).
- Panel modal con selector de operadoras y accion de habilitar.
- Solo mostrar contactos no habilitados globalmente.

## Arquitectura
`PartyMapDashboard` recibe un `mode="habilitaciones"` para activar:
- Filtrado de registros no habilitados (consulta a `/api/forms-access/enabled`).
- Box select en mapa solo cuando el modal esta abierto.
- Modal con controles de habilitacion.
`EventMapDashboardView` acepta acciones extra en header para renderizar el trigger del modal.

## Componentes
- `PartyMapDashboard`: orquesta mapa, filtros y habilitacion.
- `EventMapDashboardView`: renderiza header con acciones y mapa.
- Hook `useEnabledFormClientIds`: obtiene IDs ya habilitados.
- API `GET /api/forms-access/enabled`: lista `clientId` habilitados.

## Flujo de datos
1) El mapa carga datos de `/api/interviews`.
2) Se filtran por candidato y por no habilitados (si esta activo el modo habilitaciones).
3) El usuario selecciona puntos con box select y elige operadoras.
4) Se llama a `/api/forms-access` para habilitar accesos usando `clientIds`.
5) Se refresca la lista de habilitados para excluir los recien asignados.

## Errores y estados
- Si falla la consulta de habilitados, se muestra advertencia y se bloquea el boton de habilitar.
- Si falla la habilitacion, se muestra mensaje sin perder la seleccion.

## Pruebas
- Verificar que la nueva ruta muestra solo no habilitados.
- Habilitar una seleccion y confirmar que desaparecen del mapa.
- Validar que la ruta de Tierra sigue intacta.
