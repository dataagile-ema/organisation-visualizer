import { useState, useCallback, useMemo } from 'react';
import type { OrgUnit, DataValues, AccountGroup, MetricCategory, UnitData } from '../types';
import { aggregateUnitData } from '../utils/aggregation';

import organizationData from '../data/organization.json';
import accountsData from '../data/accounts.json';
import metricsConfigData from '../data/metrics-config.json';
import dataValues from '../data/data.json';

export function useOrganization() {
  const [selectedUnit, setSelectedUnit] = useState<OrgUnit>(organizationData as OrgUnit);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['koncernen']));

  const organization = organizationData as OrgUnit;
  const accounts = accountsData.accountGroups as AccountGroup[];
  const metricsConfig = metricsConfigData.categories as MetricCategory[];
  const data = dataValues as DataValues;

  // Hitta en enhet via ID
  const findUnit = useCallback((id: string, root: OrgUnit = organization): OrgUnit | null => {
    if (root.id === id) return root;
    if (!root.children) return null;

    for (const child of root.children) {
      const found = findUnit(id, child);
      if (found) return found;
    }
    return null;
  }, [organization]);

  // Expandera/kollapsa nod
  const toggleNode = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  // Expandera till en viss nod
  const expandToNode = useCallback((nodeId: string, root: OrgUnit = organization): boolean => {
    if (root.id === nodeId) {
      setExpandedNodes(prev => new Set([...prev, nodeId]));
      return true;
    }
    if (!root.children) return false;

    for (const child of root.children) {
      if (expandToNode(nodeId, child)) {
        setExpandedNodes(prev => new Set([...prev, root.id]));
        return true;
      }
    }
    return false;
  }, [organization]);

  // Välj enhet
  const selectUnit = useCallback((unit: OrgUnit) => {
    setSelectedUnit(unit);
    expandToNode(unit.id);
  }, [expandToNode]);

  // Hämta aggregerad data för vald enhet
  const selectedUnitData = useMemo((): UnitData => {
    return aggregateUnitData(selectedUnit, data);
  }, [selectedUnit, data]);

  // Hämta data för en specifik enhet
  const getUnitData = useCallback((unit: OrgUnit): UnitData => {
    return aggregateUnitData(unit, data);
  }, [data]);

  // Hämta brödsmulor för vald enhet
  const breadcrumbs = useMemo((): OrgUnit[] => {
    const path: OrgUnit[] = [];

    const findPath = (current: OrgUnit, target: string): boolean => {
      path.push(current);
      if (current.id === target) return true;

      if (current.children) {
        for (const child of current.children) {
          if (findPath(child, target)) return true;
        }
      }

      path.pop();
      return false;
    };

    findPath(organization, selectedUnit.id);
    return path;
  }, [organization, selectedUnit]);

  return {
    organization,
    accounts,
    metricsConfig,
    data,
    selectedUnit,
    selectedUnitData,
    expandedNodes,
    breadcrumbs,
    selectUnit,
    toggleNode,
    findUnit,
    getUnitData
  };
}
