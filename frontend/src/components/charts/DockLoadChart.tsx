import { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getRepairs } from '../../services/repairs';
import { getDocks } from '../../services/docks';
import type { ExtendedRepair } from '../../types/repair';
import type { Dock } from '../../services/docks';

interface DockLoadItem {
  dock: string;
  active: number;
  total: number;
}

export default function DockLoadChart() {
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

  const data = useMemo<DockLoadItem[]>(() => {
    return docks.map((dock) => {
      const dockRepairs = repairs.filter((repair) => repair.dock === dock.name);
      const active = dockRepairs.filter((repair) => repair.progress > 0 && repair.progress < 100).length;
      return {
        dock: dock.name,
        active,
        total: dockRepairs.length,
      };
    });
  }, [docks, repairs]);

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="dock" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={60} />
          <YAxis allowDecimals={false} />
          <Tooltip formatter={(value: number, name) => [`${value}`, name === 'active' ? 'Active' : 'Total']} />
          <Bar dataKey="active" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="total" fill="#94a3b8" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
