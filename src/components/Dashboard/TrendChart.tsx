import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { MONTH_NAMES } from '../../types';
import type { MonthlyValue } from '../../types';

interface TrendChartProps {
  data: {
    label: string;
    budget: MonthlyValue;
    utfall: MonthlyValue;
    color: string;
  }[];
  title?: string;
}

export function TrendChart({ data, title = 'Trend' }: TrendChartProps) {
  const chartData = MONTH_NAMES.map((month, index) => {
    const point: Record<string, string | number> = { name: month };
    data.forEach(series => {
      point[`${series.label} Budget`] = series.budget.monthly[index];
      point[`${series.label} Utfall`] = series.utfall.monthly[index];
    });
    return point;
  });

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={{ stroke: '#cbd5e1' }}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={{ stroke: '#cbd5e1' }}
              tickFormatter={(value) => new Intl.NumberFormat('sv-SE', { notation: 'compact' }).format(value)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
              formatter={(value) => [
                `${new Intl.NumberFormat('sv-SE').format(value as number)} KSEK`,
                ''
              ]}
            />
            <Legend />
            {data.map(series => (
              <Line
                key={series.label}
                type="monotone"
                dataKey={`${series.label} Utfall`}
                stroke={series.color}
                strokeWidth={2}
                dot={{ fill: series.color, strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
