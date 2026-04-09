CREATE TABLE docks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    max_length INTEGER NOT NULL,
    max_width INTEGER NOT NULL,
    max_draft INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    shipyard_id INTEGER NOT NULL REFERENCES shipyards(id),
    created_at DATE NOT NULL DEFAULT CURRENT_DATE,
    updated_at DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE INDEX idx_docks_shipyard_id ON docks(shipyard_id);
CREATE INDEX idx_docks_status ON docks(status);