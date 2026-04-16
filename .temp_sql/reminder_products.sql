CREATE TABLE `reminder_products` (
  `id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `product_name` varchar(100) NOT NULL,
  `variant_name` varchar(50) DEFAULT NULL,
  `denomination` double NOT NULL,
  `followup` datetime DEFAULT NULL,
  `from` enum('user request reminder','failed order') NOT NULL,
  `user_id` int(11) NOT NULL,
  `wa_message_id` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;