import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Ship, Calendar, Wrench } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import { mockExtendedRepairs } from '../mock-data/data';
import { useAuth } from '../context/AuthContext';
import { getShip } from '../services/ships';
import type { Ship as ShipType } from '../types/repair';

export default function ShipDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ship, setShip] = useState<ShipType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const shipId = parseInt(id || '0', 10);

  useEffect(() => {
    const loadShip = async () => {
      setIsLoading(true);
      try {
        const data = await getShip(shipId);
        setShip(data);
      } catch {
        setShip(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (Number.isNaN(shipId) || shipId <= 0) {
      setShip(null);
      setIsLoading(false);
      return;
    }

    void loadShip();
  }, [shipId]);

  if (isLoading) {
    return <div className="text-center py-12 text-gray-600">Загрузка...</div>;
  }

  if (!ship) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Судно не найдено</h2>
        <Button onClick={() => navigate('/ships')} className="mt-4">
          Вернуться к списку
        </Button>
      </div>
    );
  }

  const repairs = mockExtendedRepairs.filter(r => r.shipId === shipId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/ships')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{ship.name}</h1>
        <StatusBadge status={ship.status} size="md" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Ship className="h-5 w-5" />
              Основная информация
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">IMO номер</div>
                <div className="font-medium">{ship.imo}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Тип судна</div>
                <div className="font-medium">{ship.type}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Год записи</div>
                <div className="font-medium">{ship.buildYear}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Владелец</div>
                <div className="font-medium">{ship.owner}</div>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              История ремонтов
            </h2>
            {repairs.length > 0 ? (
              <div className="space-y-4">
                {repairs.map(repair => (
                  <div
                    key={repair.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/repairs/${repair.id}`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{repair.repairType}</span>
                      <StatusBadge status={repair.status} size="sm" />
                    </div>
                    <div className="text-sm text-gray-600">
                      {repair.dock} • {repair.startDate} - {repair.endDate}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${repair.progress}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{repair.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-4">Нет ремонтов</div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="font-semibold mb-4">Служебные даты</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Wrench className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Последнее обновление</div>
                  <div className="font-medium">{ship.nextRepairDate}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Дата создания</div>
                  <div className="font-medium">{ship.lastRepairDate}</div>
                </div>
              </div>
            </div>
          </Card>

          {user?.role === 'admin' && (
            <Card>
              <h2 className="font-semibold mb-4">Действия</h2>
              <div className="space-y-2">
                <Button variant="secondary" className="w-full" disabled>
                  Редактировать (скоро)
                </Button>
                <Button variant="danger" className="w-full" disabled>
                  Удалить (скоро)
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
