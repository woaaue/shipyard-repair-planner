CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message VARCHAR(1000) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

INSERT INTO notifications (type, title, message, is_read)
VALUES
    ('INFO', 'Repair started', 'Repair workflow has started for one of the active requests.', FALSE),
    ('WARNING', 'Repair delay', 'One repair item is delayed and needs schedule review.', FALSE),
    ('SUCCESS', 'Repair completed', 'A repair has been completed successfully.', TRUE);
