import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { mockExtendedRepairs } from '../../mock-data/data';

export default function RepairProgressChart() {
  
  // Данные по статусам ремонтов
  const statusData = () => {
    const statusCounts: Record<string, number> = {};
    
    mockExtendedRepairs.forEach(repair => {
      statusCounts[repair.status] = (statusCounts[repair.status] || 0) + 1;
    });
    
    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      color: getStatusColor(status)
    }));
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'в работе': return '#3b82f6'; // blue
      case 'запланирован': return '#8b5cf6'; // purple
      case 'завершён': return '#10b981'; // green
      case 'отменён': return '#94a3b8'; // gray
      default: return '#f59e0b'; // orange
    }
  };

  const data = statusData();
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => [`${value} ремонтов`, 'Количество']}
            labelFormatter={(label) => `Статус: ${label}`}
            contentStyle={{ 
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend 
            formatter={(value, _entry) => {
              const item = data.find(d => d.name === value);
              const percentage = item ? ((item.value / total) * 100).toFixed(0) : '0';
              return `${value} (${percentage}%)`;
            }}
            wrapperStyle={{ paddingTop: '20px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}