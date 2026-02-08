#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
	printf "DATABASE_URL no esta configurado.\n"
	exit 1
fi

if ! command -v ogr2ogr >/dev/null 2>&1; then
	printf "ogr2ogr no esta instalado. Ejecuta: brew install gdal\n"
	exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
	printf "psql no esta instalado. Ejecuta: brew install libpq y agrega psql al PATH\n"
	exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_DIR="${ROOT_DIR}/public/geo"

psql "${DATABASE_URL}" -c "TRUNCATE public.peru_departamentos; TRUNCATE public.peru_provincias; TRUNCATE public.peru_distritos;"

ogr2ogr \
	-f "PostgreSQL" \
	"PG:${DATABASE_URL}" \
	"${SRC_DIR}/departamentos 2.geojson" \
	-nln public.peru_departamentos \
	-nlt MULTIPOLYGON \
	-lco GEOMETRY_NAME=geom \
	-append

ogr2ogr \
	-f "PostgreSQL" \
	"PG:${DATABASE_URL}" \
	"${SRC_DIR}/provincias.geojson" \
	-nln public.peru_provincias \
	-nlt MULTIPOLYGON \
	-lco GEOMETRY_NAME=geom \
	-append

ogr2ogr \
	-f "PostgreSQL" \
	"PG:${DATABASE_URL}" \
	"${SRC_DIR}/distritos.geojson" \
	-nln public.peru_distritos \
	-nlt MULTIPOLYGON \
	-lco GEOMETRY_NAME=geom \
	-append
