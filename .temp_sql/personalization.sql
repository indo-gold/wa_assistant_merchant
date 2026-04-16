CREATE TABLE `personalization` (
  `id` int(11) NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `personality` text DEFAULT NULL,
  `nickname` varchar(100) DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `occupation` varchar(100) DEFAULT NULL,
  `language_style` varchar(50) DEFAULT NULL,
  `interests` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `reminder` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `timestamp` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;