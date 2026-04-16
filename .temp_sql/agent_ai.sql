CREATE TABLE `agent_ai` (
  `id` int(11) NOT NULL,
  `studio_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `model_id` int(11) NOT NULL,
  `hybrid_model_id` int(11) DEFAULT NULL,
  `parameters` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `instruction` text DEFAULT NULL,
  `is_used` enum('0','1') NOT NULL,
  `timestamp` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1;