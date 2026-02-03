import type { MapHierarchySelection } from "@/modules/maps/PeruMapPanel";

export type DataGoalRecord = {
  departamento: string;
  provincia: string;
  distrito: string;
  electores: number;
  datos_a_recopilar: number;
  porcentaje: number;
};

export type DataGoalIndex = {
  total: number | null;
  byDep: Map<string, number>;
  byProv: Map<string, number>;
  byDist: Map<string, number>;
};

const normalizeName = (value?: string | null) => value?.trim().toUpperCase() ?? "";

export const buildDataGoalIndex = (
  records: DataGoalRecord[],
  total: number | null,
): DataGoalIndex => {
  const byDep = new Map<string, number>();
  const byProv = new Map<string, number>();
  const byDist = new Map<string, number>();

  for (const record of records) {
    const dep = normalizeName(record.departamento);
    const prov = normalizeName(record.provincia);
    const dist = normalizeName(record.distrito);
    const value = Number(record.datos_a_recopilar) || 0;
    if (dep) byDep.set(dep, (byDep.get(dep) ?? 0) + value);
    if (dep && prov) {
      const key = `${dep}::${prov}`;
      byProv.set(key, (byProv.get(key) ?? 0) + value);
    }
    if (dep && prov && dist) {
      const key = `${dep}::${prov}::${dist}`;
      byDist.set(key, (byDist.get(key) ?? 0) + value);
    }
  }

  return { total, byDep, byProv, byDist };
};

export const resolveGoalForSelection = (
  selection: MapHierarchySelection | null,
  index: DataGoalIndex,
) => {
  if (!selection) return index.total;
  const depName = normalizeName(selection.depName);
  const provName = normalizeName(selection.provName);
  const distName = normalizeName(selection.distName);

  if (selection.level === "distrito") {
    if (depName && provName && distName) {
      return index.byDist.get(`${depName}::${provName}::${distName}`) ?? 0;
    }
    if (depName && provName) {
      return index.byProv.get(`${depName}::${provName}`) ?? 0;
    }
    if (depName) return index.byDep.get(depName) ?? 0;
    return 0;
  }

  if (selection.level === "provincia") {
    if (depName && provName) {
      return index.byProv.get(`${depName}::${provName}`) ?? 0;
    }
    if (depName) return index.byDep.get(depName) ?? 0;
    return 0;
  }

  if (depName) return index.byDep.get(depName) ?? 0;
  return 0;
};
