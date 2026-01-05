import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  trend?: number;
  trendLabel?: string;
  variant?: 'default' | 'positive' | 'negative' | 'warning';
}

const variantStyles = {
  default: 'bg-white border-slate-200',
  positive: 'bg-emerald-50 border-emerald-200',
  negative: 'bg-red-50 border-red-200',
  warning: 'bg-amber-50 border-amber-200'
};

const trendColors = {
  positive: 'text-emerald-600',
  negative: 'text-red-600',
  neutral: 'text-slate-500'
};

export function MetricCard({
  title,
  value,
  unit,
  subtitle,
  trend,
  trendLabel,
  variant = 'default'
}: MetricCardProps) {
  const getTrendIcon = () => {
    if (trend === undefined || trend === 0) {
      return <Minus className="w-4 h-4" />;
    }
    return trend > 0
      ? <TrendingUp className="w-4 h-4" />
      : <TrendingDown className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (trend === undefined || trend === 0) return trendColors.neutral;
    // För kostnader: negativ trend (under budget) är bra
    // För intäkter: positiv trend (över budget) är bra
    return trend > 0 ? trendColors.negative : trendColors.positive;
  };

  return (
    <div className={`rounded-lg border p-4 ${variantStyles[variant]}`}>
      <div className="text-sm font-medium text-slate-600 mb-1">{title}</div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-slate-800">
          {typeof value === 'number' ? new Intl.NumberFormat('sv-SE').format(value) : value}
        </span>
        {unit && (
          <span className="text-sm text-slate-500">{unit}</span>
        )}
      </div>
      {subtitle && (
        <div className="text-sm text-slate-500 mt-1">{subtitle}</div>
      )}
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-sm ${getTrendColor()}`}>
          {getTrendIcon()}
          <span>{trend > 0 ? '+' : ''}{trend.toFixed(1)}%</span>
          {trendLabel && <span className="text-slate-500 ml-1">{trendLabel}</span>}
        </div>
      )}
    </div>
  );
}
