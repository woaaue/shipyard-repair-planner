import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { mockExtendedRepairs, dockNames } from '../../mock-data/data';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useDockSelection } from '../../hooks/useDockSelection';
import DockTooltip from './DockTooltip';

interface DockStat {
  dockOriginal: string;
  загрузка: number;
  current: number;
  capacity: number;
  status: string;
  dockOrder: string;
}

export default function LoadPercentageChart() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { selectedDock, selectDock, clearSelection } = useDockSelection();
  
  const loadPercentageData = (): DockStat[] => {
    const dockStats: Record<string, { load: number, capacity: number, current: number }> = {};
    
    dockNames.forEach(dockName => {
      const capacityMatch = dockName.match(/\((\d+)м\)/);
      const capacity = capacityMatch ? parseInt(capacityMatch[1]) : 100;
      
      dockStats[dockName] = { 
        load: 0, 
        capacity: capacity,
        current: 0 
      };
    });

    mockExtendedRepairs.forEach(repair => {
      if (dockStats[repair.dock] && repair.status === 'в работе') {
        dockStats[repair.dock].current++;
      }
    });

    Object.keys(dockStats).forEach(dock => {
      const maxRepairs = 3;
      dockStats[dock].load = Math.round((dockStats[dock].current / maxRepairs) * 100);
    });

    return Object.entries(dockStats).map(([dock, stats]) => ({
      dockOriginal: dock,
      загрузка: stats.load,
      current: stats.current,
      capacity: stats.capacity,
      status: stats.load >= 80 ? 'high' : stats.load >= 40 ? 'medium' : 'low',
      dockOrder: ''
    }));
  };

  let data = loadPercentageData();
  
  data = data.sort((a, b) => b.загрузка - a.загрузка);
  
  data = data.map((item, index) => ({
    ...item,
    dockOrder: `Док ${index + 1}`
  }));

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      default: return '#10b981';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <div className="h-4 w-4">⚠️</div>;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const currentItem = data.find(d => d.dockOrder === label);
      
      const statusColor = getStatusColor(currentItem?.status || 'low');
      
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200" style={{ maxWidth: '280px' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-gray-800">{currentItem?.dockOriginal || label}</p>
            <div className="flex items-center gap-2" style={{ color: statusColor }}>
              {getStatusIcon(currentItem?.status || 'low')}
              <span className="font-bold">{currentItem?.загрузка}%</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Ремонтов сейчас:</span>
              <span className="font-medium">{currentItem?.current} из 3</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Вместимость:</span>
              <span className="font-medium">{currentItem?.capacity}м</span>
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-600">
                {currentItem?.status === 'high' ? 'Высокая загрузка - планируйте ремонты в других доках' :
                 currentItem?.status === 'medium' ? 'Средняя загрузка - доступны дополнительные мощности' :
                 'Низкая загрузка - док готов к новым ремонтам'}
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (isMobile) {
    return (
      <div className="space-y-4">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
            >
              <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                type="number" 
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                type="category" 
                dataKey="dockOrder"
                tick={{ fontSize: 12 }}
                width={60}
              />
              
              <ReferenceLine 
                x={70} 
                stroke="#f59e0b" 
                strokeDasharray="3 3" 
                label={{ 
                  value: '70%',
                  position: 'insideTopRight',
                  fill: '#f59e0b',
                  fontSize: 10
                }} 
              />
              
            <Tooltip content={() => null} />
              
              <Bar 
                dataKey="загрузка" 
                radius={[0, 4, 4, 0]}
                name="Загрузка"
                shape={(props: any) => {
                  const { x, y, width, height, index } = props;
                  
                  return (
                    <g>
                      <rect
                        x={x}
                        y={y}
                        width={width}
                        height={Math.max(height, 20)}
                        fill={getStatusColor(data[index].status)}
                        rx={4}
                        ry={4}
                        className="cursor-pointer"
                      />
                      
                      <rect
                        x={0}
                        y={y - 10}
                        width="100%"
                        height={Math.max(height, 20) + 20}
                        fill="transparent"
                        className="cursor-pointer"
                        onClick={() => {
                          selectDock(data[index]);
                        }}
                      />
                    </g>
                  );
                }}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getStatusColor(entry.status)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {selectedDock && (
          <DockTooltip 
            data={selectedDock} 
            onClose={clearSelection} 
          />
        )}
      </div>
    );
  }

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
            strokeDasharray="3 3" 
            stroke="#f0f0f0"
          />
          <XAxis 
            dataKey="dockOrder"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            label={{ 
              value: 'Загрузка (%)', 
              angle: -90, 
              position: 'insideLeft',
              offset: 10,
              style: { textAnchor: 'middle' }
            }}
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tick={{ fontSize: 12 }}
          />
          
          <ReferenceLine 
            y={70} 
            stroke="#f59e0b" 
            strokeDasharray="3 3" 
            label={{ 
              value: 'Оптимум 70%', 
              position: 'insideTopRight',
              fill: '#f59e0b',
              fontSize: 12 
            }} 
          />
          
          <Tooltip 
            content={<CustomTooltip />}
            wrapperStyle={{ zIndex: 1000 }}
          />
          
          <Bar 
            dataKey="загрузка" 
            radius={[4, 4, 0, 0]}
            name="Загрузка"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getStatusColor(entry.status)}
                className="cursor-pointer hover:opacity-90"
                onClick={() => selectDock(entry)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
