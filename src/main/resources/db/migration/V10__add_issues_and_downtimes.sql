CREATE TABLE issues (
    id SERIAL PRIMARY KEY,
    repair_id INTEGER NOT NULL REFERENCES repairs(id),
    issue_type VARCHAR(120) NOT NULL,
    description VARCHAR(2000) NOT NULL,
    impact VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    reported_by VARCHAR(120) NOT NULL,
    reported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

CREATE INDEX idx_issues_repair_id ON issues(repair_id);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_reported_at ON issues(reported_at);

CREATE TABLE downtimes (
    id SERIAL PRIMARY KEY,
    dock_name VARCHAR(150) NOT NULL,
    reason VARCHAR(200) NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    expected_end_date TIMESTAMP,
    notes VARCHAR(2000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_downtimes_dock_name ON downtimes(dock_name);
CREATE INDEX idx_downtimes_start_date ON downtimes(start_date);
CREATE INDEX idx_downtimes_end_date ON downtimes(end_date);
