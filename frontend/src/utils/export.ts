import { mockShips } from '../mock-data/data';
import type { ExtendedRepair } from '../types/repair';

export function exportToCSV(data: any[], filename: string): void {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(';'),
    ...data.map(row => 
      headers.map(h => {
        const val = row[h];
        if (typeof val === 'string' && val.includes(';')) {
          return `"${val}"`;
        }
        return val;
      }).join(';')
    )
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}

export function exportShipsToCSV(): void {
  const data = mockShips.map(s => ({
    name: s.name,
    imo: s.imo,
    type: s.type,
    status: s.status,
    buildYear: s.buildYear,
    owner: s.owner,
    lastRepairDate: s.lastRepairDate,
    nextRepairDate: s.nextRepairDate
  }));
  
  exportToCSV(data, 'ships');
}

export function exportRepairsToCSV(repairs: ExtendedRepair[]): void {
  const data = repairs.map(r => ({
    shipName: r.shipName,
    dock: r.dock,
    repairType: r.repairType,
    status: r.status,
    progress: r.progress,
    startDate: r.startDate,
    endDate: r.endDate,
    budget: r.budget,
    spent: r.spent,
    manager: r.manager,
    priority: r.priority
  }));
  
  exportToCSV(data, 'repairs');
}

export function exportToJSON(data: any, filename: string): void {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
  link.click();
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru-RU');
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('ru-RU');
}

export function calculateDaysLeft(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}