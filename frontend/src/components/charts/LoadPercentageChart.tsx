import { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { getRepairs } from '../../services/repairs';
import { getDocks } from '../../services/docks';
import type { ExtendedRepair } from '../../types/repair';
import type { Dock } from '../../services/docks';

interface LoadItem {
  dock: string;
  loadPercent: number;
}

export default function LoadPercentageChart() {
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

  const data = useMemo<LoadItem[]>(() => {
    const calculated = docks.map((dock) => {
      const active = repairs.filter(
        (repair) => repair.dock === dock.name && repair.progress > 0 && repair.progress < 100
      ).length;
      const loadPercent = Math.min(100, Math.round((active / 3) * 100));
      return { dock: dock.name, loadPercent };
    });

    return calculated.sort((a, b) => b.loadPercent - a.loadPercent);
  }, [docks, repairs]);

  const getColor = (loadPercent: number) => {
    if (loadPercent >= 80) return '#ef4444';
    if (loadPercent >= 60) return '#f59e0b';
    return '#10b981';
  };

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="dock" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={60} />
          <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
          <ReferenceLine y={70} stroke="#f59e0b" strokeDasharray="4 4" />
          <Tooltip formatter={(value: number) => [`${value}%`, 'Load']} />
          <Bar dataKey="loadPercent" radius={[4, 4, 0, 0]}>
            {data.map((item, index) => (
              <Cell key={`cell-${index}`} fill={getColor(item.loadPercent)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
