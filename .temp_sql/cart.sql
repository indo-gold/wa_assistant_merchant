CREATE TABLE `cart` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `wa_message_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `json_order` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `status_order` enum('pending','cancelled','approved') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `follow_up` datetime DEFAULT NULL,
  `timestamp` datetime DEFAULT NULL,
  `price_locked_at` datetime DEFAULT NULL COMMENT 'Timestamp saat harga di-lock untuk checkout',
  `price_lock_duration_minutes` int(11) NOT NULL DEFAULT 30 COMMENT 'Durasi price lock dalam menit (default: 30 menit)',
  `expires_at` datetime DEFAULT NULL COMMENT 'Waktu expired cart (default: 24 jam dari pembuatan)',
  `original_prices_snapshot` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Snapshot harga produk saat cart dibuat untuk perbandingan',
  `price_validated_at` datetime DEFAULT NULL COMMENT 'Timestamp terakhir validasi harga berhasil'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;