CREATE TABLE `order` (
  `id` int(11) NOT NULL,
  `cart_id` int(11) NOT NULL,
  `wa_message_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `link_invoice` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `follow_up` datetime DEFAULT NULL,
  `user_id` int(11) NOT NULL,
  `payment_status` enum('pending','paid','failed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending' COMMENT 'Status pembayaran: pending, paid, failed, cancelled',
  `payment_id` int(11) DEFAULT NULL,
  `otp_verified` tinyint(1) NOT NULL DEFAULT 0,
  `pickup_status` enum('pending','ready','picked_up','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `picked_up_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL COMMENT 'Waktu order dibatalkan (jika status failed/cancelled)',
  `cancellation_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Alasan pembatalan order'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;