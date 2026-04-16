CREATE TABLE `model_ai` (
  `id` int(11) NOT NULL,
  `studio_id` int(11) NOT NULL,
  `model` varchar(50) NOT NULL,
  `status` int(11) NOT NULL DEFAULT 1 COMMENT '1=aktif, 0=tidak aktif',
  `token_per` float NOT NULL,
  `input` float NOT NULL,
  `cached` float NOT NULL,
  `output` float NOT NULL,
  `rpm` int(11) NOT NULL,
  `rpd` int(11) NOT NULL,
  `tpm` int(11) NOT NULL,
  `tpd` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;