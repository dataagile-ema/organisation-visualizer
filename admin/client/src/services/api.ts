import type {
  OrgUnit,
  ApiResponse,
  CreateUnitRequest,
  UpdateUnitRequest,
  CostCenterCheckResponse
} from '../types';

const API_BASE_URL = '/api';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public error?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.message || 'Ett fel uppstod',
        response.status,
        data.error
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      'Kunde inte ansluta till servern',
      0,
      'Network Error'
    );
  }
}

export const api = {
  // Hämta hela organisationen
  async getOrganization(): Promise<OrgUnit> {
    const response = await fetchApi<OrgUnit>('/organization');
    return response.data!;
  },

  // Hämta specifik enhet
  async getUnit(id: string): Promise<OrgUnit> {
    const response = await fetchApi<OrgUnit>(`/organization/${id}`);
    return response.data!;
  },

  // Skapa ny enhet
  async createUnit(parentId: string, unit: CreateUnitRequest): Promise<OrgUnit> {
    const response = await fetchApi<OrgUnit>(
      `/organization/${parentId}/unit`,
      {
        method: 'POST',
        body: JSON.stringify(unit),
      }
    );
    return response.data!;
  },

  // Uppdatera enhet
  async updateUnit(id: string, updates: UpdateUnitRequest): Promise<OrgUnit> {
    const response = await fetchApi<OrgUnit>(`/organization/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response.data!;
  },

  // Ta bort enhet
  async deleteUnit(id: string, reassignChildrenTo?: string): Promise<void> {
    await fetchApi(`/organization/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ reassignChildrenTo }),
    });
  },

  // Kontrollera om costCenter är tillgängligt
  async checkCostCenter(costCenter: string): Promise<CostCenterCheckResponse> {
    const response = await fetchApi<CostCenterCheckResponse>(
      `/organization/validate/cost-center/${costCenter}`
    );
    return response.data!;
  },

  // Skapa backup
  async createBackup(): Promise<{ backupPath: string }> {
    const response = await fetchApi<{ backupPath: string }>(
      '/organization/backup',
      { method: 'POST' }
    );
    return response.data!;
  },
};

export { ApiError };
