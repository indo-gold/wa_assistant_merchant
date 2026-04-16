CREATE TABLE `blast_message_logs` (
  `id` int(11) NOT NULL,
  `meta_blast_message_id` int(11) NOT NULL,
  `phone_number` varchar(20) NOT NULL,
  `status` enum('success','failed') NOT NULL,
  `json` longtext DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;