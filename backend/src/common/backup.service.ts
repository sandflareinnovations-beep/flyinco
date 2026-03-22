import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { exec } from 'child_process';
import * as cron from 'node-cron';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class BackupService implements OnModuleInit {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir = path.resolve(process.cwd(), 'backups');

  onModuleInit() {
    this.ensureBackupDir();
    // Schedule backup every day at midnight Saudi Time (00:00)
    cron.schedule('0 0 * * *', () => {
      this.handleBackup();
    });
    this.logger.log('💿 Automated Daily Backup Service Initialized (Scheduled: 00:00)');
  }

  private ensureBackupDir() {
    if (!fs.existsSync(this.backupDir)) {
      try {
        fs.mkdirSync(this.backupDir, { recursive: true });
        this.logger.log(`📁 Backup directory created: ${this.backupDir}`);
      } catch (err) {
        this.logger.error(`❌ Failed to create backup directory: ${err.message}`);
      }
    }
  }

  async handleBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `flyinco-backup-${timestamp}.sql`;
    const filePath = path.join(this.backupDir, filename);

    // Get Database URL from env
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      this.logger.error('❌ DATABASE_URL missing. Backup failed.');
      return;
    }

    this.logger.log(`🚀 Starting database backup: ${filename}...`);

    // Use pg_dump to backup the database
    // Note: pg_dump must be installed on the system (usually part of postgres)
    const command = `pg_dump "${dbUrl}" > "${filePath}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        this.logger.error(`❌ Backup Error: ${error.message}`);
        return;
      }
      this.logger.log(`✅ Backup Successful: ${filePath}`);
      this.cleanOldBackups();
    });
  }

  private cleanOldBackups() {
    // Keep only the last 30 days of backups
    try {
      const files = fs.readdirSync(this.backupDir);
      const now = Date.now();
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days

      for (const file of files) {
        const filePath = path.join(this.backupDir, file);
        const stats = fs.statSync(filePath);
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          this.logger.log(`🧹 Deleted old backup: ${file}`);
        }
      }
    } catch (err) {
      this.logger.error(`❌ Cleanup Error: ${err.message}`);
    }
  }
}
