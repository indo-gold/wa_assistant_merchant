CREATE TABLE `cost` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `object` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created` int(11) DEFAULT NULL,
  `model` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prompt_tokens` int(11) NOT NULL,
  `cached_tokens` int(11) NOT NULL,
  `completion_tokens` int(11) NOT NULL,
  `messages_payload` longtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `json_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `estimate_cost` float NOT NULL,
  `execution_time` float NOT NULL,
  `agent_id` int(11) DEFAULT NULL,
  `model_ai_id` int(11) NOT NULL,
  `wa_message_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `timestamp` datetime DEFAULT NULL,
  `operation_type` enum('chat_completion','vision_analysis','audio_transcription','tool_execution') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'chat_completion'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;