import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '../services/api';
import type { OrgUnit, CreateUnitRequest, UpdateUnitRequest } from '../types';

interface UseOrgDataReturn {
  organization: OrgUnit | null;
  loading: boolean;
  error: string | null;
  refreshOrganization: () => Promise<void>;
  createUnit: (parentId: string, unit: CreateUnitRequest) => Promise<OrgUnit>;
  updateUnit: (id: string, updates: UpdateUnitRequest) => Promise<OrgUnit>;
  deleteUnit: (id: string, reassignChildrenTo?: string) => Promise<void>;
  checkCostCenter: (costCenter: string) => Promise<boolean>;
}

export function useOrgData(): UseOrgDataReturn {
  const [organization, setOrganization] = useState<OrgUnit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshOrganization = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await api.getOrganization();
      setOrganization(data);
    } catch (err) {
      const message = err instanceof ApiError
        ? err.message
        : 'Kunde inte hämta organisation';
      setError(message);
      console.error('Failed to fetch organization:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshOrganization();
  }, [refreshOrganization]);

  const createUnit = useCallback(async (
    parentId: string,
    unit: CreateUnitRequest
  ) => {
    try {
      const newUnit = await api.createUnit(parentId, unit);
      await refreshOrganization(); // Refresh för att få uppdaterad data
      return newUnit;
    } catch (err) {
      const message = err instanceof ApiError
        ? err.message
        : 'Kunde inte skapa enhet';
      setError(message);
      throw err;
    }
  }, [refreshOrganization]);

  const updateUnit = useCallback(async (
    id: string,
    updates: UpdateUnitRequest
  ) => {
    try {
      const updatedUnit = await api.updateUnit(id, updates);
      await refreshOrganization();
      return updatedUnit;
    } catch (err) {
      const message = err instanceof ApiError
        ? err.message
        : 'Kunde inte uppdatera enhet';
      setError(message);
      throw err;
    }
  }, [refreshOrganization]);

  const deleteUnit = useCallback(async (
    id: string,
    reassignChildrenTo?: string
  ) => {
    try {
      await api.deleteUnit(id, reassignChildrenTo);
      await refreshOrganization();
    } catch (err) {
      const message = err instanceof ApiError
        ? err.message
        : 'Kunde inte ta bort enhet';
      setError(message);
      throw err;
    }
  }, [refreshOrganization]);

  const checkCostCenter = useCallback(async (costCenter: string) => {
    try {
      const result = await api.checkCostCenter(costCenter);
      return result.available;
    } catch (err) {
      console.error('Failed to check cost center:', err);
      return false;
    }
  }, []);

  return {
    organization,
    loading,
    error,
    refreshOrganization,
    createUnit,
    updateUnit,
    deleteUnit,
    checkCostCenter,
  };
}
