interface ProgressCircleProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  label?: string;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
}

export default function ProgressCircle({
  progress,
  size = 60,
  strokeWidth = 6,
  showLabel = true,
  label,
  color = 'blue'
}: ProgressCircleProps) {
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  const colorClasses = {
    blue: {
      stroke: '#3b82f6',
      text: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    green: {
      stroke: '#10b981',
      text: 'text-green-600',
      bg: 'bg-green-50'
    },
    orange: {
      stroke: '#f59e0b',
      text: 'text-orange-600',
      bg: 'bg-orange-50'
    },
    red: {
      stroke: '#ef4444',
      text: 'text-red-600',
      bg: 'bg-red-50'
    },
    purple: {
      stroke: '#8b5cf6',
      text: 'text-purple-600',
      bg: 'bg-purple-50'
    }
  };

  const currentColor = colorClasses[color];

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Фоновый круг */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="stroke-gray-200 fill-transparent"
        />
        {/* Прогресс круг */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`fill-transparent transition-all duration-700 ease-out`}
          style={{
            stroke: currentColor.stroke,
          }}
        />
      </svg>
      
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className={`font-bold text-s ${currentColor.text}`}>
              {progress}%
            </div>
            {label && (
              <div className="text-xs text-gray-500 mt-0.5">
                {label}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}