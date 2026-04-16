CREATE TABLE `users` (
  `id` int(11) NOT NULL COMMENT 'di User',
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('active','block','silent_bot') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `pin` enum('active','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'inactive',
  `timestamp` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;