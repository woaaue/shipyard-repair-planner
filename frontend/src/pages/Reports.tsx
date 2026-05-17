import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileText } from 'lucide-react';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { getRepairs } from '../services/repairs';
import { getSubordinates } from '../services/users';
import type { ExtendedRepair } from '../types/repair';
import {
  downloadBlob,
  exportReport,
  getReportSummary,
  type ReportPeriod,
  type ReportScope,
  type ReportType,
  type ReportSummaryResponse,
} from '../services/reports';
import V7PageHeader from '../components/v7/V7PageHeader';
import V7Panel from '../components/v7/V7Panel';
import V7PanelTitle from '../components/v7/V7PanelTitle';

type Period = ReportPeriod;

function getDefaultScopeByRole(role: 'client' | 'worker' | 'master' | 'operator' | 'dispatcher' | 'admin' | undefined): ReportScope {
  switch (role) {
    case 'operator':
      return 'dock';
    case 'dispatcher':
      return 'subordinates';
    case 'admin':
      return 'system';
    case 'master':
      return 'team';
    default:
      return 'self';
  }
}
 
export default function Reports() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [reportType, setReportType] = useState<ReportType>('repairs');
  const [period, setPeriod] = useState<Period>('month');
  const [scope, setScope] = useState<ReportScope>(getDefaultScopeByRole(user?.role));
  const [scopeUserId, setScopeUserId] = useState<number | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [repairs, setRepairs] = useState<ExtendedRepair[]>([]);
  const [subordinates, setSubordinates] = useState<Array<{ id: number; fullName: string; role: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [summary, setSummary] = useState<ReportSummaryResponse>({
    total: 0,
    inProgress: 0,
    completed: 0,
    planned: 0,
  });

  useEffect(() => {
    const loadRepairs = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const baseRepairs =
          user?.role === 'operator' && typeof user.id === 'number'
            ? await getRepairs({ operatorId: user.id })
            : await getRepairs();

        if (user?.role === 'dispatcher' && typeof user.id === 'number') {
          const subordinateUsers = await getSubordinates(user.id);
          setSubordinates(subordinateUsers);
          const operatorIds = new Set(subordinateUsers.filter((member) => member.role === 'operator').map((member) => member.id));
          setRepairs(baseRepairs.filter((repair) => typeof repair.operatorId === 'number' && operatorIds.has(repair.operatorId)));
        } else if ((user?.role === 'operator' || user?.role === 'master') && typeof user.id === 'number') {
          const subordinateUsers = await getSubordinates(user.id);
          setSubordinates(subordinateUsers);
        } else {
          setSubordinates([]);
          setRepairs(baseRepairs);
        }
      } catch {
        setError('Не удалось загрузить данные для отчетов.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadRepairs();
  }, [user?.id, user?.role]);

  const filteredRepairs = useMemo(() => {
    let current = [...repairs];

    if (user?.role === 'client' && user.shipId) {
      current = current.filter((repair) => repair.shipId === user.shipId);
    }

    return current;
  }, [repairs, user]);

  const fallbackStats = useMemo(() => {
    const inProgressByStatus = filteredRepairs.filter((repair) => repair.status === 'в работе').length;
    const completedByStatus = filteredRepairs.filter((repair) => repair.status === 'завершён').length;
    const plannedByStatus = filteredRepairs.filter((repair) => repair.status === 'запланирован').length;

    return {
      totalRepairs: filteredRepairs.length,
      inProgress: inProgressByStatus,
      completed: completedByStatus,
      planned: plannedByStatus,
    };
  }, [filteredRepairs]);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const summaryData = await getReportSummary({
          type: reportType,
          period,
          scope,
          scopeUserId: scopeUserId ?? undefined,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
        });
        setSummary(summaryData);
      } catch {
        setSummary({
          total: fallbackStats.totalRepairs,
          inProgress: fallbackStats.inProgress,
          completed: fallbackStats.completed,
          planned: fallbackStats.planned,
        });
      }
    };
    void loadSummary();
  }, [reportType, period, scope, scopeUserId, fromDate, toDate, fallbackStats]);

  const generateReport = async () => {
    setNotice(null);
    setError(null);
    setIsExporting(true);
    try {
      const { blob, fileName } = await exportReport({
        type: reportType,
        period,
        scope,
        scopeUserId: scopeUserId ?? undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        format: 'xlsx',
      });
      downloadBlob(blob, fileName);
      setNotice('Экспорт отчета выполнен.');
    } catch (exportError: unknown) {
      const apiMessage =
        typeof exportError === 'object' && exportError !== null && 'response' in exportError
          ? (exportError as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(apiMessage ?? 'Не удалось сформировать отчет. Проверьте параметры и повторите попытку.');
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    if (searchParams.get('export') !== 'true') return;
    void generateReport();
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('export');
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const reportTypes = [
    { id: 'repairs', name: 'Отчет по ремонтам', description: 'Текущие и завершенные ремонты' },
    { id: 'ships', name: 'Отчет по судам', description: 'Состояние флота и активность судов' },
    { id: 'docks', name: 'Отчет по докам', description: 'Загрузка и использование доков' },
  ];
  const scopeOptionsByRole: Record<NonNullable<typeof user>['role'], Array<{ value: ReportScope; label: string }>> = {
    client: [{ value: 'self', label: 'Только мои данные' }],
    worker: [{ value: 'self', label: 'Только мои данные' }],
    master: [
      { value: 'self', label: 'Только мои данные' },
      { value: 'team', label: 'Моя бригада' },
    ],
    operator: [
      { value: 'self', label: 'Только мои данные' },
      { value: 'dock', label: 'Мой док' },
      { value: 'team', label: 'Мои мастера и рабочие' },
    ],
    dispatcher: [
      { value: 'self', label: 'Только мои данные' },
      { value: 'subordinates', label: 'Все мои операторы' },
      { value: 'dock', label: 'По докам в зоне ответственности' },
    ],
    admin: [
      { value: 'self', label: 'Только мои данные' },
      { value: 'system', label: 'Вся система' },
    ],
  };
  const scopeOptions: Array<{ value: ReportScope; label: string }> = user
    ? scopeOptionsByRole[user.role]
    : [{ value: 'self', label: 'Только мои данные' }];
  const canPickSubordinate = (scope === 'team' || scope === 'subordinates') && subordinates.length > 0;

  useEffect(() => {
    if (user?.role) {
      setScope(getDefaultScopeByRole(user.role));
    }
  }, [user?.role]);

  useEffect(() => {
    if (!scopeOptions.some((option) => option.value === scope)) {
      setScope(scopeOptions[0]?.value ?? 'self');
    }
    if (scope !== 'team' && scope !== 'subordinates') {
      setScopeUserId(null);
    }
  }, [scope, scopeOptions]);

  return (
    <div className="space-y-6">
      <V7PageHeader title="Отчеты" description="Формирование отчетов по ремонтам, флоту и докам." />

      {error && <V7Panel><div className="text-[var(--danger-ink)]">{error}</div></V7Panel>}
      {notice && <V7Panel><div className="text-[var(--ink)]">{notice}</div></V7Panel>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <V7Panel>
            <V7PanelTitle title="Тип отчета" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {reportTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setReportType(type.id as ReportType)}
                  className={`p-4 border rounded-lg text-left transition-all ${
                    reportType === type.id
                      ? 'border-[var(--line-strong)] bg-[var(--soft)]'
                      : 'border-[var(--line)] hover:border-[var(--line-strong)]'
                  }`}
                >
                  <div className="font-medium">{type.name}</div>
                  <div className="text-sm text-[var(--muted)]">{type.description}</div>
                </button>
              ))}
            </div>
          </V7Panel>

          <V7Panel>
            <V7PanelTitle title="Параметры отчета" />
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--muted)] mb-1">Период</label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as Period)}
                  className="px-4 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
                >
                  <option value="week">Неделя</option>
                  <option value="month">Месяц</option>
                  <option value="quarter">Квартал</option>
                  <option value="year">Год</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--muted)] mb-1">Зона ответственности</label>
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value as ReportScope)}
                  className="px-4 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
                >
                  {scopeOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              {canPickSubordinate && (
                <div>
                  <label className="block text-sm font-medium text-[var(--muted)] mb-1">Подчиненный</label>
                  <select
                    value={scopeUserId ?? ''}
                    onChange={(e) => setScopeUserId(e.target.value ? Number(e.target.value) : null)}
                    className="px-4 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
                  >
                    <option value="">Все подчиненные</option>
                    {subordinates.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.fullName} ({member.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-[var(--muted)] mb-1">С даты (опционально)</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="px-4 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--muted)] mb-1">По дату (опционально)</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="px-4 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
                />
              </div>
            </div>
          </V7Panel>

          <div className="flex gap-4">
            <Button onClick={() => void generateReport()} disabled={isLoading || isExporting}>
              <FileText className="h-4 w-4 mr-2" />
              {isExporting ? 'Формирование...' : 'Сформировать отчет'}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <V7Panel>
            <V7PanelTitle title="Текущая статистика" />
            {isLoading ? (
              <div className="text-[var(--muted)]">Загрузка...</div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Всего ремонтов</span>
                  <span className="font-medium">{summary.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">В работе</span>
                  <span className="font-medium">{summary.inProgress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Завершено</span>
                  <span className="font-medium">{summary.completed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Запланировано</span>
                  <span className="font-medium">{summary.planned}</span>
                </div>
              </div>
            )}
          </V7Panel>
        </div>
      </div>
    </div>
  );
}

