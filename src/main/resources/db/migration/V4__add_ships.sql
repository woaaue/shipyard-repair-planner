CREATE TABLE ships (
    id SERIAL PRIMARY KEY,
    reg_number VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL,
    ship_type VARCHAR(20) NOT NULL,
    max_length INTEGER NOT NULL,
    max_width INTEGER NOT NULL,
    max_draft INTEGER NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id),
    ship_status VARCHAR(20) NOT NULL DEFAULT 'IDLE',
    dock_id INTEGER REFERENCES docks(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ships_user_id ON ships(user_id);
CREATE INDEX idx_ships_dock_id ON ships(dock_id);
CREATE INDEX idx_ships_status ON ships(ship_status);
CREATE INDEX idx_ships_type ON ships(ship_type);