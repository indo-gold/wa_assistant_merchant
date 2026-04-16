CREATE TABLE `meta_templates_message` (
  `id` int(11) NOT NULL,
  `template_id` varchar(50) NOT NULL,
  `template_name` varchar(255) NOT NULL,
  `category` enum('marketing','utility','authentication') NOT NULL,
  `status` enum('pending','rejected','approved') NOT NULL,
  `json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `meta_response` longtext DEFAULT NULL,
  `media_url` longtext NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1;