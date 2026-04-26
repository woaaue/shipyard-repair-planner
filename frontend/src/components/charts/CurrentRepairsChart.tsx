import { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getRepairs } from '../../services/repairs';
import { getDocks } from '../../services/docks';
import type { ExtendedRepair } from '../../types/repair';
import type { Dock } from '../../services/docks';

interface ChartItem {
  dock: string;
  currentRepairs: number;
  loadPercent: number;
}

export default function CurrentRepairsChart() {
  const [repairs, setRepairs] = useState<ExtendedRepair[]>([]);
  const [docks, setDocks] = useState<Dock[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [repairsData, docksData] = await Promise.all([getRepairs(), getDocks()]);
        setRepairs(repairsData);
        setDocks(docksData);
      } catch {
        setRepairs([]);
        setDocks([]);
      }
    };

    void loadData();
  }, []);

  const data = useMemo<ChartItem[]>(() => {
    const activeByDock = new Map<string, number>();

    repairs.forEach((repair) => {
      const isActive = repair.progress > 0 && repair.progress < 100;
      if (!isActive) return;
      activeByDock.set(repair.dock, (activeByDock.get(repair.dock) ?? 0) + 1);
    });

    return docks.map((dock) => {
      const currentRepairs = activeByDock.get(dock.name) ?? 0;
      const loadPercent = Math.min(100, Math.round((currentRepairs / 3) * 100));
      return { dock: dock.name, currentRepairs, loadPercent };
    });
  }, [docks, repairs]);

  const getLoadColor = (loadPercent: number) => {
    if (loadPercent >= 80) return '#ef4444';
    if (loadPercent >= 60) return '#f59e0b';
    if (loadPercent >= 40) return '#3b82f6';
    return '#10b981';
  };

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="dock" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={60} />
          <YAxis allowDecimals={false} />
          <Tooltip formatter={(value: number) => [`${value}`, 'Active repairs']} />
          <Bar dataKey="currentRepairs" radius={[4, 4, 0, 0]}>
            {data.map((item, index) => (
              <Cell key={`cell-${index}`} fill={getLoadColor(item.loadPercent)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
