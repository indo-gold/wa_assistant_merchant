CREATE TABLE `account_whatsapp` (
  `id` int(11) NOT NULL,
  `sender_name` varchar(50) NOT NULL,
  `business_id` varchar(255) NOT NULL,
  `phone_number_id` varchar(255) NOT NULL,
  `waba_id` varchar(255) NOT NULL,
  `meta_app_id` varchar(255) NOT NULL,
  `whatsapp_access_token` text NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1;