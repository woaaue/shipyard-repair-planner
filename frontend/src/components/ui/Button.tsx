import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  onClick,
  disabled = false,
  className = '',
  type = 'button'
}: ButtonProps) {
  
  const baseClasses = 'font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2';
  
  const variantClasses = {
    primary: 'bg-[var(--blue)] text-white hover:bg-[var(--blue-strong)] active:bg-[var(--blue-strong)] focus:ring-2 focus:ring-[var(--blue)] focus:ring-offset-2',
    secondary: 'bg-[var(--soft)] text-[var(--ink)] border border-[var(--line)] hover:bg-white focus:ring-2 focus:ring-[var(--line-strong)] focus:ring-offset-2',
    danger: 'bg-[#b44a4a] text-white hover:bg-[#9d3f3f] active:bg-[#8d3737] focus:ring-2 focus:ring-[#b44a4a] focus:ring-offset-2',
    outline: 'bg-white text-[var(--ink)] border border-[var(--line-strong)] hover:bg-[var(--soft)] focus:ring-2 focus:ring-[var(--blue)] focus:ring-offset-2'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };

  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabledClasses}
        ${className}
      `}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
}
