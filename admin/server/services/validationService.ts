import { z } from 'zod';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { OrgUnit, ValidationResult } from '../types/index.js';

// Ladda unit-types.json från huvudappens data-katalog
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const unitTypesPath = join(__dirname, '..', '..', '..', 'src', 'data', 'unit-types.json');

interface UnitTypeConfig {
  label: string;
  color: { text: string; bg: string; badgeText: string };
  icon: string;
  allowedChildren: string[];
  allowedAtDepth: number[];
}

interface UnitTypesConfig {
  types: Record<string, UnitTypeConfig>;
  iconOverrides: { pattern: string; icon: string }[];
}

let unitTypesConfig: UnitTypesConfig;

function loadUnitTypes(): UnitTypesConfig {
  if (!unitTypesConfig) {
    try {
      const content = readFileSync(unitTypesPath, 'utf-8');
      unitTypesConfig = JSON.parse(content);
    } catch (error) {
      console.error('Kunde inte ladda unit-types.json:', error);
      // Fallback till hårdkodade typer om filen inte finns
      unitTypesConfig = {
        types: {
          koncern: { label: 'Koncern', color: { text: '', bg: '', badgeText: '' }, icon: '', allowedChildren: ['division'], allowedAtDepth: [0] },
          division: { label: 'Division', color: { text: '', bg: '', badgeText: '' }, icon: '', allowedChildren: ['avdelning', 'stab', 'enhet'], allowedAtDepth: [1] },
          avdelning: { label: 'Avdelning', color: { text: '', bg: '', badgeText: '' }, icon: '', allowedChildren: ['enhet', 'sektion'], allowedAtDepth: [2, 3] },
          sektion: { label: 'Sektion', color: { text: '', bg: '', badgeText: '' }, icon: '', allowedChildren: ['enhet'], allowedAtDepth: [3, 4] },
          stab: { label: 'Stab', color: { text: '', bg: '', badgeText: '' }, icon: '', allowedChildren: ['enhet'], allowedAtDepth: [2] },
          enhet: { label: 'Enhet', color: { text: '', bg: '', badgeText: '' }, icon: '', allowedChildren: [], allowedAtDepth: [2, 3, 4] }
        },
        iconOverrides: []
      };
    }
  }
  return unitTypesConfig;
}

// Dynamiskt Zod-schema som validerar mot konfigurerade typer
function getValidTypes(): string[] {
  return Object.keys(loadUnitTypes().types);
}

export const OrgUnitTypeSchema = z.string().min(1, 'Typ är obligatoriskt').refine(
  (type) => getValidTypes().includes(type),
  (type) => ({ message: `Ogiltig typ: ${type}. Giltiga typer: ${getValidTypes().join(', ')}` })
);

export const OrgUnitCreateSchema = z.object({
  id: z.string().min(1).regex(/^[a-z0-9-]+$/, 'ID får endast innehålla små bokstäver, siffror och bindestreck'),
  name: z.string().min(1, 'Namn är obligatoriskt').max(100, 'Namnet får vara max 100 tecken'),
  type: OrgUnitTypeSchema,
  costCenter: z.string().regex(/^\d{4}$/, 'Kostnadsställe måste vara 4 siffror'),
  manager: z.string().max(100, 'Chef får vara max 100 tecken').optional()
});

export const OrgUnitUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.string().min(1).refine(
    (type) => type === undefined || getValidTypes().includes(type),
    (type) => ({ message: `Ogiltig typ: ${type}. Giltiga typer: ${getValidTypes().join(', ')}` })
  ).optional(),
  manager: z.string().max(100).optional(),
  costCenter: z.string().regex(/^\d{4}$/).optional()
});

class ValidationService {
  /**
   * Hämta konfiguration för en enhetstyp
   */
  getTypeConfig(type: string): UnitTypeConfig | undefined {
    return loadUnitTypes().types[type];
  }

  /**
   * Hämta alla giltiga enhetstyper
   */
  getValidTypes(): string[] {
    return Object.keys(loadUnitTypes().types);
  }

  /**
   * Kontrollera om en typ är giltig
   */
  isValidType(type: string): boolean {
    return this.getValidTypes().includes(type);
  }

  /**
   * Hämta tillåtna barntyper för en föräldratyp
   */
  getAllowedChildTypes(parentType: string): string[] {
    const config = this.getTypeConfig(parentType);
    return config?.allowedChildren || [];
  }

  /**
   * Validera att en barntyp är tillåten under en föräldratyp
   */
  validateChildType(parentType: string, childType: string): ValidationResult {
    const issues: string[] = [];
    const allowedChildren = this.getAllowedChildTypes(parentType);

    if (!allowedChildren.includes(childType)) {
      const parentLabel = this.getTypeConfig(parentType)?.label || parentType;
      const childLabel = this.getTypeConfig(childType)?.label || childType;
      issues.push(`${childLabel} kan inte placeras under ${parentLabel}. Tillåtna typer: ${allowedChildren.join(', ') || 'inga'}`);
    }

    return { valid: issues.length === 0, issues };
  }

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
    const config = loadUnitTypes();

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

      // Validera att typen finns i konfigurationen
      const typeConfig = config.types[unit.type];
      if (!typeConfig) {
        issues.push(`Ogiltig typ "${unit.type}" för enhet ${unit.name}`);
      } else {
        // Validera djup
        if (!typeConfig.allowedAtDepth.includes(depth)) {
          issues.push(`${typeConfig.label} kan inte vara på djup ${depth} (${unit.name})`);
        }

        // Validera att enheten är tillåten under föräldern
        if (parentType) {
          const parentConfig = config.types[parentType];
          if (parentConfig && !parentConfig.allowedChildren.includes(unit.type)) {
            issues.push(`${typeConfig.label} kan inte placeras under ${parentConfig.label} (${unit.name})`);
          }
        }
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
    const config = loadUnitTypes();

    // Kan inte flytta till sig själv
    if (unit.id === newParent.id) {
      issues.push('Kan inte flytta enhet till sig själv');
      return { valid: false, issues };
    }

    // Kan inte flytta till egen descendant
    if (this.isDescendant(unit, newParent)) {
      issues.push('Kan inte flytta enhet till egen underenhet');
    }

    // Validera hierarki-regler från config
    const unitConfig = config.types[unit.type];
    const parentConfig = config.types[newParent.type];

    if (unitConfig?.allowedAtDepth.includes(0) && unitConfig.allowedAtDepth.length === 1) {
      issues.push(`Kan inte flytta ${unitConfig.label}`);
    }

    if (parentConfig && !parentConfig.allowedChildren.includes(unit.type)) {
      const unitLabel = unitConfig?.label || unit.type;
      issues.push(`${unitLabel} kan inte placeras under ${parentConfig.label}`);
    }

    return { valid: issues.length === 0, issues };
  }

  /**
   * Validera typändring
   */
  validateTypeChange(unit: OrgUnit, newType: string, parentType: string | null, org: OrgUnit): ValidationResult {
    const issues: string[] = [];
    const config = loadUnitTypes();

    // Kontrollera att nya typen finns
    if (!config.types[newType]) {
      issues.push(`Ogiltig typ: ${newType}`);
      return { valid: false, issues };
    }

    const newTypeConfig = config.types[newType];

    // Kontrollera att nya typen är tillåten under föräldern
    if (parentType) {
      const parentConfig = config.types[parentType];
      if (parentConfig && !parentConfig.allowedChildren.includes(newType)) {
        issues.push(`${newTypeConfig.label} kan inte placeras under ${parentConfig.label}`);
      }
    }

    // Kontrollera att enhetens barn fortfarande är tillåtna
    if (unit.children && unit.children.length > 0) {
      for (const child of unit.children) {
        if (!newTypeConfig.allowedChildren.includes(child.type)) {
          const childConfig = config.types[child.type];
          issues.push(`${childConfig?.label || child.type} kan inte vara under ${newTypeConfig.label}`);
        }
      }
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
   * Hitta förälder för en enhet
   */
  findParent(org: OrgUnit, unitId: string): OrgUnit | null {
    if (org.children) {
      for (const child of org.children) {
        if (child.id === unitId) {
          return org;
        }
        const found = this.findParent(child, unitId);
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
