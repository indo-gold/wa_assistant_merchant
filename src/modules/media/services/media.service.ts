/**
 * ============================================================================
 * MEDIA SERVICE
 * ============================================================================
 * 
 * Service untuk file upload dan download.
 * 
 * Fitur:
 * - Upload file dari multipart/form-data
 * - Download file dari WhatsApp CDN
 * - Generate file URL
 * - Cleanup old files
 * 
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { MultipartFile } from '@fastify/multipart';

export interface UploadedFile {
  id: number;
  filename: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
}

export interface FileInfo {
  filename: string;
  originalName: string;
  url: string;
  path: string;
}

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly mediaDir: string;
  private readonly baseUrl: string;
  private readonly allowedTypes = ['image', 'audio', 'video', 'document'];

  constructor(private readonly configService: ConfigService) {
    this.mediaDir = path.join(process.cwd(), 'media');
    this.baseUrl = this.configService.get<string>('app.url') || 'http://localhost:3000';
    
    // Ensure media directory exists
    this.ensureDirectoryExists(this.mediaDir);
  }

  /**
   * ==========================================================================
   * UPLOAD FILE
   * ==========================================================================
   * Upload file dari multipart form.
   */
  async uploadFile(file: MultipartFile): Promise<FileInfo> {
    try {
      // Determine file type
      const mimeType = file.mimetype;
      const typeCategory = this.getTypeCategory(mimeType);
      
      if (!this.allowedTypes.includes(typeCategory)) {
        throw new BadRequestException(`File type ${mimeType} not allowed`);
      }

      // Create type directory
      const typeDir = path.join(this.mediaDir, typeCategory);
      this.ensureDirectoryExists(typeDir);

      // Generate unique filename — sanitize originalName untuk cegah path traversal
      const originalName = file.filename;
      const sanitizedName = path.basename(originalName).replace(/[^a-zA-Z0-9._-]/g, '_');
      const uniqueId = uuidv4();
      const filename = `${uniqueId}-${sanitizedName}`;
      const filepath = path.join(typeDir, filename);

      // Verify filepath masih dalam typeDir (extra safety)
      const resolvedPath = path.resolve(filepath);
      if (!resolvedPath.startsWith(path.resolve(typeDir))) {
        throw new BadRequestException('Invalid filename');
      }

      // Save file
      await this.saveFile(file, filepath);

      // Generate URL
      const url = `${this.baseUrl}/media/${typeCategory}/${filename}`;

      this.logger.log(`File uploaded: ${filename}`);

      return {
        filename,
        originalName,
        url,
        path: filepath,
      };
    } catch (error) {
      this.logger.error(`Failed to upload file: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * ==========================================================================
   * SAVE FILE FROM BUFFER
   * ==========================================================================
   * Save file dari buffer (untuk media dari WhatsApp).
   */
  async saveFromBuffer(
    buffer: Buffer,
    typeCategory: string,
    originalName: string,
  ): Promise<FileInfo> {
    try {
      // Create type directory
      const typeDir = path.join(this.mediaDir, typeCategory);
      this.ensureDirectoryExists(typeDir);

      // Generate unique filename
      const uniqueId = uuidv4();
      const filename = `${uniqueId}-${originalName}`;
      const filepath = path.join(typeDir, filename);

      // Save file
      fs.writeFileSync(filepath, buffer);

      // Generate URL
      const url = `${this.baseUrl}/media/${typeCategory}/${filename}`;

      this.logger.log(`File saved: ${filename}`);

      return {
        filename,
        originalName,
        url,
        path: filepath,
      };
    } catch (error) {
      this.logger.error(`Failed to save file: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * ==========================================================================
   * GET FILE PATH
   * ==========================================================================
   * Get file path dari URL atau filename.
   */
  getFilePath(filePath: string): string {
    // Handle relative path dari media folder
    if (!path.isAbsolute(filePath)) {
      return path.join(this.mediaDir, filePath);
    }
    return filePath;
  }

  /**
   * ==========================================================================
   * DELETE FILE
   * ==========================================================================
   * Delete file dari storage.
   */
  deleteFile(filePath: string): boolean {
    try {
      const fullPath = this.getFilePath(filePath);
      
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        this.logger.log(`File deleted: ${filePath}`);
        return true;
      }
      
      return false;
    } catch (error) {
      this.logger.error(`Failed to delete file: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * ==========================================================================
   * GET FILE INFO
   * ==========================================================================
   * Get file info (size, mime type, etc).
   */
  getFileInfo(filePath: string): {
    size: number;
    mimeType: string;
    exists: boolean;
  } {
    const fullPath = this.getFilePath(filePath);
    
    if (!fs.existsSync(fullPath)) {
      return { size: 0, mimeType: 'application/octet-stream', exists: false };
    }

    const stat = fs.statSync(fullPath);
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = this.getMimeType(ext);

    return {
      size: stat.size,
      mimeType,
      exists: true,
    };
  }

  /**
   * ==========================================================================
   * ENSURE DIRECTORY EXISTS
   * ==========================================================================
   */
  private ensureDirectoryExists(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * ==========================================================================
   * SAVE FILE
   * ==========================================================================
   * Save file dari multipart ke disk.
   */
  private async saveFile(file: MultipartFile, filepath: string): Promise<void> {
    const writeStream = fs.createWriteStream(filepath);
    
    return new Promise((resolve, reject) => {
      file.file
        .pipe(writeStream)
        .on('finish', resolve)
        .on('error', reject);
    });
  }

  /**
   * ==========================================================================
   * GET TYPE CATEGORY
   * ==========================================================================
   * Get category dari mime type.
   */
  private getTypeCategory(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('video/')) return 'video';
    return 'document';
  }

  /**
   * ==========================================================================
   * GET MIME TYPE
   * ==========================================================================
   * Get mime type dari extension.
   */
  private getMimeType(ext: string): string {
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
      '.mp3': 'audio/mpeg',
      '.ogg': 'audio/ogg',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }
}
