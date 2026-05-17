-- Refresh demo dataset with richer, realistic operational data.
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
    ('Восточная верфь', 'Владивосток', 'Доковая 12', '690000', 'ACTIVE'),
    ('Западная верфь', 'Калининград', 'Причальная 8', '236000', 'MAINTENANCE');

INSERT INTO docks (name, max_length, max_width, max_draft, status, shipyard_id)
VALUES
    ('Док-1', 280, 45, 12, 'OCCUPIED', 1),
    ('Док-2', 260, 40, 11, 'AVAILABLE', 1),
    ('Док-3', 250, 39, 11, 'OCCUPIED', 2),
    ('Док-4', 210, 35, 9, 'MAINTENANCE', 2);

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
    ('operator2@shipyard.com', '$2a$06$OmS3cNwrv0HbZEF8s2WgAOjE7WBoq1SbwSjdrmSQ8I3.MVm7RkKBC', 'Павел', 'Оператор', NULL, 'OPERATOR', TRUE, 3, 2),
    ('master1@shipyard.com', '$2a$06$OmS3cNwrv0HbZEF8s2WgAOjE7WBoq1SbwSjdrmSQ8I3.MVm7RkKBC', 'Марат', 'Мастер', NULL, 'MASTER', TRUE, 1, 3),
    ('master2@shipyard.com', '$2a$06$OmS3cNwrv0HbZEF8s2WgAOjE7WBoq1SbwSjdrmSQ8I3.MVm7RkKBC', 'Сергей', 'Мастер', NULL, 'MASTER', TRUE, 3, 4),
    ('worker1@shipyard.com', '$2a$06$OmS3cNwrv0HbZEF8s2WgAOjE7WBoq1SbwSjdrmSQ8I3.MVm7RkKBC', 'Иван', 'Рабочий', NULL, 'WORKER', TRUE, 1, 5),
    ('worker2@shipyard.com', '$2a$06$OmS3cNwrv0HbZEF8s2WgAOjE7WBoq1SbwSjdrmSQ8I3.MVm7RkKBC', 'Антон', 'Рабочий', NULL, 'WORKER', TRUE, 1, 5),
    ('worker3@shipyard.com', '$2a$06$OmS3cNwrv0HbZEF8s2WgAOjE7WBoq1SbwSjdrmSQ8I3.MVm7RkKBC', 'Петр', 'Рабочий', NULL, 'WORKER', TRUE, 3, 6),
    ('worker4@shipyard.com', '$2a$06$OmS3cNwrv0HbZEF8s2WgAOjE7WBoq1SbwSjdrmSQ8I3.MVm7RkKBC', 'Егор', 'Рабочий', NULL, 'WORKER', TRUE, 3, 6),
    ('client1@shipyard.com', '$2a$06$OmS3cNwrv0HbZEF8s2WgAOjE7WBoq1SbwSjdrmSQ8I3.MVm7RkKBC', 'Алексей', 'Клиент', NULL, 'CLIENT', TRUE, NULL, NULL),
    ('client2@shipyard.com', '$2a$06$OmS3cNwrv0HbZEF8s2WgAOjE7WBoq1SbwSjdrmSQ8I3.MVm7RkKBC', 'Николай', 'Клиент', NULL, 'CLIENT', TRUE, NULL, NULL),
    ('client3@shipyard.com', '$2a$06$OmS3cNwrv0HbZEF8s2WgAOjE7WBoq1SbwSjdrmSQ8I3.MVm7RkKBC', 'Виктор', 'Клиент', NULL, 'CLIENT', TRUE, NULL, NULL);

INSERT INTO ships (reg_number, name, ship_type, max_length, max_width, max_draft, user_id, ship_status, dock_id)
VALUES
    ('IMO-9501001', 'Волна', 'BULK_CARRIER', 210, 33, 10, 11, 'COMPLETED', NULL),
    ('IMO-9501002', 'Гранит', 'TANKER', 224, 34, 11, 11, 'UNDER_REPAIR', 1),
    ('IMO-9501003', 'Маяк', 'CONTAINER_SHIP', 238, 36, 11, 12, 'UNDER_REPAIR', 3),
    ('IMO-9501004', 'Север', 'TUG', 92, 18, 6, 12, 'WAITING', NULL),
    ('IMO-9501005', 'Атлас', 'RO_RO', 232, 35, 10, 13, 'WAITING', NULL),
    ('IMO-9501006', 'Нептун', 'FERRY', 145, 24, 7, 13, 'IDLE', NULL),
    ('IMO-9501007', 'Рысь', 'DREDGER', 130, 22, 7, 11, 'WAITING', NULL);

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
    (1, 11, 'CLIENT_ACCEPTED', CURRENT_DATE - 40, CURRENT_DATE - 26, CURRENT_DATE - 38, CURRENT_DATE - 24, 14, 2, 14, 980000.00, 'Плановый ремонт корпуса и швартовной линии', 'Закрыт и принят клиентом', 1, 3, NULL, NULL, TRUE, CURRENT_TIMESTAMP - INTERVAL '23 days', 'Работы приняты без замечаний'),
    (2, 11, 'IN_PROGRESS', CURRENT_DATE - 12, CURRENT_DATE + 6, CURRENT_DATE - 10, CURRENT_DATE + 8, 18, 2, 10, 1450000.00, 'Капитальная дефектовка и сварочные работы', 'Работы ведутся по графику', 1, 3, NULL, NULL, FALSE, NULL, NULL),
    (3, 12, 'IN_PROGRESS', CURRENT_DATE - 8, CURRENT_DATE + 10, CURRENT_DATE - 7, CURRENT_DATE + 11, 18, 3, 7, 1680000.00, 'Ремонт магистралей и электрики', 'Фаза контроля качества', 3, 4, NULL, NULL, FALSE, NULL, NULL),
    (4, 12, 'APPROVED', CURRENT_DATE + 3, CURRENT_DATE + 16, CURRENT_DATE + 5, CURRENT_DATE + 18, 13, 2, 0, 1120000.00, 'Подготовка буксира к межсезонью', 'Ожидает постановки в док', 3, 4, NULL, NULL, FALSE, NULL, NULL),
    (5, 13, 'UNDER_REVIEW', CURRENT_DATE + 2, CURRENT_DATE + 14, NULL, NULL, 12, 1, 0, NULL, 'Диагностика рулевого комплекса', 'Нужно назначить док и окно работ', NULL, NULL, NULL, NULL, FALSE, NULL, NULL),
    (7, 11, 'SUBMITTED', CURRENT_DATE + 4, CURRENT_DATE + 17, NULL, NULL, 13, 2, 0, NULL, 'Осмотр дноуглубительного оборудования', 'Новая заявка в очереди диспетчера', NULL, NULL, NULL, NULL, FALSE, NULL, NULL),
    (6, 13, 'REJECTED', CURRENT_DATE - 1, CURRENT_DATE + 6, NULL, NULL, 6, 1, 0, NULL, 'Срочная заявка без пакета документов', NULL, NULL, NULL, 'Не хватает обязательных документов', 'Приложите акт дефектации и фотофиксацию', FALSE, NULL, NULL),
    (5, 13, 'DRAFT', CURRENT_DATE + 10, CURRENT_DATE + 20, NULL, NULL, 10, 1, 0, NULL, 'Черновик заявки на доковый осмотр', 'Заполнена частично, не отправлена', NULL, NULL, NULL, NULL, FALSE, NULL, NULL);

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
    (1, 1, 'COMPLETED', CURRENT_DATE - 38, CURRENT_DATE - 24, 100, 980000.00, 'Работы завершены и приняты', 3),
    (2, 1, 'IN_PROGRESS', CURRENT_DATE - 10, NULL, 0, 760000.00, 'Основной производственный этап', 3),
    (3, 3, 'QA', CURRENT_DATE - 7, NULL, 0, 690000.00, 'Завершение и контроль качества', 4),
    (4, 3, 'SCHEDULED', NULL, NULL, 0, 1120000.00, 'Подготовка к старту ремонта', 4);

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
    (1, 1, 'SAFETY', 'Первичный осмотр', 'Осмотр и подтверждение фронта работ', 'COMPLETED', 2, 2, TRUE, FALSE, NULL, 7, 'APPROVED'),
    (1, 1, 'MECHANICAL', 'Ревизия палубных механизмов', 'Проверка и обслуживание узлов', 'COMPLETED', 5, 5, TRUE, FALSE, NULL, 8, 'APPROVED'),
    (1, 1, 'PAINTING', 'Антикоррозийная обработка', 'Подготовка и нанесение покрытия', 'COMPLETED', 6, 6, TRUE, FALSE, NULL, 7, 'APPROVED'),
    (1, 1, 'SAFETY', 'Итоговая приемка', 'Контрольный чек перед закрытием', 'COMPLETED', 2, 2, TRUE, FALSE, NULL, 8, 'APPROVED'),

    (2, 2, 'SAFETY', 'Входной контроль', 'Осмотр перед стартом корпусных работ', 'COMPLETED', 3, 3, TRUE, FALSE, NULL, 7, 'APPROVED'),
    (2, 2, 'MECHANICAL', 'Дефектовка', 'Уточнение объема работ', 'COMPLETED', 6, 6, TRUE, FALSE, NULL, 8, 'APPROVED'),
    (2, 2, 'STEEL', 'Замена листов корпуса', 'Сварка и монтаж новых секций', 'IN_PROGRESS', 20, 10, TRUE, FALSE, 'Работы по правому борту', 7, 'NOT_SUBMITTED'),
    (2, 2, 'PAINTING', 'Подготовка под окраску', 'Очистка и грунтовка поверхностей', 'PENDING', 8, 0, FALSE, FALSE, NULL, NULL, 'NOT_SUBMITTED'),
    (2, 2, 'PIPING', 'Ревизия магистралей', 'Проверка герметичности и креплений', 'COMPLETED', 4, 4, TRUE, FALSE, NULL, 8, 'PENDING_REVIEW'),

    (3, 3, 'SAFETY', 'Контроль безопасного доступа', 'Проверка условий работы бригады', 'COMPLETED', 2, 2, TRUE, FALSE, NULL, 9, 'APPROVED'),
    (3, 3, 'ELECTRICAL', 'Диагностика питания', 'Проверка щитов и кабельных линий', 'COMPLETED', 5, 5, TRUE, FALSE, NULL, 9, 'PENDING_REVIEW'),
    (3, 3, 'PROPULSION', 'Балансировка валопровода', 'Выверка и устранение вибраций', 'COMPLETED', 7, 7, TRUE, FALSE, NULL, 10, 'APPROVED'),
    (3, 3, 'OTHER', 'Контрольная проверка качества', 'Финальная валидация перед завершением', 'IN_PROGRESS', 3, 1, TRUE, FALSE, 'Ожидается закрытие замечаний', 9, 'NOT_SUBMITTED'),

    (4, 4, 'SAFETY', 'Первичная приемка доком', 'Осмотр судна после постановки', 'PENDING', 3, 0, TRUE, FALSE, NULL, NULL, 'NOT_SUBMITTED'),
    (4, 4, 'MECHANICAL', 'Подготовка подъемных механизмов', 'Подготовка оборудования дока', 'PENDING', 5, 0, TRUE, FALSE, NULL, NULL, 'NOT_SUBMITTED'),
    (4, 4, 'VALVES', 'Ревизия арматуры', 'Плановая проверка клапанов и задвижек', 'PENDING', 4, 0, FALSE, FALSE, NULL, NULL, 'NOT_SUBMITTED');

INSERT INTO issues (repair_id, issue_type, description, impact, status, reported_by, reported_at, resolved_at)
VALUES
    (2, 'DEFECT', 'Обнаружена трещина на силовом наборе правого борта', 'HIGH', 'OPEN', 'master1@shipyard.com', CURRENT_TIMESTAMP - INTERVAL '11 hours', NULL),
    (2, 'DELAY', 'Сдвиг поставки металлопроката на 1 сутки', 'MEDIUM', 'OPEN', 'operator1@shipyard.com', CURRENT_TIMESTAMP - INTERVAL '6 hours', NULL),
    (3, 'QUALITY', 'Замечание по изоляции в кабельном канале', 'LOW', 'RESOLVED', 'master2@shipyard.com', CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '2 days 3 hours'),
    (1, 'DOCUMENTATION', 'Уточнение исполнительной схемы', 'LOW', 'RESOLVED', 'operator1@shipyard.com', CURRENT_TIMESTAMP - INTERVAL '30 days', CURRENT_TIMESTAMP - INTERVAL '29 days 8 hours');

INSERT INTO downtimes (dock_name, reason, start_date, end_date, expected_end_date, notes)
VALUES
    ('Док-4', 'Профилактика насосной станции', CURRENT_TIMESTAMP - INTERVAL '1 day', NULL, CURRENT_TIMESTAMP + INTERVAL '2 days', 'Техническая пауза по регламенту обслуживания'),
    ('Док-2', 'Кратковременное отключение питания', CURRENT_TIMESTAMP - INTERVAL '7 hours', CURRENT_TIMESTAMP - INTERVAL '5 hours', CURRENT_TIMESTAMP - INTERVAL '6 hours', 'Работы завершены, док возвращен в доступное состояние');

INSERT INTO notifications (type, title, message, is_read, user_id)
VALUES
    ('INFO', 'Новая заявка в очереди', 'Заявка #6 ожидает первичного рассмотрения диспетчером.', FALSE, 2),
    ('WARNING', 'Открыт дефект по ремонту', 'В ремонте #2 зафиксирован новый дефект корпуса.', FALSE, 3),
    ('WARNING', 'Задача на проверке', 'По ремонту #3 есть задача, ожидающая подтверждения мастером.', FALSE, 6),
    ('SUCCESS', 'Ремонт принят клиентом', 'Клиент подтвердил приемку ремонта по заявке #1.', TRUE, 11);

INSERT INTO audit_logs (action, entity_type, entity_id, actor_email, actor_user_id, details, created_at)
VALUES
    ('STATUS_CHANGE', 'REPAIR_REQUEST', 4, 'dispatcher@shipyard.com', 2, 'SUBMITTED->APPROVED, dock=Док-3, operator=operator2@shipyard.com', CURRENT_TIMESTAMP - INTERVAL '12 hours'),
    ('STATUS_CHANGE', 'WORK_ITEM', 12, 'worker3@shipyard.com', 9, 'COMPLETED,PENDING_REVIEW', CURRENT_TIMESTAMP - INTERVAL '4 hours'),
    ('CREATE', 'ISSUE', 1, 'master1@shipyard.com', 5, 'DEFECT repair#2', CURRENT_TIMESTAMP - INTERVAL '11 hours'),
    ('REPORT_EXPORT', 'REPORT', NULL, 'operator1@shipyard.com', 3, 'type=REPAIRS,scope=DOCK,period=MONTH', CURRENT_TIMESTAMP - INTERVAL '2 hours');

-- Queue timestamps for SLA visualization in dispatcher screens.
UPDATE repair_requests
SET created_at = CURRENT_TIMESTAMP - INTERVAL '4 days',
    updated_at = CURRENT_TIMESTAMP - INTERVAL '2 hours'
WHERE id = 6;

UPDATE repair_requests
SET created_at = CURRENT_TIMESTAMP - INTERVAL '20 hours',
    updated_at = CURRENT_TIMESTAMP - INTERVAL '1 hour'
WHERE id = 5;

UPDATE repair_requests
SET created_at = CURRENT_TIMESTAMP - INTERVAL '6 days',
    updated_at = CURRENT_TIMESTAMP - INTERVAL '5 days'
WHERE id = 7;

-- Keep repair progress consistent with work items.
UPDATE repairs r
SET progress_percentage = CASE
    WHEN r.status = 'COMPLETED' THEN 100
    WHEN r.status = 'CANCELLED' THEN 0
    ELSE COALESCE((
        SELECT ROUND(
            100.0 * SUM(CASE WHEN wi.status = 'COMPLETED' THEN 1 ELSE 0 END)::numeric
            / NULLIF(COUNT(*), 0)
        )::int
        FROM work_items wi
        WHERE wi.repair_id = r.id
    ), 0)
END;
