/**
 * ============================================================================
 * KTP VERIFICATION SERVICE
 * ============================================================================
 *
 * Service untuk menyimpan dan mengelola data verifikasi KTP.
 *
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { KtpVerification } from '../../../database/models';

export interface KtpData {
  nik?: string | null;
  nama?: string | null;
  tempat_lahir?: string | null;
  tanggal_lahir?: string | null;
  jenis_kelamin?: string | null;
  alamat?: string | null;
  rt?: string | null;
  rw?: string | null;
  kelurahan?: string | null;
  kecamatan?: string | null;
  kabupaten?: string | null;
  provinsi?: string | null;
  agama?: string | null;
  status_perkawinan?: string | null;
  pekerjaan?: string | null;
  kewarganegaraan?: string | null;
  berlaku_hingga?: string | null;
}

@Injectable()
export class KtpVerificationService {
  private readonly logger = new Logger(KtpVerificationService.name);

  constructor(
    @InjectModel(KtpVerification)
    private readonly ktpModel: typeof KtpVerification,
  ) {}

  /**
   * ==========================================================================
   * SAVE KTP DATA
   * ==========================================================================
   * Simpan atau update data KTP user.
   * Jika user sudah punya data KTP sebelumnya, update record lama.
   */
  async save(
    userId: number,
    ktpData: KtpData,
    fileUrl: string,
    rawOcr?: Record<string, unknown>,
  ): Promise<KtpVerification> {
    try {
      const existing = await this.ktpModel.findOne({
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
      });

      const payload = {
        nik: ktpData.nik || null,
        nama: ktpData.nama || null,
        tempat_lahir: ktpData.tempat_lahir || null,
        tanggal_lahir: ktpData.tanggal_lahir || null,
        jenis_kelamin: ktpData.jenis_kelamin || null,
        alamat: ktpData.alamat || null,
        rt: ktpData.rt || null,
        rw: ktpData.rw || null,
        kelurahan: ktpData.kelurahan || null,
        kecamatan: ktpData.kecamatan || null,
        kabupaten: ktpData.kabupaten || null,
        provinsi: ktpData.provinsi || null,
        agama: ktpData.agama || null,
        status_perkawinan: ktpData.status_perkawinan || null,
        pekerjaan: ktpData.pekerjaan || null,
        kewarganegaraan: ktpData.kewarganegaraan || null,
        berlaku_hingga: ktpData.berlaku_hingga || null,
        file_url: fileUrl,
        raw_ocr: rawOcr || null,
      };

      if (existing) {
        await existing.update(payload);
        this.logger.log(`KTP updated for user ${userId}`);
        return existing;
      }

      const created = await this.ktpModel.create({
        user_id: userId,
        ...payload,
      });

      this.logger.log(`KTP saved for user ${userId}`);
      return created;
    } catch (error) {
      this.logger.error(`Failed to save KTP: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * ==========================================================================
   * GET KTP BY USER
   * ==========================================================================
   */
  async findByUser(userId: number): Promise<KtpVerification | null> {
    return this.ktpModel.findOne({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
    });
  }
}
