import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import type { OrgUnit, ValidationResult } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class FileService {
  private dataDir = path.resolve(__dirname, '../../../src/data');
  private backupDir = path.resolve(__dirname, '../../../backups');
  private orgFilePath = path.join(this.dataDir, 'organization.json');

  /**
   * Läs organization.json
   */
  async readOrganization(): Promise<OrgUnit> {
    try {
      const data = await fs.readJSON(this.orgFilePath);
      return data as OrgUnit;
    } catch (error) {
      throw new Error(`Failed to read organization.json: ${(error as Error).message}`);
    }
  }

  /**
   * Skriv organization.json med atomisk operation och backup
   */
  async writeOrganization(data: OrgUnit): Promise<void> {
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const backupPath = path.join(this.backupDir, `organization.${timestamp}.json`);
    const tempPath = `${this.orgFilePath}.tmp`;

    try {
      // 1. Validera data (grundläggande struktur)
      if (!data || !data.id || !data.costCenter) {
        throw new Error('Invalid organization data structure');
      }

      // 2. Skapa backup-mapp om den inte finns
      await fs.ensureDir(this.backupDir);

      // 3. Skapa backup av nuvarande fil
      if (await fs.pathExists(this.orgFilePath)) {
        await fs.copy(this.orgFilePath, backupPath);
        console.log(`Backup created: ${backupPath}`);
      }

      // 4. Skriv till temporär fil
      await fs.writeJSON(tempPath, data, { spaces: 2 });

      // 5. Atomisk rename (OS-nivå operation)
      await fs.rename(tempPath, this.orgFilePath);
      console.log(`Organization data written successfully`);

      // 6. Rensa gamla backups (behåll senaste 10)
      await this.cleanupOldBackups();

    } catch (error) {
      // Rollback: återställ från backup vid fel
      if (await fs.pathExists(backupPath)) {
        try {
          await fs.copy(backupPath, this.orgFilePath);
          console.log('Rolled back changes from backup');
        } catch (rollbackError) {
          console.error('Failed to rollback:', rollbackError);
        }
      }

      // Rensa temporär fil om den finns
      if (await fs.pathExists(tempPath)) {
        await fs.remove(tempPath);
      }

      throw new Error(`Failed to write organization.json: ${(error as Error).message}`);
    }
  }

  /**
   * Skapa manuell backup
   */
  async createBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const backupPath = path.join(this.backupDir, `organization.manual.${timestamp}.json`);

    try {
      await fs.ensureDir(this.backupDir);
      if (await fs.pathExists(this.orgFilePath)) {
        await fs.copy(this.orgFilePath, backupPath);
        return backupPath;
      } else {
        throw new Error('Organization file does not exist');
      }
    } catch (error) {
      throw new Error(`Failed to create backup: ${(error as Error).message}`);
    }
  }

  /**
   * Rensa gamla backups (behåll senaste 10)
   */
  private async cleanupOldBackups(): Promise<void> {
    try {
      const files = await fs.readdir(this.backupDir);
      const backups = files
        .filter(f => f.startsWith('organization.') && f.endsWith('.json'))
        .sort()
        .reverse();

      // Ta bort alla utom de 10 senaste
      for (const file of backups.slice(10)) {
        await fs.remove(path.join(this.backupDir, file));
        console.log(`Removed old backup: ${file}`);
      }
    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
      // Inte kritiskt, fortsätt ändå
    }
  }

  /**
   * Lista alla backups
   */
  async listBackups(): Promise<string[]> {
    try {
      await fs.ensureDir(this.backupDir);
      const files = await fs.readdir(this.backupDir);
      return files
        .filter(f => f.startsWith('organization.') && f.endsWith('.json'))
        .sort()
        .reverse();
    } catch (error) {
      throw new Error(`Failed to list backups: ${(error as Error).message}`);
    }
  }

  /**
   * Återställ från backup
   */
  async restoreFromBackup(backupFileName: string): Promise<void> {
    const backupPath = path.join(this.backupDir, backupFileName);

    try {
      if (!await fs.pathExists(backupPath)) {
        throw new Error('Backup file does not exist');
      }

      // Skapa säkerhetsbackup innan återställning
      await this.createBackup();

      // Kopiera backup till huvudfil
      await fs.copy(backupPath, this.orgFilePath);
      console.log(`Restored from backup: ${backupFileName}`);
    } catch (error) {
      throw new Error(`Failed to restore from backup: ${(error as Error).message}`);
    }
  }
}

export const fileService = new FileService();
