CREATE TABLE `user_need_help` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `topic` text DEFAULT NULL,
  `session_status` enum('waiting','closed') NOT NULL DEFAULT 'waiting',
  `remarks` text DEFAULT NULL,
  `timestamp` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;