import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { mockExtendedRepairs } from '../../mock-data/data';

export default function DockLoadChart() {
  
  // Подсчитываем загрузку доков
  const dockLoadData = () => {
    const dockStats: Record<string, { current: number, total: number, load: number, capacity: number }> = {
      'Док №1 (200м)': { current: 0, total: 0, load: 0, capacity: 200 },
      'Док №2 (180м)': { current: 0, total: 0, load: 0, capacity: 180 },
      'Док №3 (150м)': { current: 0, total: 0, load: 0, capacity: 150 },
      'Док №4 (120м)': { current: 0, total: 0, load: 0, capacity: 120 },
      'Плавучий док': { current: 0, total: 0, load: 0, capacity: 100 }
    };

    mockExtendedRepairs.forEach(repair => {
      if (dockStats[repair.dock]) {
        dockStats[repair.dock].total++;
        if (repair.status === 'в работе') {
          dockStats[repair.dock].current++;
        }
      }
    });

    // Рассчитываем загрузку в процентах
    Object.keys(dockStats).forEach(dock => {
      dockStats[dock].load = Math.round((dockStats[dock].current / 3) * 100); // макс 3 ремонта
    });

    return Object.entries(dockStats).map(([dock, stats]) => ({
      dock,
      текущие: stats.current,
      всего: stats.total,
      загрузка: stats.load,
      capacity: stats.capacity
    }));
  };

  const data = dockLoadData();

  // Цвет загрузки
  const getLoadColor = (load: number) => {
    if (load >= 80) return '#ef4444'; // red
    if (load >= 60) return '#f59e0b'; // orange
    if (load >= 40) return '#3b82f6'; // blue
    return '#10b981'; // green
  };

  // Кастомный tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const currentItem = data.find(d => d.dock === label);
      const loadColor = getLoadColor(currentItem?.загрузка || 0);
      
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-bold text-gray-800 mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="inline-block w-3 h-3 bg-blue-500 rounded mr-2"></span>
              Текущие ремонты: <span className="font-semibold">{currentItem?.текущие}</span>
            </p>
            <p className="text-sm">
              <span className="inline-block w-3 h-3 bg-gray-400 rounded mr-2"></span>
              Всего ремонтов: <span className="font-semibold">{currentItem?.всего}</span>
            </p>
            <p className="text-sm">
              <span className="inline-block w-3 h-3 rounded mr-2" style={{ backgroundColor: loadColor }}></span>
              Загрузка: <span className="font-semibold">{currentItem?.загрузка}%</span>
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Вместимость: <span className="font-semibold">{currentItem?.capacity}m</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
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
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* Текущие ремонты - СИНИЙ */}
          <Bar 
            dataKey="текущие" 
            radius={[4, 4, 0, 0]}
            fill="#3b82f6" // blue
          />
          
          {/* Всего ремонтов - СЕРЫЙ */}
          <Bar 
            dataKey="всего" 
            radius={[4, 4, 0, 0]}
            fill="#94a3b8" // gray
          />
          
          {/* Загрузка доков - цветные столбцы */}
          <Bar 
            dataKey="загрузка" 
            radius={[4, 4, 0, 0]}
            fill="#8b5cf6" // фиолетовый по умолчанию
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getLoadColor(entry.загрузка)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}