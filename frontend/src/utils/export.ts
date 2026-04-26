import { getShips } from '../services/ships';
import type { ExtendedRepair } from '../types/repair';

export function exportToCSV(data: any[], filename: string): void {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(';'),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          if (typeof value === 'string' && value.includes(';')) {
            return `"${value}"`;
          }
          return value;
        })
        .join(';')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}

export async function exportShipsToCSV(): Promise<void> {
  const ships = await getShips();
  const data = ships.map((ship) => ({
    name: ship.name,
    imo: ship.imo,
    type: ship.type,
    status: ship.status,
    buildYear: ship.buildYear,
    owner: ship.owner,
    lastRepairDate: ship.lastRepairDate,
    nextRepairDate: ship.nextRepairDate,
  }));

  exportToCSV(data, 'ships');
}

export function exportRepairsToCSV(repairs: ExtendedRepair[]): void {
  const data = repairs.map((repair) => ({
    shipName: repair.shipName,
    dock: repair.dock,
    repairType: repair.repairType,
    status: repair.status,
    progress: repair.progress,
    startDate: repair.startDate,
    endDate: repair.endDate,
    budget: repair.budget,
    spent: repair.spent,
    manager: repair.manager,
    priority: repair.priority,
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
    minimumFractionDigits: 0,
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
