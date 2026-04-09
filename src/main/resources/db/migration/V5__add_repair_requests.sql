CREATE TABLE repair_requests (
    id SERIAL PRIMARY KEY,
    ship_id INTEGER NOT NULL REFERENCES ships(id),
    client_id INTEGER NOT NULL REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    requested_start_date DATE,
    requested_end_date DATE,
    scheduled_start_date DATE,
    scheduled_end_date DATE,
    estimated_duration_days INTEGER NOT NULL DEFAULT 1,
    contingency_days INTEGER NOT NULL DEFAULT 0,
    actual_duration_days INTEGER,
    total_cost DECIMAL(12, 2),
    description VARCHAR(1000),
    notes VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_repair_requests_ship_id ON repair_requests(ship_id);
CREATE INDEX idx_repair_requests_client_id ON repair_requests(client_id);
CREATE INDEX idx_repair_requests_status ON repair_requests(status);
CREATE INDEX idx_repair_requests_scheduled_dates ON repair_requests(scheduled_start_date, scheduled_end_date);