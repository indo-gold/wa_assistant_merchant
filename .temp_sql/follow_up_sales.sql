CREATE TABLE `follow_up_sales` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `follow_up_by` int(11) NOT NULL,
  `user_result` enum('no response','not_interested','purchase') DEFAULT NULL,
  `remarks` text NOT NULL,
  `follow_up_date` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;