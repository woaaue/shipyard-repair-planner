import { useEffect, useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { getRepairs } from '../../services/repairs';
import type { ExtendedRepair } from '../../types/repair';

interface PieItem {
  [key: string]: string | number;
  name: string;
  value: number;
  color: string;
}

export default function RepairProgressChart() {
  const [repairs, setRepairs] = useState<ExtendedRepair[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const repairsData = await getRepairs();
        setRepairs(repairsData);
      } catch {
        setRepairs([]);
      }
    };

    void loadData();
  }, []);

  const data = useMemo<PieItem[]>(() => {
    const byStatus = new Map<string, number>();

    repairs.forEach((repair) => {
      byStatus.set(repair.status, (byStatus.get(repair.status) ?? 0) + 1);
    });

    return Array.from(byStatus.entries()).map(([name, value]) => ({
      name,
      value,
      color:
        name === 'в работе'
          ? '#3b82f6'
          : name === 'запланирован'
            ? '#8b5cf6'
            : name === 'завершён'
              ? '#10b981'
              : '#94a3b8',
    }));
  }, [repairs]);

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
            {data.map((item, index) => (
              <Cell key={`cell-${index}`} fill={item.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => [`${value}`, 'Repairs']} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
