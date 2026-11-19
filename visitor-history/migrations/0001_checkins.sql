-- Private GitHub account check-ins. No email, IP, device ID or OAuth token.
CREATE TABLE IF NOT EXISTS visitor_checkins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  github_id INTEGER NOT NULL,
  github_login TEXT NOT NULL,
  verified_at_ms INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_visitor_checkins_verified_at
  ON visitor_checkins (verified_at_ms DESC);
