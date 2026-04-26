import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Anchor,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Activity,
  CloudOff,
  Download,
  FileText,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import DowntimeForm from '../components/forms/DowntimeForm';
import { getRepairs, updateRepairStatus } from '../services/repairs';
import type { ExtendedRepair } from '../types/repair';
import type { BackendRepairStatus } from '../services/repairs';

const STATUS_LABELS: Record<BackendRepairStatus, string> = {
  SCHEDULED: 'Scheduled',
  STARTED: 'Started',
  IN_PROGRESS: 'In progress',
  QA: 'QA',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

function toBackendStatus(repair: ExtendedRepair): BackendRepairStatus {
  if (repair.progress >= 100) return 'COMPLETED';
  if (repair.progress > 0) return 'IN_PROGRESS';
  return 'SCHEDULED';
}

export default function OperatorDock() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedRepairId, setSelectedRepairId] = useState<number | null>(null);
  const [actualDate, setActualDate] = useState('');
  const [comment, setComment] = useState('');
  const [showDowntimeForm, setShowDowntimeForm] = useState(false);
  const [repairs, setRepairs] = useState<ExtendedRepair[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userDock = user?.dock ?? 'Dock';

  const loadRepairs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getRepairs();
      setRepairs(data);
    } catch {
      setError('Failed to load dock repairs.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRepairs();
  }, []);

  const dockRepairs = useMemo(() => repairs.filter((repair) => repair.dock === userDock), [repairs, userDock]);
  const activeRepairs = useMemo(
    () => dockRepairs.filter((repair) => repair.progress > 0 && repair.progress < 100),
    [dockRepairs]
  );
  const plannedRepairs = useMemo(
    () => dockRepairs.filter((repair) => repair.progress <= 0),
    [dockRepairs]
  );
  const completedRepairs = useMemo(
    () => dockRepairs.filter((repair) => repair.progress >= 100),
    [dockRepairs]
  );

  const loadPercentage = Math.min(100, Math.round((activeRepairs.length / 3) * 100));
  const isOverloaded = loadPercentage > 80;

  const handleConfirmPlacement = async (repairId: number) => {
    try {
      await updateRepairStatus(repairId, 'IN_PROGRESS');
      await loadRepairs();
      window.alert(`Repair #${repairId} started.`);
    } catch {
      window.alert('Failed to update repair status.');
    } finally {
      setSelectedRepairId(null);
      setActualDate('');
      setComment('');
    }
  };

  const handleUpdateStatus = async (repairId: number, newStatus: BackendRepairStatus) => {
    try {
      await updateRepairStatus(repairId, newStatus);
      await loadRepairs();
    } catch {
      window.alert('Failed to update repair status.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Anchor className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My dock</h1>
            <p className="text-gray-500">{userDock}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate('/reports')}>
            <FileText className="h-4 w-4 mr-2" />
            Report
          </Button>
          <Button variant="secondary" onClick={() => window.alert('Exported')}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="secondary" onClick={() => setShowDowntimeForm(true)}>
            <CloudOff className="h-4 w-4 mr-2" />
            Downtime
          </Button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <Activity className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold text-gray-900">{activeRepairs.length}</div>
            <div className="text-sm text-gray-500">In progress</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <Calendar className="h-6 w-6 mx-auto mb-2 text-orange-600" />
            <div className="text-2xl font-bold text-gray-900">{plannedRepairs.length}</div>
            <div className="text-sm text-gray-500">Planned</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold text-gray-900">{completedRepairs.length}</div>
            <div className="text-sm text-gray-500">Completed</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className={`text-2xl font-bold ${isOverloaded ? 'text-red-600' : 'text-green-600'}`}>{loadPercentage}%</div>
            <div className="text-sm text-gray-500">Load</div>
            {isOverloaded && (
              <div className="flex items-center justify-center gap-1 mt-1 text-xs text-red-600">
                <AlertTriangle className="h-3 w-3" />
                Overload
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            Current repairs ({activeRepairs.length})
          </h2>
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-gray-500 text-center py-4">Loading...</div>
            ) : activeRepairs.length === 0 ? (
              <div className="text-gray-500 text-center py-4">No active repairs</div>
            ) : (
              activeRepairs.map((repair) => (
                <div key={repair.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-medium">{repair.shipName}</div>
                      <div className="text-sm text-gray-500">
                        {repair.startDate} - {repair.endDate}
                      </div>
                    </div>
                    <select
                      value={toBackendStatus(repair)}
                      onChange={(e) => handleUpdateStatus(repair.id, e.target.value as BackendRepairStatus)}
                      className="text-sm border rounded px-2 py-1"
                    >
                      {Object.keys(STATUS_LABELS).map((status) => (
                        <option key={status} value={status}>
                          {STATUS_LABELS[status as BackendRepairStatus]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Progress: {repair.progress}%</span>
                    <span>Manager: {repair.manager}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-500" />
            Planned repairs ({plannedRepairs.length})
          </h2>
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-gray-500 text-center py-4">Loading...</div>
            ) : plannedRepairs.length === 0 ? (
              <div className="text-gray-500 text-center py-4">No planned repairs</div>
            ) : (
              plannedRepairs.map((repair) => (
                <div key={repair.id} className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-medium">{repair.shipName}</div>
                    <Button size="sm" onClick={() => setSelectedRepairId(repair.id)}>
                      Confirm placement
                    </Button>
                  </div>
                  <div className="text-sm text-gray-500">
                    {repair.startDate} - {repair.endDate}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {selectedRepairId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Confirm vessel placement</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Actual placement date</label>
                <input
                  type="date"
                  value={actualDate}
                  onChange={(e) => setActualDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comment (optional)</label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Details"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setSelectedRepairId(null);
                    setActualDate('');
                    setComment('');
                  }}
                >
                  Cancel
                </Button>
                <Button className="flex-1" onClick={() => handleConfirmPlacement(selectedRepairId)}>
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDowntimeForm && <DowntimeForm onClose={() => setShowDowntimeForm(false)} dockName={userDock} />}
    </div>
  );
}
