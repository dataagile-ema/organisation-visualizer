import type { OrgUnit, UnitData } from '../../types';
import { calculateResult, calculateVariance } from '../../utils/aggregation';
import { ChevronRight } from 'lucide-react';

interface ChildUnitsComparisonProps {
  unit: OrgUnit;
  getUnitData: (unit: OrgUnit) => UnitData;
  onSelectUnit: (unit: OrgUnit) => void;
}

export function ChildUnitsComparison({ unit, getUnitData, onSelectUnit }: ChildUnitsComparisonProps) {
  if (!unit.children || unit.children.length === 0) {
    return null;
  }

  const childrenWithData = unit.children.map(child => {
    const data = getUnitData(child);
    const budgetResult = calculateResult(data.ekonomi, 'budget');
    const utfallResult = calculateResult(data.ekonomi, 'utfall');

    const totalKostnaderBudget =
      (data.ekonomi.personal?.budget?.yearly || 0) +
      (data.ekonomi.lokaler?.budget?.yearly || 0) +
      (data.ekonomi.material?.budget?.yearly || 0) +
      (data.ekonomi.externa?.budget?.yearly || 0) +
      (data.ekonomi.ovrigt?.budget?.yearly || 0);

    const totalKostnaderUtfall =
      (data.ekonomi.personal?.utfall?.yearly || 0) +
      (data.ekonomi.lokaler?.utfall?.yearly || 0) +
      (data.ekonomi.material?.utfall?.yearly || 0) +
      (data.ekonomi.externa?.utfall?.yearly || 0) +
      (data.ekonomi.ovrigt?.utfall?.yearly || 0);

    return {
      unit: child,
      data,
      budgetResult,
      utfallResult,
      variance: calculateVariance(budgetResult, utfallResult),
      kostnaderBudget: totalKostnaderBudget,
      kostnaderUtfall: totalKostnaderUtfall,
      kostnaderVariance: calculateVariance(totalKostnaderBudget, totalKostnaderUtfall)
    };
  }).sort((a, b) => b.data.personal.antal_anstallda - a.data.personal.antal_anstallda);

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
        <h3 className="text-sm font-semibold text-slate-700">Underliggande enheter</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <th className="px-4 py-3">Enhet</th>
              <th className="px-4 py-3 text-right">Anställda</th>
              <th className="px-4 py-3 text-right">Kostnader (KSEK)</th>
              <th className="px-4 py-3 text-right">Avvikelse</th>
              <th className="px-4 py-3 text-right">Pers.oms.</th>
              <th className="px-4 py-3 text-right">Sjukfr.</th>
              {childrenWithData.some(c => c.data.produktion.kundnojdhet !== null) && (
                <th className="px-4 py-3 text-right">Kundnöjdhet</th>
              )}
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {childrenWithData.map(({ unit: child, data, kostnaderUtfall, kostnaderVariance }) => (
              <tr
                key={child.id}
                className="hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => onSelectUnit(child)}
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-800">{child.name}</div>
                  <div className="text-xs text-slate-500">{child.costCenter}</div>
                </td>
                <td className="px-4 py-3 text-right text-sm text-slate-600">
                  {data.personal.antal_anstallda}
                </td>
                <td className="px-4 py-3 text-right text-sm text-slate-600">
                  {new Intl.NumberFormat('sv-SE').format(kostnaderUtfall)}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    kostnaderVariance <= 0 ? 'bg-emerald-100 text-emerald-700' :
                    kostnaderVariance < 5 ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {kostnaderVariance > 0 ? '+' : ''}{kostnaderVariance.toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={`text-sm ${
                    data.personal.personalomsattning > 15 ? 'text-red-600' :
                    data.personal.personalomsattning > 10 ? 'text-amber-600' :
                    'text-slate-600'
                  }`}>
                    {data.personal.personalomsattning.toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={`text-sm ${
                    data.personal.sjukfranvaro > 5 ? 'text-red-600' :
                    data.personal.sjukfranvaro > 3.5 ? 'text-amber-600' :
                    'text-slate-600'
                  }`}>
                    {data.personal.sjukfranvaro.toFixed(1)}%
                  </span>
                </td>
                {childrenWithData.some(c => c.data.produktion.kundnojdhet !== null) && (
                  <td className="px-4 py-3 text-right">
                    {data.produktion.kundnojdhet !== null ? (
                      <span className={`text-sm ${
                        data.produktion.kundnojdhet >= 85 ? 'text-emerald-600' :
                        data.produktion.kundnojdhet >= 75 ? 'text-amber-600' :
                        'text-red-600'
                      }`}>
                        {data.produktion.kundnojdhet}%
                      </span>
                    ) : (
                      <span className="text-sm text-slate-400">-</span>
                    )}
                  </td>
                )}
                <td className="px-4 py-3 text-right">
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
