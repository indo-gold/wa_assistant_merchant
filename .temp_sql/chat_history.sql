CREATE TABLE `chat_history` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `wa_message_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reply_wa_message_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('text','interactive','image','striker','document','audio','video','order','template','reaction') COLLATE utf8mb4_unicode_ci DEFAULT 'text',
  `role` enum('assistant','user') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('sent','delivered','read','failed') COLLATE utf8mb4_unicode_ci NOT NULL,
  `json_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `admin_id` int(11) DEFAULT NULL,
  `is_llm_read` tinyint(1) NOT NULL DEFAULT 1,
  `timestamp` datetime DEFAULT NULL,
  `processed_content` text COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;