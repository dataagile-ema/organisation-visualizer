import type { OrgUnit, UnitData } from '../../types';
import { MetricCard } from './MetricCard';
import { BudgetChart } from './BudgetChart';
import { CostBreakdownChart } from './CostBreakdownChart';
import { calculateResult, calculateVariance, getAllCostCenters } from '../../utils/aggregation';
import { Users, TrendingDown, Activity, Award } from 'lucide-react';

interface DashboardProps {
  unit: OrgUnit;
  data: UnitData;
}

export function Dashboard({ unit, data }: DashboardProps) {
  const budgetResult = calculateResult(data.ekonomi, 'budget');
  const utfallResult = calculateResult(data.ekonomi, 'utfall');
  const resultVariance = calculateVariance(budgetResult, utfallResult);

  const totalBudgetKostnader =
    (data.ekonomi.personal?.budget?.yearly || 0) +
    (data.ekonomi.lokaler?.budget?.yearly || 0) +
    (data.ekonomi.material?.budget?.yearly || 0) +
    (data.ekonomi.externa?.budget?.yearly || 0) +
    (data.ekonomi.ovrigt?.budget?.yearly || 0);

  const totalUtfallKostnader =
    (data.ekonomi.personal?.utfall?.yearly || 0) +
    (data.ekonomi.lokaler?.utfall?.yearly || 0) +
    (data.ekonomi.material?.utfall?.yearly || 0) +
    (data.ekonomi.externa?.utfall?.yearly || 0) +
    (data.ekonomi.ovrigt?.utfall?.yearly || 0);

  const kostnadsVariance = calculateVariance(totalBudgetKostnader, totalUtfallKostnader);

  const intakterBudget = data.ekonomi.intakter?.budget?.yearly || 0;
  const intakterUtfall = data.ekonomi.intakter?.utfall?.yearly || 0;
  const intakterVariance = intakterBudget > 0 ? calculateVariance(intakterBudget, intakterUtfall) : 0;

  const childCount = getAllCostCenters(unit).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{unit.name}</h2>
            <p className="text-slate-500 mt-1">
              {unit.manager && <span>Chef: {unit.manager}</span>}
              {unit.manager && ' • '}
              <span>Kostnadsställe: {unit.costCenter}</span>
              {childCount > 1 && (
                <span> • Omfattar {childCount} enheter</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              unit.type === 'koncern' ? 'bg-blue-100 text-blue-700' :
              unit.type === 'division' ? 'bg-emerald-100 text-emerald-700' :
              unit.type === 'avdelning' ? 'bg-amber-100 text-amber-700' :
              unit.type === 'stab' ? 'bg-purple-100 text-purple-700' :
              'bg-slate-100 text-slate-700'
            }`}>
              {unit.type.charAt(0).toUpperCase() + unit.type.slice(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Ekonomiska nyckeltal */}
      <div>
        <h3 className="text-lg font-semibold text-slate-700 mb-3">Ekonomi</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {intakterBudget > 0 && (
            <MetricCard
              title="Intäkter"
              value={intakterUtfall}
              unit="KSEK"
              subtitle={`Budget: ${new Intl.NumberFormat('sv-SE').format(intakterBudget)} KSEK`}
              trend={intakterVariance}
              trendLabel="vs budget"
              variant={intakterVariance >= 0 ? 'positive' : 'negative'}
            />
          )}
          <MetricCard
            title="Kostnader"
            value={totalUtfallKostnader}
            unit="KSEK"
            subtitle={`Budget: ${new Intl.NumberFormat('sv-SE').format(totalBudgetKostnader)} KSEK`}
            trend={kostnadsVariance}
            trendLabel="vs budget"
            variant={kostnadsVariance <= 0 ? 'positive' : kostnadsVariance < 5 ? 'warning' : 'negative'}
          />
          <MetricCard
            title="Resultat"
            value={utfallResult}
            unit="KSEK"
            subtitle={`Budget: ${new Intl.NumberFormat('sv-SE').format(budgetResult)} KSEK`}
            trend={resultVariance}
            trendLabel="vs budget"
            variant={utfallResult >= budgetResult ? 'positive' : 'negative'}
          />
          <MetricCard
            title="Budgetavvikelse kostnader"
            value={`${kostnadsVariance > 0 ? '+' : ''}${kostnadsVariance.toFixed(1)}%`}
            subtitle={kostnadsVariance <= 0 ? 'Under budget' : 'Över budget'}
            variant={kostnadsVariance <= 0 ? 'positive' : kostnadsVariance < 5 ? 'warning' : 'negative'}
          />
        </div>
      </div>

      {/* Personal nyckeltal */}
      <div>
        <h3 className="text-lg font-semibold text-slate-700 mb-3">Personal</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-slate-500">Antal anställda</div>
                <div className="text-2xl font-semibold text-slate-800">
                  {data.personal.antal_anstallda}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                data.personal.personalomsattning > 15 ? 'bg-red-100' :
                data.personal.personalomsattning > 10 ? 'bg-amber-100' :
                'bg-emerald-100'
              }`}>
                <TrendingDown className={`w-5 h-5 ${
                  data.personal.personalomsattning > 15 ? 'text-red-600' :
                  data.personal.personalomsattning > 10 ? 'text-amber-600' :
                  'text-emerald-600'
                }`} />
              </div>
              <div>
                <div className="text-sm text-slate-500">Personalomsättning</div>
                <div className="text-2xl font-semibold text-slate-800">
                  {data.personal.personalomsattning.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                data.personal.sjukfranvaro > 5 ? 'bg-red-100' :
                data.personal.sjukfranvaro > 3.5 ? 'bg-amber-100' :
                'bg-emerald-100'
              }`}>
                <Activity className={`w-5 h-5 ${
                  data.personal.sjukfranvaro > 5 ? 'text-red-600' :
                  data.personal.sjukfranvaro > 3.5 ? 'text-amber-600' :
                  'text-emerald-600'
                }`} />
              </div>
              <div>
                <div className="text-sm text-slate-500">Sjukfrånvaro</div>
                <div className="text-2xl font-semibold text-slate-800">
                  {data.personal.sjukfranvaro.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Produktion/Verksamhet nyckeltal */}
      {((data.produktion.arenden ?? 0) > 0 || data.produktion.kundnojdhet !== null) && (
        <div>
          <h3 className="text-lg font-semibold text-slate-700 mb-3">Verksamhet</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {(data.produktion.arenden ?? 0) > 0 && (
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="text-sm text-slate-500">Hanterade ärenden</div>
                <div className="text-2xl font-semibold text-slate-800">
                  {new Intl.NumberFormat('sv-SE').format(data.produktion.arenden ?? 0)}
                </div>
              </div>
            )}
            {data.produktion.leveranstid !== null && (
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="text-sm text-slate-500">Leveranstid (snitt)</div>
                <div className="text-2xl font-semibold text-slate-800">
                  {data.produktion.leveranstid} dagar
                </div>
              </div>
            )}
            {data.produktion.kundnojdhet !== null && (
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    data.produktion.kundnojdhet >= 85 ? 'bg-emerald-100' :
                    data.produktion.kundnojdhet >= 75 ? 'bg-amber-100' :
                    'bg-red-100'
                  }`}>
                    <Award className={`w-5 h-5 ${
                      data.produktion.kundnojdhet >= 85 ? 'text-emerald-600' :
                      data.produktion.kundnojdhet >= 75 ? 'text-amber-600' :
                      'text-red-600'
                    }`} />
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">Kundnöjdhet</div>
                    <div className="text-2xl font-semibold text-slate-800">
                      {data.produktion.kundnojdhet}%
                    </div>
                  </div>
                </div>
              </div>
            )}
            {data.produktion.kvalitetsindex !== null && (
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="text-sm text-slate-500">Kvalitetsindex</div>
                <div className="text-2xl font-semibold text-slate-800">
                  {data.produktion.kvalitetsindex}%
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Diagram */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BudgetChart
          ekonomiData={data.ekonomi}
          title="Resultat per månad (Budget vs Utfall)"
        />
        <CostBreakdownChart ekonomiData={data.ekonomi} />
      </div>
    </div>
  );
}
