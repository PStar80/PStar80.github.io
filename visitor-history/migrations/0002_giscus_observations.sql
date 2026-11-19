-- Best-effort public GitHub username observations from the giscus widget.
-- No claims of verified authentication; no IP, email, token or device tracking.
CREATE TABLE IF NOT EXISTS giscus_observations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  github_login TEXT NOT NULL,
  observed_at_ms INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_giscus_observations_recent
  ON giscus_observations (observed_at_ms DESC);
CREATE INDEX IF NOT EXISTS idx_giscus_observations_login_time
  ON giscus_observations (github_login, observed_at_ms DESC);
