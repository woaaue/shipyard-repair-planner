-- Expand demo dataset with additional realistic records for role flows and reports.
-- Depends on clean base from V16.

-- Additional ships
INSERT INTO ships (reg_number, name, ship_type, max_length, max_width, max_draft, user_id, ship_status, dock_id)
SELECT 'IMO-9402001', 'Норд', 'BULK_CARRIER', 205, 32, 10, u.id, 'WAITING', NULL
FROM users u
WHERE u.email = 'client1@shipyard.com';

INSERT INTO ships (reg_number, name, ship_type, max_length, max_width, max_draft, user_id, ship_status, dock_id)
SELECT 'IMO-9402002', 'Атлас', 'CONTAINER_SHIP', 245, 37, 11, u.id, 'WAITING', NULL
FROM users u
WHERE u.email = 'client2@shipyard.com';

INSERT INTO ships (reg_number, name, ship_type, max_length, max_width, max_draft, user_id, ship_status, dock_id)
SELECT 'IMO-9402003', 'Буран', 'TANKER', 230, 35, 11, u.id, 'UNDER_REPAIR', d.id
FROM users u
JOIN docks d ON d.name = 'Док-2'
WHERE u.email = 'client2@shipyard.com';

-- Additional repair requests across statuses and owners
INSERT INTO repair_requests (
    ship_id, client_id, status,
    requested_start_date, requested_end_date,
    scheduled_start_date, scheduled_end_date,
    estimated_duration_days, contingency_days, actual_duration_days,
    total_cost, description, notes,
    assigned_dock_id, assigned_operator_id,
    rejection_reason, rejection_note,
    client_accepted, client_accepted_at, client_acceptance_note
)
SELECT s.id, u.id, 'SUBMITTED',
       DATE '2026-05-21', DATE '2026-06-03',
       NULL, NULL,
       11, 2, 0,
       NULL, 'Диагностика гидравлики и проверка систем', 'Новая заявка от владельца',
       NULL, NULL,
       NULL, NULL,
       FALSE, NULL, NULL
FROM ships s
JOIN users u ON u.id = s.user_id
WHERE s.reg_number = 'IMO-9402001';

INSERT INTO repair_requests (
    ship_id, client_id, status,
    requested_start_date, requested_end_date,
    scheduled_start_date, scheduled_end_date,
    estimated_duration_days, contingency_days, actual_duration_days,
    total_cost, description, notes,
    assigned_dock_id, assigned_operator_id,
    rejection_reason, rejection_note,
    client_accepted, client_accepted_at, client_acceptance_note
)
SELECT s.id, u.id, 'UNDER_REVIEW',
       DATE '2026-05-19', DATE '2026-05-31',
       NULL, NULL,
       10, 1, 0,
       NULL, 'Осмотр рулевого комплекса и корпуса', 'Ожидает назначения дока',
       NULL, NULL,
       NULL, NULL,
       FALSE, NULL, NULL
FROM ships s
JOIN users u ON u.id = s.user_id
WHERE s.reg_number = 'IMO-9402002';

INSERT INTO repair_requests (
    ship_id, client_id, status,
    requested_start_date, requested_end_date,
    scheduled_start_date, scheduled_end_date,
    estimated_duration_days, contingency_days, actual_duration_days,
    total_cost, description, notes,
    assigned_dock_id, assigned_operator_id,
    rejection_reason, rejection_note,
    client_accepted, client_accepted_at, client_acceptance_note
)
SELECT s.id, u.id, 'APPROVED',
       DATE '2026-05-10', DATE '2026-05-26',
       DATE '2026-05-11', DATE '2026-05-28',
       15, 2, 0,
       1450000.00, 'Подготовка к доковому ремонту', 'Назначено диспетчером',
       d.id, op.id,
       NULL, NULL,
       FALSE, NULL, NULL
FROM ships s
JOIN users u ON u.id = s.user_id
JOIN docks d ON d.name = 'Док-1'
JOIN users op ON op.email = 'operator1@shipyard.com'
WHERE s.reg_number = 'IMO-9402001';

INSERT INTO repair_requests (
    ship_id, client_id, status,
    requested_start_date, requested_end_date,
    scheduled_start_date, scheduled_end_date,
    estimated_duration_days, contingency_days, actual_duration_days,
    total_cost, description, notes,
    assigned_dock_id, assigned_operator_id,
    rejection_reason, rejection_note,
    client_accepted, client_accepted_at, client_acceptance_note
)
SELECT s.id, u.id, 'IN_PROGRESS',
       DATE '2026-05-04', DATE '2026-05-18',
       DATE '2026-05-05', DATE '2026-05-21',
       14, 2, 7,
       1680000.00, 'Ремонт топливной магистрали и ревизия насоса', 'Работы идут по графику',
       d.id, op.id,
       NULL, NULL,
       FALSE, NULL, NULL
FROM ships s
JOIN users u ON u.id = s.user_id
JOIN docks d ON d.name = 'Док-2'
JOIN users op ON op.email = 'operator2@shipyard.com'
WHERE s.reg_number = 'IMO-9402003';

-- Repairs for new APPROVED / IN_PROGRESS requests
INSERT INTO repairs (
    repair_request_id, dock_id, status,
    actual_start_date, actual_end_date, progress_percentage,
    total_cost, notes, operator_id
)
SELECT rr.id, rr.assigned_dock_id, 'SCHEDULED',
       NULL, NULL, 0,
       rr.total_cost, 'Подготовлен к старту работ', rr.assigned_operator_id
FROM repair_requests rr
JOIN ships s ON s.id = rr.ship_id
WHERE s.reg_number = 'IMO-9402001'
  AND rr.status = 'APPROVED'
ORDER BY rr.id DESC
LIMIT 1;

INSERT INTO repairs (
    repair_request_id, dock_id, status,
    actual_start_date, actual_end_date, progress_percentage,
    total_cost, notes, operator_id
)
SELECT rr.id, rr.assigned_dock_id, 'IN_PROGRESS',
       DATE '2026-05-05', NULL, 42,
       rr.total_cost, 'Работы на среднем этапе', rr.assigned_operator_id
FROM repair_requests rr
JOIN ships s ON s.id = rr.ship_id
WHERE s.reg_number = 'IMO-9402003'
  AND rr.status = 'IN_PROGRESS'
ORDER BY rr.id DESC
LIMIT 1;

-- Work items for new repairs
INSERT INTO work_items (
    repair_request_id, repair_id, category, name, description,
    status, estimated_hours, actual_hours,
    is_mandatory, is_discovered, notes, assignee_id, review_status
)
SELECT r.repair_request_id, r.id, 'SAFETY', 'Первичная приемка доком', 'Проверка состояния при постановке',
       'PENDING', 3, 0,
       TRUE, FALSE, 'Создано для нового согласованного ремонта', NULL, 'NOT_SUBMITTED'
FROM repairs r
JOIN repair_requests rr ON rr.id = r.repair_request_id
JOIN ships s ON s.id = rr.ship_id
WHERE s.reg_number = 'IMO-9402001'
  AND rr.status = 'APPROVED'
ORDER BY r.id DESC
LIMIT 1;

INSERT INTO work_items (
    repair_request_id, repair_id, category, name, description,
    status, estimated_hours, actual_hours,
    is_mandatory, is_discovered, notes, assignee_id, review_status
)
SELECT r.repair_request_id, r.id, 'MECHANICAL', 'Замена насосного узла', 'Работы по замене изношенных элементов',
       'IN_PROGRESS', 12, 5,
       TRUE, FALSE, NULL, w.id, 'NOT_SUBMITTED'
FROM repairs r
JOIN repair_requests rr ON rr.id = r.repair_request_id
JOIN ships s ON s.id = rr.ship_id
JOIN users w ON w.email = 'worker3@shipyard.com'
WHERE s.reg_number = 'IMO-9402003'
  AND rr.status = 'IN_PROGRESS'
ORDER BY r.id DESC
LIMIT 1;

INSERT INTO work_items (
    repair_request_id, repair_id, category, name, description,
    status, estimated_hours, actual_hours,
    is_mandatory, is_discovered, notes, assignee_id, review_status
)
SELECT r.repair_request_id, r.id, 'PIPING', 'Ревизия магистралей', 'Контроль соединений и герметичности',
       'COMPLETED', 8, 8,
       TRUE, FALSE, NULL, w.id, 'PENDING_REVIEW'
FROM repairs r
JOIN repair_requests rr ON rr.id = r.repair_request_id
JOIN ships s ON s.id = rr.ship_id
JOIN users w ON w.email = 'worker3@shipyard.com'
WHERE s.reg_number = 'IMO-9402003'
  AND rr.status = 'IN_PROGRESS'
ORDER BY r.id DESC
LIMIT 1;

-- Supporting timeline entries
INSERT INTO notifications (type, title, message, is_read, user_id)
SELECT 'INFO', 'Новая согласованная заявка', 'Заявка переведена в APPROVED и ожидает старт работ.', FALSE, u.id
FROM users u
WHERE u.email = 'operator1@shipyard.com';

INSERT INTO audit_logs (action, entity_type, entity_id, actor_email, actor_user_id, details, created_at)
SELECT 'STATUS_CHANGE', 'REPAIR_REQUEST', rr.id, 'dispatcher@shipyard.com', d.id, 'UNDER_REVIEW->APPROVED', TIMESTAMP '2026-05-10 16:20:00'
FROM repair_requests rr
JOIN ships s ON s.id = rr.ship_id
JOIN users d ON d.email = 'dispatcher@shipyard.com'
WHERE s.reg_number = 'IMO-9402001'
  AND rr.status = 'APPROVED'
ORDER BY rr.id DESC
LIMIT 1;

