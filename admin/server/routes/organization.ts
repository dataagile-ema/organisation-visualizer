import express from 'express';
import { fileService } from '../services/fileService.js';
import { validationService, OrgUnitCreateSchema, OrgUnitUpdateSchema } from '../services/validationService.js';
import type {
  OrgUnit,
  ApiResponse,
  CreateUnitRequest,
  UpdateUnitRequest,
  DeleteUnitRequest,
  MoveUnitRequest,
  CostCenterCheckResponse
} from '../types/index.js';

const router = express.Router();

/**
 * GET / - Hämta hela organisationsträdet
 */
router.get('/', async (req, res, next) => {
  try {
    const organization = await fileService.readOrganization();

    const response: ApiResponse<OrgUnit> = {
      success: true,
      data: organization,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /:id - Hämta specifik enhet
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const organization = await fileService.readOrganization();
    const unit = validationService.findById(organization, id);

    if (!unit) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Enhet med ID ${id} hittades inte`,
        timestamp: new Date().toISOString()
      });
    }

    const response: ApiResponse<OrgUnit> = {
      success: true,
      data: unit,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /:parentId/unit - Skapa ny enhet under parent
 */
router.post('/:parentId/unit', async (req, res, next) => {
  try {
    const { parentId } = req.params;
    const unitData = req.body as CreateUnitRequest;

    // Validera input med Zod
    const validation = OrgUnitCreateSchema.safeParse(unitData);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: validation.error.errors.map(e => e.message).join(', '),
        timestamp: new Date().toISOString()
      });
    }

    // Läs nuvarande organisation
    const organization = await fileService.readOrganization();

    // Hitta parent
    const parent = validationService.findById(organization, parentId);
    if (!parent) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Parent-enhet med ID ${parentId} hittades inte`,
        timestamp: new Date().toISOString()
      });
    }

    // Validera att costCenter är unikt
    const costCenterCheck = validationService.validateUniqueCostCenter(
      organization,
      unitData.costCenter
    );
    if (!costCenterCheck.valid) {
      return res.status(422).json({
        success: false,
        error: 'Validation Error',
        message: costCenterCheck.issues.join(', '),
        timestamp: new Date().toISOString()
      });
    }

    // Validera att ID är unikt
    const idCheck = validationService.validateUniqueId(organization, unitData.id);
    if (!idCheck.valid) {
      return res.status(422).json({
        success: false,
        error: 'Validation Error',
        message: idCheck.issues.join(', '),
        timestamp: new Date().toISOString()
      });
    }

    // Validera att barntypen är tillåten under föräldern
    const childTypeCheck = validationService.validateChildType(parent.type, unitData.type);
    if (!childTypeCheck.valid) {
      return res.status(422).json({
        success: false,
        error: 'Validation Error',
        message: childTypeCheck.issues.join(', '),
        timestamp: new Date().toISOString()
      });
    }

    // Skapa ny enhet
    const newUnit: OrgUnit = {
      id: unitData.id,
      name: unitData.name,
      type: unitData.type,
      costCenter: unitData.costCenter,
      manager: unitData.manager
    };

    // Lägg till under parent
    if (!parent.children) {
      parent.children = [];
    }
    parent.children.push(newUnit);

    // Validera hela strukturen
    const structureValidation = validationService.validateOrganization(organization);
    if (!structureValidation.valid) {
      return res.status(422).json({
        success: false,
        error: 'Validation Error',
        message: structureValidation.issues.join(', '),
        timestamp: new Date().toISOString()
      });
    }

    // Spara
    await fileService.writeOrganization(organization);

    const response: ApiResponse<OrgUnit> = {
      success: true,
      data: newUnit,
      message: `Enhet ${newUnit.name} skapades`,
      timestamp: new Date().toISOString()
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /:id - Uppdatera enhet
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body as UpdateUnitRequest;

    // Validera input
    const validation = OrgUnitUpdateSchema.safeParse(updates);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: validation.error.errors.map(e => e.message).join(', '),
        timestamp: new Date().toISOString()
      });
    }

    // Läs organisation
    const organization = await fileService.readOrganization();
    const unit = validationService.findById(organization, id);

    if (!unit) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Enhet med ID ${id} hittades inte`,
        timestamp: new Date().toISOString()
      });
    }

    // Om costCenter ändras, validera unicitet
    if (updates.costCenter && updates.costCenter !== unit.costCenter) {
      const costCenterCheck = validationService.validateUniqueCostCenter(
        organization,
        updates.costCenter,
        id
      );
      if (!costCenterCheck.valid) {
        return res.status(422).json({
          success: false,
          error: 'Validation Error',
          message: costCenterCheck.issues.join(', '),
          timestamp: new Date().toISOString()
        });
      }
    }

    // Om typ ändras, validera mot hierarkiregler
    if (updates.type && updates.type !== unit.type) {
      const parent = validationService.findParent(organization, id);
      const typeCheck = validationService.validateTypeChange(
        unit,
        updates.type,
        parent?.type || null,
        organization
      );
      if (!typeCheck.valid) {
        return res.status(422).json({
          success: false,
          error: 'Validation Error',
          message: typeCheck.issues.join(', '),
          timestamp: new Date().toISOString()
        });
      }
    }

    // Uppdatera fält
    if (updates.name !== undefined) unit.name = updates.name;
    if (updates.type !== undefined) unit.type = updates.type;
    if (updates.manager !== undefined) unit.manager = updates.manager;
    if (updates.costCenter !== undefined) unit.costCenter = updates.costCenter;

    // Validera hela strukturen
    const structureValidation = validationService.validateOrganization(organization);
    if (!structureValidation.valid) {
      return res.status(422).json({
        success: false,
        error: 'Validation Error',
        message: structureValidation.issues.join(', '),
        timestamp: new Date().toISOString()
      });
    }

    // Spara
    await fileService.writeOrganization(organization);

    const response: ApiResponse<OrgUnit> = {
      success: true,
      data: unit,
      message: `Enhet ${unit.name} uppdaterades`,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /:id - Ta bort enhet
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reassignChildrenTo } = req.body as DeleteUnitRequest;

    // Läs organisation
    const organization = await fileService.readOrganization();

    // Kan inte ta bort root
    if (organization.id === id) {
      return res.status(422).json({
        success: false,
        error: 'Validation Error',
        message: 'Kan inte ta bort koncernnivån',
        timestamp: new Date().toISOString()
      });
    }

    // Hitta enhet och parent
    let parent: OrgUnit | null = null;
    let unit: OrgUnit | null = null;
    let unitIndex = -1;

    const findUnitAndParent = (current: OrgUnit, p: OrgUnit | null = null): boolean => {
      if (current.id === id) {
        unit = current;
        parent = p;
        return true;
      }

      if (current.children) {
        for (let i = 0; i < current.children.length; i++) {
          if (current.children[i].id === id) {
            unit = current.children[i];
            parent = current;
            unitIndex = i;
            return true;
          }
          if (findUnitAndParent(current.children[i], current)) {
            return true;
          }
        }
      }

      return false;
    };

    findUnitAndParent(organization);

    if (!unit || !parent) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Enhet med ID ${id} hittades inte`,
        timestamp: new Date().toISOString()
      });
    }

    // TypeScript kan inte följa closure-mutation, så vi skapar typade konstanter
    const foundUnit = unit as OrgUnit;
    const foundParent = parent as OrgUnit;

    // Hantera barn
    if (foundUnit.children && foundUnit.children.length > 0) {
      if (reassignChildrenTo) {
        // Flytta barn till annan enhet
        const newParent = validationService.findById(organization, reassignChildrenTo);
        if (!newParent) {
          return res.status(404).json({
            success: false,
            error: 'Not Found',
            message: `Ny parent-enhet med ID ${reassignChildrenTo} hittades inte`,
            timestamp: new Date().toISOString()
          });
        }

        if (!newParent.children) {
          newParent.children = [];
        }
        newParent.children.push(...foundUnit.children);
      } else {
        // Kan inte ta bort enhet med barn
        return res.status(422).json({
          success: false,
          error: 'Validation Error',
          message: `Enheten har ${foundUnit.children.length} underenheter. Ange reassignChildrenTo för att flytta dem.`,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Ta bort enheten
    if (foundParent.children) {
      foundParent.children.splice(unitIndex, 1);
    }

    // Spara
    await fileService.writeOrganization(organization);

    const response: ApiResponse = {
      success: true,
      message: `Enhet ${foundUnit.name} togs bort`,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /:id/move - Flytta enhet till ny parent
 */
router.post('/:id/move', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newParentId } = req.body as MoveUnitRequest;

    if (!newParentId) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'newParentId ar obligatoriskt',
        timestamp: new Date().toISOString()
      });
    }

    const organization = await fileService.readOrganization();

    if (organization.id === id) {
      return res.status(422).json({
        success: false,
        error: 'Validation Error',
        message: 'Kan inte flytta koncernnivan',
        timestamp: new Date().toISOString()
      });
    }

    let currentParent: OrgUnit | null = null;
    let unit: OrgUnit | null = null;
    let unitIndex = -1;

    const findUnitAndParent = (current: OrgUnit): boolean => {
      if (current.children) {
        for (let i = 0; i < current.children.length; i++) {
          if (current.children[i].id === id) {
            unit = current.children[i];
            currentParent = current;
            unitIndex = i;
            return true;
          }
          if (findUnitAndParent(current.children[i])) {
            return true;
          }
        }
      }
      return false;
    };

    findUnitAndParent(organization);

    if (!unit || !currentParent) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Enhet med ID ' + id + ' hittades inte',
        timestamp: new Date().toISOString()
      });
    }

    // TypeScript kan inte följa closure-mutation
    const foundUnit = unit as OrgUnit;
    const foundCurrentParent = currentParent as OrgUnit;

    const newParent = validationService.findById(organization, newParentId);
    if (!newParent) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Ny parent-enhet med ID ' + newParentId + ' hittades inte',
        timestamp: new Date().toISOString()
      });
    }

    const isDescendant = (parent: OrgUnit, targetId: string): boolean => {
      if (parent.id === targetId) return true;
      if (parent.children) {
        return parent.children.some(child => isDescendant(child, targetId));
      }
      return false;
    };

    if (isDescendant(foundUnit, newParentId)) {
      return res.status(422).json({
        success: false,
        error: 'Validation Error',
        message: 'Kan inte flytta enhet till sig sjalv eller sina underenheter',
        timestamp: new Date().toISOString()
      });
    }

    if (foundCurrentParent.children) {
      foundCurrentParent.children.splice(unitIndex, 1);
    }

    if (!newParent.children) {
      newParent.children = [];
    }
    newParent.children.push(foundUnit);

    const structureValidation = validationService.validateOrganization(organization);
    if (!structureValidation.valid) {
      return res.status(422).json({
        success: false,
        error: 'Validation Error',
        message: structureValidation.issues.join(', '),
        timestamp: new Date().toISOString()
      });
    }

    await fileService.writeOrganization(organization);

    const response: ApiResponse<OrgUnit> = {
      success: true,
      data: foundUnit,
      message: 'Enhet ' + foundUnit.name + ' flyttades till ' + newParent.name,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /validate/cost-center/:costCenter - Kontrollera om costCenter är unikt
 */
router.get('/validate/cost-center/:costCenter', async (req, res, next) => {
  try {
    const { costCenter } = req.params;
    const organization = await fileService.readOrganization();
    const existingUnit = validationService.findByCostCenter(organization, costCenter);

    const response: ApiResponse<CostCenterCheckResponse> = {
      success: true,
      data: {
        available: !existingUnit,
        existingUnit: existingUnit ? {
          id: existingUnit.id,
          name: existingUnit.name
        } : undefined
      },
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /types - Hämta alla giltiga enhetstyper
 */
router.get('/types', async (req, res, next) => {
  try {
    const types = validationService.getValidTypes();
    const typesWithLabels = types.map(type => ({
      value: type,
      label: validationService.getTypeConfig(type)?.label || type
    }));

    const response: ApiResponse = {
      success: true,
      data: typesWithLabels,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /types/:parentType/allowed-children - Hämta tillåtna barntyper för en föräldratyp
 */
router.get('/types/:parentType/allowed-children', async (req, res, next) => {
  try {
    const { parentType } = req.params;
    const allowedChildren = validationService.getAllowedChildTypes(parentType);
    const typesWithLabels = allowedChildren.map(type => ({
      value: type,
      label: validationService.getTypeConfig(type)?.label || type
    }));

    const response: ApiResponse = {
      success: true,
      data: typesWithLabels,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /backup - Skapa manuell backup
 */
router.post('/backup', async (req, res, next) => {
  try {
    const backupPath = await fileService.createBackup();

    const response: ApiResponse = {
      success: true,
      message: `Backup skapad`,
      data: { backupPath },
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;
