import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Ship, Calendar, Wrench } from 'lucide-react';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { getShip } from '../services/ships';
import { getRepairsByShip } from '../services/repairs';
import { getWorkItems } from '../services/workItems';
import type { Ship as ShipType } from '../types/repair';
import type { ExtendedRepair } from '../types/repair';
import V7PageHeader from '../components/v7/V7PageHeader';
import V7Panel from '../components/v7/V7Panel';
import V7PanelTitle from '../components/v7/V7PanelTitle';
import V7StateText from '../components/v7/V7StateText';
import { formatDateRangeRu } from '../utils/repairDates';

export default function ShipDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ship, setShip] = useState<ShipType | null>(null);
  const [repairs, setRepairs] = useState<ExtendedRepair[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const shipId = parseInt(id || '0', 10);

  useEffect(() => {
    const loadShip = async () => {
      setIsLoading(true);
      try {
        const [shipData, repairsData, workItems] = await Promise.all([
          getShip(shipId),
          getRepairsByShip(shipId),
          getWorkItems(),
        ]);
        const mappedRepairs = repairsData.map((repair) => {
          const repairTasks = workItems.filter((item) => item.repairId === repair.id);
          const completedTasks = repairTasks.filter((task) => task.reviewStatus === 'APPROVED').length;
          let progressFromTasks =
            repairTasks.length > 0 ? Math.round((completedTasks / repairTasks.length) * 100) : repair.progress;

          if (repair.status === 'завершён') {
            progressFromTasks = 100;
          }

          if (repair.status === 'отменён') {
            progressFromTasks = 0;
          }
          return {
            ...repair,
            progress: progressFromTasks,
          };
        });
        setShip(shipData);
        setRepairs(mappedRepairs);
      } catch {
        setShip(null);
        setRepairs([]);
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
    return <div className="text-center py-12 text-[var(--muted)]">Загрузка...</div>;
  }

  if (!ship) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-[var(--ink)]">Судно не найдено</h2>
        <Button onClick={() => navigate('/ships')} className="mt-4">
          Вернуться к списку
        </Button>
      </div>
    );
  }

  if (user?.role === 'client' && typeof user.id === 'number' && ship.ownerId !== user.id) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-[var(--ink)]">Доступ ограничен</h2>
        <p className="text-[var(--muted)] mt-2">Это судно не относится к вашему аккаунту.</p>
        <Button onClick={() => navigate('/ships')} className="mt-4">
          Вернуться к списку
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <V7PageHeader
        title={ship.name}
        description={`Карточка судна · IMO ${ship.imo}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => navigate('/ships')} icon={ArrowLeft}>
              К списку
            </Button>
            <V7StateText value={String(ship.status).toUpperCase()} />
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <V7Panel>
            <V7PanelTitle title="Основная информация" extra={<Ship className="h-4 w-4 text-[var(--muted)]" />} />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-[var(--muted)]">IMO номер</div>
                <div className="font-medium">{ship.imo}</div>
              </div>
              <div>
                <div className="text-sm text-[var(--muted)]">Тип судна</div>
                <div className="font-medium">{ship.type}</div>
              </div>
              <div>
                <div className="text-sm text-[var(--muted)]">Год записи</div>
                <div className="font-medium">{ship.buildYear}</div>
              </div>
              <div>
                <div className="text-sm text-[var(--muted)]">Владелец</div>
                <div className="font-medium">{ship.owner}</div>
              </div>
            </div>
          </V7Panel>

          <V7Panel>
            <V7PanelTitle title="История ремонтов" extra={<Calendar className="h-4 w-4 text-[var(--muted)]" />} />
            {repairs.length > 0 ? (
              <div className="space-y-4">
                {repairs.map((repair) => (
                  <div
                    key={repair.id}
                    className="p-4 border border-[var(--line)] rounded-lg hover:bg-[var(--soft)] cursor-pointer"
                    onClick={() => navigate(`/repairs/${repair.id}`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{repair.repairType}</span>
                      <V7StateText value={String(repair.status).toUpperCase()} />
                    </div>
                    <div className="text-sm text-[var(--muted)]">
                      {repair.dock} • {formatDateRangeRu(repair.startDate, repair.endDate)}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 bg-[var(--line)] rounded-full h-2">
                        <div
                          className="bg-[var(--blue)] h-2 rounded-full"
                          style={{ width: `${repair.progress}%` }}
                        />
                      </div>
                      <span className="text-sm text-[var(--muted)]">{repair.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[var(--muted)] text-center py-4">Нет ремонтов</div>
            )}
          </V7Panel>
        </div>

        <div className="space-y-6">
          <V7Panel>
            <V7PanelTitle title="Служебные даты" />
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--soft)] border border-[var(--line)] rounded-lg">
                  <Wrench className="h-4 w-4 text-[var(--ink)]" />
                </div>
                <div>
                  <div className="text-sm text-[var(--muted)]">Последний ремонт</div>
                  <div className="font-medium">{ship.lastRepairDate}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--soft)] border border-[var(--line)] rounded-lg">
                  <Calendar className="h-4 w-4 text-[var(--ink)]" />
                </div>
                <div>
                  <div className="text-sm text-[var(--muted)]">Следующий ремонт</div>
                  <div className="font-medium">{ship.nextRepairDate}</div>
                </div>
              </div>
            </div>
          </V7Panel>

          {user?.role === 'admin' && (
            <V7Panel>
              <V7PanelTitle title="Действия" />
              <div className="space-y-2 text-sm text-[var(--muted)]">
                <p>Редактирование карточки судна выполняется в отдельном модуле управления флотом.</p>
                <p>Удаление судна отключено для сохранения целостности истории ремонтов.</p>
              </div>
            </V7Panel>
          )}
        </div>
      </div>
    </div>
  );
}
