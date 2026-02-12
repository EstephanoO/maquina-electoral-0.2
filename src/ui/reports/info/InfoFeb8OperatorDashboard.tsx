"use client";

import * as React from "react";
import useSWR from "swr";
import Image from "next/image";
import { ChevronsLeft, ChevronsRight, Home, Landmark, Pencil, Plus } from "lucide-react";
import { Badge } from "@/ui/primitives/badge";
import { Input } from "@/ui/primitives/input";
import { Textarea } from "@/ui/primitives/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/primitives/dialog";
import { applyTheme } from "@/theme/theme";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/ui/primitives/table";
import { isInfoAdminEmail } from "@/info/auth";
import type { InfoFeb8OperatorConfig } from "@/ui/reports/info/infoOperatorConfigs";

const DEFAULT_MESSAGE =
  "Hola {nombre}, somos el equipo de Somos Peru. Gracias por tu tiempo. Queremos compartirte una breve actualizacion del trabajo en campo.";
const LOADING_ROW_KEYS = [
  "loading-1",
  "loading-2",
  "loading-3",
  "loading-4",
  "loading-5",
  "loading-6",
  "loading-7",
];
const TABLE_COLUMN_COUNT = 5;

type InterviewRecord = {
  sourceId: string;
  interviewer: string;
  candidate: string;
  name: string;
  phone: string;
  homeMapsUrl?: string | null;
  pollingPlaceUrl?: string | null;
  linksComment?: string | null;
  east?: string;
  north?: string;
  lat?: string;
  lng?: string;
  timestamp: string;
};

type RecordStatus = {
  contacted?: boolean;
  replied?: boolean;
  deleted?: boolean;
  assignedToId?: string | null;
  assignedToName?: string | null;
  assignedToEmail?: string | null;
  assignedAt?: number | null;
  updatedAt?: number;
};

type InfoAction = "no_hablado" | "hablado" | "contestado" | "eliminado" | "whatsapp";

type InfoFeb8ApiRecord = {
  sourceId: string;
  recordedAt: string | null;
  interviewer: string | null;
  candidate: string | null;
  name: string | null;
  phone: string | null;
  homeMapsUrl: string | null;
  pollingPlaceUrl: string | null;
  linksComment: string | null;
  east: string | null;
  north: string | null;
  latitude: string | null;
  longitude: string | null;
};

type InfoFeb8ApiStatus = {
  sourceId: string;
  phone: string | null;
  contacted: boolean;
  replied: boolean;
  deleted: boolean;
  assignedToId: string | null;
  assignedToName: string | null;
  assignedToEmail: string | null;
  assignedAt: string | null;
  updatedAt: string | null;
};

type SessionPayload = {
  user: null | {
    id: string;
    email: string;
    name: string;
    role: "admin" | "candidato";
  };
};

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("No se pudo cargar la sesion.");
  }
  return response.json();
};

const normalizePhone = (phone: string) => phone.replace(/\D/g, "");

const splitPeruPhone = (phone: string) => {
  const digits = normalizePhone(phone);
  if (digits.length === 11 && digits.startsWith("51")) {
    return { country: "51", local: digits.slice(2), raw: digits };
  }
  if (digits.length === 9) {
    return { country: "51", local: digits, raw: `51${digits}` };
  }
  return { country: "51", local: digits, raw: digits };
};

const formatPhone = (phone: string) => {
  const { local } = splitPeruPhone(phone);
  if (local.length !== 9) return `+51 ${local}`;
  return `+51 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
};

const buildWhatsappUrl = (phone: string, message: string) => {
  const { raw } = splitPeruPhone(phone);
  const text = encodeURIComponent(message.trim());
  return `https://wa.me/${raw}?text=${text}`;
};

const buildWhatsappMessage = (template: string, name: string) => {
  const trimmedName = name.trim();
  const firstName = trimmedName.split(/\s+/).filter(Boolean)[0] ?? "";
  const personalized = template.replaceAll("{nombre}", firstName);
  return personalized.replace(/\s+,/g, ",").replace(/\s{2,}/g, " ").trim();
};

const getValidUrl = (value: string) => {
  if (!value.trim()) return null;
  try {
    return new URL(value.trim()).toString();
  } catch {
    return null;
  }
};

const getLinkCount = (record: InterviewRecord) =>
  [record.homeMapsUrl, record.pollingPlaceUrl].filter(Boolean).length;

  const matchesExcludedCandidate = (
    candidate: string | null | undefined,
    exclusions: string[],
  ) => {
  if (!candidate || exclusions.length === 0) return false;
  const normalized = candidate.toLowerCase();
  return exclusions.some((value) => normalized.includes(value.toLowerCase().trim()));
};

const formatDateTime = (timestamp: string) => {
  const value = new Date(timestamp);
  if (Number.isNaN(value.getTime())) return timestamp;
  return new Intl.DateTimeFormat("es-PE", {
    timeStyle: "short",
  }).format(value);
};

const getAssignedLabel = (name: string | null | undefined, email: string | null | undefined) => {
  const raw = (name || email || "").trim();
  if (!raw) return "Asignado";
  const sanitized = raw.split("@")[0] ?? raw;
  const first = sanitized.split(/\s+/).filter(Boolean)[0] ?? sanitized;
  return first.toLowerCase();
};

type InfoFeb8OperatorDashboardProps = {
  config: InfoFeb8OperatorConfig;
};

type LinkDraft = {
  homeMapsUrl: string;
  pollingPlaceUrl: string;
  linksComment: string;
};

type CreateContactDraft = {
  name: string;
  phone: string;
  homeMapsUrl: string;
  pollingPlaceUrl: string;
  comments: string;
};

export default function InfoFeb8OperatorDashboard({
  config,
}: InfoFeb8OperatorDashboardProps) {
  const headerRef = React.useRef<HTMLElement | null>(null);
  const { data: sessionData } = useSWR<SessionPayload>("/api/auth/me", fetcher);
  const userId = sessionData?.user?.id ?? null;
  const isAdmin =
    sessionData?.user?.role === "admin" || isInfoAdminEmail(sessionData?.user?.email);
  const [records, setRecords] = React.useState<InterviewRecord[]>([]);
  const [message, setMessage] = React.useState(DEFAULT_MESSAGE);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [statusMap, setStatusMap] = React.useState<Record<string, RecordStatus>>({});
  const [savePulse, setSavePulse] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [assigningId, setAssigningId] = React.useState<string | null>(null);
  const [linksOpen, setLinksOpen] = React.useState(false);
  const [linksDraft, setLinksDraft] = React.useState<LinkDraft>({
    homeMapsUrl: "",
    pollingPlaceUrl: "",
    linksComment: "",
  });
  const [linksErrors, setLinksErrors] = React.useState<Partial<LinkDraft>>({});
  const [activeRecord, setActiveRecord] = React.useState<InterviewRecord | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [createDraft, setCreateDraft] = React.useState<CreateContactDraft>({
    name: "",
    phone: "",
    homeMapsUrl: "",
    pollingPlaceUrl: "",
    comments: "",
  });
  const [createErrors, setCreateErrors] = React.useState<Partial<CreateContactDraft>>({});
  const [creating, setCreating] = React.useState(false);
  const saveTimerRef = React.useRef<number | null>(null);
  const isMountedRef = React.useRef(true);
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | "uncontacted" | "contacted" | "replied" | "archived"
  >("uncontacted");
  const [linkFilter, setLinkFilter] = React.useState<"all" | "home" | "polling">("all");
  const [pageSize, setPageSize] = React.useState(20);
  const [pageIndex, setPageIndex] = React.useState(1);

  const triggerSavePulse = React.useCallback(() => {
    if (typeof window === "undefined") return;
    setSavePulse(true);
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => setSavePulse(false), 1800);
  }, []);

  const fetchRecords = React.useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const recordsUrl = config.supervisor
          ? `${config.apiBasePath}?supervisor=${encodeURIComponent(config.supervisor)}`
          : config.apiBasePath;
        const response = await fetch(recordsUrl, {
          cache: "no-store",
        });
        if (!response.ok) throw new Error("No se pudo cargar los registros.");
        const payload = (await response.json()) as {
          records?: InfoFeb8ApiRecord[];
          statuses?: InfoFeb8ApiStatus[];
        };
        const parsed = (payload.records ?? [])
          .filter((record) => record.sourceId && record.phone)
          .map((record) => ({
            sourceId: record.sourceId,
            timestamp: record.recordedAt ?? "",
            interviewer: record.interviewer ?? "",
            candidate: record.candidate ?? "",
            name: record.name ?? "",
            phone: record.phone ?? "",
            homeMapsUrl: record.homeMapsUrl ?? null,
            pollingPlaceUrl: record.pollingPlaceUrl ?? null,
            linksComment: record.linksComment ?? null,
            east: record.east ?? "",
            north: record.north ?? "",
            lat: record.latitude !== null ? String(record.latitude) : "",
            lng: record.longitude !== null ? String(record.longitude) : "",
          }))
          .filter((record) => record.timestamp && record.interviewer && record.phone)
          .filter(
            (record) =>
              !matchesExcludedCandidate(record.candidate, config.excludeCandidates ?? []),
          );
        const baseInterviewers = config.allowedInterviewers ?? [];
        const allowedInterviewers = (baseInterviewers.length > 0
          ? baseInterviewers.concat(sessionData?.user?.name ? [sessionData.user.name] : [])
          : baseInterviewers
        )
          .map((value) => value.trim().toLowerCase())
          .filter(Boolean);
        const filteredByInterviewer =
          allowedInterviewers.length === 0
            ? parsed
            : parsed.filter((record) =>
                allowedInterviewers.includes(record.interviewer.trim().toLowerCase()),
              );
        const uniqueByPhone = new Map<string, InterviewRecord>();
        filteredByInterviewer.forEach((record) => {
          const key = normalizePhone(record.phone);
          if (!key || uniqueByPhone.has(key)) return;
          uniqueByPhone.set(key, record);
        });
        const uniqueRecords = Array.from(uniqueByPhone.values());
        const nextStatusMap = (payload.statuses ?? []).reduce(
          (acc, status) => {
            if (!status.sourceId) return acc;
            acc[status.sourceId] = {
              contacted: status.contacted,
              replied: status.replied,
              deleted: status.deleted,
              assignedToId: status.assignedToId,
              assignedToName: status.assignedToName,
              assignedToEmail: status.assignedToEmail,
              assignedAt: status.assignedAt ? new Date(status.assignedAt).getTime() : undefined,
              updatedAt: status.updatedAt ? new Date(status.updatedAt).getTime() : undefined,
            };
            return acc;
          },
          {} as Record<string, RecordStatus>,
        );
        if (!isMountedRef.current) return;
        setRecords(uniqueRecords);
        setStatusMap(nextStatusMap);
      } catch (err) {
        if (!isMountedRef.current) return;
        setError(err instanceof Error ? err.message : "Error inesperado.");
      } finally {
        if (!silent && isMountedRef.current) setLoading(false);
      }
    },
    [
      config.apiBasePath,
      config.supervisor,
      config.excludeCandidates,
      config.allowedInterviewers,
      sessionData?.user?.name,
    ],
  );

  const handleRetry = React.useCallback(() => {
    void fetchRecords();
  }, [fetchRecords]);

  React.useEffect(() => {
    isMountedRef.current = true;
    fetchRecords();
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchRecords]);

  React.useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const source = new EventSource("/api/info/8-febrero/stream");

    const handleStatus = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as {
          sourceId?: string;
          contacted?: boolean;
          replied?: boolean;
          deleted?: boolean;
          assignedToId?: string | null;
          assignedToName?: string | null;
          assignedToEmail?: string | null;
          updatedAt?: number;
        };
        const sourceId = payload.sourceId;
        if (!sourceId) return;
        setStatusMap((current) => {
          const previous = current[sourceId] ?? {};
          return {
            ...current,
            [sourceId]: {
              ...previous,
              contacted: payload.contacted ?? previous.contacted,
              replied: payload.replied ?? previous.replied,
              deleted: payload.deleted ?? previous.deleted,
              assignedToId: payload.assignedToId ?? previous.assignedToId,
              assignedToName: payload.assignedToName ?? previous.assignedToName,
              assignedToEmail: payload.assignedToEmail ?? previous.assignedToEmail,
              updatedAt: payload.updatedAt ?? previous.updatedAt,
            },
          };
        });
      } catch {
        // noop
      }
    };

    const handleAssignment = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as {
          sourceId?: string;
          assignedToId?: string | null;
          assignedToName?: string | null;
          assignedToEmail?: string | null;
          assignedAt?: number | null;
        };
        const sourceId = payload.sourceId;
        if (!sourceId) return;
        setStatusMap((current) => {
          const previous = current[sourceId] ?? {};
          return {
            ...current,
            [sourceId]: {
              ...previous,
              assignedToId: payload.assignedToId ?? previous.assignedToId,
              assignedToName: payload.assignedToName ?? previous.assignedToName,
              assignedToEmail: payload.assignedToEmail ?? previous.assignedToEmail,
              assignedAt: payload.assignedAt ?? previous.assignedAt,
              updatedAt: Date.now(),
            },
          };
        });
      } catch {
        // noop
      }
    };

    source.addEventListener("status", handleStatus as EventListener);
    source.addEventListener("assignment", handleAssignment as EventListener);

    return () => {
      source.close();
    };
  }, []);

  React.useEffect(() => {
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, []);

  React.useLayoutEffect(() => {
    if (!headerRef.current) return;
    const updateHeaderHeight = () => {
      const height = headerRef.current?.getBoundingClientRect().height ?? 0;
      document.documentElement.style.setProperty(
        "--info-feb-header",
        `${Math.ceil(height)}px`,
      );
    };
    updateHeaderHeight();
    const observer = new ResizeObserver(updateHeaderHeight);
    observer.observe(headerRef.current);
    window.addEventListener("resize", updateHeaderHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateHeaderHeight);
    };
  }, []);

  React.useLayoutEffect(() => {
    if (typeof document === "undefined") return undefined;
    applyTheme("light");
    return undefined;
  }, []);

  const recordsWithLinks = React.useMemo(() => {
    if (config.allowRecordsWithoutLinks) return records;
    return records.filter((record) => getLinkCount(record) > 0);
  }, [config.allowRecordsWithoutLinks, records]);

  const accessibleRecords = React.useMemo(() => {
    if (isAdmin) return recordsWithLinks;
    if (!userId) return recordsWithLinks;
    return recordsWithLinks.filter((record) => {
      const status = statusMap[record.sourceId] ?? {};
      if (!status.assignedToId) return true;
      return status.assignedToId === userId;
    });
  }, [isAdmin, recordsWithLinks, statusMap, userId]);

  const statusCounts = React.useMemo(() => {
    let contacted = 0;
    let replied = 0;
    let archived = 0;
    accessibleRecords.forEach((record) => {
      const status = statusMap[record.sourceId] ?? {};
      if (status.deleted) {
        archived += 1;
        return;
      }
      if (status.contacted) contacted += 1;
      if (status.replied) replied += 1;
    });
    const activeTotal = Math.max(accessibleRecords.length - archived, 0);
    return {
      all: activeTotal,
      contacted,
      replied,
      uncontacted: Math.max(activeTotal - contacted, 0),
      archived,
    };
  }, [accessibleRecords, statusMap]);

  const filteredRecords = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return accessibleRecords.filter((record) => {
      if (query) {
        const match = [record.interviewer, record.candidate, record.name, record.phone]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query));
        if (!match) return false;
      }
      const status = statusMap[record.sourceId] ?? {};
      if (status.deleted) return statusFilter === "archived";
      if (statusFilter === "archived") return false;
      if (statusFilter === "uncontacted") return !status.contacted;
      if (statusFilter === "contacted") return Boolean(status.contacted);
      if (statusFilter === "replied") return Boolean(status.replied);
      return true;
    });
  }, [accessibleRecords, search, statusFilter, statusMap]);

  const linkFilteredRecords = React.useMemo(() => {
    if (linkFilter === "all") return filteredRecords;
    if (linkFilter === "home") {
      return filteredRecords.filter((record) => Boolean(record.homeMapsUrl));
    }
    return filteredRecords.filter((record) => Boolean(record.pollingPlaceUrl));
  }, [filteredRecords, linkFilter]);

  const totalPages = Math.max(Math.ceil(linkFilteredRecords.length / pageSize), 1);
  const safePageIndex = Math.min(pageIndex, totalPages);
  const pagedRecords = React.useMemo(() => {
    const start = (safePageIndex - 1) * pageSize;
    return linkFilteredRecords.slice(start, start + pageSize);
  }, [linkFilteredRecords, pageSize, safePageIndex]);
  const pageStart = linkFilteredRecords.length === 0 ? 0 : (safePageIndex - 1) * pageSize + 1;
  const pageEnd = Math.min(pageStart + pageSize - 1, linkFilteredRecords.length);
  const showContactAction = statusFilter === "uncontacted";
  const showReplyAction = statusFilter === "contacted";
  const showArchiveAction = statusFilter === "uncontacted";

  const linkCounts = React.useMemo(() => {
    const counts = { home: 0, polling: 0 };
    filteredRecords.forEach((record) => {
      if (record.homeMapsUrl) counts.home += 1;
      if (record.pollingPlaceUrl) counts.polling += 1;
    });
    return counts;
  }, [filteredRecords]);

  const logAction = React.useCallback(
    async (action: InfoAction, record: InterviewRecord) => {
      if (!config.operatorSlug) return;
      try {
        await fetch("/api/info/8-febrero/actions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            operatorSlug: config.operatorSlug,
            sourceId: record.sourceId,
            phone: record.phone,
            personName: record.name,
          }),
          keepalive: true,
        });
      } catch {
        // noop
      }
    },
    [config.operatorSlug],
  );

  const assignRecord = React.useCallback(
    async (record: InterviewRecord) => {
      if (!record.sourceId) return null;
      setAssigningId(record.sourceId);
      try {
        const response = await fetch("/api/info/8-febrero/assign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceId: record.sourceId,
            phone: record.phone,
          }),
        });
        if (response.status === 409) {
          const payload = (await response.json()) as {
            assignedToName?: string | null;
            assignedToEmail?: string | null;
          };
          const displayName = payload.assignedToName || payload.assignedToEmail || "otra operadora";
          setActionError(`Registro bloqueado por ${displayName}.`);
          return null;
        }
        if (!response.ok) throw new Error("No se pudo asignar el registro.");
        const payload = (await response.json()) as {
          sourceId: string;
          assignedToId: string;
          assignedToName?: string | null;
          assignedToEmail?: string | null;
          assignedAt?: number | null;
        };
        setStatusMap((current) => {
          const previous = current[payload.sourceId] ?? {};
          return {
            ...current,
            [payload.sourceId]: {
              ...previous,
              assignedToId: payload.assignedToId,
              assignedToName: payload.assignedToName ?? previous.assignedToName,
              assignedToEmail: payload.assignedToEmail ?? previous.assignedToEmail,
              assignedAt: payload.assignedAt ?? previous.assignedAt,
              updatedAt: Date.now(),
            },
          };
        });
        setActionError(null);
        return payload;
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Error inesperado.");
        return null;
      } finally {
        setAssigningId((current) => (current === record.sourceId ? null : current));
      }
    },
    [],
  );

  const setRecordStatus = React.useCallback(
    async (record: InterviewRecord, next: Partial<RecordStatus>) => {
      if (!record.sourceId) return;
      const key = record.sourceId;
      const previous = statusMap[key] ?? {};
      const optimistic = {
        ...previous,
        ...next,
        updatedAt: Date.now(),
      };
      setStatusMap((current) => ({
        ...current,
        [key]: optimistic,
      }));
      triggerSavePulse();
      try {
        const response = await fetch(`${config.apiBasePath}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceId: key,
            phone: record.phone,
            contacted: Boolean(optimistic.contacted),
            replied: Boolean(optimistic.replied),
            deleted: Boolean(optimistic.deleted),
          }),
        });
        if (!response.ok) throw new Error("No se pudo guardar el estado.");
        const payload = (await response.json()) as {
          sourceId: string;
          contacted: boolean;
          replied: boolean;
          deleted: boolean;
          updatedAt: number;
        };
        setStatusMap((current) => ({
          ...current,
          [payload.sourceId]: {
            ...current[payload.sourceId],
            contacted: payload.contacted,
            replied: payload.replied,
            deleted: payload.deleted,
            updatedAt: payload.updatedAt,
          },
        }));
        triggerSavePulse();
        setActionError(null);
      } catch (err) {
        setStatusMap((current) => ({
          ...current,
          [key]: previous,
        }));
        setActionError(err instanceof Error ? err.message : "Error inesperado.");
      }
    },
    [config.apiBasePath, statusMap, triggerSavePulse],
  );

  const handleArchive = React.useCallback(
    async (record: InterviewRecord) => {
      if (!record.sourceId) return;
      const confirmed = window.confirm(
        `Archivar a ${record.name || "este registro"}?`,
      );
      if (!confirmed) return;
      setDeletingId(record.sourceId);
      try {
        await setRecordStatus(record, { deleted: true });
        void logAction("eliminado", record);
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Error inesperado.");
      } finally {
        setDeletingId((current) => (current === record.sourceId ? null : current));
      }
    },
    [logAction, setRecordStatus],
  );

  const openLinksModal = React.useCallback((record: InterviewRecord) => {
    setActiveRecord(record);
    setLinksDraft({
      homeMapsUrl: record.homeMapsUrl ?? "",
      pollingPlaceUrl: record.pollingPlaceUrl ?? "",
      linksComment: record.linksComment ?? "",
    });
    setLinksErrors({});
    setLinksOpen(true);
  }, []);

  const closeLinksModal = React.useCallback(() => {
    setLinksOpen(false);
    setActiveRecord(null);
    setLinksErrors({});
  }, []);

  const saveLinks = React.useCallback(async () => {
    if (!activeRecord) return;
    const nextHome = linksDraft.homeMapsUrl.trim();
    const nextPolling = linksDraft.pollingPlaceUrl.trim();
    const nextComment = linksDraft.linksComment.trim();
    const errors: Partial<LinkDraft> = {};
    if (nextHome && !getValidUrl(nextHome)) {
      errors.homeMapsUrl = "URL invalida";
    }
    if (nextPolling && !getValidUrl(nextPolling)) {
      errors.pollingPlaceUrl = "URL invalida";
    }
    if (Object.keys(errors).length > 0) {
      setLinksErrors(errors);
      return;
    }

    const previous = activeRecord;
    const updated = {
      ...activeRecord,
      homeMapsUrl: nextHome || null,
      pollingPlaceUrl: nextPolling || null,
      linksComment: nextComment || null,
    };
    setRecords((current) =>
      current.map((item) => (item.sourceId === activeRecord.sourceId ? updated : item)),
    );
    triggerSavePulse();
    try {
      const response = await fetch(`${config.apiBasePath}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId: activeRecord.sourceId,
          homeMapsUrl: updated.homeMapsUrl,
          pollingPlaceUrl: updated.pollingPlaceUrl,
          linksComment: updated.linksComment,
        }),
      });
      if (!response.ok) throw new Error("No se pudo guardar los links.");
      const payload = (await response.json()) as {
        sourceId?: string;
        homeMapsUrl?: string | null;
        pollingPlaceUrl?: string | null;
        linksComment?: string | null;
      };
      setRecords((current) =>
        current.map((item) =>
          item.sourceId === activeRecord.sourceId
            ? {
                ...item,
                homeMapsUrl: payload.homeMapsUrl ?? updated.homeMapsUrl ?? null,
                pollingPlaceUrl: payload.pollingPlaceUrl ?? updated.pollingPlaceUrl ?? null,
                linksComment: payload.linksComment ?? updated.linksComment ?? null,
              }
            : item,
        ),
      );
      triggerSavePulse();
      closeLinksModal();
    } catch (error) {
      setRecords((current) =>
        current.map((item) => (item.sourceId === activeRecord.sourceId ? previous : item)),
      );
    }
  }, [activeRecord, config.apiBasePath, linksDraft, triggerSavePulse, closeLinksModal]);

  const openCreateModal = React.useCallback(() => {
    setCreateDraft({
      name: "",
      phone: "",
      homeMapsUrl: "",
      pollingPlaceUrl: "",
      comments: "",
    });
    setCreateErrors({});
    setCreateOpen(true);
  }, []);

  const closeCreateModal = React.useCallback(() => {
    setCreateOpen(false);
    setCreateErrors({});
  }, []);

  const createContact = React.useCallback(async () => {
    const nextName = createDraft.name.trim();
    const nextPhone = createDraft.phone.trim();
    const nextHome = createDraft.homeMapsUrl.trim();
    const nextPolling = createDraft.pollingPlaceUrl.trim();
    const nextComments = createDraft.comments.trim();
    const errors: Partial<CreateContactDraft> = {};
    if (!nextName) errors.name = "Requerido";
    if (!nextPhone) errors.phone = "Requerido";
    if (nextHome && !getValidUrl(nextHome)) errors.homeMapsUrl = "URL invalida";
    if (nextPolling && !getValidUrl(nextPolling)) errors.pollingPlaceUrl = "URL invalida";
    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors);
      return;
    }

    const candidateName =
      config.candidateName?.trim() ||
      config.supervisor?.trim() ||
      config.operatorSlug ||
      "";
    const interviewerName = sessionData?.user?.name?.trim() || "";
    if (!candidateName || !interviewerName) {
      setCreateErrors({ name: "Falta candidato o entrevistador" });
      return;
    }

    setCreating(true);
    try {
      const response = await fetch(config.apiBasePath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nextName,
          phone: nextPhone,
          candidate: candidateName,
          interviewer: interviewerName,
          homeMapsUrl: nextHome || null,
          pollingPlaceUrl: nextPolling || null,
          comments: nextComments || null,
        }),
      });
      if (!response.ok) throw new Error("No se pudo crear el contacto.");
      closeCreateModal();
      void fetchRecords({ silent: true });
    } catch (error) {
      setCreateErrors({ name: error instanceof Error ? error.message : "Error inesperado." });
    } finally {
      setCreating(false);
    }
  }, [createDraft, config, sessionData?.user?.name, fetchRecords, closeCreateModal]);

  return (
    <main className="min-h-screen bg-[#f5f2ea] text-foreground">
      <header
        ref={headerRef}
        className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top,_rgba(255,200,0,0.22),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(15,34,61,0.92),_rgba(15,34,61,0.96))] px-6 py-8 text-white [&_*]:!text-white"
      >
        <div className="mx-auto flex w-full max-w-[1760px] flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 p-2 shadow-[0_18px_40px_rgba(0,0,0,0.35)] ring-1 ring-white/20">
              <Image
                src="/isotipo(2).jpg"
                alt="GOBERNA"
                width={56}
                height={56}
                className="h-full w-full rounded-lg object-contain"
                priority
              />
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/80">
                  Reporte diario
                </span>
                {config.badgeDate ? (
                  <span className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/70">
                    {config.badgeDate}
                  </span>
                ) : null}
              </div>
              <h1 className="heading-display text-3xl font-semibold text-white md:text-4xl">
                {config.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
                <span className="text-white/90">{config.subtitle}</span>
                <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-white">
                  INFO
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-xs uppercase tracking-[0.2em] text-white/80">
              {accessibleRecords.length || 0} registros
            </div>
            <div
              className={`rounded-2xl border px-4 py-3 text-xs uppercase tracking-[0.2em] ${
                savePulse
                  ? "border-[#25D366]/60 bg-[#25D366]/10 text-[#d6ffe5]"
                  : "border-white/15 bg-white/10 text-white/70"
              }`}
            >
              {savePulse ? "Guardado" : "Sincronizado"}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1760px] flex-1 flex-col gap-4 px-6 pb-6 pt-4 [&_*]:!text-black">
        <section className="panel fade-rise flex min-h-0 flex-1 flex-col rounded-3xl border border-border/70 bg-white/92 px-6 py-5 shadow-[0_20px_50px_rgba(15,34,61,0.12)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <h2 className="heading-display text-2xl font-semibold uppercase tracking-[0.16em]">
                Registro
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-border/60 text-foreground">
                {linkFilteredRecords.length} registros activos
              </Badge>
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex min-h-[36px] items-center gap-2 rounded-full border border-[#163960]/30 bg-[#163960]/10 px-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#163960] transition hover:border-[#163960]/70 hover:bg-[#163960]/15"
              >
                <Plus className="h-4 w-4" />
                Nuevo contacto
              </button>
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="min-h-[36px] rounded-full border border-border/60 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground transition hover:border-[#163960]/50 hover:text-[#163960]"
                >
                  Limpiar busqueda
                </button>
              )}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="min-w-[240px] flex-1">
              <Input
                id="record-search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPageIndex(1);
                }}
                placeholder="Buscar por entrevistador, candidato, nombre o telefono"
                className="h-11 rounded-2xl border-border/60 bg-white/80"
              />
            </div>
            <div className="flex flex-1 flex-wrap items-center gap-2">
              {([
                { id: "uncontacted", label: "No hablados", count: statusCounts.uncontacted },
                { id: "contacted", label: "Hablados", count: statusCounts.contacted },
                { id: "replied", label: "Respondieron", count: statusCounts.replied },
                { id: "archived", label: "Archivados", count: statusCounts.archived },
                { id: "all", label: "Todos", count: statusCounts.all },
              ] as const).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setStatusFilter(item.id);
                    setPageIndex(1);
                  }}
                  className={`min-h-[36px] rounded-full border px-3 text-[10px] font-semibold uppercase tracking-[0.2em] transition ${
                    statusFilter === item.id
                      ? "border-[#163960] bg-[#163960]/10 text-[#163960]"
                      : "border-border/60 text-muted-foreground hover:border-[#163960]/50 hover:text-[#163960]"
                  }`}
                >
                  {item.label} · {item.count}
                </button>
              ))}
              <div className="hidden h-6 w-px bg-border/60 sm:block" />
              {([
                {
                  id: "home",
                  label: "Ubicacion",
                  count: linkCounts.home,
                  icon: <Home className="h-4 w-4" />,
                },
                {
                  id: "polling",
                  label: "Local",
                  count: linkCounts.polling,
                  icon: <Landmark className="h-4 w-4" />,
                },
              ] as const).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setLinkFilter((current) => (current === item.id ? "all" : item.id));
                    setPageIndex(1);
                  }}
                  className={`min-h-[36px] rounded-full border px-3 text-[10px] font-semibold uppercase tracking-[0.18em] transition ${
                    linkFilter === item.id
                      ? "border-[#163960] bg-[#163960]/10 text-[#163960]"
                      : "border-border/60 text-muted-foreground hover:border-[#163960]/50 hover:text-[#163960]"
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    {item.icon}
                    {item.label} · {item.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
          {actionError ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-500/30 bg-red-50 px-4 py-3 text-sm text-red-600">
              <span>{actionError}</span>
              <button
                type="button"
                onClick={() => setActionError(null)}
                className="min-h-[32px] rounded-full border border-red-500/40 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-red-600"
              >
                Cerrar
              </button>
            </div>
          ) : null}
          <details className="mt-4 rounded-2xl border border-border/60 bg-[#f8f6f1] px-5 py-4">
            <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Mensaje predeterminado de WhatsApp
            </summary>
            <div className="mt-3 space-y-2">
              <label htmlFor="whatsapp-message" className="sr-only">
                Mensaje predeterminado
              </label>
              <Textarea
                id="whatsapp-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="min-h-[120px] rounded-2xl border-border/60 bg-white"
              />
              <p className="text-xs text-muted-foreground">
                Se aplica al abrir WhatsApp desde cualquier fila. Usa {"{nombre}"} para
                insertar el nombre del entrevistado.
              </p>
            </div>
          </details>
          <div className="mt-4 flex-1 overflow-hidden rounded-2xl border border-border/60 bg-white">
            <div className="h-full overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-white/95 backdrop-blur">
                  <TableRow>
                    <TableHead className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                      Hora
                    </TableHead>
                    <TableHead className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                      Entrevistador
                    </TableHead>
                    <TableHead className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                      Ciudadano
                    </TableHead>
                    <TableHead className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                      Telefono (WhatsApp)
                    </TableHead>
                    <TableHead className="text-right text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                      Estado
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    LOADING_ROW_KEYS.map((rowKey) => (
                      <TableRow key={rowKey} className="border-border/60">
                        <TableCell colSpan={TABLE_COLUMN_COUNT} className="py-6">
                          <div className="h-4 w-full animate-pulse rounded-full bg-muted/50" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : error ? (
                    <TableRow>
                      <TableCell
                        colSpan={TABLE_COLUMN_COUNT}
                        className="py-8 text-center text-sm text-red-500"
                      >
                        <div className="space-y-3">
                          <p>{error}</p>
                          <button
                            type="button"
                            onClick={handleRetry}
                            className="min-h-[36px] rounded-full border border-red-500/40 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-red-500 transition hover:border-red-500"
                          >
                            Reintentar
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : linkFilteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={TABLE_COLUMN_COUNT} className="py-10 text-center text-sm">
                        <div className="space-y-3">
                          <p>No hay registros para mostrar.</p>
                           {(search || statusFilter !== "uncontacted" || linkFilter !== "all") && (
                             <button
                               type="button"
                               onClick={() => {
                                 setSearch("");
                                 setStatusFilter("uncontacted");
                                 setLinkFilter("all");
                                 setPageIndex(1);
                               }}
                               className="min-h-[36px] rounded-full border border-border/60 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground transition hover:border-[#163960]/50 hover:text-[#163960]"
                             >
                              Limpiar busqueda
                            </button>
                          )}
                          {statusFilter === "uncontacted" && !search && linkFilter === "all" && (
                            <button
                              type="button"
                              onClick={() => {
                                setStatusFilter("all");
                                setPageIndex(1);
                              }}
                              className="min-h-[36px] rounded-full border border-[#163960]/30 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#163960] transition hover:border-[#163960]"
                            >
                              Ver todos
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    pagedRecords.map((record, index) => (
                      <TableRow
                        key={record.sourceId}
                        className={`border-border/60 ${
                          index % 2 === 0 ? "bg-[#fbfaf7]" : "bg-transparent"
                        } hover:bg-[#fff7d6]`}
                      >
                        {(() => {
                          const status = statusMap[record.sourceId] ?? {};
                          const contacted = Boolean(status.contacted);
                          const replied = Boolean(status.replied);
                          const deleted = Boolean(status.deleted);
                          const assignedToId = status.assignedToId ?? null;
                          const isAssignedToUser = Boolean(userId && assignedToId === userId);
                          const isLocked = Boolean(
                            deleted || (assignedToId && !isAssignedToUser && !isAdmin),
                          );
                          const canEdit = Boolean(isAdmin || isAssignedToUser);
                          const canEditLinks = canEdit && !deleted;
                          const canReply = canEdit && contacted && !deleted;
                          const canContact = canEdit && !deleted;
                          const canDelete = deletingId === record.sourceId;
                          const assignedLabel = assignedToId
                            ? getAssignedLabel(status.assignedToName, status.assignedToEmail)
                            : "Disponible";
                          const hasHomeLink = Boolean(record.homeMapsUrl);
                          const hasPollingLink = Boolean(record.pollingPlaceUrl);
                          const linkBadgeClass =
                            hasHomeLink || hasPollingLink
                              ? "border-[#163960]/20 bg-[#163960]/5 text-[#163960]"
                              : "border-border/60 bg-white text-muted-foreground";
                          return (
                            <>
                              <TableCell>{formatDateTime(record.timestamp)}</TableCell>
                              <TableCell className="whitespace-normal" title={record.interviewer}>
                                {record.interviewer}
                              </TableCell>
                              <TableCell className="whitespace-normal" title={record.name}>
                                {record.name}
                              </TableCell>
                              <TableCell className="font-medium">
                                <button
                                  type="button"
                                  disabled={isLocked || assigningId === record.sourceId}
                                  className={`inline-flex min-h-[42px] items-center rounded-full border bg-white px-4 py-2 text-sm font-semibold shadow-[0_8px_18px_rgba(15,34,61,0.12)] transition ${
                                    isLocked || assigningId === record.sourceId
                                      ? "cursor-not-allowed border-border/60 text-muted-foreground"
                                      : "border-[#163960]/30 text-[#163960] hover:border-[#25D366] hover:text-[#1a8d44]"
                                  }`}
                                  onClick={() => {
                                    void (async () => {
                                      if (isLocked) return;
                                      const assignment = await assignRecord(record);
                                      if (!assignment && !isAssignedToUser) return;
                                      const personalizedMessage = buildWhatsappMessage(
                                        message,
                                        record.name,
                                      );
                                      const url = buildWhatsappUrl(record.phone, personalizedMessage);
                                      void logAction("whatsapp", record);
                                      window.open(url, "_blank", "noopener,noreferrer");
                                    })();
                                  }}
                                  title="Abrir WhatsApp"
                                >
                                  <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#25D366]/15 text-[10px] font-semibold text-[#1a8d44]">
                                    WA
                                  </span>
                                  {formatPhone(record.phone)}
                                </button>
                              </TableCell>
                              <TableCell className="text-right">
                                  <div className="flex flex-wrap justify-end gap-2">
                                    <span
                                      className={`inline-flex min-h-[38px] items-center gap-2 rounded-full border px-3 text-[11px] font-semibold uppercase tracking-[0.2em] ${linkBadgeClass}`}
                                    >
                                      <Home
                                        className={`h-4 w-4 ${
                                          hasHomeLink ? "text-[#25D366]" : "text-muted-foreground/70"
                                        }`}
                                      />
                                      <Landmark
                                        className={`h-4 w-4 ${
                                          hasPollingLink
                                            ? "text-[#25D366]"
                                            : "text-muted-foreground/70"
                                        }`}
                                      />
                                    </span>
                                    {assignedToId ? (
                                      <span className="inline-flex min-h-[38px] items-center justify-center rounded-full border border-[#0f2f4f]/15 bg-gradient-to-r from-[#fff1c2] via-white to-[#d6f5e3] px-4 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0f2f4f] shadow-[0_8px_18px_rgba(15,47,79,0.12)]">
                                        {assignedLabel}
                                      </span>
                                    ) : null}
                                    {showContactAction ? (
                                    <button
                                      type="button"
                                      disabled={!canContact}
                                      className={`min-h-[38px] rounded-full border px-4 text-[11px] font-semibold uppercase tracking-[0.2em] transition ${
                                        !canContact
                                          ? "border-border/60 text-muted-foreground cursor-not-allowed"
                                          : contacted
                                            ? "border-[#FFC800] bg-[#FFC800]/20 text-[#7a5b00]"
                                            : "border-border/60 text-muted-foreground hover:border-[#FFC800]/60 hover:text-[#7a5b00]"
                                      }`}
                                      onClick={() =>
                                        (() => {
                                          const nextContacted = !contacted;
                                          void logAction(
                                            nextContacted ? "hablado" : "no_hablado",
                                            record,
                                          );
                                          void setRecordStatus(record, {
                                            contacted: nextContacted,
                                          });
                                        })()
                                      }
                                    >
                                      Hablado
                                    </button>
                                  ) : null}
                                  {showReplyAction ? (
                                    <button
                                      type="button"
                                      disabled={!canReply}
                                      className={`min-h-[38px] rounded-full border px-4 text-[11px] font-semibold uppercase tracking-[0.2em] transition ${
                                        !canReply
                                          ? "border-border/60 text-muted-foreground cursor-not-allowed"
                                          : replied
                                            ? "border-[#25D366] bg-[#25D366]/15 text-[#1a8d44]"
                                            : "border-border/60 text-muted-foreground hover:border-[#25D366]/60 hover:text-[#1a8d44]"
                                      }`}
                                      onClick={() =>
                                        (() => {
                                          const nextReplied = !replied;
                                          if (nextReplied) {
                                            void logAction("contestado", record);
                                          }
                                          void setRecordStatus(record, {
                                            replied: nextReplied,
                                          });
                                        })()
                                      }
                                    >
                                      Respondio
                                    </button>
                                  ) : null}
                                  <button
                                    type="button"
                                    disabled={!canEditLinks}
                                    onClick={() => openLinksModal(record)}
                                    className={`min-h-[38px] rounded-full border px-3 text-[11px] font-semibold uppercase tracking-[0.2em] transition ${
                                      canEditLinks
                                        ? "border-[#163960]/30 bg-white text-[#163960] hover:border-[#163960]/70"
                                        : "border-border/60 text-muted-foreground cursor-not-allowed"
                                    }`}
                                    title="Editar links"
                                  >
                                    <span className="inline-flex items-center gap-2">
                                      <Pencil className="h-4 w-4" />
                                      Editar
                                    </span>
                                  </button>
                                  {showArchiveAction ? (
                                    <button
                                      type="button"
                                      disabled={canDelete || !canEdit || deleted}
                                      onClick={() => handleArchive(record)}
                                      className={`min-h-[38px] rounded-full border px-4 text-[11px] font-semibold uppercase tracking-[0.2em] transition ${
                                        canDelete
                                          ? "cursor-wait border-red-500/40 text-red-500"
                                          : !canEdit || deleted
                                            ? "border-border/60 text-muted-foreground cursor-not-allowed"
                                            : "border-border/60 text-muted-foreground hover:border-red-500/60 hover:text-red-500"
                                      }`}
                                    >
                                      {canDelete ? "Archivando" : "Archivar"}
                                    </button>
                                  ) : null}
                                </div>
                              </TableCell>
                            </>
                          );
                        })()}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            <div className="flex flex-wrap items-center gap-3">
              <span>
                {pageStart}-{pageEnd} de {linkFilteredRecords.length}
              </span>
              <div className="flex items-center gap-2">
                {[20, 50, 100].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      setPageSize(size);
                      setPageIndex(1);
                    }}
                    className={`min-h-[32px] rounded-full border px-3 text-[10px] font-semibold uppercase tracking-[0.2em] transition ${
                      pageSize === size
                        ? "border-[#163960] bg-[#163960]/10 text-[#163960]"
                        : "border-border/60 text-muted-foreground hover:border-[#163960]/50 hover:text-[#163960]"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPageIndex(1)}
                disabled={safePageIndex <= 1}
                className={`min-h-[32px] rounded-full border px-2 text-[10px] font-semibold uppercase tracking-[0.2em] transition ${
                  safePageIndex <= 1
                    ? "border-border/40 text-muted-foreground/40"
                    : "border-border/60 text-muted-foreground hover:border-[#163960]/50 hover:text-[#163960]"
                }`}
                title="Primera pagina"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setPageIndex((current) => Math.max(current - 1, 1))}
                disabled={safePageIndex <= 1}
                className={`min-h-[32px] rounded-full border px-3 text-[10px] font-semibold uppercase tracking-[0.2em] transition ${
                  safePageIndex <= 1
                    ? "border-border/40 text-muted-foreground/40"
                    : "border-border/60 text-muted-foreground hover:border-[#163960]/50 hover:text-[#163960]"
                }`}
              >
                Anterior
              </button>
              <span className="min-h-[32px] rounded-full border border-border/60 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {safePageIndex} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPageIndex((current) => Math.min(current + 1, totalPages))}
                disabled={safePageIndex >= totalPages}
                className={`min-h-[32px] rounded-full border px-3 text-[10px] font-semibold uppercase tracking-[0.2em] transition ${
                  safePageIndex >= totalPages
                    ? "border-border/40 text-muted-foreground/40"
                    : "border-border/60 text-muted-foreground hover:border-[#163960]/50 hover:text-[#163960]"
                }`}
              >
                Siguiente
              </button>
              <button
                type="button"
                onClick={() => setPageIndex(totalPages)}
                disabled={safePageIndex >= totalPages}
                className={`min-h-[32px] rounded-full border px-2 text-[10px] font-semibold uppercase tracking-[0.2em] transition ${
                  safePageIndex >= totalPages
                    ? "border-border/40 text-muted-foreground/40"
                    : "border-border/60 text-muted-foreground hover:border-[#163960]/50 hover:text-[#163960]"
                }`}
                title="Ultima pagina"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </div>
      <Dialog open={linksOpen} onOpenChange={(open) => (open ? null : closeLinksModal())}>
        <DialogContent className="rounded-3xl border-border/70 bg-white/95">
          <DialogHeader>
            <DialogTitle>Links de ubicacion</DialogTitle>
            <DialogDescription>
              Guarda los links de Maps para casa y local de votacion.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <label
                htmlFor="home-maps-url"
                className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground"
              >
                Casa
              </label>
              <Input
                id="home-maps-url"
                value={linksDraft.homeMapsUrl}
                onChange={(event) =>
                  setLinksDraft((current) => ({
                    ...current,
                    homeMapsUrl: event.target.value,
                  }))
                }
                placeholder="https://..."
                className="mt-2 h-11 rounded-2xl border-border/60 bg-white"
              />
              {linksErrors.homeMapsUrl ? (
                <p className="mt-2 text-xs text-red-500">{linksErrors.homeMapsUrl}</p>
              ) : null}
            </div>
            <div>
              <label
                htmlFor="polling-place-url"
                className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground"
              >
                Local de votacion
              </label>
              <Input
                id="polling-place-url"
                value={linksDraft.pollingPlaceUrl}
                onChange={(event) =>
                  setLinksDraft((current) => ({
                    ...current,
                    pollingPlaceUrl: event.target.value,
                  }))
                }
                placeholder="https://..."
                className="mt-2 h-11 rounded-2xl border-border/60 bg-white"
              />
              {linksErrors.pollingPlaceUrl ? (
                <p className="mt-2 text-xs text-red-500">{linksErrors.pollingPlaceUrl}</p>
              ) : null}
            </div>
            <div>
              <label
                htmlFor="links-comment"
                className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground"
              >
                Comentario
              </label>
              <Textarea
                id="links-comment"
                value={linksDraft.linksComment}
                onChange={(event) =>
                  setLinksDraft((current) => ({
                    ...current,
                    linksComment: event.target.value,
                  }))
                }
                placeholder="Notas adicionales"
                className="mt-2 min-h-[100px] rounded-2xl border-border/60 bg-white"
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
            <button
              type="button"
              onClick={closeLinksModal}
              className="min-h-[40px] rounded-full border border-border/60 px-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground transition hover:border-[#163960]/50 hover:text-[#163960]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={saveLinks}
              className="min-h-[40px] rounded-full border border-[#163960]/40 bg-[#163960]/10 px-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#163960] transition hover:border-[#163960]"
            >
              Guardar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={createOpen} onOpenChange={(open) => (open ? null : closeCreateModal())}>
        <DialogContent className="sm:max-w-[520px] rounded-3xl border-border/70 bg-white/95">
          <DialogHeader>
            <DialogTitle>Nuevo contacto</DialogTitle>
            <DialogDescription>
              Completa ciudadano y telefono. Domicilio, local y comentarios son opcionales.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="create-name" className="text-xs font-semibold uppercase tracking-[0.2em]">
                Ciudadano
              </label>
              <Input
                id="create-name"
                value={createDraft.name}
                onChange={(event) =>
                  setCreateDraft((current) => ({ ...current, name: event.target.value }))
                }
                className="h-11 rounded-2xl border-border/60 bg-white"
              />
              {createErrors.name ? (
                <span className="text-xs text-red-500">{createErrors.name}</span>
              ) : null}
            </div>
            <div className="grid gap-2">
              <label htmlFor="create-phone" className="text-xs font-semibold uppercase tracking-[0.2em]">
                Telefono
              </label>
              <Input
                id="create-phone"
                value={createDraft.phone}
                onChange={(event) =>
                  setCreateDraft((current) => ({ ...current, phone: event.target.value }))
                }
                className="h-11 rounded-2xl border-border/60 bg-white"
              />
              {createErrors.phone ? (
                <span className="text-xs text-red-500">{createErrors.phone}</span>
              ) : null}
            </div>
            <div className="grid gap-2">
              <label htmlFor="create-home" className="text-xs font-semibold uppercase tracking-[0.2em]">
                Domicilio (link)
              </label>
              <Input
                id="create-home"
                value={createDraft.homeMapsUrl}
                onChange={(event) =>
                  setCreateDraft((current) => ({ ...current, homeMapsUrl: event.target.value }))
                }
                className="h-11 rounded-2xl border-border/60 bg-white"
              />
              {createErrors.homeMapsUrl ? (
                <span className="text-xs text-red-500">{createErrors.homeMapsUrl}</span>
              ) : null}
            </div>
            <div className="grid gap-2">
              <label htmlFor="create-polling" className="text-xs font-semibold uppercase tracking-[0.2em]">
                Local de votacion (link)
              </label>
              <Input
                id="create-polling"
                value={createDraft.pollingPlaceUrl}
                onChange={(event) =>
                  setCreateDraft((current) => ({ ...current, pollingPlaceUrl: event.target.value }))
                }
                className="h-11 rounded-2xl border-border/60 bg-white"
              />
              {createErrors.pollingPlaceUrl ? (
                <span className="text-xs text-red-500">{createErrors.pollingPlaceUrl}</span>
              ) : null}
            </div>
            <div className="grid gap-2">
              <label htmlFor="create-comments" className="text-xs font-semibold uppercase tracking-[0.2em]">
                Comentarios
              </label>
              <Textarea
                id="create-comments"
                value={createDraft.comments}
                onChange={(event) =>
                  setCreateDraft((current) => ({ ...current, comments: event.target.value }))
                }
                className="min-h-[100px] rounded-2xl border-border/60 bg-white"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={closeCreateModal}
              className="min-h-[40px] rounded-full border border-border/60 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void createContact()}
              disabled={creating}
              className="min-h-[40px] rounded-full border border-[#163960]/30 bg-[#163960]/10 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#163960] transition hover:border-[#163960]/70 hover:bg-[#163960]/15 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {creating ? "Guardando" : "Crear"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
