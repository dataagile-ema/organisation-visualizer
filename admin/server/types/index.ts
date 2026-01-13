// Organisationsstruktur (matchar huvudappens types)
export interface OrgUnit {
  id: string;
  name: string;
  type: 'koncern' | 'division' | 'avdelning' | 'enhet' | 'stab';
  costCenter: string;
  manager?: string;
  children?: OrgUnit[];
}

// API Request/Response types
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
  type: 'division' | 'avdelning' | 'enhet' | 'stab';
  costCenter: string;
  manager?: string;
}

export interface UpdateUnitRequest {
  name?: string;
  manager?: string;
  costCenter?: string;
}

export interface DeleteUnitRequest {
  reassignChildrenTo?: string;
}

export interface MoveUnitRequest {
  newParentId: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: string[];
}

export interface CostCenterCheckResponse {
  available: boolean;
  existingUnit?: {
    id: string;
    name: string;
  };
}
