-- Reset and seed deterministic realistic demo data for end-to-end role scenario.
-- Password for all seeded users: operator12345

TRUNCATE TABLE
    notifications,
    issues,
    downtimes,
    audit_logs,
    work_items,
    repairs,
    repair_requests,
    ships,
    users,
    docks,
    shipyards
RESTART IDENTITY CASCADE;

INSERT INTO shipyards (name, city, street, postal_code, status)
VALUES
    ('Северная верфь', 'Санкт-Петербург', 'Портовая 1', '190000', 'ACTIVE'),
    ('Восточная верфь', 'Владивосток', 'Доковая 12', '690000', 'ACTIVE');

INSERT INTO docks (name, max_length, max_width, max_draft, status, shipyard_id)
VALUES
    ('Док-1', 280, 45, 12, 'AVAILABLE', 1),
    ('Док-2', 260, 40, 11, 'AVAILABLE', 2),
    ('Док-3', 220, 36, 10, 'MAINTENANCE', 2);

INSERT INTO users (
    email,
    encoded_password,
    first_name,
    last_name,
    patronymic,
    role,
    enabled,
    dock_id,
    reports_to_user_id
)
VALUES
    ('admin@shipyard.com', '$2a$06$OmS3cNwrv0HbZEF8s2WgAOjE7WBoq1SbwSjdrmSQ8I3.MVm7RkKBC', 'Системный', 'Администратор', NULL, 'ADMIN', TRUE, NULL, NULL),
    ('dispatcher@shipyard.com', '$2a$06$OmS3cNwrv0HbZEF8s2WgAOjE7WBoq1SbwSjdrmSQ8I3.MVm7RkKBC', 'Ирина', 'Диспетчер', NULL, 'DISPATCHER', TRUE, NULL, NULL),
    ('operator1@shipyard.com', '$2a$06$OmS3cNwrv0HbZEF8s2WgAOjE7WBoq1SbwSjdrmSQ8I3.MVm7RkKBC', 'Олег', 'Оператор', NULL, 'OPERATOR', TRUE, 1, 2),
    ('operator2@shipyard.com', '$2a$06$OmS3cNwrv0HbZEF8s2WgAOjE7WBoq1SbwSjdrmSQ8I3.MVm7RkKBC', 'Павел', 'Оператор', NULL, 'OPERATOR', TRUE, 2, 2),
    ('master1@shipyard.com', '$2a$06$OmS3cNwrv0HbZEF8s2WgAOjE7WBoq1SbwSjdrmSQ8I3.MVm7RkKBC', 'Марат', 'Мастер', NULL, 'MASTER', TRUE, 1, 3),
    ('master2@shipyard.com', '$2a$06$OmS3cNwrv0HbZEF8s2WgAOjE7WBoq1SbwSjdrmSQ8I3.MVm7RkKBC', 'Сергей', 'Мастер', NULL, 'MASTER', TRUE, 2, 4),
    ('worker1@shipyard.com', '$2a$06$OmS3cNwrv0HbZEF8s2WgAOjE7WBoq1SbwSjdrmSQ8I3.MVm7RkKBC', 'Иван', 'Рабочий', NULL, 'WORKER', TRUE, 1, 5),
    ('worker2@shipyard.com', '$2a$06$OmS3cNwrv0HbZEF8s2WgAOjE7WBoq1SbwSjdrmSQ8I3.MVm7RkKBC', 'Антон', 'Рабочий', NULL, 'WORKER', TRUE, 1, 5),
    ('worker3@shipyard.com', '$2a$06$OmS3cNwrv0HbZEF8s2WgAOjE7WBoq1SbwSjdrmSQ8I3.MVm7RkKBC', 'Петр', 'Рабочий', NULL, 'WORKER', TRUE, 2, 6),
    ('worker4@shipyard.com', '$2a$06$OmS3cNwrv0HbZEF8s2WgAOjE7WBoq1SbwSjdrmSQ8I3.MVm7RkKBC', 'Егор', 'Рабочий', NULL, 'WORKER', TRUE, 2, 6),
    ('client1@shipyard.com', '$2a$06$OmS3cNwrv0HbZEF8s2WgAOjE7WBoq1SbwSjdrmSQ8I3.MVm7RkKBC', 'Алексей', 'Клиент', NULL, 'CLIENT', TRUE, NULL, NULL),
    ('client2@shipyard.com', '$2a$06$OmS3cNwrv0HbZEF8s2WgAOjE7WBoq1SbwSjdrmSQ8I3.MVm7RkKBC', 'Николай', 'Клиент', NULL, 'CLIENT', TRUE, NULL, NULL);

INSERT INTO ships (reg_number, name, ship_type, max_length, max_width, max_draft, user_id, ship_status, dock_id)
VALUES
    ('IMO-9401001', 'Волна', 'BULK_CARRIER', 210, 33, 10, 11, 'UNDER_REPAIR', 1),
    ('IMO-9401002', 'Гранит', 'TANKER', 220, 34, 11, 11, 'WAITING', NULL),
    ('IMO-9401003', 'Маяк', 'CONTAINER_SHIP', 240, 36, 11, 12, 'UNDER_REPAIR', 2),
    ('IMO-9401004', 'Север', 'TUG', 90, 18, 6, 12, 'WAITING', NULL),
    ('IMO-9401005', 'Атлас', 'RO_RO', 230, 35, 10, 12, 'IDLE', NULL);

INSERT INTO repair_requests (
    ship_id,
    client_id,
    status,
    requested_start_date,
    requested_end_date,
    scheduled_start_date,
    scheduled_end_date,
    estimated_duration_days,
    contingency_days,
    actual_duration_days,
    total_cost,
    description,
    notes,
    assigned_dock_id,
    assigned_operator_id,
    rejection_reason,
    rejection_note,
    client_accepted,
    client_accepted_at,
    client_acceptance_note
)
VALUES
    (1, 11, 'IN_PROGRESS', CURRENT_DATE - 8, CURRENT_DATE + 6, CURRENT_DATE - 7, CURRENT_DATE + 7, 14, 2, 8, 1280000.00, 'Плановый доковый ремонт корпуса', NULL, 1, 3, NULL, NULL, FALSE, NULL, NULL),
    (2, 11, 'SUBMITTED', CURRENT_DATE + 3, CURRENT_DATE + 14, NULL, NULL, 11, 2, 0, NULL, 'Диагностика гидравлики и проверка систем', 'Ожидает рассмотрения диспетчером', NULL, NULL, NULL, NULL, FALSE, NULL, NULL),
    (3, 12, 'APPROVED', CURRENT_DATE + 1, CURRENT_DATE + 12, CURRENT_DATE + 2, CURRENT_DATE + 13, 10, 1, 0, 1460000.00, 'Подготовка к ремонту магистралей', 'Назначен док и оператор', 2, 4, NULL, NULL, FALSE, NULL, NULL),
    (4, 12, 'UNDER_REVIEW', CURRENT_DATE + 5, CURRENT_DATE + 15, NULL, NULL, 9, 1, 0, NULL, 'Осмотр рулевого комплекса', 'Требуется распределение по доку', NULL, NULL, NULL, NULL, FALSE, NULL, NULL),
    (5, 11, 'CLIENT_ACCEPTED', CURRENT_DATE - 28, CURRENT_DATE - 16, CURRENT_DATE - 27, CURRENT_DATE - 15, 12, 1, 12, 980000.00, 'Завершенный ремонт и клиентская приемка', 'Архивный кейс', 1, 3, NULL, NULL, TRUE, CURRENT_TIMESTAMP - INTERVAL '14 days', 'Работы приняты без замечаний'),
    (4, 12, 'REJECTED', CURRENT_DATE - 2, CURRENT_DATE + 4, NULL, NULL, 6, 1, 0, NULL, 'Срочная заявка без полного пакета', NULL, NULL, NULL, 'Не хватает обязательных документов', 'Добавьте акт дефектации и фотофиксацию', FALSE, NULL, NULL);

INSERT INTO repairs (
    repair_request_id,
    dock_id,
    status,
    actual_start_date,
    actual_end_date,
    progress_percentage,
    total_cost,
    notes,
    operator_id
)
VALUES
    (1, 1, 'IN_PROGRESS', CURRENT_DATE - 7, NULL, 67, 640000.00, 'Основные корпусные работы в процессе', 3),
    (3, 2, 'SCHEDULED', NULL, NULL, 0, 1460000.00, 'Ожидает старта работ', 4),
    (5, 1, 'COMPLETED', CURRENT_DATE - 27, CURRENT_DATE - 15, 100, 980000.00, 'Работы завершены и приняты клиентом', 3);

INSERT INTO work_items (
    repair_request_id,
    repair_id,
    category,
    name,
    description,
    status,
    estimated_hours,
    actual_hours,
    is_mandatory,
    is_discovered,
    notes,
    assignee_id,
    review_status
)
VALUES
    (1, 1, 'SAFETY', 'Первичный осмотр', 'Осмотр судна и фиксация замечаний', 'COMPLETED', 2, 2, TRUE, FALSE, NULL, 7, 'APPROVED'),
    (1, 1, 'MECHANICAL', 'Дефектовка', 'Уточнение плана работ', 'COMPLETED', 4, 4, TRUE, FALSE, NULL, 8, 'PENDING_REVIEW'),
    (1, 1, 'HULL', 'Сварочные работы', 'Усиление секций корпуса', 'IN_PROGRESS', 16, 8, TRUE, FALSE, NULL, 7, 'NOT_SUBMITTED'),

    (3, 2, 'SAFETY', 'Первичная приемка доком', 'Проверка состояния при постановке', 'PENDING', 3, 0, TRUE, FALSE, 'Создано оператором после согласования', NULL, 'NOT_SUBMITTED'),
    (3, 2, 'PIPING', 'Подготовка магистралей', 'Подготовительный этап до старта ремонта', 'PENDING', 6, 0, TRUE, FALSE, NULL, NULL, 'NOT_SUBMITTED'),

    (5, 3, 'ELECTRICAL', 'Проверка электрики', 'Плановые регламентные работы', 'COMPLETED', 8, 8, TRUE, FALSE, NULL, 7, 'APPROVED'),
    (5, 3, 'SAFETY', 'Тест безопасности', 'Контрольная проверка перед сдачей', 'COMPLETED', 3, 3, TRUE, FALSE, NULL, 8, 'APPROVED');

INSERT INTO issues (repair_id, issue_type, description, impact, status, reported_by, reported_at, resolved_at)
VALUES
    (1, 'DEFECT', 'Выявлен дополнительный дефект обшивки', 'MEDIUM', 'OPEN', 'master1@shipyard.com', CURRENT_TIMESTAMP - INTERVAL '1 day', NULL),
    (3, 'DELAY', 'Сдвиг сроков поставки комплектующих', 'LOW', 'RESOLVED', 'operator1@shipyard.com', CURRENT_TIMESTAMP - INTERVAL '20 days', CURRENT_TIMESTAMP - INTERVAL '19 days');

INSERT INTO downtimes (dock_name, reason, start_date, end_date, expected_end_date, notes)
VALUES
    ('Док-3', 'Плановое обслуживание дока', CURRENT_TIMESTAMP - INTERVAL '4 days', NULL, CURRENT_TIMESTAMP + INTERVAL '6 days', 'Регламентные работы на неактивном доке');

INSERT INTO notifications (type, title, message, is_read, user_id)
VALUES
    ('INFO', 'Новая заявка', 'Поступила новая заявка на ремонт в очередь диспетчера.', FALSE, 2),
    ('WARNING', 'Работа на проверке', 'Задача ожидает проверки мастером.', FALSE, 5),
    ('SUCCESS', 'Ремонт принят', 'Клиент подтвердил приемку завершенного ремонта.', TRUE, 3);

INSERT INTO audit_logs (action, entity_type, entity_id, actor_email, actor_user_id, details, created_at)
VALUES
    ('STATUS_CHANGE', 'REPAIR_REQUEST', 1, 'dispatcher@shipyard.com', 2, 'SUBMITTED->IN_PROGRESS', CURRENT_TIMESTAMP - INTERVAL '7 days'),
    ('STATUS_CHANGE', 'WORK_ITEM', 2, 'worker2@shipyard.com', 8, 'PENDING_REVIEW', CURRENT_TIMESTAMP - INTERVAL '1 day'),
    ('REPORT_EXPORT', 'REPORT', NULL, 'operator1@shipyard.com', 3, 'type=REPAIRS,scope=DOCK,period=MONTH', CURRENT_TIMESTAMP - INTERVAL '2 hours');

-- Time offsets for a realistic queue and SLA checks.
UPDATE repair_requests
SET created_at = CURRENT_TIMESTAMP - INTERVAL '3 days',
    updated_at = CURRENT_TIMESTAMP - INTERVAL '3 days'
WHERE id = 2;

UPDATE repair_requests
SET created_at = CURRENT_TIMESTAMP - INTERVAL '1 day',
    updated_at = CURRENT_TIMESTAMP - INTERVAL '1 day'
WHERE id = 4;

UPDATE repair_requests
SET created_at = CURRENT_TIMESTAMP - INTERVAL '2 days',
    updated_at = CURRENT_TIMESTAMP - INTERVAL '2 days'
WHERE id = 6;
