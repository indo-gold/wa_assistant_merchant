-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Apr 16, 2026 at 04:59 AM
-- Server version: 10.3.36-MariaDB-log
-- PHP Version: 8.0.29

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `chatbot_retail`
--

-- --------------------------------------------------------

--
-- Table structure for table `account_whatsapp`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `admin`
--

CREATE TABLE `admin` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `role_id` int(11) NOT NULL,
  `is_active` enum('active','inactive') NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `admin_bot_onoff_notes`
--

CREATE TABLE `admin_bot_onoff_notes` (
  `id` int(11) NOT NULL,
  `admin_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `bot_status` enum('active','silent_bot') NOT NULL,
  `notes` text NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `admin_menu_items`
--

CREATE TABLE `admin_menu_items` (
  `id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `label` varchar(100) NOT NULL,
  `path` varchar(100) DEFAULT NULL,
  `icon` varchar(50) DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `admin_permissions`
--

CREATE TABLE `admin_permissions` (
  `id` int(11) NOT NULL,
  `resource` varchar(50) NOT NULL,
  `action` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `admin_role`
--

CREATE TABLE `admin_role` (
  `id` int(11) NOT NULL,
  `slug` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `is_active` enum('active','inactive') DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `admin_role_permissions`
--

CREATE TABLE `admin_role_permissions` (
  `id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL,
  `is_homepage` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `agent_ai`
--

CREATE TABLE `agent_ai` (
  `id` int(11) NOT NULL,
  `studio_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `model_id` int(11) NOT NULL,
  `hybrid_model_id` int(11) DEFAULT NULL,
  `parameters` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `instruction` text DEFAULT NULL,
  `is_used` enum('0','1') NOT NULL,
  `timestamp` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `blast_message_logs`
--

CREATE TABLE `blast_message_logs` (
  `id` int(11) NOT NULL,
  `meta_blast_message_id` int(11) NOT NULL,
  `phone_number` varchar(20) NOT NULL,
  `status` enum('success','failed') NOT NULL,
  `json` longtext DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `blast_recipients`
--

CREATE TABLE `blast_recipients` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `blast_id` bigint(20) UNSIGNED NOT NULL,
  `phone` varchar(32) NOT NULL,
  `status` enum('pending','sending','sent','delivered','read','failed') NOT NULL DEFAULT 'pending',
  `retry_count` int(11) NOT NULL DEFAULT 0,
  `next_attempt_at` datetime DEFAULT NULL,
  `locked_at` datetime DEFAULT NULL,
  `worker_id` varchar(64) DEFAULT NULL,
  `last_error` text DEFAULT NULL,
  `wa_message_id` varchar(128) DEFAULT NULL,
  `template_send` longtext NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `cart`
--

CREATE TABLE `cart` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `wa_message_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `json_order` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `status_order` enum('pending','cancelled','approved') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `follow_up` datetime DEFAULT NULL,
  `timestamp` datetime DEFAULT NULL,
  `price_locked_at` datetime DEFAULT NULL COMMENT 'Timestamp saat harga di-lock untuk checkout',
  `price_lock_duration_minutes` int(11) NOT NULL DEFAULT 30 COMMENT 'Durasi price lock dalam menit (default: 30 menit)',
  `expires_at` datetime DEFAULT NULL COMMENT 'Waktu expired cart (default: 24 jam dari pembuatan)',
  `original_prices_snapshot` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Snapshot harga produk saat cart dibuat untuk perbandingan',
  `price_validated_at` datetime DEFAULT NULL COMMENT 'Timestamp terakhir validasi harga berhasil'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chat_history`
--

CREATE TABLE `chat_history` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `wa_message_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reply_wa_message_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('text','interactive','image','striker','document','audio','video','order','template','reaction') COLLATE utf8mb4_unicode_ci DEFAULT 'text',
  `role` enum('assistant','user') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('sent','delivered','read','failed') COLLATE utf8mb4_unicode_ci NOT NULL,
  `json_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `admin_id` int(11) DEFAULT NULL,
  `is_llm_read` tinyint(1) NOT NULL DEFAULT 1,
  `timestamp` datetime DEFAULT NULL,
  `processed_content` text COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chat_user_complain`
--

CREATE TABLE `chat_user_complain` (
  `id` int(11) NOT NULL,
  `wa_message_id` varchar(255) NOT NULL,
  `issue_category` enum('link','image','aI assistant intelligence','product','response speed','language style','other') NOT NULL,
  `timestamp` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `cost`
--

CREATE TABLE `cost` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `object` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created` int(11) DEFAULT NULL,
  `model` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prompt_tokens` int(11) NOT NULL,
  `cached_tokens` int(11) NOT NULL,
  `completion_tokens` int(11) NOT NULL,
  `messages_payload` longtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `json_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `estimate_cost` float NOT NULL,
  `execution_time` float NOT NULL,
  `agent_id` int(11) DEFAULT NULL,
  `model_ai_id` int(11) NOT NULL,
  `wa_message_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `timestamp` datetime DEFAULT NULL,
  `operation_type` enum('chat_completion','vision_analysis','audio_transcription','tool_execution') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'chat_completion'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `error_log`
--

CREATE TABLE `error_log` (
  `id` int(11) NOT NULL,
  `error` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `timestamp` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `follow_up_sales`
--

CREATE TABLE `follow_up_sales` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `follow_up_by` int(11) NOT NULL,
  `user_result` enum('no response','not_interested','purchase') DEFAULT NULL,
  `remarks` text NOT NULL,
  `follow_up_date` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `general_variables`
--

CREATE TABLE `general_variables` (
  `id` int(11) NOT NULL,
  `variable` varchar(100) NOT NULL,
  `value` longtext NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `knowledge_base`
--

CREATE TABLE `knowledge_base` (
  `id` int(11) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `category_id` int(11) DEFAULT NULL,
  `question` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `answer` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `modified_by` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp(),
  `views` int(11) DEFAULT 0,
  `is_default` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `knowledge_base_categories`
--

CREATE TABLE `knowledge_base_categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `icon` varchar(50) DEFAULT 'file-text',
  `color` varchar(20) DEFAULT 'blue'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `ktp_verifications`
--

CREATE TABLE `ktp_verifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `order_id` int(11) DEFAULT NULL,
  `nik` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nama` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tempat_lahir` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tanggal_lahir` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `jenis_kelamin` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `alamat` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rt` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rw` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `kelurahan` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `kecamatan` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `kabupaten` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `provinsi` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `agama` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status_perkawinan` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pekerjaan` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `kewarganegaraan` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `berlaku_hingga` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_url` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `raw_ocr` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `is_verified` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `media_message`
--

CREATE TABLE `media_message` (
  `id` int(11) NOT NULL,
  `wa_message_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `original_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `url` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `caption` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `timestamp` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `meta_blast_message`
--

CREATE TABLE `meta_blast_message` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `template_id` int(11) NOT NULL,
  `status` enum('active','inactive') NOT NULL,
  `execute_date` datetime DEFAULT NULL,
  `is_send_now` tinyint(4) NOT NULL DEFAULT 0,
  `upload_recipients_id` int(11) NOT NULL,
  `upload_path` text NOT NULL,
  `recipients_loaded` tinyint(1) DEFAULT 0,
  `total_recipients` int(11) NOT NULL DEFAULT 0,
  `sent_count` int(11) NOT NULL DEFAULT 0,
  `delivered_count` int(11) NOT NULL DEFAULT 0,
  `read_count` int(11) NOT NULL DEFAULT 0,
  `failed_count` int(11) NOT NULL DEFAULT 0,
  `last_activity_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp(),
  `processing_status` enum('scheduled','processing','completed','error','paused') NOT NULL DEFAULT 'scheduled'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `meta_templates_message`
--

CREATE TABLE `meta_templates_message` (
  `id` int(11) NOT NULL,
  `template_id` varchar(50) NOT NULL,
  `template_name` varchar(255) NOT NULL,
  `category` enum('marketing','utility','authentication') NOT NULL,
  `status` enum('pending','rejected','approved') NOT NULL,
  `json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `meta_response` longtext DEFAULT NULL,
  `media_url` longtext NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `model_ai`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `order`
--

CREATE TABLE `order` (
  `id` int(11) NOT NULL,
  `cart_id` int(11) NOT NULL,
  `wa_message_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `link_invoice` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `follow_up` datetime DEFAULT NULL,
  `user_id` int(11) NOT NULL,
  `payment_status` enum('pending','paid','failed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending' COMMENT 'Status pembayaran: pending, paid, failed, cancelled',
  `payment_id` int(11) DEFAULT NULL,
  `otp_verified` tinyint(1) NOT NULL DEFAULT 0,
  `pickup_status` enum('pending','ready','picked_up','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `picked_up_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL COMMENT 'Waktu order dibatalkan (jika status failed/cancelled)',
  `cancellation_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Alasan pembatalan order'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `order_history`
--

CREATE TABLE `order_history` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `status` varchar(50) NOT NULL,
  `note` text DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `order_otps`
--

CREATE TABLE `order_otps` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `payment_id` int(11) NOT NULL,
  `otp_code` varchar(10) NOT NULL,
  `purpose` enum('pickup_verification','order_confirmation') DEFAULT 'pickup_verification',
  `status` enum('active','used','expired') DEFAULT 'active',
  `expires_at` datetime NOT NULL,
  `verified_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `order_payments`
--

CREATE TABLE `order_payments` (
  `id` int(11) NOT NULL,
  `order_id` int(11) DEFAULT NULL COMMENT 'FK ke orders (nullable karena order dibuat setelah payment success)',
  `cart_id` int(11) NOT NULL COMMENT 'FK ke cart',
  `user_id` int(11) NOT NULL COMMENT 'FK ke users',
  `xendit_invoice_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ID invoice dari Xendit',
  `xendit_external_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'External ID yang kita kirim ke Xendit',
  `payment_method` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL COMMENT 'Total amount',
  `currency` varchar(3) COLLATE utf8mb4_unicode_ci DEFAULT 'IDR',
  `status` enum('pending','paid','expired','failed','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `invoice_url` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'URL invoice Xendit',
  `payment_details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Detail pembayaran (VA number, QR string, etc)',
  `expiry_date` datetime DEFAULT NULL COMMENT 'Waktu expired invoice',
  `paid_at` datetime DEFAULT NULL COMMENT 'Waktu pembayaran berhasil',
  `xendit_callback_payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Raw payload dari Xendit webhook',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `fee_type` enum('percent','flat') COLLATE utf8mb4_unicode_ci DEFAULT 'percent',
  `platform_fee_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `merchant_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `fee_percent` decimal(5,2) DEFAULT NULL,
  `fee_flat` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `personalization`
--

CREATE TABLE `personalization` (
  `id` int(11) NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `personality` text DEFAULT NULL,
  `nickname` varchar(100) DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `occupation` varchar(100) DEFAULT NULL,
  `language_style` varchar(50) DEFAULT NULL,
  `interests` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `reminder` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `timestamp` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `products_history`
--

CREATE TABLE `products_history` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `product_name` varchar(50) NOT NULL,
  `variant_id` int(11) NOT NULL,
  `variant_name` varchar(50) NOT NULL,
  `denomination` double NOT NULL,
  `price` float NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `promos`
--

CREATE TABLE `promos` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `discount_type` enum('percentage','fixed_amount','free_shipping') COLLATE utf8mb4_unicode_ci NOT NULL,
  `discount_value` decimal(15,2) NOT NULL DEFAULT 0.00,
  `min_purchase_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `max_discount_amount` decimal(15,2) DEFAULT NULL,
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `applies_to_all_products` tinyint(1) NOT NULL DEFAULT 0,
  `is_single_product_promo` tinyint(1) NOT NULL DEFAULT 0,
  `usage_limit` int(10) UNSIGNED DEFAULT NULL,
  `banner_image` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `max_usage_per_user` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `promo_products`
--

CREATE TABLE `promo_products` (
  `promo_id` int(10) UNSIGNED NOT NULL,
  `product_id` int(11) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `promo_usage_logs`
--

CREATE TABLE `promo_usage_logs` (
  `id` int(10) UNSIGNED NOT NULL,
  `promo_id` int(10) UNSIGNED NOT NULL,
  `user_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `discount_amount` decimal(15,2) NOT NULL,
  `used_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reminder_products`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `sequelizemeta`
--

CREATE TABLE `sequelizemeta` (
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `studio_ai`
--

CREATE TABLE `studio_ai` (
  `id` int(11) NOT NULL,
  `studio` varchar(25) NOT NULL,
  `is_active` enum('active','inactive') NOT NULL,
  `is_used` enum('0','1') NOT NULL,
  `hybrid` int(11) NOT NULL COMMENT '0=tidak, 1=iya'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `survey`
--

CREATE TABLE `survey` (
  `id` int(11) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `text` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `time` int(11) NOT NULL,
  `status` enum('active','inactive') NOT NULL,
  `modifiy_by` int(11) NOT NULL,
  `delete` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `survey_detail`
--

CREATE TABLE `survey_detail` (
  `id` int(11) NOT NULL,
  `survey_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `activity` enum('generate_link','open_link','completed') NOT NULL,
  `unique` text NOT NULL,
  `wa_message_id` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `upload_recipients`
--

CREATE TABLE `upload_recipients` (
  `id` int(11) NOT NULL,
  `uuid` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `upload_path` varchar(500) NOT NULL,
  `file_size` int(11) NOT NULL,
  `total_contacts` int(11) NOT NULL,
  `valid_contacts` int(11) DEFAULT 0,
  `invalid_contacts` int(11) DEFAULT 0,
  `hash` varchar(64) DEFAULT NULL,
  `status` enum('draft','ready','used','archived') DEFAULT 'draft',
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL COMMENT 'di User',
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('active','block','silent_bot') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `pin` enum('active','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'inactive',
  `timestamp` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_need_help`
--

CREATE TABLE `user_need_help` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `topic` text DEFAULT NULL,
  `session_status` enum('waiting','closed') NOT NULL DEFAULT 'waiting',
  `remarks` text DEFAULT NULL,
  `timestamp` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `user_penalty`
--

CREATE TABLE `user_penalty` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `penalty_until` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `status` enum('running','end') NOT NULL DEFAULT 'running',
  `timestamp` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `webhook_request`
--

CREATE TABLE `webhook_request` (
  `id` int(11) NOT NULL,
  `nonce` varchar(255) NOT NULL,
  `timestamp` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `account_whatsapp`
--
ALTER TABLE `account_whatsapp`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `admin_bot_onoff_notes`
--
ALTER TABLE `admin_bot_onoff_notes`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `admin_menu_items`
--
ALTER TABLE `admin_menu_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `permission_id` (`permission_id`),
  ADD KEY `parent_id` (`parent_id`);

--
-- Indexes for table `admin_permissions`
--
ALTER TABLE `admin_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `resource_action` (`resource`,`action`);

--
-- Indexes for table `admin_role`
--
ALTER TABLE `admin_role`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `admin_role_permissions`
--
ALTER TABLE `admin_role_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `role_permission` (`role_id`,`permission_id`),
  ADD KEY `permission_id` (`permission_id`);

--
-- Indexes for table `agent_ai`
--
ALTER TABLE `agent_ai`
  ADD PRIMARY KEY (`id`),
  ADD KEY `studio_id` (`studio_id`),
  ADD KEY `idx_agent_ai_model_id` (`model_id`),
  ADD KEY `idx_agent_ai_hybrid_model_id` (`hybrid_model_id`);

--
-- Indexes for table `blast_message_logs`
--
ALTER TABLE `blast_message_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_meta_blast_message_id` (`meta_blast_message_id`),
  ADD KEY `idx_phone_number` (`phone_number`);

--
-- Indexes for table `blast_recipients`
--
ALTER TABLE `blast_recipients`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_blast_phone` (`blast_id`,`phone`),
  ADD KEY `idx_status_next` (`blast_id`,`status`,`next_attempt_at`),
  ADD KEY `idx_locked` (`blast_id`,`status`,`locked_at`);

--
-- Indexes for table `cart`
--
ALTER TABLE `cart`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_cart_status_expires` (`status_order`,`expires_at`),
  ADD KEY `idx_cart_status_price_lock` (`status_order`,`price_locked_at`);

--
-- Indexes for table `chat_history`
--
ALTER TABLE `chat_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);
ALTER TABLE `chat_history` ADD FULLTEXT KEY `idx_chat_history_processed_content` (`processed_content`);

--
-- Indexes for table `chat_user_complain`
--
ALTER TABLE `chat_user_complain`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `cost`
--
ALTER TABLE `cost`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `model_ai_id` (`model_ai_id`),
  ADD KEY `agent_id` (`agent_id`),
  ADD KEY `wa_message_id` (`wa_message_id`),
  ADD KEY `idx_cost_operation_type` (`operation_type`);

--
-- Indexes for table `error_log`
--
ALTER TABLE `error_log`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `follow_up_sales`
--
ALTER TABLE `follow_up_sales`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `general_variables`
--
ALTER TABLE `general_variables`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `variable` (`variable`);

--
-- Indexes for table `knowledge_base`
--
ALTER TABLE `knowledge_base`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_kb_category` (`category_id`);

--
-- Indexes for table `knowledge_base_categories`
--
ALTER TABLE `knowledge_base_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indexes for table `ktp_verifications`
--
ALTER TABLE `ktp_verifications`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_order_ktp` (`order_id`),
  ADD KEY `idx_ktp_verifications_user_id` (`user_id`),
  ADD KEY `idx_ktp_verifications_nik` (`nik`),
  ADD KEY `idx_order_id` (`order_id`);

--
-- Indexes for table `media_message`
--
ALTER TABLE `media_message`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `meta_blast_message`
--
ALTER TABLE `meta_blast_message`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_upload_recipients_id` (`upload_recipients_id`),
  ADD KEY `idx_meta_templates_message` (`template_id`);

--
-- Indexes for table `meta_templates_message`
--
ALTER TABLE `meta_templates_message`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `model_ai`
--
ALTER TABLE `model_ai`
  ADD PRIMARY KEY (`id`),
  ADD KEY `studio_id` (`studio_id`);

--
-- Indexes for table `order`
--
ALTER TABLE `order`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_order_status_cancelled` (`payment_status`,`cancelled_at`);

--
-- Indexes for table `order_history`
--
ALTER TABLE `order_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_order_id` (`order_id`);

--
-- Indexes for table `order_otps`
--
ALTER TABLE `order_otps`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_otp_code` (`otp_code`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_expires` (`expires_at`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `payment_id` (`payment_id`),
  ADD KEY `order_otps_ibfk_1` (`order_id`);

--
-- Indexes for table `order_payments`
--
ALTER TABLE `order_payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `xendit_external_id` (`xendit_external_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_xendit_invoice` (`xendit_invoice_id`),
  ADD KEY `idx_external_id` (`xendit_external_id`),
  ADD KEY `idx_expiry` (`expiry_date`),
  ADD KEY `cart_id` (`cart_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `personalization`
--
ALTER TABLE `personalization`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_product_variant_denomination` (`product_name`,`variant_name`,`denomination`);

--
-- Indexes for table `products_history`
--
ALTER TABLE `products_history`
  ADD PRIMARY KEY (`id`,`variant_id`,`variant_name`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `product_name` (`product_name`),
  ADD KEY `denomination` (`denomination`);

--
-- Indexes for table `promos`
--
ALTER TABLE `promos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_promo_active_dates` (`is_active`,`start_date`,`end_date`);

--
-- Indexes for table `promo_products`
--
ALTER TABLE `promo_products`
  ADD PRIMARY KEY (`promo_id`,`product_id`),
  ADD KEY `idx_promo_product_promo` (`promo_id`),
  ADD KEY `idx_promo_product_product` (`product_id`);

--
-- Indexes for table `promo_usage_logs`
--
ALTER TABLE `promo_usage_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_usage_promo` (`promo_id`),
  ADD KEY `idx_usage_user` (`user_id`);

--
-- Indexes for table `reminder_products`
--
ALTER TABLE `reminder_products`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sequelizemeta`
--
ALTER TABLE `sequelizemeta`
  ADD PRIMARY KEY (`name`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `studio_ai`
--
ALTER TABLE `studio_ai`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `survey`
--
ALTER TABLE `survey`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `title` (`title`);

--
-- Indexes for table `survey_detail`
--
ALTER TABLE `survey_detail`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `upload_recipients`
--
ALTER TABLE `upload_recipients`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uuid` (`uuid`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `phone_number` (`phone_number`),
  ADD UNIQUE KEY `phone_number_2` (`phone_number`),
  ADD UNIQUE KEY `phone_number_3` (`phone_number`),
  ADD UNIQUE KEY `phone_number_4` (`phone_number`),
  ADD UNIQUE KEY `phone_number_5` (`phone_number`),
  ADD UNIQUE KEY `phone_number_6` (`phone_number`),
  ADD UNIQUE KEY `phone_number_7` (`phone_number`),
  ADD UNIQUE KEY `phone_number_8` (`phone_number`),
  ADD UNIQUE KEY `phone_number_9` (`phone_number`),
  ADD UNIQUE KEY `phone_number_10` (`phone_number`),
  ADD UNIQUE KEY `phone_number_11` (`phone_number`),
  ADD UNIQUE KEY `phone_number_12` (`phone_number`),
  ADD UNIQUE KEY `phone_number_13` (`phone_number`),
  ADD UNIQUE KEY `phone_number_14` (`phone_number`),
  ADD UNIQUE KEY `phone_number_15` (`phone_number`),
  ADD UNIQUE KEY `phone_number_16` (`phone_number`),
  ADD UNIQUE KEY `phone_number_17` (`phone_number`),
  ADD UNIQUE KEY `phone_number_18` (`phone_number`),
  ADD UNIQUE KEY `phone_number_19` (`phone_number`),
  ADD UNIQUE KEY `phone_number_20` (`phone_number`),
  ADD UNIQUE KEY `phone_number_21` (`phone_number`),
  ADD UNIQUE KEY `phone_number_22` (`phone_number`),
  ADD UNIQUE KEY `phone_number_23` (`phone_number`),
  ADD UNIQUE KEY `phone_number_24` (`phone_number`),
  ADD UNIQUE KEY `phone_number_25` (`phone_number`),
  ADD UNIQUE KEY `phone_number_26` (`phone_number`),
  ADD UNIQUE KEY `phone_number_27` (`phone_number`),
  ADD UNIQUE KEY `phone_number_28` (`phone_number`),
  ADD UNIQUE KEY `phone_number_29` (`phone_number`),
  ADD UNIQUE KEY `phone_number_30` (`phone_number`),
  ADD UNIQUE KEY `phone_number_31` (`phone_number`),
  ADD UNIQUE KEY `phone_number_32` (`phone_number`),
  ADD UNIQUE KEY `phone_number_33` (`phone_number`),
  ADD UNIQUE KEY `phone_number_34` (`phone_number`),
  ADD UNIQUE KEY `phone_number_35` (`phone_number`),
  ADD UNIQUE KEY `phone_number_36` (`phone_number`);

--
-- Indexes for table `user_need_help`
--
ALTER TABLE `user_need_help`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_user_need_help_user` (`user_id`);

--
-- Indexes for table `user_penalty`
--
ALTER TABLE `user_penalty`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `webhook_request`
--
ALTER TABLE `webhook_request`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `account_whatsapp`
--
ALTER TABLE `account_whatsapp`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `admin`
--
ALTER TABLE `admin`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `admin_bot_onoff_notes`
--
ALTER TABLE `admin_bot_onoff_notes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `admin_menu_items`
--
ALTER TABLE `admin_menu_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `admin_permissions`
--
ALTER TABLE `admin_permissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `admin_role`
--
ALTER TABLE `admin_role`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `admin_role_permissions`
--
ALTER TABLE `admin_role_permissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `agent_ai`
--
ALTER TABLE `agent_ai`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `blast_message_logs`
--
ALTER TABLE `blast_message_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `blast_recipients`
--
ALTER TABLE `blast_recipients`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `cart`
--
ALTER TABLE `cart`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `chat_history`
--
ALTER TABLE `chat_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `chat_user_complain`
--
ALTER TABLE `chat_user_complain`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `cost`
--
ALTER TABLE `cost`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `error_log`
--
ALTER TABLE `error_log`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `follow_up_sales`
--
ALTER TABLE `follow_up_sales`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `general_variables`
--
ALTER TABLE `general_variables`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `knowledge_base`
--
ALTER TABLE `knowledge_base`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `knowledge_base_categories`
--
ALTER TABLE `knowledge_base_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ktp_verifications`
--
ALTER TABLE `ktp_verifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `media_message`
--
ALTER TABLE `media_message`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `meta_blast_message`
--
ALTER TABLE `meta_blast_message`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `meta_templates_message`
--
ALTER TABLE `meta_templates_message`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `model_ai`
--
ALTER TABLE `model_ai`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order`
--
ALTER TABLE `order`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_history`
--
ALTER TABLE `order_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_otps`
--
ALTER TABLE `order_otps`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_payments`
--
ALTER TABLE `order_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `personalization`
--
ALTER TABLE `personalization`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `promos`
--
ALTER TABLE `promos`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `promo_usage_logs`
--
ALTER TABLE `promo_usage_logs`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `reminder_products`
--
ALTER TABLE `reminder_products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `studio_ai`
--
ALTER TABLE `studio_ai`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `survey`
--
ALTER TABLE `survey`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `survey_detail`
--
ALTER TABLE `survey_detail`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `upload_recipients`
--
ALTER TABLE `upload_recipients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'di User';

--
-- AUTO_INCREMENT for table `user_need_help`
--
ALTER TABLE `user_need_help`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_penalty`
--
ALTER TABLE `user_penalty`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `webhook_request`
--
ALTER TABLE `webhook_request`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `admin_menu_items`
--
ALTER TABLE `admin_menu_items`
  ADD CONSTRAINT `fk_menu_parent` FOREIGN KEY (`parent_id`) REFERENCES `admin_menu_items` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_menu_permission` FOREIGN KEY (`permission_id`) REFERENCES `admin_permissions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `admin_role_permissions`
--
ALTER TABLE `admin_role_permissions`
  ADD CONSTRAINT `fk_role_perm_permission` FOREIGN KEY (`permission_id`) REFERENCES `admin_permissions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_role_perm_role` FOREIGN KEY (`role_id`) REFERENCES `admin_role` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `agent_ai`
--
ALTER TABLE `agent_ai`
  ADD CONSTRAINT `fk_agent_ai_hybrid_model_id` FOREIGN KEY (`hybrid_model_id`) REFERENCES `model_ai` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_agent_ai_model_id` FOREIGN KEY (`model_id`) REFERENCES `model_ai` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_agent_ai_studio_id` FOREIGN KEY (`studio_id`) REFERENCES `studio_ai` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `blast_message_logs`
--
ALTER TABLE `blast_message_logs`
  ADD CONSTRAINT `fk_blast_message_logs_blast` FOREIGN KEY (`meta_blast_message_id`) REFERENCES `meta_blast_message` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `cart`
--
ALTER TABLE `cart`
  ADD CONSTRAINT `cart_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Constraints for table `chat_history`
--
ALTER TABLE `chat_history`
  ADD CONSTRAINT `chat_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Constraints for table `knowledge_base`
--
ALTER TABLE `knowledge_base`
  ADD CONSTRAINT `fk_kb_category` FOREIGN KEY (`category_id`) REFERENCES `knowledge_base_categories` (`id`);

--
-- Constraints for table `ktp_verifications`
--
ALTER TABLE `ktp_verifications`
  ADD CONSTRAINT `fk_ktp_verifications_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `model_ai`
--
ALTER TABLE `model_ai`
  ADD CONSTRAINT `fk_model_ai_studio_id` FOREIGN KEY (`studio_id`) REFERENCES `studio_ai` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `order_history`
--
ALTER TABLE `order_history`
  ADD CONSTRAINT `order_history_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `order` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `order_otps`
--
ALTER TABLE `order_otps`
  ADD CONSTRAINT `order_otps_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `order` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_otps_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_otps_ibfk_3` FOREIGN KEY (`payment_id`) REFERENCES `order_payments` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `order_payments`
--
ALTER TABLE `order_payments`
  ADD CONSTRAINT `order_payments_ibfk_1` FOREIGN KEY (`cart_id`) REFERENCES `cart` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_payments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `promo_products`
--
ALTER TABLE `promo_products`
  ADD CONSTRAINT `fk_promo_product_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_promo_product_promo` FOREIGN KEY (`promo_id`) REFERENCES `promos` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `promo_usage_logs`
--
ALTER TABLE `promo_usage_logs`
  ADD CONSTRAINT `fk_usage_promo` FOREIGN KEY (`promo_id`) REFERENCES `promos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_usage_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_need_help`
--
ALTER TABLE `user_need_help`
  ADD CONSTRAINT `fk_user_need_help_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
