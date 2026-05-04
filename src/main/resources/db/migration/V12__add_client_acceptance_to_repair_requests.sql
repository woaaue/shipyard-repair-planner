ALTER TABLE repair_requests
    ADD COLUMN client_accepted BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN client_accepted_at TIMESTAMP,
    ADD COLUMN client_acceptance_note VARCHAR(500);

