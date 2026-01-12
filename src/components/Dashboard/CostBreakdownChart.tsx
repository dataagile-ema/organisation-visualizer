import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';
import type { EconomyData } from '../../types';

interface CostBreakdownChartProps {
  ekonomiData: EconomyData;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const costLabels: Record<string, string> = {
  personal: 'Personalkostnader',
  lokaler: 'Lokalkostnader',
  material: 'Material & Varor',
  externa: 'Externa tjänster',
  ovrigt: 'Övriga kostnader'
};

export function CostBreakdownChart({ ekonomiData }: CostBreakdownChartProps) {
  const data = Object.entries(costLabels)
    .map(([key, label]) => ({
      name: label,
      value: ekonomiData[key]?.utfall?.yearly || 0
    }))
    .filter(item => item.value > 0);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Kostnadsfördelning</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
              formatter={(value) => [
                `${new Intl.NumberFormat('sv-SE').format(value as number)} KSEK (${(((value as number) / total) * 100).toFixed(1)}%)`,
                ''
              ]}
            />
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              formatter={(value) => {
                const item = data.find(d => d.name === value);
                if (item) {
                  const percent = ((item.value / total) * 100).toFixed(0);
                  return (
                    <span className="text-sm text-slate-600">
                      {value} ({percent}%)
                    </span>
                  );
                }
                return value;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="text-center mt-2">
        <span className="text-sm text-slate-500">Totalt: </span>
        <span className="text-sm font-semibold text-slate-700">
          {new Intl.NumberFormat('sv-SE').format(total)} KSEK
        </span>
      </div>
    </div>
  );
}
