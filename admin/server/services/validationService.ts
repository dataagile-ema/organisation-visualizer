import { z } from 'zod';
import type { OrgUnit, ValidationResult, CreateUnitRequest, UpdateUnitRequest } from '../types/index.js';

// Zod schemas
export const OrgUnitTypeSchema = z.enum(['koncern', 'division', 'avdelning', 'enhet', 'stab']);

export const OrgUnitCreateSchema = z.object({
  id: z.string().min(1).regex(/^[a-z0-9-]+$/, 'ID får endast innehålla små bokstäver, siffror och bindestreck'),
  name: z.string().min(1, 'Namn är obligatoriskt').max(100, 'Namnet får vara max 100 tecken'),
  type: OrgUnitTypeSchema,
  costCenter: z.string().regex(/^\d{4}$/, 'Kostnadsställe måste vara 4 siffror'),
  manager: z.string().max(100, 'Chef får vara max 100 tecken').optional()
});

export const OrgUnitUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  manager: z.string().max(100).optional(),
  costCenter: z.string().regex(/^\d{4}$/).optional()
});

class ValidationService {
  /**
   * Validera att costCenter är unikt över hela trädet
   */
  validateUniqueCostCenter(org: OrgUnit, costCenter: string, excludeId?: string): ValidationResult {
    const issues: string[] = [];
    const costCenters = this.getAllCostCenters(org, excludeId);

    if (costCenters.has(costCenter)) {
      issues.push(`Kostnadsställe ${costCenter} finns redan`);
    }

    return { valid: issues.length === 0, issues };
  }

  /**
   * Validera att ID är unikt över hela trädet
   */
  validateUniqueId(org: OrgUnit, id: string, excludeId?: string): ValidationResult {
    const issues: string[] = [];
    const ids = this.getAllIds(org, excludeId);

    if (ids.has(id)) {
      issues.push(`ID ${id} finns redan`);
    }

    return { valid: issues.length === 0, issues };
  }

  /**
   * Validera hela organisationsstrukturen
   */
  validateOrganization(org: OrgUnit): ValidationResult {
    const issues: string[] = [];
    const costCenters = new Set<string>();
    const ids = new Set<string>();

    const validate = (unit: OrgUnit, depth: number = 0, parentType?: string) => {
      // Kontrollera duplicerade cost centers
      if (costCenters.has(unit.costCenter)) {
        issues.push(`Duplicerat kostnadsställe: ${unit.costCenter} (enhet: ${unit.name})`);
      }
      costCenters.add(unit.costCenter);

      // Kontrollera duplicerade IDs
      if (ids.has(unit.id)) {
        issues.push(`Duplicerat ID: ${unit.id} (enhet: ${unit.name})`);
      }
      ids.add(unit.id);

      // Validera hierarki-regler
      if (unit.type === 'koncern' && depth > 0) {
        issues.push(`Koncern kan endast vara på toppnivå (${unit.name})`);
      }

      if (unit.type === 'stab' && parentType !== 'division') {
        issues.push(`Stab måste vara direkt under division (${unit.name})`);
      }

      // Rekursivt validera barn
      if (unit.children) {
        unit.children.forEach(child => validate(child, depth + 1, unit.type));
      }
    };

    validate(org);
    return { valid: issues.length === 0, issues };
  }

  /**
   * Validera att en enhet kan tas bort
   */
  validateDelete(unit: OrgUnit, allowChildren: boolean = false): ValidationResult {
    const issues: string[] = [];

    if (!allowChildren && unit.children && unit.children.length > 0) {
      issues.push(`Enheten ${unit.name} har ${unit.children.length} underenheter och kan inte tas bort`);
    }

    return { valid: issues.length === 0, issues };
  }

  /**
   * Validera flyttning av enhet
   */
  validateMove(unit: OrgUnit, newParent: OrgUnit, org: OrgUnit): ValidationResult {
    const issues: string[] = [];

    // Kan inte flytta till sig själv
    if (unit.id === newParent.id) {
      issues.push('Kan inte flytta enhet till sig själv');
      return { valid: false, issues };
    }

    // Kan inte flytta till egen descendant
    if (this.isDescendant(unit, newParent)) {
      issues.push('Kan inte flytta enhet till egen underenhet');
    }

    // Validera hierarki-regler
    if (unit.type === 'koncern') {
      issues.push('Kan inte flytta koncernnivån');
    }

    if (unit.type === 'stab' && newParent.type !== 'division') {
      issues.push('Stab kan endast vara direkt under division');
    }

    return { valid: issues.length === 0, issues };
  }

  /**
   * Hitta enhet med specifikt costCenter
   */
  findByCostCenter(org: OrgUnit, costCenter: string): OrgUnit | null {
    if (org.costCenter === costCenter) return org;

    if (org.children) {
      for (const child of org.children) {
        const found = this.findByCostCenter(child, costCenter);
        if (found) return found;
      }
    }

    return null;
  }

  /**
   * Hitta enhet med specifikt ID
   */
  findById(org: OrgUnit, id: string): OrgUnit | null {
    if (org.id === id) return org;

    if (org.children) {
      for (const child of org.children) {
        const found = this.findById(child, id);
        if (found) return found;
      }
    }

    return null;
  }

  /**
   * Kontrollera om en enhet är descendant av en annan
   */
  private isDescendant(ancestor: OrgUnit, potentialDescendant: OrgUnit): boolean {
    if (!ancestor.children) return false;

    for (const child of ancestor.children) {
      if (child.id === potentialDescendant.id) return true;
      if (this.isDescendant(child, potentialDescendant)) return true;
    }

    return false;
  }

  /**
   * Samla alla cost centers (utom exkluderade)
   */
  private getAllCostCenters(org: OrgUnit, excludeId?: string): Set<string> {
    const costCenters = new Set<string>();

    const collect = (unit: OrgUnit) => {
      if (unit.id !== excludeId) {
        costCenters.add(unit.costCenter);
      }
      if (unit.children) {
        unit.children.forEach(collect);
      }
    };

    collect(org);
    return costCenters;
  }

  /**
   * Samla alla IDs (utom exkluderade)
   */
  private getAllIds(org: OrgUnit, excludeId?: string): Set<string> {
    const ids = new Set<string>();

    const collect = (unit: OrgUnit) => {
      if (unit.id !== excludeId) {
        ids.add(unit.id);
      }
      if (unit.children) {
        unit.children.forEach(collect);
      }
    };

    collect(org);
    return ids;
  }
}

export const validationService = new ValidationService();
