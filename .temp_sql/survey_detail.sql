CREATE TABLE `survey_detail` (
  `id` int(11) NOT NULL,
  `survey_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `activity` enum('generate_link','open_link','completed') NOT NULL,
  `unique` text NOT NULL,
  `wa_message_id` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1;