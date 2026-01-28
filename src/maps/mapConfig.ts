export const defaultMapView = {
  longitude: -75.02,
  latitude: -9.19,
  zoom: 5.2,
};

import type { StyleSpecification } from "maplibre-gl";

export const mapStyleLight =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
export const mapStyleDark =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

export const peruMapStyle: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [
    {
      id: "background",
      type: "background",
      paint: {
        "background-color": "rgba(0,0,0,0)",
      },
    },
  ],
};
