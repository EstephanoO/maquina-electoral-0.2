CREATE TABLE IF NOT EXISTS info_feb8_action_events (
  id text PRIMARY KEY,
  operator_slug text NOT NULL,
  action text NOT NULL,
  source_id text,
  phone text,
  person_name text,
  actor_id text NOT NULL,
  actor_name text NOT NULL,
  actor_email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS info_feb8_action_events_operator_idx
  ON info_feb8_action_events (operator_slug);

CREATE INDEX IF NOT EXISTS info_feb8_action_events_action_idx
  ON info_feb8_action_events (action);

CREATE INDEX IF NOT EXISTS info_feb8_action_events_created_at_idx
  ON info_feb8_action_events (created_at);
