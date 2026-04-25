import { useEffect, useMemo, useState } from 'react';
import { FileText, Download } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { getRepairs } from '../services/repairs';
import type { ExtendedRepair } from '../types/repair';

type ReportType = 'repairs' | 'ships' | 'budget' | 'docks';
type Period = 'week' | 'month' | 'quarter' | 'year';

export default function Reports() {
  const { user } = useAuth();
  const [reportType, setReportType] = useState<ReportType>('repairs');
  const [period, setPeriod] = useState<Period>('month');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [repairs, setRepairs] = useState<ExtendedRepair[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRepairs = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getRepairs();
        setRepairs(data);
      } catch {
        setError('Failed to load report data.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadRepairs();
  }, []);

  const filteredRepairs = useMemo(() => {
    let current = [...repairs];

    if (user?.role === 'operator' && user.dock) {
      current = current.filter((repair) => repair.dock === user.dock);
    }

    if (user?.role === 'client' && user.shipId) {
      current = current.filter((repair) => repair.shipId === user.shipId);
    }

    return current;
  }, [repairs, user]);

  const stats = useMemo(() => {
    const totalBudget = filteredRepairs.reduce((sum, repair) => sum + (repair.budget ?? 0), 0);
    const totalSpent = filteredRepairs.reduce((sum, repair) => sum + (repair.spent ?? 0), 0);

    return {
      totalRepairs: filteredRepairs.length,
      inProgress: filteredRepairs.filter((repair) => repair.progress > 0 && repair.progress < 100).length,
      completed: filteredRepairs.filter((repair) => repair.progress >= 100).length,
      planned: filteredRepairs.filter((repair) => repair.progress <= 0).length,
      totalBudget,
      totalSpent,
    };
  }, [filteredRepairs]);

  const generateReport = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      window.alert(`Report generated for ${reportType} (${period}).`);
    }, 1000);
  };

  const reportTypes = [
    { id: 'repairs', name: 'Repair report', description: 'Current and completed repairs' },
    { id: 'ships', name: 'Ships report', description: 'Fleet and vessel activity' },
    { id: 'budget', name: 'Budget report', description: 'Costs and spending overview' },
    { id: 'docks', name: 'Docks report', description: 'Dock utilization and workload' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
      </div>

      {error && <Card><div className="text-red-600">{error}</div></Card>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h2 className="font-semibold mb-4">Report type</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {reportTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setReportType(type.id as ReportType)}
                  className={`p-4 border rounded-lg text-left transition-all ${
                    reportType === type.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">{type.name}</div>
                  <div className="text-sm text-gray-500">{type.description}</div>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="font-semibold mb-4">Report parameters</h2>
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as Period)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                  <option value="quarter">Quarter</option>
                  <option value="year">Year</option>
                </select>
              </div>
            </div>
          </Card>

          <div className="flex gap-4">
            <Button onClick={generateReport} disabled={isGenerating || isLoading}>
              <FileText className="h-4 w-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Generate report'}
            </Button>
            <Button variant="secondary" disabled={isLoading}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="font-semibold mb-4">Current stats</h3>
            {isLoading ? (
              <div className="text-gray-500">Loading...</div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total repairs</span>
                  <span className="font-medium">{stats.totalRepairs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">In progress</span>
                  <span className="font-medium text-blue-600">{stats.inProgress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completed</span>
                  <span className="font-medium text-green-600">{stats.completed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Planned</span>
                  <span className="font-medium text-purple-600">{stats.planned}</span>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total budget</span>
                    <span className="font-medium">{stats.totalBudget.toLocaleString()} ?</span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-gray-600">Total spent</span>
                    <span className="font-medium">{stats.totalSpent.toLocaleString()} ?</span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
