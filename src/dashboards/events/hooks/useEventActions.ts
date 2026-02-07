import { useCallback } from "react";
import type { EventRecord } from "@/ui/dashboards/events/EventRecordsDialog";

interface UseEventActionsParams {
  dataUrl: string;
  mutate: any;
  onFocusRecord?: (record: EventRecord) => void;
}

interface UseEventActionsReturn {
  handleEdit: (record: EventRecord) => Promise<void>;
  handleDelete: (record: EventRecord) => Promise<void>;
  createFocusPointHandler: (mapRef: any) => (record: EventRecord) => void;
  buildDeleteUrl: (id: string) => string;
}

export const useEventActions = ({
  dataUrl,
  mutate,
  onFocusRecord,
}: UseEventActionsParams): UseEventActionsReturn => {
  const buildDeleteUrl = useCallback(
    (id: string) => {
      const url = new URL(dataUrl, window.location.origin);
      url.searchParams.set("id", id);
      return url.toString();
    },
    [dataUrl],
  );

  const handleEdit = useCallback(
    async (record: EventRecord) => {
      if (!record.id) return;

      await mutate(
        (current: { points: EventRecord[] } | undefined) =>
          current
            ? {
                points: current.points.map((item: EventRecord) =>
                  item.id === record.id
                    ? {
                        ...item,
                        candidate: record.candidate ?? item.candidate,
                        name: record.name ?? item.name,
                        phone: record.phone ?? item.phone,
                      }
                    : item,
                ),
              }
            : current,
        false,
      );

      const response = await fetch(dataUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: record.id,
          candidate: record.candidate,
          name: record.name,
          phone: record.phone,
        }),
      });

      if (!response.ok) {
        await mutate();
        return;
      }

      await mutate();
    },
    [dataUrl, mutate],
  );

  const handleDelete = useCallback(
    async (record: EventRecord) => {
      if (!record.id) return;
      const confirmDelete = window.confirm(
        "Eliminar este registro? Esta accion es permanente.",
      );
      if (!confirmDelete) return;

      await mutate(
        (current: { points: EventRecord[] } | undefined) =>
          current
            ? {
                points: current.points.filter((item: EventRecord) => item.id !== record.id),
              }
            : current,
        false,
      );

      const response = await fetch(buildDeleteUrl(record.id), {
        method: "DELETE",
      });
      if (!response.ok) {
        await mutate();
        return;
      }

      await mutate();
    },
    [buildDeleteUrl, mutate],
  );

  const handleFocusPoint = useCallback((record: EventRecord, mapRef: any) => {
    if (record.latitude === null || record.longitude === null) return;
    mapRef.current?.flyTo({
      center: [record.longitude, record.latitude],
      zoom: 15,
      essential: true,
    });
    onFocusRecord?.(record);
  }, [onFocusRecord]);

  const createFocusPointHandler = useCallback((mapRef: any) => {
    return (record: EventRecord) => handleFocusPoint(record, mapRef);
  }, [handleFocusPoint]);

  return {
    handleEdit,
    handleDelete,
    createFocusPointHandler,
    buildDeleteUrl,
  };
};
