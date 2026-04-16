CREATE TABLE `blast_recipients` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `blast_id` bigint(20) UNSIGNED NOT NULL,
  `phone` varchar(32) NOT NULL,
  `status` enum('pending','sending','sent','delivered','read','failed') NOT NULL DEFAULT 'pending',
  `retry_count` int(11) NOT NULL DEFAULT 0,
  `next_attempt_at` datetime DEFAULT NULL,
  `locked_at` datetime DEFAULT NULL,
  `worker_id` varchar(64) DEFAULT NULL,
  `last_error` text DEFAULT NULL,
  `wa_message_id` varchar(128) DEFAULT NULL,
  `template_send` longtext NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;