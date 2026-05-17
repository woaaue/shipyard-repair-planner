ALTER TABLE repair_requests
    ADD COLUMN IF NOT EXISTS assigned_dock_id INTEGER NULL,
    ADD COLUMN IF NOT EXISTS assigned_operator_id INTEGER NULL,
    ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(200) NULL,
    ADD COLUMN IF NOT EXISTS rejection_note VARCHAR(500) NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'repair_requests_assigned_dock_id_fkey'
          AND table_name = 'repair_requests'
    ) THEN
        ALTER TABLE repair_requests
            ADD CONSTRAINT repair_requests_assigned_dock_id_fkey
            FOREIGN KEY (assigned_dock_id) REFERENCES docks(id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'repair_requests_assigned_operator_id_fkey'
          AND table_name = 'repair_requests'
    ) THEN
        ALTER TABLE repair_requests
            ADD CONSTRAINT repair_requests_assigned_operator_id_fkey
            FOREIGN KEY (assigned_operator_id) REFERENCES users(id);
    END IF;
END $$;
