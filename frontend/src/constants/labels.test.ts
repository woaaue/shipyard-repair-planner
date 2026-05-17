import { describe, expect, it } from 'vitest';
import {
  REPAIR_REQUEST_STATUS_LABELS,
  UI_STATUS_BADGE_CONFIG,
  UI_STATUS_COMPACT_LABELS,
  WORK_CATEGORY_LABELS,
  WORK_REVIEW_STATUS_LABELS,
  WORK_STATUS_LABELS,
} from './labels';

describe('labels dictionaries', () => {
  it('contains all expected work status labels', () => {
    expect(WORK_STATUS_LABELS.PENDING).toBe('Ожидает начала');
    expect(WORK_STATUS_LABELS.IN_PROGRESS).toBe('В работе');
    expect(WORK_STATUS_LABELS.COMPLETED).toBe('Выполнено');
    expect(WORK_STATUS_LABELS.CANCELLED).toBe('Отменено');
  });

  it('contains all expected work review labels', () => {
    expect(WORK_REVIEW_STATUS_LABELS.NOT_SUBMITTED).toBe('Не отправлена на проверку');
    expect(WORK_REVIEW_STATUS_LABELS.NOT_REVIEWED).toBe('Не проверялась');
    expect(WORK_REVIEW_STATUS_LABELS.PENDING_REVIEW).toBe('Ожидает проверки');
    expect(WORK_REVIEW_STATUS_LABELS.APPROVED).toBe('Принято');
    expect(WORK_REVIEW_STATUS_LABELS.REJECTED).toBe('Возвращено');
  });

  it('contains all expected repair request status labels', () => {
    expect(REPAIR_REQUEST_STATUS_LABELS.SUBMITTED).toBe('Подана');
    expect(REPAIR_REQUEST_STATUS_LABELS.UNDER_REVIEW).toBe('На рассмотрении');
    expect(REPAIR_REQUEST_STATUS_LABELS.CLIENT_ACCEPTED).toBe('Принята клиентом');
    expect(REPAIR_REQUEST_STATUS_LABELS.CANCELLED).toBe('Отменена');
  });

  it('contains category labels for core categories', () => {
    expect(WORK_CATEGORY_LABELS.HULL).toBe('Корпус');
    expect(WORK_CATEGORY_LABELS.MECHANICAL).toBe('Механика');
    expect(WORK_CATEGORY_LABELS.ELECTRICAL).toBe('Электрика');
    expect(WORK_CATEGORY_LABELS.OTHER).toBe('Другое');
  });

  it('contains compact and badge configs for commonly used UI statuses', () => {
    expect(UI_STATUS_COMPACT_LABELS['в работе']).toBe('В работе');
    expect(UI_STATUS_COMPACT_LABELS['запланирован']).toBe('План');

    expect(UI_STATUS_BADGE_CONFIG['в работе'].bgColor).toBe('bg-blue-50');
    expect(UI_STATUS_BADGE_CONFIG['завершён'].textColor).toBe('text-gray-800');
  });
});
