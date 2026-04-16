CREATE TABLE `webhook_request` (
  `id` int(11) NOT NULL,
  `nonce` varchar(255) NOT NULL,
  `timestamp` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1;