import * as React from "react";
import type { GeoIndex, GeoLevel, GeoNode } from "./types";
import { getGeoIndex } from "./geoIndex";

type LoadStatus = "idle" | "loading" | "ready" | "error";

export const useMapHierarchy = () => {
  const [index, setIndex] = React.useState<GeoIndex | null>(null);
  const [status, setStatus] = React.useState<LoadStatus>("idle");
  const [error, setError] = React.useState<Error | null>(null);

  const [level, setLevel] = React.useState<GeoLevel>("departamento");
  const [selectedDepartmentId, setSelectedDepartmentId] = React.useState<string | null>(null);
  const [selectedProvinceId, setSelectedProvinceId] = React.useState<string | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    setStatus("loading");
    getGeoIndex()
      .then((payload) => {
        if (!active) return;
        setIndex(payload);
        setStatus("ready");
      })
      .catch((err) => {
        if (!active) return;
        setError(err as Error);
        setStatus("error");
      });
    return () => {
      active = false;
    };
  }, []);

  const selectedDepartment = React.useMemo<GeoNode | null>(() => {
    if (!index || !selectedDepartmentId) return null;
    return index.nodes[selectedDepartmentId] ?? null;
  }, [index, selectedDepartmentId]);

  const selectedProvince = React.useMemo<GeoNode | null>(() => {
    if (!index || !selectedProvinceId) return null;
    return index.nodes[selectedProvinceId] ?? null;
  }, [index, selectedProvinceId]);

  const selectedDistrict = React.useMemo<GeoNode | null>(() => {
    if (!index || !selectedDistrictId) return null;
    return index.nodes[selectedDistrictId] ?? null;
  }, [index, selectedDistrictId]);

  const selectDepartmentByCode = React.useCallback(
    (code: string) => {
      if (!index) return;
      const id = index.byCode.departamento[code];
      if (!id) return;
      setSelectedDepartmentId(id);
      setSelectedProvinceId(null);
      setSelectedDistrictId(null);
      setLevel("provincia");
    },
    [index],
  );

  const selectProvinceByCodes = React.useCallback(
    (dep: string, prov: string) => {
      if (!index) return;
      const id = index.byCode.provincia[`${dep}${prov}`];
      if (!id) return;
      setSelectedDepartmentId(index.byCode.departamento[dep] ?? null);
      setSelectedProvinceId(id);
      setSelectedDistrictId(null);
      setLevel("distrito");
    },
    [index],
  );

  const selectDistrictByCode = React.useCallback(
    (code: string) => {
      if (!index) return;
      const id = index.byCode.distrito[code];
      if (!id) return;
      const provinceId = index.nodes[id]?.parentId ?? null;
      const departmentId = provinceId ? index.nodes[provinceId]?.parentId ?? null : null;
      setSelectedDepartmentId(departmentId);
      setSelectedProvinceId(provinceId);
      setSelectedDistrictId(id);
      setLevel("distrito");
    },
    [index],
  );

  const reset = React.useCallback(() => {
    setSelectedDepartmentId(null);
    setSelectedProvinceId(null);
    setSelectedDistrictId(null);
    setLevel("departamento");
  }, []);

  const goBack = React.useCallback(() => {
    if (level === "distrito") {
      setSelectedDistrictId(null);
      setSelectedProvinceId(null);
      setLevel("provincia");
      return;
    }
    if (level === "provincia") {
      setSelectedProvinceId(null);
      setSelectedDepartmentId(null);
      setLevel("departamento");
    }
  }, [level]);

  const breadcrumb = React.useMemo(() => {
    const labels: string[] = ["Peru"];
    if (selectedDepartment?.name) labels.push(selectedDepartment.name);
    if (selectedProvince?.name) labels.push(selectedProvince.name);
    if (selectedDistrict?.name) labels.push(selectedDistrict.name);
    return labels;
  }, [selectedDepartment?.name, selectedProvince?.name, selectedDistrict?.name]);

  const selectedCodes = React.useMemo(() => {
    return {
      dep: selectedDepartment?.codes.dep,
      prov: selectedProvince?.codes.prov,
      dist: selectedDistrict?.codes.dist,
    };
  }, [selectedDepartment, selectedProvince, selectedDistrict]);

  return {
    index,
    status,
    error,
    level,
    selectedDepartment,
    selectedProvince,
    selectedDistrict,
    selectedCodes,
    breadcrumb,
    canGoBack: level !== "departamento",
    actions: {
      selectDepartmentByCode,
      selectProvinceByCodes,
      selectDistrictByCode,
      goBack,
      reset,
    },
  };
};
