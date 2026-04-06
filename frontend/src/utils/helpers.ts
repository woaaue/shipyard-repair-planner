export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export const isMobile = () => typeof window !== 'undefined' && window.innerWidth < breakpoints.md;
export const isTablet = () => typeof window !== 'undefined' && window.innerWidth >= breakpoints.md && window.innerWidth < breakpoints.lg;
export const isDesktop = () => typeof window !== 'undefined' && window.innerWidth >= breakpoints.lg;

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'в работе': 'blue',
    'завершён': 'green',
    'запланирован': 'purple',
    'отменён': 'gray',
    'в ремонте': 'orange',
    'в плавании': 'blue',
    'ожидает': 'yellow',
  };
  return colors[status] || 'gray';
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    'критический': 'red',
    'высокий': 'orange',
    'средний': 'yellow',
    'низкий': 'green',
  };
  return colors[priority] || 'gray';
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}