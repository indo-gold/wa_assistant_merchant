CREATE TABLE `upload_recipients` (
  `id` int(11) NOT NULL,
  `uuid` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `upload_path` varchar(500) NOT NULL,
  `file_size` int(11) NOT NULL,
  `total_contacts` int(11) NOT NULL,
  `valid_contacts` int(11) DEFAULT 0,
  `invalid_contacts` int(11) DEFAULT 0,
  `hash` varchar(64) DEFAULT NULL,
  `status` enum('draft','ready','used','archived') DEFAULT 'draft',
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;