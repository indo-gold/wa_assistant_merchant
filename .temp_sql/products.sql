CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `product_name` varchar(50) NOT NULL,
  `variant_name` varchar(255) DEFAULT NULL,
  `denomination` double NOT NULL,
  `price` float NOT NULL,
  `max_quantity` int(11) NOT NULL,
  `products_sold` int(11) NOT NULL,
  `discount_price` float NOT NULL,
  `image` text NOT NULL,
  `is_po` tinyint(1) NOT NULL DEFAULT 0,
  `automatic_po` tinyint(1) NOT NULL DEFAULT 0,
  `est_date_po` int(3) NOT NULL DEFAULT 0,
  `stock_po` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1;