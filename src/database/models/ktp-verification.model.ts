/**
 * ============================================================================
 * KTP VERIFICATION MODEL
 * ============================================================================
 *
 * Model Sequelize untuk tabel ktp_verifications.
 * Menyimpan hasil OCR dan verifikasi data KTP dari gambar.
 *
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  ForeignKey,
  BelongsTo,
  Default,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { User } from './user.model';

@Table({
  tableName: 'ktp_verifications',
  timestamps: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
})
export class KtpVerification extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  /**
   * Foreign key ke table users
   */
  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  user_id!: number;

  /**
   * Nomor Induk Kependudukan
   */
  @Default(null)
  @Column(DataType.STRING)
  nik!: string | null;

  /**
   * Nama lengkap sesuai KTP
   */
  @Default(null)
  @Column(DataType.STRING)
  nama!: string | null;

  /**
   * Tempat lahir
   */
  @Default(null)
  @Column(DataType.STRING)
  tempat_lahir!: string | null;

  /**
   * Tanggal lahir
   */
  @Default(null)
  @Column(DataType.STRING)
  tanggal_lahir!: string | null;

  /**
   * Jenis kelamin
   */
  @Default(null)
  @Column(DataType.STRING)
  jenis_kelamin!: string | null;

  /**
   * Alamat lengkap
   */
  @Default(null)
  @Column(DataType.TEXT)
  alamat!: string | null;

  /**
   * RT
   */
  @Default(null)
  @Column(DataType.STRING)
  rt!: string | null;

  /**
   * RW
   */
  @Default(null)
  @Column(DataType.STRING)
  rw!: string | null;

  /**
   * Kelurahan / Desa
   */
  @Default(null)
  @Column(DataType.STRING)
  kelurahan!: string | null;

  /**
   * Kecamatan
   */
  @Default(null)
  @Column(DataType.STRING)
  kecamatan!: string | null;

  /**
   * Kabupaten / Kota
   */
  @Default(null)
  @Column(DataType.STRING)
  kabupaten!: string | null;

  /**
   * Provinsi
   */
  @Default(null)
  @Column(DataType.STRING)
  provinsi!: string | null;

  /**
   * Agama
   */
  @Default(null)
  @Column(DataType.STRING)
  agama!: string | null;

  /**
   * Status perkawinan
   */
  @Default(null)
  @Column(DataType.STRING)
  status_perkawinan!: string | null;

  /**
   * Pekerjaan
   */
  @Default(null)
  @Column(DataType.STRING)
  pekerjaan!: string | null;

  /**
   * Kewarganegaraan
   */
  @Default(null)
  @Column(DataType.STRING)
  kewarganegaraan!: string | null;

  /**
   * Berlaku hingga
   */
  @Default(null)
  @Column(DataType.STRING)
  berlaku_hingga!: string | null;

  /**
   * URL file gambar KTP yang tersimpan
   */
  @Default(null)
  @Column(DataType.TEXT)
  file_url!: string | null;

  /**
   * Raw OCR data dalam format JSON
   */
  @Default(null)
  @Column(DataType.JSON)
  raw_ocr!: Record<string, unknown> | null;

  /**
   * Flag apakah data KTP sudah terverifikasi
   */
  @Default(false)
  @Column(DataType.BOOLEAN)
  is_verified!: boolean;

  /**
   * Timestamp pembuatan record
   */
  @CreatedAt
  @Column(DataType.DATE)
  created_at!: Date;

  /**
   * Timestamp update record
   */
  @UpdatedAt
  @Column(DataType.DATE)
  updated_at!: Date;

  // ========================================================================
  // RELATIONSHIPS
  // ========================================================================

  /**
   * Many-to-One relationship dengan User
   */
  @BelongsTo(() => User, 'user_id')
  user!: User;
}
