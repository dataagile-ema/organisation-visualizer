// Organisationsstruktur
export interface OrgUnit {
  id: string;
  name: string;
  type: 'koncern' | 'division' | 'avdelning' | 'enhet' | 'stab';
  costCenter: string;
  manager?: string;
  children?: OrgUnit[];
}

// Kontoplan
export interface Account {
  code: string;
  name: string;
  type: 'income' | 'expense';
  group: string;
}

export interface AccountGroup {
  id: string;
  name: string;
  accounts: Account[];
}

// Måttdefinitioner
export interface MetricDefinition {
  id: string;
  name: string;
  unit: string;
  aggregation: 'sum' | 'avg' | 'weighted_avg' | 'latest';
  format?: 'number' | 'percent' | 'currency';
}

export interface MetricCategory {
  id: string;
  name: string;
  metrics: MetricDefinition[];
}

// Datavärden
export interface MonthlyValue {
  yearly: number;
  monthly: number[];
}

export interface EconomyData {
  [accountGroup: string]: {
    budget: MonthlyValue;
    utfall: MonthlyValue;
  };
}

export interface PersonalData {
  antal_anstallda: number;
  personalomsattning: number;
  sjukfranvaro: number;
}

export interface ProduktionData {
  [metricId: string]: number | null;
}

export interface UnitData {
  ekonomi: EconomyData;
  personal: PersonalData;
  produktion: ProduktionData;
}

export interface DataValues {
  year: string;
  values: {
    [costCenter: string]: UnitData;
  };
}

// Aggregerade värden
export interface AggregatedUnitData extends UnitData {
  isAggregated: boolean;
  childCount: number;
}

// App state
export interface AppState {
  organization: OrgUnit;
  accounts: AccountGroup[];
  metricsConfig: MetricCategory[];
  data: DataValues;
  selectedUnit: OrgUnit | null;
  expandedNodes: Set<string>;
}

// Månadsnamn
export const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun',
  'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'
];

export const MONTH_NAMES_FULL = [
  'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
  'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
];
