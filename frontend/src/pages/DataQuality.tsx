import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import V7PageHeader from '../components/v7/V7PageHeader';
import V7Panel from '../components/v7/V7Panel';
import V7PanelTitle from '../components/v7/V7PanelTitle';
import Button from '../components/ui/Button';
import { getDataQualityReport, type DataQualityResponse, type DataQualityUserIssue } from '../services/dataQuality';
import { getUsers, updateUser } from '../services/users';
import { getDocks, type Dock } from '../services/docks';
import type { User } from '../context/AuthContext';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Администратор',
  DISPATCHER: 'Диспетчер',
  OPERATOR: 'Оператор',
  MASTER: 'Мастер',
  WORKER: 'Рабочий',
  CLIENT: 'Клиент',
  admin: 'Администратор',
  dispatcher: 'Диспетчер',
  operator: 'Оператор',
  master: 'Мастер',
  worker: 'Рабочий',
  client: 'Клиент',
};

const BACKEND_TO_UI_ROLE: Record<string, User['role']> = {
  ADMIN: 'admin',
  DISPATCHER: 'dispatcher',
  OPERATOR: 'operator',
  MASTER: 'master',
  WORKER: 'worker',
  CLIENT: 'client',
};

export default function DataQuality() {
  const navigate = useNavigate();
  const [report, setReport] = useState<DataQualityResponse | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [docks, setDocks] = useState<Dock[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [supervisorSelection, setSupervisorSelection] = useState<Record<number, string>>({});
  const [dockSelection, setDockSelection] = useState<Record<number, string>>({});
  const [bulkSupervisorId, setBulkSupervisorId] = useState('');
  const [bulkDockId, setBulkDockId] = useState('');
  const [selectedWithoutSupervisorIds, setSelectedWithoutSupervisorIds] = useState<number[]>([]);
  const [selectedWithoutDockIds, setSelectedWithoutDockIds] = useState<number[]>([]);

  const usersById = useMemo(() => new Map<number, User>(users.map((u) => [u.id, u])), [users]);
  const dockIdByName = useMemo(() => {
    const map = new Map<string, number>();
    docks.forEach((dock) => map.set(dock.name, dock.id));
    return map;
  }, [docks]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [reportData, usersData, docksData] = await Promise.all([
        getDataQualityReport(),
        getUsers(),
        getDocks(),
      ]);
      setReport(reportData);
      setUsers(usersData);
      setDocks(docksData);
    } catch {
      setError('Не удалось загрузить отчет качества данных.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const supervisorCandidates = (issue: DataQualityUserIssue): User[] => {
    if (!issue.expectedSupervisorRole) return [];
    const expected = BACKEND_TO_UI_ROLE[issue.expectedSupervisorRole];
    if (!expected) return [];
    return users.filter((user) => user.role === expected);
  };

  const selectedWithoutSupervisorIssues = useMemo(() => {
    if (!report) return [];
    return report.withoutSupervisorUsers.filter((item) => selectedWithoutSupervisorIds.includes(item.userId));
  }, [report, selectedWithoutSupervisorIds]);

  const selectedExpectedSupervisorRoles = useMemo(() => {
    return Array.from(
      new Set(
        selectedWithoutSupervisorIssues
          .map((item) => item.expectedSupervisorRole)
          .filter((value): value is string => Boolean(value))
      )
    );
  }, [selectedWithoutSupervisorIssues]);

  const bulkSupervisorCandidates = useMemo(() => {
    if (selectedExpectedSupervisorRoles.length !== 1) return [];
    const expectedUiRole = BACKEND_TO_UI_ROLE[selectedExpectedSupervisorRoles[0]];
    if (!expectedUiRole) return [];
    return users.filter((user) => user.role === expectedUiRole);
  }, [selectedExpectedSupervisorRoles, users]);

  const selectedWithoutDockIssues = useMemo(() => {
    if (!report) return [];
    return report.withoutDockUsers.filter((item) => selectedWithoutDockIds.includes(item.userId));
  }, [report, selectedWithoutDockIds]);

  const assignSupervisors = async (issues: DataQualityUserIssue[]) => {
    const assignments = issues
      .map((issue) => ({ issue, supervisorId: supervisorSelection[issue.userId] }))
      .filter((item) => item.supervisorId);
    if (assignments.length === 0) {
      setError('Для выбранных пользователей не указаны руководители.');
      return;
    }

    setSavingKey('bulk-supervisor');
    setError(null);
    setNotice(null);
    let successCount = 0;
    let failCount = 0;
    try {
      for (const assignment of assignments) {
        try {
          const user = usersById.get(assignment.issue.userId);
          if (!user) {
            failCount += 1;
            continue;
          }
          const existingDockId = user.dock ? dockIdByName.get(user.dock) : undefined;
          await updateUser(assignment.issue.userId, {
            ...user,
            reportsToUserId: Number(assignment.supervisorId),
            dockId: existingDockId,
          });
          successCount += 1;
        } catch {
          failCount += 1;
        }
      }
      setNotice(`Руководители: успешно ${successCount}, ошибок ${failCount}`);
      setSelectedWithoutSupervisorIds([]);
      await loadData();
    } catch {
      setError('Не удалось выполнить массовое назначение руководителей.');
    } finally {
      setSavingKey(null);
    }
  };

  const assignSingleSupervisorForMany = async (issues: DataQualityUserIssue[], supervisorId: string) => {
    if (!supervisorId || issues.length === 0) return;
    setSavingKey('bulk-supervisor-single');
    setError(null);
    setNotice(null);
    let successCount = 0;
    let failCount = 0;
    try {
      for (const issue of issues) {
        try {
          const user = usersById.get(issue.userId);
          if (!user) {
            failCount += 1;
            continue;
          }
          const existingDockId = user.dock ? dockIdByName.get(user.dock) : undefined;
          await updateUser(issue.userId, {
            ...user,
            reportsToUserId: Number(supervisorId),
            dockId: existingDockId,
          });
          successCount += 1;
        } catch {
          failCount += 1;
        }
      }
      setNotice(`Единый руководитель: успешно ${successCount}, ошибок ${failCount}`);
      setSelectedWithoutSupervisorIds([]);
      setBulkSupervisorId('');
      await loadData();
    } catch {
      setError('Не удалось выполнить массовое назначение руководителя.');
    } finally {
      setSavingKey(null);
    }
  };

  const assignDocks = async (issues: DataQualityUserIssue[]) => {
    const assignments = issues
      .map((issue) => ({ issue, dockId: dockSelection[issue.userId] }))
      .filter((item) => item.dockId);
    if (assignments.length === 0) {
      setError('Для выбранных пользователей не указаны доки.');
      return;
    }

    setSavingKey('bulk-dock');
    setError(null);
    setNotice(null);
    let successCount = 0;
    let failCount = 0;
    try {
      for (const assignment of assignments) {
        try {
          const user = usersById.get(assignment.issue.userId);
          if (!user) {
            failCount += 1;
            continue;
          }
          await updateUser(assignment.issue.userId, {
            ...user,
            reportsToUserId: user.reportsToUserId,
            dockId: Number(assignment.dockId),
          });
          successCount += 1;
        } catch {
          failCount += 1;
        }
      }
      setNotice(`Доки: успешно ${successCount}, ошибок ${failCount}`);
      setSelectedWithoutDockIds([]);
      await loadData();
    } catch {
      setError('Не удалось выполнить массовое назначение доков.');
    } finally {
      setSavingKey(null);
    }
  };

  const assignSingleDockForMany = async (issues: DataQualityUserIssue[], dockId: string) => {
    if (!dockId || issues.length === 0) return;
    setSavingKey('bulk-dock-single');
    setError(null);
    setNotice(null);
    let successCount = 0;
    let failCount = 0;
    try {
      for (const issue of issues) {
        try {
          const user = usersById.get(issue.userId);
          if (!user) {
            failCount += 1;
            continue;
          }
          await updateUser(issue.userId, {
            ...user,
            reportsToUserId: user.reportsToUserId,
            dockId: Number(dockId),
          });
          successCount += 1;
        } catch {
          failCount += 1;
        }
      }
      setNotice(`Единый док: успешно ${successCount}, ошибок ${failCount}`);
      setSelectedWithoutDockIds([]);
      setBulkDockId('');
      await loadData();
    } catch {
      setError('Не удалось выполнить массовое назначение дока.');
    } finally {
      setSavingKey(null);
    }
  };

  const handleAssignSupervisor = async (issue: DataQualityUserIssue) => {
    const selected = supervisorSelection[issue.userId];
    if (!selected) return;
    const user = usersById.get(issue.userId);
    if (!user) return;

    setSupervisorSelection((prev) => ({ ...prev, [issue.userId]: selected }));
    await assignSupervisors([issue]);
  };

  const handleAssignDock = async (issue: DataQualityUserIssue) => {
    const selected = dockSelection[issue.userId];
    if (!selected) return;
    const user = usersById.get(issue.userId);
    if (!user) return;

    setDockSelection((prev) => ({ ...prev, [issue.userId]: selected }));
    await assignDocks([issue]);
  };

  const exportCsv = () => {
    if (!report) return;

    const rows: string[][] = [
      [
        'Категория',
        'User ID',
        'ФИО',
        'Email',
        'Роль',
        'Док',
        'Руководитель',
        'Ожидаемая роль руководителя',
        'Фактическая роль руководителя',
      ],
    ];

    const addIssues = (category: string, issues: DataQualityUserIssue[]) => {
      issues.forEach((issue) => {
        rows.push([
          category,
          String(issue.userId),
          issue.fullName,
          issue.email,
          ROLE_LABELS[issue.role] ?? issue.role,
          issue.dockName ?? '',
          issue.reportsToFullName ?? '',
          issue.expectedSupervisorRole ? ROLE_LABELS[issue.expectedSupervisorRole] ?? issue.expectedSupervisorRole : '',
          issue.actualSupervisorRole ? ROLE_LABELS[issue.actualSupervisorRole] ?? issue.actualSupervisorRole : '',
        ]);
      });
    };

    addIssues('Без руководителя', report.withoutSupervisorUsers);
    addIssues('Без дока', report.withoutDockUsers);
    addIssues('Нарушение орг-цепочки', report.invalidHierarchyUsers);
    report.duplicateEmailGroups.forEach((group) => {
      addIssues(`Дубликат email (${group.email})`, group.users);
    });

    const csv = `\uFEFF${rows.map((row) => row.map(escapeCsvValue).join(';')).join('\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `data-quality-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice('Отчет качества данных экспортирован в CSV.');
  };

  return (
    <div className="space-y-6">
      <V7PageHeader
        title="Качество данных"
        description="Проверка структуры пользователей и аномалий учетных данных."
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate('/users')}>
              Пользователи
            </Button>
            <Button variant="secondary" onClick={exportCsv} disabled={!report}>
              Экспорт CSV
            </Button>
            <Button onClick={() => void loadData()} disabled={isLoading}>
              Обновить
            </Button>
          </div>
        }
      />

      {error && (
        <div className="px-4 py-3 rounded-lg border bg-[var(--danger-bg)] border-[var(--danger-line)] text-[var(--danger-ink)]">
          {error}
        </div>
      )}
      {notice && (
        <div className="px-4 py-3 rounded-lg border bg-[var(--soft)] border-[var(--line)] text-[var(--ink)]">
          {notice}
        </div>
      )}

      {isLoading && (
        <div className="px-4 py-3 rounded-lg border bg-[var(--soft)] border-[var(--line)] text-[var(--muted)]">
          Загрузка...
        </div>
      )}

      {report && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <StatCard label="Без руководителя" value={report.withoutSupervisorCount} />
            <StatCard label="Без дока" value={report.withoutDockCount} />
            <StatCard label="Нарушения цепочки" value={report.invalidHierarchyCount} />
            <StatCard label="Дубли email" value={report.duplicateEmailGroupsCount} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <IssuePanel
              title="Пользователи без руководителя"
              issues={report.withoutSupervisorUsers}
              emptyText="Проблем не найдено."
              onOpenUser={(id) => navigate(`/users/${id}`)}
              selectedIds={selectedWithoutSupervisorIds}
              onToggleRow={(id) => {
                setSelectedWithoutSupervisorIds((prev) =>
                  prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
                );
              }}
              onToggleAll={(checked, issues) => {
                setSelectedWithoutSupervisorIds(checked ? issues.map((item) => item.userId) : []);
                if (!checked) {
                  setBulkSupervisorId('');
                }
              }}
              panelActions={
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={selectedWithoutSupervisorIds.length === 0 || savingKey === 'bulk-supervisor'}
                    onClick={() => void assignSupervisors(selectedWithoutSupervisorIssues)}
                  >
                    Назначить выбранным
                  </Button>
                  <select
                    value={bulkSupervisorId}
                    onChange={(event) => setBulkSupervisorId(event.target.value)}
                    className="px-2 py-1.5 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] text-xs"
                  >
                    <option value="">Единый руководитель</option>
                    {bulkSupervisorCandidates.map((candidate) => (
                      <option key={candidate.id} value={candidate.id}>
                        {candidate.fullName}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={
                      selectedWithoutSupervisorIds.length === 0 ||
                      selectedExpectedSupervisorRoles.length !== 1 ||
                      !bulkSupervisorId ||
                      savingKey === 'bulk-supervisor-single'
                    }
                    onClick={() => void assignSingleSupervisorForMany(selectedWithoutSupervisorIssues, bulkSupervisorId)}
                  >
                    Один на всех
                  </Button>
                </div>
              }
              renderActions={(issue) => {
                const candidates = supervisorCandidates(issue);
                return (
                  <div className="flex items-center gap-2">
                    <select
                      value={supervisorSelection[issue.userId] ?? ''}
                      onChange={(event) =>
                        setSupervisorSelection((prev) => ({ ...prev, [issue.userId]: event.target.value }))
                      }
                      className="px-2 py-1.5 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] text-xs"
                    >
                      <option value="">Выбрать руководителя</option>
                      {candidates.map((candidate) => (
                        <option key={candidate.id} value={candidate.id}>
                          {candidate.fullName}
                        </option>
                      ))}
                    </select>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={!supervisorSelection[issue.userId] || (savingKey?.startsWith('bulk-supervisor') ?? false)}
                    onClick={() => void handleAssignSupervisor(issue)}
                  >
                    Назначить
                  </Button>
                </div>
                );
              }}
            />

            <IssuePanel
              title="Пользователи без дока"
              issues={report.withoutDockUsers}
              emptyText="Проблем не найдено."
              onOpenUser={(id) => navigate(`/users/${id}`)}
              selectedIds={selectedWithoutDockIds}
              onToggleRow={(id) => {
                setSelectedWithoutDockIds((prev) =>
                  prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
                );
              }}
              onToggleAll={(checked, issues) => {
                setSelectedWithoutDockIds(checked ? issues.map((item) => item.userId) : []);
                if (!checked) {
                  setBulkDockId('');
                }
              }}
              panelActions={
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={selectedWithoutDockIds.length === 0 || savingKey === 'bulk-dock'}
                    onClick={() => void assignDocks(selectedWithoutDockIssues)}
                  >
                    Назначить выбранным
                  </Button>
                  <select
                    value={bulkDockId}
                    onChange={(event) => setBulkDockId(event.target.value)}
                    className="px-2 py-1.5 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] text-xs"
                  >
                    <option value="">Единый док</option>
                    {docks.map((dock) => (
                      <option key={dock.id} value={dock.id}>
                        {dock.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={
                      selectedWithoutDockIds.length === 0 ||
                      !bulkDockId ||
                      savingKey === 'bulk-dock-single'
                    }
                    onClick={() => void assignSingleDockForMany(selectedWithoutDockIssues, bulkDockId)}
                  >
                    Один на всех
                  </Button>
                </div>
              }
              renderActions={(issue) => (
                <div className="flex items-center gap-2">
                  <select
                    value={dockSelection[issue.userId] ?? ''}
                    onChange={(event) =>
                      setDockSelection((prev) => ({ ...prev, [issue.userId]: event.target.value }))
                    }
                    className="px-2 py-1.5 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] text-xs"
                  >
                    <option value="">Выбрать док</option>
                    {docks.map((dock) => (
                      <option key={dock.id} value={dock.id}>
                        {dock.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={!dockSelection[issue.userId] || (savingKey?.startsWith('bulk-dock') ?? false)}
                    onClick={() => void handleAssignDock(issue)}
                  >
                    Назначить
                  </Button>
                </div>
              )}
            />
          </div>

          <IssuePanel
            title="Нарушения орг-цепочки"
            issues={report.invalidHierarchyUsers}
            emptyText="Проблем не найдено."
            onOpenUser={(id) => navigate(`/users/${id}`)}
            showHierarchyHint
          />

          <V7Panel>
            <V7PanelTitle title="Дубли email" />
            {report.duplicateEmailGroups.length === 0 ? (
              <div className="text-sm text-[var(--muted)]">Проблем не найдено.</div>
            ) : (
              <div className="space-y-4">
                {report.duplicateEmailGroups.map((group) => (
                  <div key={group.email} className="rounded-lg border border-[var(--line)] bg-white p-3">
                    <div className="flex items-center justify-between mb-2 gap-3">
                      <div className="font-medium text-[var(--ink)]">{group.email}</div>
                      <div className="text-xs text-[var(--muted)]">совпадений: {group.usersCount}</div>
                    </div>
                    <div className="space-y-2">
                      {group.users.map((user) => (
                        <div key={`${group.email}-${user.userId}`} className="flex items-center justify-between rounded border border-[var(--line)] px-3 py-2">
                          <div>
                            <div className="text-sm font-medium text-[var(--ink)]">{user.fullName}</div>
                            <div className="text-xs text-[var(--muted)]">
                              {ROLE_LABELS[user.role] ?? user.role}
                              {user.dockName ? ` · ${user.dockName}` : ''}
                            </div>
                          </div>
                          <Button size="sm" variant="secondary" onClick={() => navigate(`/users/${user.userId}`)}>
                            Открыть
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </V7Panel>
        </>
      )}
    </div>
  );
}

function escapeCsvValue(value: string): string {
  if (value.includes(';') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function IssuePanel({
  title,
  issues,
  emptyText,
  onOpenUser,
  showHierarchyHint = false,
  renderActions,
  selectedIds,
  onToggleRow,
  onToggleAll,
  panelActions,
}: {
  title: string;
  issues: DataQualityUserIssue[];
  emptyText: string;
  onOpenUser: (id: number) => void;
  showHierarchyHint?: boolean;
  renderActions?: (issue: DataQualityUserIssue) => ReactNode;
  selectedIds?: number[];
  onToggleRow?: (id: number) => void;
  onToggleAll?: (checked: boolean, issues: DataQualityUserIssue[]) => void;
  panelActions?: ReactNode;
}) {
  const allSelected = selectedIds && issues.length > 0 && selectedIds.length === issues.length;
  return (
    <V7Panel>
      <V7PanelTitle
        title={title}
        extra={
          <div className="flex items-center gap-2">
            {onToggleAll ? (
              <label className="inline-flex items-center gap-1 text-xs text-[var(--muted)]">
                <input
                  type="checkbox"
                  checked={Boolean(allSelected)}
                  onChange={(event) => onToggleAll(event.target.checked, issues)}
                />
                Выбрать все
              </label>
            ) : null}
            {panelActions}
            <span className="text-xs text-[var(--muted)]">записей: {issues.length}</span>
          </div>
        }
      />
      {issues.length === 0 ? (
        <div className="text-sm text-[var(--muted)]">{emptyText}</div>
      ) : (
        <div className="space-y-2">
          {issues.map((issue) => (
            <div key={issue.userId} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded border border-[var(--line)] px-3 py-2">
              <div className="flex items-start gap-2">
                {onToggleRow ? (
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={Boolean(selectedIds?.includes(issue.userId))}
                    onChange={() => onToggleRow(issue.userId)}
                  />
                ) : null}
                <div>
                <div className="text-sm font-medium text-[var(--ink)]">{issue.fullName}</div>
                <div className="text-xs text-[var(--muted)]">
                  {ROLE_LABELS[issue.role] ?? issue.role}
                  {issue.dockName ? ` · ${issue.dockName}` : ''}
                  {issue.reportsToFullName ? ` · рук. ${issue.reportsToFullName}` : ''}
                </div>
                {showHierarchyHint && (
                  <div className="text-xs text-[var(--danger-ink)] mt-1">
                    Ожидалось: {issue.expectedSupervisorRole ?? '-'}; фактически: {issue.actualSupervisorRole ?? '-'}
                  </div>
                )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {renderActions ? renderActions(issue) : null}
                <Button size="sm" variant="secondary" onClick={() => onOpenUser(issue.userId)}>
                  Открыть
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </V7Panel>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[8px] border border-[var(--line)] bg-[rgba(255,255,255,0.97)] px-3 py-3">
      <span className="block text-xs text-[var(--muted)]">{label}</span>
      <strong className="mt-1 block text-xl leading-tight text-[var(--ink)]">{value}</strong>
    </div>
  );
}
