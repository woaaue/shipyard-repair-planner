import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { mockExtendedRepairs } from '../../mock-data/data';
import { Wrench } from 'lucide-react';
import { useMediaQuery } from '../../hooks/useMediaQuery'; // Если нет хука - создадим

export default function CurrentRepairsChart() {
  // Хук для определения мобильных устройств
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Подсчитываем текущие ремонты по докам
  const currentRepairsData = () => {
    const dockStats: Record<string, { current: number, capacity: number }> = {
      'Док №1 (200м)': { current: 0, capacity: 200 },
      'Док №2 (180м)': { current: 0, capacity: 180 },
      'Док №3 (150м)': { current: 0, capacity: 150 },
      'Док №4 (120м)': { current: 0, capacity: 120 },
      'Плавучий док': { current: 0, capacity: 100 }
    };

    mockExtendedRepairs.forEach(repair => {
      if (dockStats[repair.dock] && repair.status === 'в работе') {
        dockStats[repair.dock].current++;
      }
    });

    return Object.entries(dockStats).map(([dock, stats]) => ({
      dock,
      текущиеРемонты: stats.current,
      вместимость: stats.capacity,
      загрузка: Math.round((stats.current / 3) * 100),
      maxCapacity: 3
    }));
  };

  const data = currentRepairsData();

  // Цвет в зависимости от загрузки
  const getLoadColor = (load: number) => {
    if (load >= 80) return '#ef4444';
    if (load >= 60) return '#f59e0b';
    if (load >= 40) return '#3b82f6';
    return '#10b981';
  };

  // Кастомный tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const currentItem = data.find(d => d.dock === label);
      const loadColor = getLoadColor(currentItem?.загрузка || 0);

      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Wrench className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="font-bold text-gray-800">{label}</p>
              <p className="text-xs text-gray-600">Вместимость: {currentItem?.вместимость}м</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Текущие ремонты:</span>
              <span className="font-bold text-lg text-blue-600">{currentItem?.текущиеРемонты}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Загрузка:</span>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded" style={{ backgroundColor: loadColor }}></div>
                <span className="font-bold">{currentItem?.загрузка}%</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Максимум:</span>
              <span className="font-medium">3 ремонта</span>
            </div>

            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                {currentItem?.текущиеРемонты === 0 ? 'Док свободен' :
                  (currentItem?.загрузка ?? 0) >= 80 ? 'Высокая загрузка' :
                    (currentItem?.загрузка ?? 0) >= 40 ? 'Средняя загрузка' : 'Низкая загрузка'}
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Вертикальная конфигурация (для мобилок)
  if (isMobile) {
    return (
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
          >
            <CartesianGrid horizontal={false} strokeDasharray="2 4" stroke="#e5e7eb" />
            <XAxis type="number" domain={[0, 3]} ticks={[0, 1, 2, 3]} />
            <YAxis 
              type="category" 
              dataKey="dock" 
              tick={{ fontSize: 12 }}
              width={90}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="текущиеРемонты"
              radius={[0, 4, 4, 0]}
              name="Текущие ремонты"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getLoadColor(entry.загрузка)} />
              ))}
              <LabelList
                dataKey="текущиеРемонты"
                position="right"
                formatter={(value) => (typeof value === 'number' && value > 0) ? value : ''}
                style={{ fill: '#374151', fontSize: '12px', fontWeight: 'bold' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Горизонтальная конфигурация (для десктопа - как было)
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid
            horizontal={true}
            vertical={false}
            strokeDasharray="2 4"
            stroke="#e5e7eb"
          />
          <XAxis
            dataKey="dock"
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            label={{
              value: 'Количество ремонтов',
              angle: -90,
              position: 'insideLeft',
              offset: 10,
              style: { textAnchor: 'middle' }
            }}
            domain={[0, 3]}
            ticks={[0, 1, 2, 3]}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />

          <Bar
            dataKey="текущиеРемонты"
            radius={[4, 4, 0, 0]}
            name="Текущие ремонты"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getLoadColor(entry.загрузка)} />
            ))}
            <LabelList
              dataKey="текущиеРемонты"
              position="top"
              formatter={(value) => (typeof value === 'number' && value > 0) ? value : ''}
              style={{ fill: '#374151', fontSize: '12px', fontWeight: 'bold' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}