CREATE TABLE `user_penalty` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `penalty_until` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `status` enum('running','end') NOT NULL DEFAULT 'running',
  `timestamp` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;