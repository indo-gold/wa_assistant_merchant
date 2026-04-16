CREATE TABLE `general_variables` (
  `id` int(11) NOT NULL,
  `variable` varchar(100) NOT NULL,
  `value` longtext NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1;