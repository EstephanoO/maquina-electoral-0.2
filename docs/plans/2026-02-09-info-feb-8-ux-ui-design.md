# Info Feb 8 UX/UI (Tabla Primero)

## Contexto
Pantalla operativa para seguimiento de entrevistas y contacto por WhatsApp. El objetivo es acelerar el flujo de trabajo (abrir chat + marcar estado) y mejorar la legibilidad en tablas con alto volumen.

## Objetivos
- Reducir friccion para abrir WhatsApp y marcar estados.
- Hacer la tabla mas escaneable con jerarquia clara.
- Mantener el contexto sin competir con la tabla.

## Direccion de diseno
Se adopta un layout “tabla primero” con una cinta de control sticky arriba y un rail derecho compacto para resumenes. El mensaje predeterminado se mantiene, pero pasa a un bloque colapsable para liberar altura.

## Layout
- Cinta superior sticky: buscador principal, chips de estado con conteos, total de registros y limpieza rapida.
- Tabla principal full-bleed: encabezado fijo, zebra sutil, hover de fila, acciones inline.
- Rail derecho colapsable: ranking por entrevistador y conversaciones activas en modo compacto.

## Interacciones
- Boton de WhatsApp reducido a icono + telefono, con hover que refuerza la accion.
- Chips de estado con feedback visual consistente (filled vs outline).
- Confirmacion de guardado local con badge discreto.

## Estado y manejo de errores
- Skeletons en loading para evitar salto visual.
- Mensaje de error con CTA “Reintentar”.
- Empty state con opcion de limpiar filtros si aplica.

## Datos y flujo
- CSV se carga una vez y se deriva a summary, filteredRecords y activeConversations.
- statusMap persiste en localStorage y alimenta conteos y filtros.

## Testing
- Parseo CSV y filtros por estado.
- Persistencia de statusMap.
- Render de error/empty y presencia de CTA.
