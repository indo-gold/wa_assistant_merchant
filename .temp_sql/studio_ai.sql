CREATE TABLE `studio_ai` (
  `id` int(11) NOT NULL,
  `studio` varchar(25) NOT NULL,
  `is_active` enum('active','inactive') NOT NULL,
  `is_used` enum('0','1') NOT NULL,
  `hybrid` int(11) NOT NULL COMMENT '0=tidak, 1=iya'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;