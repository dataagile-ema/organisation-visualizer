// Organisationsstruktur
export interface OrgUnit {
  id: string;
  name: string;
  type: string;
  costCenter: string;
  manager?: string;
  children?: OrgUnit[];
}

// Enhetstyp-konfiguration
export interface UnitTypeColor {
  text: string;
  bg: string;
  badgeText: string;
}

export interface UnitTypeConfig {
  label: string;
  color: UnitTypeColor;
  icon: string;
  allowedChildren: string[];
  allowedAtDepth: number[];
}

export interface IconOverride {
  pattern: string;
  icon: string;
}

export interface UnitTypesConfig {
  types: Record<string, UnitTypeConfig>;
  iconOverrides: IconOverride[];
}

// Tröskelvärden-konfiguration
export interface ThresholdRange {
  min?: number;
  max?: number;
  color: string;
}

export interface ThresholdConfig {
  label: string;
  unit: string;
  thresholds: {
    good: ThresholdRange;
    warning: ThresholdRange;
    critical: ThresholdRange;
  };
  higherIsBetter: boolean;
}

export interface ThresholdsConfig {
  [key: string]: ThresholdConfig;
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

// Hjälpfunktion för tröskelvärdesfärger
export function getThresholdColor(value: number, config: ThresholdConfig): string {
  const { thresholds, higherIsBetter } = config;

  if (higherIsBetter) {
    if (thresholds.good.min !== undefined && value >= thresholds.good.min) return thresholds.good.color;
    if (thresholds.warning.min !== undefined && value >= thresholds.warning.min) return thresholds.warning.color;
    return thresholds.critical.color;
  } else {
    if (thresholds.good.max !== undefined && value <= thresholds.good.max) return thresholds.good.color;
    if (thresholds.warning.max !== undefined && value <= thresholds.warning.max) return thresholds.warning.color;
    return thresholds.critical.color;
  }
}
