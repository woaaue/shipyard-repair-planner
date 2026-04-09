CREATE TABLE repairs (
    id SERIAL PRIMARY KEY,
    repair_request_id INTEGER NOT NULL REFERENCES repair_requests(id),
    dock_id INTEGER NOT NULL REFERENCES docks(id),
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    actual_start_date DATE,
    actual_end_date DATE,
    progress_percentage INTEGER NOT NULL DEFAULT 0,
    total_cost DECIMAL(12, 2),
    notes VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_repairs_repair_request_id ON repairs(repair_request_id);
CREATE INDEX idx_repairs_dock_id ON repairs(dock_id);
CREATE INDEX idx_repairs_status ON repairs(status);