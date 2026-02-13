export type GeoLevel = "departamento" | "provincia" | "distrito";

export type GeoNode = {
  id: string;
  level: GeoLevel;
  name: string;
  parentId: string | null;
  children: string[];
  bbox: [number, number, number, number];
  codes: {
    dep: string;
    prov?: string;
    dist?: string;
  };
};

export type GeoIndex = {
  meta: {
    version: number;
    generatedAt: string;
    sources: {
      departamentos: string;
      provincias: string;
      distritos: string;
    };
  };
  nodes: Record<string, GeoNode>;
  byCode: {
    departamento: Record<string, string>;
    provincia: Record<string, string>;
    distrito: Record<string, string>;
  };
};

export type GeoFeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties?: Record<string, unknown>;
    geometry: {
      type: string;
      coordinates: unknown;
    };
  }>;
};

export type MapHierarchySelection = {
  level: GeoLevel;
  depCode?: string;
  provCode?: string;
  distCode?: string;
  sector?: string;
  subsector?: string;
  depName?: string;
  provName?: string;
  distName?: string;
  pointCount?: number;
};
