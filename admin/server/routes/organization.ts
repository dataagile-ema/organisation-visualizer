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

    // Uppdatera fält
    if (updates.name !== undefined) unit.name = updates.name;
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

    // Hantera barn
    if (unit.children && unit.children.length > 0) {
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
        newParent.children.push(...unit.children);
      } else {
        // Kan inte ta bort enhet med barn
        return res.status(422).json({
          success: false,
          error: 'Validation Error',
          message: `Enheten har ${unit.children.length} underenheter. Ange reassignChildrenTo för att flytta dem.`,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Ta bort enheten
    if (parent.children) {
      parent.children.splice(unitIndex, 1);
    }

    // Spara
    await fileService.writeOrganization(organization);

    const response: ApiResponse = {
      success: true,
      message: `Enhet ${unit.name} togs bort`,
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
