import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { MONTH_NAMES } from '../../types';
import type { EconomyData } from '../../types';
import { getMonthlyResults } from '../../utils/aggregation';

interface BudgetChartProps {
  ekonomiData: EconomyData;
  title?: string;
}

export function BudgetChart({ ekonomiData, title = 'Budget vs Utfall' }: BudgetChartProps) {
  const budgetMonthly = getMonthlyResults(ekonomiData, 'budget');
  const utfallMonthly = getMonthlyResults(ekonomiData, 'utfall');

  const data = MONTH_NAMES.map((month, index) => ({
    name: month,
    Budget: budgetMonthly[index],
    Utfall: utfallMonthly[index]
  }));

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={{ stroke: '#cbd5e1' }}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={{ stroke: '#cbd5e1' }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}M`}
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
            <Bar dataKey="Budget" fill="#94a3b8" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Utfall" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
