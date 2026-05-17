import api from './api';

export type ReportType = 'repairs' | 'ships' | 'docks';
export type ReportPeriod = 'week' | 'month' | 'quarter' | 'year';
export type ReportFormat = 'xlsx' | 'csv';
export type ReportScope = 'self' | 'team' | 'dock' | 'subordinates' | 'system';

export interface ExportReportParams {
  type: ReportType;
  period: ReportPeriod;
  scope?: ReportScope;
  scopeUserId?: number;
  fromDate?: string;
  toDate?: string;
  format?: ReportFormat;
  filters?: Record<string, string | number | boolean | null | undefined>;
}

export interface ReportSummaryResponse {
  total: number;
  inProgress: number;
  completed: number;
  planned: number;
}

export async function exportReport(params: ExportReportParams): Promise<{ blob: Blob; fileName: string }> {
  const format = params.format ?? 'xlsx';
  const queryParams: Record<string, string | number | boolean> = {
    type: params.type.toUpperCase(),
    period: params.period.toUpperCase(),
    scope: (params.scope ?? 'self').toUpperCase(),
    format,
  };

  if (typeof params.scopeUserId === 'number') {
    queryParams.scopeUserId = params.scopeUserId;
  }
  if (params.fromDate) {
    queryParams.fromDate = params.fromDate;
  }
  if (params.toDate) {
    queryParams.toDate = params.toDate;
  }

  if (params.filters) {
    for (const [key, value] of Object.entries(params.filters)) {
      if (value !== null && value !== undefined && value !== '') {
        queryParams[key] = value;
      }
    }
  }

  const response = await api.get('/reports/export', {
    params: queryParams,
    responseType: 'blob',
  });

  const disposition = response.headers['content-disposition'] as string | undefined;
  const matchedFileName = disposition?.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i)?.[1];
  const fileName = matchedFileName ? decodeURIComponent(matchedFileName) : `report-${params.type}-${params.period}.${format}`;

  return { blob: response.data as Blob, fileName };
}

export async function getReportSummary(params: Omit<ExportReportParams, 'format' | 'filters'>): Promise<ReportSummaryResponse> {
  const queryParams: Record<string, string | number | boolean> = {
    type: params.type.toUpperCase(),
    period: params.period.toUpperCase(),
    scope: (params.scope ?? 'self').toUpperCase(),
  };

  if (typeof params.scopeUserId === 'number') {
    queryParams.scopeUserId = params.scopeUserId;
  }
  if (params.fromDate) {
    queryParams.fromDate = params.fromDate;
  }
  if (params.toDate) {
    queryParams.toDate = params.toDate;
  }

  const response = await api.get<ReportSummaryResponse>('/reports/summary', { params: queryParams });
  return response.data;
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
