import type { OrgUnit, UnitData, DataValues, MonthlyValue, EconomyData, PersonalData, ProduktionData } from '../types';

// Hämta alla kostnadsställen under en enhet (inklusive sig själv om det är en lövnod)
export function getAllCostCenters(unit: OrgUnit): string[] {
  if (!unit.children || unit.children.length === 0) {
    return [unit.costCenter];
  }

  const childCostCenters = unit.children.flatMap(child => getAllCostCenters(child));
  return childCostCenters;
}

// Summera två MonthlyValue-objekt
function sumMonthlyValues(a: MonthlyValue, b: MonthlyValue): MonthlyValue {
  return {
    yearly: a.yearly + b.yearly,
    monthly: a.monthly.map((v, i) => v + b.monthly[i])
  };
}

// Skapa en tom MonthlyValue
function emptyMonthlyValue(): MonthlyValue {
  return {
    yearly: 0,
    monthly: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  };
}

// Aggregera ekonomidata
function aggregateEconomyData(dataItems: EconomyData[]): EconomyData {
  const accountGroups = ['intakter', 'personal', 'lokaler', 'material', 'externa', 'ovrigt'];
  const result: EconomyData = {};

  for (const group of accountGroups) {
    result[group] = {
      budget: emptyMonthlyValue(),
      utfall: emptyMonthlyValue()
    };

    for (const data of dataItems) {
      if (data[group]) {
        result[group].budget = sumMonthlyValues(result[group].budget, data[group].budget);
        result[group].utfall = sumMonthlyValues(result[group].utfall, data[group].utfall);
      }
    }
  }

  return result;
}

// Aggregera personaldata med viktad medelvärdering för procent
function aggregatePersonalData(dataItems: PersonalData[]): PersonalData {
  const totalAnstallda = dataItems.reduce((sum, d) => sum + d.antal_anstallda, 0);

  if (totalAnstallda === 0) {
    return { antal_anstallda: 0, personalomsattning: 0, sjukfranvaro: 0 };
  }

  // Viktad medelvärdering baserat på antal anställda
  const weightedOmsattning = dataItems.reduce(
    (sum, d) => sum + d.personalomsattning * d.antal_anstallda, 0
  ) / totalAnstallda;

  const weightedSjukfranvaro = dataItems.reduce(
    (sum, d) => sum + d.sjukfranvaro * d.antal_anstallda, 0
  ) / totalAnstallda;

  return {
    antal_anstallda: totalAnstallda,
    personalomsattning: Math.round(weightedOmsattning * 10) / 10,
    sjukfranvaro: Math.round(weightedSjukfranvaro * 10) / 10
  };
}

// Aggregera produktionsdata
function aggregateProduktionData(dataItems: ProduktionData[], personalDataItems: PersonalData[]): ProduktionData {
  // Summera ärenden
  const arenden = dataItems.reduce((sum, d) => sum + (d.arenden || 0), 0);

  // Viktad medelvärdering för leveranstid, kundnöjdhet och kvalitetsindex
  const validLeveranstid = dataItems.filter(d => d.leveranstid !== null);
  const leveranstid = validLeveranstid.length > 0
    ? validLeveranstid.reduce((sum, d, i) => sum + (d.leveranstid || 0) * personalDataItems[i].antal_anstallda, 0) /
      validLeveranstid.reduce((sum, _, i) => sum + personalDataItems[i].antal_anstallda, 0)
    : null;

  const validKundnojdhet = dataItems
    .map((d, i) => ({ value: d.kundnojdhet, weight: personalDataItems[i].antal_anstallda }))
    .filter(d => d.value !== null);
  const kundnojdhet = validKundnojdhet.length > 0
    ? Math.round(validKundnojdhet.reduce((sum, d) => sum + (d.value || 0) * d.weight, 0) /
        validKundnojdhet.reduce((sum, d) => sum + d.weight, 0))
    : null;

  const validKvalitet = dataItems
    .map((d, i) => ({ value: d.kvalitetsindex, weight: personalDataItems[i].antal_anstallda }))
    .filter(d => d.value !== null);
  const kvalitetsindex = validKvalitet.length > 0
    ? Math.round(validKvalitet.reduce((sum, d) => sum + (d.value || 0) * d.weight, 0) /
        validKvalitet.reduce((sum, d) => sum + d.weight, 0))
    : null;

  return {
    arenden,
    leveranstid: leveranstid !== null ? Math.round(leveranstid * 10) / 10 : null,
    kundnojdhet,
    kvalitetsindex
  };
}

// Huvudfunktion för att aggregera data för en enhet
export function aggregateUnitData(unit: OrgUnit, allData: DataValues): UnitData {
  const costCenters = getAllCostCenters(unit);

  // Om det är en lövnod och vi har direkt data
  if (costCenters.length === 1 && allData.values[costCenters[0]]) {
    return allData.values[costCenters[0]];
  }

  // Samla all data från underliggande kostnadsställen
  const dataItems: UnitData[] = costCenters
    .filter(cc => allData.values[cc])
    .map(cc => allData.values[cc]);

  if (dataItems.length === 0) {
    // Returnera tom data om inget finns
    return {
      ekonomi: aggregateEconomyData([]),
      personal: { antal_anstallda: 0, personalomsattning: 0, sjukfranvaro: 0 },
      produktion: { arenden: 0, leveranstid: null, kundnojdhet: null, kvalitetsindex: null }
    };
  }

  return {
    ekonomi: aggregateEconomyData(dataItems.map(d => d.ekonomi)),
    personal: aggregatePersonalData(dataItems.map(d => d.personal)),
    produktion: aggregateProduktionData(
      dataItems.map(d => d.produktion),
      dataItems.map(d => d.personal)
    )
  };
}

// Beräkna budgetavvikelse i procent
export function calculateVariance(budget: number, utfall: number): number {
  if (budget === 0) return 0;
  return Math.round(((utfall - budget) / budget) * 1000) / 10;
}

// Formatera tal för visning
export function formatNumber(value: number, format: 'number' | 'percent' | 'currency' = 'number'): string {
  if (format === 'percent') {
    return `${value.toFixed(1)}%`;
  }
  if (format === 'currency') {
    return new Intl.NumberFormat('sv-SE').format(value) + ' KSEK';
  }
  return new Intl.NumberFormat('sv-SE').format(value);
}

// Beräkna totalt resultat (intäkter - kostnader)
export function calculateResult(ekonomi: EconomyData, type: 'budget' | 'utfall'): number {
  const intakter = ekonomi.intakter?.[type]?.yearly || 0;
  const kostnader =
    (ekonomi.personal?.[type]?.yearly || 0) +
    (ekonomi.lokaler?.[type]?.yearly || 0) +
    (ekonomi.material?.[type]?.yearly || 0) +
    (ekonomi.externa?.[type]?.yearly || 0) +
    (ekonomi.ovrigt?.[type]?.yearly || 0);

  return intakter - kostnader;
}

// Hämta månatliga resultat
export function getMonthlyResults(ekonomi: EconomyData, type: 'budget' | 'utfall'): number[] {
  const months = 12;
  const results: number[] = [];

  for (let i = 0; i < months; i++) {
    const intakter = ekonomi.intakter?.[type]?.monthly[i] || 0;
    const kostnader =
      (ekonomi.personal?.[type]?.monthly[i] || 0) +
      (ekonomi.lokaler?.[type]?.monthly[i] || 0) +
      (ekonomi.material?.[type]?.monthly[i] || 0) +
      (ekonomi.externa?.[type]?.monthly[i] || 0) +
      (ekonomi.ovrigt?.[type]?.monthly[i] || 0);

    results.push(intakter - kostnader);
  }

  return results;
}
