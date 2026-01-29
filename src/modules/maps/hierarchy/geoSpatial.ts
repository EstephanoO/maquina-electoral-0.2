import type { GeoFeatureCollection } from "./types";

export const findFeatureByPoint = (
  collection: GeoFeatureCollection,
  point: { lat: number; lng: number },
) => {
  for (const feature of collection.features) {
    if (!feature.geometry) continue;
    if (isPointInGeometry(feature.geometry, point)) return feature as any;
  }
  return null;
};

const isPointInGeometry = (
  geometry: { type: string; coordinates: unknown },
  point: { lat: number; lng: number },
) => {
  if (geometry.type === "Polygon") {
    return isPointInPolygon(geometry.coordinates as number[][][], point);
  }
  if (geometry.type === "MultiPolygon") {
    const polygons = geometry.coordinates as number[][][][];
    for (const polygon of polygons) {
      if (isPointInPolygon(polygon, point)) return true;
    }
  }
  return false;
};

const isPointInPolygon = (polygon: number[][][], point: { lat: number; lng: number }) => {
  if (polygon.length === 0) return false;
  const [outer, ...holes] = polygon;
  if (!isPointInRing(outer, point)) return false;
  for (const hole of holes) {
    if (isPointInRing(hole, point)) return false;
  }
  return true;
};

const isPointInRing = (ring: number[][], point: { lat: number; lng: number }) => {
  let inside = false;
  const x = point.lng;
  const y = point.lat;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 0.0) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
};
