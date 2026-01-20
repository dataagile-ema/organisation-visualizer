// Organisationsstruktur (matchar backend types)
export interface OrgUnit {
  id: string;
  name: string;
  type: 'koncern' | 'division' | 'avdelning' | 'enhet' | 'stab' | 'sektion';
  costCenter: string;
  manager?: string;
  children?: OrgUnit[];
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
  timestamp: string;
}

export interface CreateUnitRequest {
  id: string;
  name: string;
  type: 'division' | 'avdelning' | 'enhet' | 'stab' | 'sektion';
  costCenter: string;
  manager?: string;
}

export interface UpdateUnitRequest {
  name?: string;
  manager?: string;
  costCenter?: string;
}

export interface CostCenterCheckResponse {
  available: boolean;
  existingUnit?: {
    id: string;
    name: string;
  };
}
