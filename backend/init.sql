

-- TODO make this secure

\c gaze_data

CREATE TABLE gaze_data (
  session_id UUID NOT NULL,
  user_id UUID NOT NULL,
  timestamp_ms BIGINT NOT NULL,
  gaze_x FLOAT,
  sampling_rate INTEGER CHECK (sampling_rate >= 0 AND sampling_rate <= 300),
  calibration_params FLOAT[3],
  device TEXT,
  PRIMARY KEY (session_id, timestamp_ms, user_id)
);

SELECT create_hypertable('gaze_data', 'timestamp_ms');

CREATE TABLE processed (
  session_id UUID NOT NULL,
  user_id UUID NOT NULL,
  timestamp_ms BIGINT NOT NULL,
  gaze_x FLOAT,
  sampling_rate INTEGER CHECK (sampling_rate >= 0 AND sampling_rate <= 300),
  calibration_params FLOAT[3],
  device TEXT,
  velocity FLOAT,
  is_anomaly BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (session_id, timestamp_ms, user_id)
);

SELECT create_hypertable('processed', 'timestamp_ms');

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO gaze;