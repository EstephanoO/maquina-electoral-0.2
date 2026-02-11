BEGIN;

CREATE TEMP TABLE tmp_info_feb8_registros_import (
  source_id text,
  recorded_at timestamptz,
  interviewer text,
  supervisor text,
  name text,
  phone text,
  east double precision,
  north double precision,
  latitude double precision,
  longitude double precision,
  created_at timestamptz,
  home_maps_url text,
  polling_place_url text
);

\copy tmp_info_feb8_registros_import (source_id, recorded_at, interviewer, supervisor, name, phone, east, north, latitude, longitude, created_at, home_maps_url, polling_place_url) FROM '/Users/milaa/sandbox/nexus/nexus/tmp/info-feb8-guillermo.csv' CSV;

INSERT INTO info_feb8_registros (
  source_id,
  recorded_at,
  interviewer,
  supervisor,
  name,
  phone,
  east,
  north,
  latitude,
  longitude,
  created_at,
  home_maps_url,
  polling_place_url
)
SELECT
  source_id,
  recorded_at,
  interviewer,
  supervisor,
  name,
  phone,
  east,
  north,
  latitude,
  longitude,
  created_at,
  home_maps_url,
  polling_place_url
FROM tmp_info_feb8_registros_import
ON CONFLICT (source_id) DO NOTHING;

COMMIT;
