#!/usr/bin/env bash
set -euo pipefail

if ! command -v tippecanoe >/dev/null 2>&1; then
	printf "tippecanoe no esta instalado. Ejecuta: brew install tippecanoe\n"
	exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_DIR="${ROOT_DIR}/public/geo"
OUT_DIR="${ROOT_DIR}/public/tiles/peru"

mkdir -p "${OUT_DIR}"

tippecanoe \
	-Z 4 \
	-z 12 \
	-e "${OUT_DIR}" \
	-L departamentos:"${SRC_DIR}/departamentos 2.geojson" \
	-L provincias:"${SRC_DIR}/provincias.geojson" \
	-L distritos:"${SRC_DIR}/distritos.geojson" \
	--drop-densest-as-needed \
	--extend-zooms-if-still-dropping
