# Frontend UI → Backend API Matrix (v1)

Этот документ фиксирует, какие пользовательские действия уже опираются на backend API, а какие пока работают как локальный UX-сценарий без выделенного endpoint.

## 1) Полностью поддержанные действия (API есть)

### Аутентификация
- Вход: `POST /api/auth/login`
- Регистрация: `POST /api/auth/register`

### Ремонты
- Загрузка списка ремонтов: `GET /api/repairs`
- Фильтрация по оператору: `GET /api/repairs?operatorId=...`
- Просмотр ремонта: `GET /api/repairs/{id}`
- Обновление статуса ремонта: `PATCH /api/repairs/{id}/status` (через frontend service)
- Назначение оператора: `PATCH /api/repairs/{id}/operator`

### Заявки на ремонт
- Загрузка заявок: `GET /api/repair-requests`
- Создание заявки: `POST /api/repair-requests`
- Подтверждение приемки клиентом: `POST /api/repair-requests/{id}/accept`

### Работы (tasks/work items)
- Список работ: `GET /api/work-items`
- Фильтры: `GET /api/work-items?assigneeId=...`, `?repairId=...`, `?reviewStatus=...`
- Детали работы: `GET /api/work-items/{id}`
- Статус работы: `PATCH /api/work-items/{id}/status`
- Назначение исполнителя: `PATCH /api/work-items/{id}/assignee`
- Ревью мастером: `PATCH /api/work-items/{id}/review`

### Суда
- Список судов: `GET /api/ships`
- Детали судна: `GET /api/ships/{id}`
- Создание судна: `POST /api/ships`

### Пользователи и иерархия
- Список пользователей: `GET /api/users`
- Детали пользователя: `GET /api/users/{id}`
- Подчиненные: `GET /api/users/{id}/subordinates`
- Создание пользователя: `POST /api/users`
- Обновление пользователя/руководителя: `PATCH /api/users/{id}`
- Блокировка: `POST /api/users/{id}/block`
- Разблокировка: `POST /api/users/{id}/unblock`
- Сброс пароля: `POST /api/users/{id}/reset-password`

### Доки
- Список доков: `GET /api/docks`
- Создание дока: `POST /api/docks`
- Удаление дока: `DELETE /api/docks/{id}`

---

## 2) Частично поддержанные UX-сценарии

- **Формирование отчета**: в UI есть действие и индикация завершения, но нет отдельного backend endpoint генерации файла.
- **Экспорт отчетов**:
  - frontend-контракт уже внедрен: `GET /api/reports/export?type=&period=&format=`
  - реализован download flow через `frontend/src/services/reports.ts`
  - подключен в UI для экранов `Reports`, `Repairs`, `Ships`, `Operator Dock`
  - для `Repairs` и `Ships` экспорт передает текущие фильтры экрана (`search/status/dock/...`)
  - при отсутствии endpoint в окружении показывается честное уведомление.
- **Формирование отчета**: в UI сохраняется как настройка параметров (без имитации долгой серверной обработки).
- **Изменение приоритета ремонта**: модалка и UX есть, но сохранение пока локальное (без backend обновления поля приоритета).

---

## 3) Что добавить в backend в следующую очередь

1. `GET /api/reports/export?...` (или набор endpoint-ов по типам отчетов) для реальной выгрузки.
2. `PATCH /api/repairs/{id}` с полем приоритета (или отдельный `PATCH /priority`).
3. (Опционально) endpoint системной конфигурации типов ремонта, если планируется делать список в `Settings` редактируемым.

---

## 4) Принципы, которые уже применены во frontend

- Нет фейковых `window.alert`-подтверждений для бизнес-критичных действий.
- Для неподключенных backend-фич используются явные `notice`-сообщения.
- «Недоступные» кнопки заменяются на понятные текстовые объяснения, если endpoint отсутствует.
