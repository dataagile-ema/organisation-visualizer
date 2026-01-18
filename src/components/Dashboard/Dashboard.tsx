import type { OrgUnit, UnitData, UnitTypesConfig, ThresholdsConfig } from '../../types';
import { getThresholdColor } from '../../types';
import { MetricCard } from './MetricCard';
import { BudgetChart } from './BudgetChart';
import { CostBreakdownChart } from './CostBreakdownChart';
import { calculateResult, calculateVariance, getAllCostCenters } from '../../utils/aggregation';
import { getColorClasses as getStaticColorClasses } from '../../utils/colorClasses';
import { Users, TrendingDown, Activity, Award } from 'lucide-react';
import unitTypesConfig from '../../data/unit-types.json';
import thresholdsConfig from '../../data/thresholds.json';

const typeConfig = unitTypesConfig as UnitTypesConfig;
const thresholds = thresholdsConfig as ThresholdsConfig;

// Hjälpfunktion för att få badge-klasser för en enhetstyp
function getTypeBadgeClasses(type: string): string {
  const config = typeConfig.types?.[type];
  if (config?.color?.bg && config?.color?.badgeText) {
    return `${config.color.bg} ${config.color.badgeText}`;
  }
  return 'bg-slate-100 text-slate-700';
}

// Hjälpfunktion för att få typ-label
function getTypeLabel(type: string): string {
  const config = typeConfig.types?.[type];
  return config?.label || type.charAt(0).toUpperCase() + type.slice(1);
}

// Hjälpfunktion för färgklasser baserat på tröskelvärde
function getColorClasses(value: number, metricKey: string): { bg: string; text: string } {
  const config = thresholds[metricKey];
  if (!config) return { bg: 'bg-slate-100', text: 'text-slate-600' };

  const color = getThresholdColor(value, config);
  return getStaticColorClasses(color);
}

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

  // Beräkna färgklasser för mätvärden
  const personalOmsColors = getColorClasses(data.personal.personalomsattning, 'personalomsattning');
  const sjukfranvaroColors = getColorClasses(data.personal.sjukfranvaro, 'sjukfranvaro');
  const kundnojdhetColors = data.produktion.kundnojdhet !== null
    ? getColorClasses(data.produktion.kundnojdhet, 'kundnojdhet')
    : { bg: 'bg-slate-100', text: 'text-slate-600' };

  // Bestäm variant för MetricCard baserat på tröskelvärden
  const getBudgetVariant = (variance: number): 'positive' | 'warning' | 'negative' => {
    const color = getThresholdColor(variance, thresholds.budgetavvikelse);
    if (color === 'emerald') return 'positive';
    if (color === 'amber') return 'warning';
    return 'negative';
  };

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
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeBadgeClasses(unit.type)}`}>
              {getTypeLabel(unit.type)}
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
            variant={getBudgetVariant(kostnadsVariance)}
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
            variant={getBudgetVariant(kostnadsVariance)}
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
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${personalOmsColors.bg}`}>
                <TrendingDown className={`w-5 h-5 ${personalOmsColors.text}`} />
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
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${sjukfranvaroColors.bg}`}>
                <Activity className={`w-5 h-5 ${sjukfranvaroColors.text}`} />
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
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${kundnojdhetColors.bg}`}>
                    <Award className={`w-5 h-5 ${kundnojdhetColors.text}`} />
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
