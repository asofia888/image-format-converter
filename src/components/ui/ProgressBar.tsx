import React from 'react';
import { APP_CONSTANTS } from '../../constants';

interface ProgressBarProps {
  value: number;
  max: number;
  className?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'purple' | 'green' | 'blue' | 'red';
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max,
  className = '',
  showPercentage = false,
  size = 'md',
  color = 'purple',
}) => {
  const percentage = Math.round((value / max) * APP_CONSTANTS.PERCENTAGE_MULTIPLIER);

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-4',
  };

  const colorClasses = {
    purple: 'bg-purple-600',
    green: 'bg-green-600',
    blue: 'bg-blue-600',
    red: 'bg-red-600',
  };

  return (
    <div className={`w-full ${className}`}>
      <div className={`bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`${colorClasses[color]} transition-all duration-300 ease-out ${sizeClasses[size]}`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
      {showPercentage && (
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center">
          {percentage}%
        </div>
      )}
    </div>
  );
};

export default React.memo(ProgressBar);