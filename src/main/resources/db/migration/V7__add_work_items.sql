CREATE TABLE work_items (
    id SERIAL PRIMARY KEY,
    repair_request_id INTEGER NOT NULL REFERENCES repair_requests(id),
    repair_id INTEGER REFERENCES repairs(id),
    category VARCHAR(20) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description VARCHAR(1000),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    estimated_hours INTEGER,
    actual_hours INTEGER,
    is_mandatory BOOLEAN NOT NULL DEFAULT FALSE,
    is_discovered BOOLEAN NOT NULL DEFAULT FALSE,
    notes VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_work_items_repair_request_id ON work_items(repair_request_id);
CREATE INDEX idx_work_items_category ON work_items(category);
CREATE INDEX idx_work_items_status ON work_items(status);