-- Full demo reset with clean operational dataset (no duplicates).
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
    ('Док-2', 260, 40, 11, 'AVAILABLE', 1),
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
    ('client1@shipyard.com', '$2a$06$OmS3cNwrv0HbZEF8s2WgAOjE7WBoq1SbwSjdrmSQ8I3.MVm7RkKBC', 'Клиент', 'Север', NULL, 'CLIENT', TRUE, NULL, NULL),
    ('client2@shipyard.com', '$2a$06$OmS3cNwrv0HbZEF8s2WgAOjE7WBoq1SbwSjdrmSQ8I3.MVm7RkKBC', 'Клиент', 'Восток', NULL, 'CLIENT', TRUE, NULL, NULL);

INSERT INTO ships (reg_number, name, ship_type, max_length, max_width, max_draft, user_id, ship_status, dock_id)
VALUES
    ('IMO-9401001', 'Волна', 'BULK_CARRIER', 210, 33, 10, 10, 'UNDER_REPAIR', 1),
    ('IMO-9401002', 'Гранит', 'TANKER', 220, 34, 11, 10, 'UNDER_REPAIR', 2),
    ('IMO-9401003', 'Маяк', 'CONTAINER_SHIP', 240, 36, 11, 11, 'WAITING', NULL),
    ('IMO-9401004', 'Север', 'TUG', 90, 18, 6, 11, 'IDLE', NULL);

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
    (1, 10, 'IN_PROGRESS', DATE '2026-05-01', DATE '2026-05-16', DATE '2026-05-02', DATE '2026-05-18', 16, 2, 9, 1280000.00, 'Плановый доковый ремонт корпуса', NULL, 1, 3, NULL, NULL, FALSE, NULL, NULL),
    (2, 10, 'COMPLETED', DATE '2026-04-10', DATE '2026-04-30', DATE '2026-04-11', DATE '2026-05-01', 20, 1, 20, 1750000.00, 'Ремонт насосного оборудования и покраска', NULL, 2, 4, NULL, NULL, FALSE, NULL, NULL),
    (3, 11, 'SUBMITTED', DATE '2026-05-20', DATE '2026-06-05', NULL, NULL, 12, 2, 0, NULL, 'Новая заявка на диагностику энергетики', 'Ожидание рассмотрения', NULL, NULL, NULL, NULL, FALSE, NULL, NULL),
    (4, 11, 'UNDER_REVIEW', DATE '2026-05-18', DATE '2026-05-28', NULL, NULL, 10, 1, 0, NULL, 'Подготовка к текущему ремонту рулевого', NULL, NULL, NULL, NULL, NULL, FALSE, NULL, NULL),
    (1, 10, 'CLIENT_ACCEPTED', DATE '2026-03-01', DATE '2026-03-20', DATE '2026-03-02', DATE '2026-03-22', 15, 2, 15, 980000.00, 'Завершенный ремонт, принятый клиентом', 'Архивный кейс', 1, 3, NULL, NULL, TRUE, TIMESTAMP '2026-03-23 10:15:00', 'Работы приняты без замечаний'),
    (4, 11, 'REJECTED', DATE '2026-05-07', DATE '2026-05-14', NULL, NULL, 7, 1, 0, NULL, 'Срочная заявка без полного пакета данных', NULL, NULL, NULL, 'Не хватает обязательных документов', 'Требуется приложить акт дефектации', FALSE, NULL, NULL);

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
    (1, 1, 'IN_PROGRESS', DATE '2026-05-02', NULL, 50, 640000.00, 'Основные корпусные работы в процессе', 3),
    (2, 2, 'COMPLETED', DATE '2026-04-11', DATE '2026-05-01', 100, 1750000.00, 'Работы завершены, ожидается приемка клиента', 4),
    (5, 1, 'COMPLETED', DATE '2026-03-02', DATE '2026-03-22', 100, 980000.00, 'Архивный завершенный ремонт', 3);

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

    (2, 2, 'MECHANICAL', 'Ремонт насосов', 'Замена изношенных узлов', 'COMPLETED', 12, 12, TRUE, FALSE, NULL, 9, 'APPROVED'),
    (2, 2, 'PAINTING', 'Финишная покраска', 'Антикоррозионное покрытие', 'COMPLETED', 10, 10, TRUE, FALSE, NULL, 9, 'APPROVED'),

    (5, 3, 'ELECTRICAL', 'Проверка электрики', 'Плановые регламентные работы', 'COMPLETED', 8, 8, TRUE, FALSE, NULL, 7, 'APPROVED'),
    (5, 3, 'SAFETY', 'Тест безопасности', 'Контрольная проверка перед сдачей', 'COMPLETED', 3, 3, TRUE, FALSE, NULL, 8, 'APPROVED');

INSERT INTO issues (repair_id, issue_type, description, impact, status, reported_by, reported_at, resolved_at)
VALUES
    (1, 'DEFECT', 'Выявлен дополнительный дефект обшивки', 'MEDIUM', 'OPEN', 'master1@shipyard.com', TIMESTAMP '2026-05-09 09:00:00', NULL),
    (2, 'DELAY', 'Сдвиг сроков поставки комплектующих', 'LOW', 'RESOLVED', 'operator2@shipyard.com', TIMESTAMP '2026-04-20 13:00:00', TIMESTAMP '2026-04-21 10:30:00');

INSERT INTO downtimes (dock_name, reason, start_date, end_date, expected_end_date, notes)
VALUES
    ('Док-3', 'Плановое обслуживание дока', TIMESTAMP '2026-05-01 08:00:00', NULL, TIMESTAMP '2026-05-20 18:00:00', 'Плановые регламентные работы');

INSERT INTO notifications (type, title, message, is_read, user_id)
VALUES
    ('INFO', 'Новая заявка', 'Поступила новая заявка на ремонт в очередь диспетчера.', FALSE, 2),
    ('WARNING', 'Задача на проверке', 'Работа ожидает проверки мастером.', FALSE, 5),
    ('SUCCESS', 'Ремонт завершен', 'Ремонт #2 завершен и готов к приемке клиентом.', TRUE, 4);

INSERT INTO audit_logs (action, entity_type, entity_id, actor_email, actor_user_id, details, created_at)
VALUES
    ('STATUS_CHANGE', 'REPAIR_REQUEST', 1, 'dispatcher@shipyard.com', 2, 'SUBMITTED->IN_PROGRESS', TIMESTAMP '2026-05-02 11:00:00'),
    ('STATUS_CHANGE', 'WORK_ITEM', 2, 'worker2@shipyard.com', 8, 'PENDING_REVIEW', TIMESTAMP '2026-05-10 09:30:00'),
    ('REPORT_EXPORT', 'REPORT', NULL, 'operator1@shipyard.com', 3, 'type=REPAIRS,scope=DOCK,period=MONTH', TIMESTAMP '2026-05-10 10:10:00');
