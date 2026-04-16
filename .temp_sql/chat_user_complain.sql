CREATE TABLE `chat_user_complain` (
  `id` int(11) NOT NULL,
  `wa_message_id` varchar(255) NOT NULL,
  `issue_category` enum('link','image','aI assistant intelligence','product','response speed','language style','other') NOT NULL,
  `timestamp` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;