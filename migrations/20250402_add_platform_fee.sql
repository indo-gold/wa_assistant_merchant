-- ============================================================================
-- MIGRATION: Add Platform Fee Columns to Order Payments
-- ============================================================================
-- Description: Add columns for platform fee tracking
-- Date: 2025-04-02
-- ============================================================================

-- Tambah kolom platform fee ke order_payments
ALTER TABLE order_payments 
ADD COLUMN fee_type ENUM('percent', 'flat') DEFAULT 'percent' COMMENT 'Tipe platform fee: percent atau flat',
ADD COLUMN platform_fee_amount DECIMAL(15,2) NOT NULL DEFAULT 0 COMMENT 'Jumlah platform fee yang di-charge',
ADD COLUMN merchant_amount DECIMAL(15,2) NOT NULL DEFAULT 0 COMMENT 'Jumlah yang diterima merchant (setelah dipotong fee)',
ADD COLUMN fee_percent DECIMAL(5,2) NULL COMMENT 'Persentase fee (untuk history)',
ADD COLUMN fee_flat INT NULL COMMENT 'Flat fee amount (untuk history)';

-- Tambah index untuk query laporan
CREATE INDEX idx_fee_type ON order_payments(fee_type);
CREATE INDEX idx_platform_fee ON order_payments(platform_fee_amount);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Cek struktur tabel
-- DESCRIBE order_payments;

-- Query laporan platform fee per periode
-- SELECT 
--   DATE(created_at) as date,
--   fee_type,
--   COUNT(*) as total_orders,
--   SUM(amount) as total_transaction,
--   SUM(platform_fee_amount) as total_platform_fee,
--   SUM(merchant_amount) as total_merchant_amount
-- FROM order_payments
-- WHERE status = 'paid'
-- GROUP BY DATE(created_at), fee_type;
