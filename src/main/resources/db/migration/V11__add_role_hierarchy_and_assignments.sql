ALTER TABLE users
    ADD COLUMN reports_to_user_id INTEGER REFERENCES users(id);

CREATE INDEX idx_users_reports_to_user_id ON users(reports_to_user_id);

ALTER TABLE repairs
    ADD COLUMN operator_id INTEGER REFERENCES users(id);

CREATE INDEX idx_repairs_operator_id ON repairs(operator_id);

ALTER TABLE work_items
    ADD COLUMN assignee_id INTEGER REFERENCES users(id),
    ADD COLUMN review_status VARCHAR(30) NOT NULL DEFAULT 'NOT_SUBMITTED';

CREATE INDEX idx_work_items_assignee_id ON work_items(assignee_id);
CREATE INDEX idx_work_items_review_status ON work_items(review_status);
