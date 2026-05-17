export function normalizeDateOnly(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length >= 10 ? trimmed.slice(0, 10) : trimmed;
}

export function formatDateRu(value?: string | null): string {
  const normalized = normalizeDateOnly(value);
  if (!normalized) return 'Не назначено';
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return normalized;
  return parsed.toLocaleDateString('ru-RU');
}

export function formatDateRangeRu(start?: string | null, end?: string | null): string {
  const startDate = normalizeDateOnly(start);
  const endDate = normalizeDateOnly(end);

  if (!startDate && !endDate) return 'Не назначено';
  if (startDate && endDate) return `${formatDateRu(startDate)} → ${formatDateRu(endDate)}`;
  if (startDate) return `${formatDateRu(startDate)} → Не назначено`;
  return `Не назначено → ${formatDateRu(endDate)}`;
}

