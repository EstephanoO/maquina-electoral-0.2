CREATE TABLE IF NOT EXISTS forms (
  id text PRIMARY KEY,
  client_id text,
  nombre text,
  telefono text,
  fecha timestamptz,
  x double precision,
  y double precision,
  zona text,
  candidate text,
  encuestador text,
  encuestador_id text,
  candidato_preferido text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS forms_client_id_idx ON forms (client_id);
