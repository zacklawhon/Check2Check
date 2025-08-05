-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Aug 02, 2025 at 01:41 AM
-- Server version: 10.11.10-MariaDB-log
-- PHP Version: 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `u976395984_3L98y`
--

-- --------------------------------------------------------

--
-- Table structure for table `auth_tokens`
--

CREATE TABLE `auth_tokens` (
  `id` int(11) UNSIGNED NOT NULL,
  `user_id` int(11) UNSIGNED NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `budget_cycles`
--

CREATE TABLE `budget_cycles` (
  `id` int(11) UNSIGNED NOT NULL,
  `user_id` int(11) UNSIGNED NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` enum('active','completed') NOT NULL DEFAULT 'active',
  `initial_income` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `initial_expenses` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `final_summary` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `budget_cycles`
--

INSERT INTO `budget_cycles` (`id`, `user_id`, `start_date`, `end_date`, `status`, `initial_income`, `initial_expenses`, `final_summary`, `created_at`) VALUES
(1, 1, '2025-07-16', '2025-07-29', 'completed', '[{\"id\":\"1\",\"user_id\":\"1\",\"label\":\"Zack\'s Check\",\"description\":null,\"frequency\":\"semi-monthly\",\"amount\":1204,\"is_active\":\"1\",\"created_at\":\"2025-07-29 15:11:23\"},{\"id\":\"2\",\"user_id\":\"1\",\"label\":\"Melody\'s Check\",\"description\":null,\"frequency\":\"semi-monthly\",\"amount\":\"1881.00\",\"is_active\":\"1\",\"created_at\":\"2025-07-29 15:11:34\"}]', '[{\"id\":\"1\",\"user_id\":\"1\",\"label\":\"RedBrick Financial\",\"due_date\":\"23\",\"estimated_amount\":\"140.00\",\"category\":\"loan\",\"principal_balance\":null,\"interest_rate\":null,\"maturity_date\":null,\"is_active\":\"1\",\"created_at\":\"2025-07-29 15:12:51\",\"type\":\"recurring\",\"is_paid\":true},{\"id\":\"2\",\"user_id\":\"1\",\"label\":\"Zack - Quick SIlver - 5006\",\"due_date\":\"28\",\"estimated_amount\":\"150.00\",\"category\":\"credit-card\",\"principal_balance\":null,\"interest_rate\":null,\"maturity_date\":null,\"is_active\":\"1\",\"created_at\":\"2025-07-29 15:13:07\",\"type\":\"recurring\",\"is_paid\":true},{\"id\":\"3\",\"user_id\":\"1\",\"label\":\"Melody - Quick Silver - 1473\",\"due_date\":\"19\",\"estimated_amount\":\"140.00\",\"category\":\"credit-card\",\"principal_balance\":null,\"interest_rate\":null,\"maturity_date\":null,\"is_active\":\"1\",\"created_at\":\"2025-07-29 15:13:21\",\"type\":\"recurring\",\"is_paid\":true},{\"id\":\"4\",\"user_id\":\"1\",\"label\":\"Melody - Quick Silver - 7403\",\"due_date\":\"19\",\"estimated_amount\":\"15.49\",\"category\":\"credit-card\",\"principal_balance\":null,\"interest_rate\":null,\"maturity_date\":null,\"is_active\":\"1\",\"created_at\":\"2025-07-29 15:13:34\",\"type\":\"recurring\",\"is_paid\":true},{\"id\":\"5\",\"user_id\":\"1\",\"label\":\"Zack - Discover It - 5869\",\"due_date\":\"19\",\"estimated_amount\":\"140.00\",\"category\":\"credit-card\",\"principal_balance\":null,\"interest_rate\":null,\"maturity_date\":null,\"is_active\":\"1\",\"created_at\":\"2025-07-29 15:13:45\",\"type\":\"recurring\",\"is_paid\":true},{\"id\":\"6\",\"user_id\":\"1\",\"label\":\"Zack - Custom Cash - 8486\",\"due_date\":\"20\",\"estimated_amount\":\"50.00\",\"category\":\"credit-card\",\"principal_balance\":null,\"interest_rate\":null,\"maturity_date\":null,\"is_active\":\"1\",\"created_at\":\"2025-07-29 15:13:59\",\"type\":\"recurring\",\"is_paid\":true},{\"id\":\"7\",\"user_id\":\"1\",\"label\":\"ONG\",\"due_date\":\"16\",\"estimated_amount\":\"60.00\",\"category\":\"utilities\",\"principal_balance\":null,\"interest_rate\":null,\"maturity_date\":null,\"is_active\":\"1\",\"created_at\":\"2025-07-29 15:14:15\",\"type\":\"recurring\",\"is_paid\":true},{\"id\":\"8\",\"user_id\":\"1\",\"label\":\"OGE\",\"due_date\":\"17\",\"estimated_amount\":\"231.00\",\"category\":\"utilities\",\"principal_balance\":null,\"interest_rate\":null,\"maturity_date\":null,\"is_active\":\"1\",\"created_at\":\"2025-07-29 15:14:27\",\"type\":\"recurring\",\"is_paid\":true},{\"label\":\"Pull for Cash\",\"estimated_amount\":\"50\",\"category\":\"variable\",\"type\":\"variable\"},{\"label\":\"Some Bille\",\"estimated_amount\":\"100\",\"category\":\"other\",\"type\":\"recurring\",\"due_date\":\"31\",\"is_paid\":true}]', '{\"plannedSurplus\":2008.51,\"actualSurplus\":2038.51,\"totalIncome\":3085,\"totalExpenses\":1046.49,\"topSpendingCategories\":{\"credit-card\":495.49,\"utilities\":291,\"loan\":140,\"other\":100,\"Pull for Cash\":20},\"previous_cycles\":[],\"deficit_advice\":null}', '2025-07-29 15:14:56'),
(2, 1, '2025-07-16', '2025-07-27', 'completed', '[{\"id\":\"1\",\"user_id\":\"1\",\"label\":\"Zack\'s Check\",\"description\":null,\"frequency\":\"semi-monthly\",\"amount\":\"1206.00\",\"is_active\":\"1\",\"created_at\":\"2025-07-29 15:11:23\"},{\"id\":\"2\",\"user_id\":\"1\",\"label\":\"Melody\'s Check\",\"description\":null,\"frequency\":\"semi-monthly\",\"amount\":\"1881.00\",\"is_active\":\"1\",\"created_at\":\"2025-07-29 15:11:34\"}]', '[{\"id\":\"1\",\"user_id\":\"1\",\"label\":\"RedBrick Financial\",\"due_date\":\"23\",\"estimated_amount\":\"140.00\",\"category\":\"loan\",\"principal_balance\":null,\"interest_rate\":null,\"maturity_date\":null,\"is_active\":\"1\",\"created_at\":\"2025-07-29 15:12:51\",\"type\":\"recurring\",\"is_paid\":true},{\"id\":\"2\",\"user_id\":\"1\",\"label\":\"Zack - Quick SIlver - 5006\",\"due_date\":\"28\",\"estimated_amount\":\"150.00\",\"category\":\"credit-card\",\"principal_balance\":null,\"interest_rate\":null,\"maturity_date\":null,\"is_active\":\"1\",\"created_at\":\"2025-07-29 15:13:07\",\"type\":\"recurring\",\"is_paid\":true},{\"id\":\"3\",\"user_id\":\"1\",\"label\":\"Melody - Quick Silver - 1473\",\"due_date\":\"19\",\"estimated_amount\":\"140.00\",\"category\":\"credit-card\",\"principal_balance\":null,\"interest_rate\":null,\"maturity_date\":null,\"is_active\":\"1\",\"created_at\":\"2025-07-29 15:13:21\",\"type\":\"recurring\",\"is_paid\":true},{\"id\":\"4\",\"user_id\":\"1\",\"label\":\"Melody - Quick Silver - 7403\",\"due_date\":\"19\",\"estimated_amount\":\"15.49\",\"category\":\"credit-card\",\"principal_balance\":null,\"interest_rate\":null,\"maturity_date\":null,\"is_active\":\"1\",\"created_at\":\"2025-07-29 15:13:34\",\"type\":\"recurring\",\"is_paid\":true},{\"id\":\"5\",\"user_id\":\"1\",\"label\":\"Zack - Discover It - 5869\",\"due_date\":\"19\",\"estimated_amount\":\"140.00\",\"category\":\"credit-card\",\"principal_balance\":null,\"interest_rate\":null,\"maturity_date\":null,\"is_active\":\"1\",\"created_at\":\"2025-07-29 15:13:45\",\"type\":\"recurring\",\"is_paid\":true},{\"id\":\"6\",\"user_id\":\"1\",\"label\":\"Zack - Custom Cash - 8486\",\"due_date\":\"20\",\"estimated_amount\":\"50.00\",\"category\":\"credit-card\",\"principal_balance\":null,\"interest_rate\":null,\"maturity_date\":null,\"is_active\":\"1\",\"created_at\":\"2025-07-29 15:13:59\",\"type\":\"recurring\",\"is_paid\":true},{\"id\":\"7\",\"user_id\":\"1\",\"label\":\"ONG\",\"due_date\":\"16\",\"estimated_amount\":\"60.00\",\"category\":\"utilities\",\"principal_balance\":null,\"interest_rate\":null,\"maturity_date\":null,\"is_active\":\"1\",\"created_at\":\"2025-07-29 15:14:15\",\"type\":\"recurring\",\"is_paid\":true},{\"id\":\"8\",\"user_id\":\"1\",\"label\":\"OGE\",\"due_date\":\"17\",\"estimated_amount\":\"231.00\",\"category\":\"utilities\",\"principal_balance\":null,\"interest_rate\":null,\"maturity_date\":null,\"is_active\":\"1\",\"created_at\":\"2025-07-29 15:14:27\",\"type\":\"recurring\",\"is_paid\":true},{\"id\":\"9\",\"user_id\":\"1\",\"label\":\"Some Bill\",\"due_date\":\"31\",\"estimated_amount\":\"100.00\",\"category\":\"utilities\",\"principal_balance\":null,\"interest_rate\":null,\"maturity_date\":null,\"is_active\":\"1\",\"created_at\":\"2025-07-29 15:47:00\",\"type\":\"recurring\",\"is_paid\":true},{\"id\":\"10\",\"user_id\":\"1\",\"label\":\"Some Bille\",\"due_date\":\"31\",\"estimated_amount\":\"100.00\",\"category\":\"other\",\"principal_balance\":null,\"interest_rate\":null,\"maturity_date\":null,\"is_active\":\"1\",\"created_at\":\"2025-07-29 15:47:19\",\"type\":\"recurring\",\"is_paid\":true},{\"label\":\"Pull for Cash\",\"estimated_amount\":null,\"category\":\"variable\",\"type\":\"variable\"}]', '{\"plannedSurplus\":1960.51,\"actualSurplus\":1960.51,\"totalIncome\":3087,\"totalExpenses\":1126.49,\"topSpendingCategories\":{\"credit-card\":495.49,\"utilities\":391,\"loan\":140,\"other\":100},\"previous_cycles\":[{\"cycle_id\":\"1\",\"start_date\":\"2025-07-16\",\"end_date\":\"2025-07-29\",\"planned_surplus\":0,\"actual_surplus\":0,\"total_income\":0,\"total_expenses\":0}],\"deficit_advice\":null}', '2025-07-29 16:04:30'),
(9, 1, '2025-08-01', '2025-08-15', 'completed', '[{\"id\":\"1\",\"user_id\":\"1\",\"label\":\"Zack\'s Check\",\"description\":null,\"frequency\":\"semi-monthly\",\"is_active\":\"1\",\"created_at\":\"2025-07-29 15:11:23\",\"amount\":\"1300\"},{\"id\":\"2\",\"user_id\":\"1\",\"label\":\"Melody\'s Check\",\"description\":null,\"frequency\":\"semi-monthly\",\"is_active\":\"1\",\"created_at\":\"2025-07-29 15:11:34\",\"amount\":\"1880\"}]', '[{\"id\":\"11\",\"user_id\":\"1\",\"label\":\"Rocket Mortgage \",\"due_date\":\"3\",\"category\":\"housing\",\"principal_balance\":null,\"interest_rate\":null,\"outstanding_balance\":null,\"maturity_date\":null,\"is_active\":\"1\",\"created_at\":\"2025-07-30 13:30:52\",\"estimated_amount\":\"1300\",\"type\":\"recurring\",\"is_paid\":true},{\"id\":\"12\",\"user_id\":\"1\",\"label\":\"Greensky 8240\",\"due_date\":\"13\",\"category\":\"loan\",\"principal_balance\":null,\"interest_rate\":null,\"outstanding_balance\":null,\"maturity_date\":null,\"is_active\":\"1\",\"created_at\":\"2025-07-30 13:31:17\",\"estimated_amount\":\"75\",\"type\":\"recurring\",\"is_paid\":false},{\"id\":\"13\",\"user_id\":\"1\",\"label\":\"Greensky 8164\",\"due_date\":\"13\",\"category\":\"loan\",\"principal_balance\":\"3402.06\",\"interest_rate\":\"7.99\",\"outstanding_balance\":null,\"maturity_date\":\"2032-08-13\",\"is_active\":\"1\",\"created_at\":\"2025-07-30 13:43:58\",\"estimated_amount\":\"65\",\"type\":\"recurring\",\"is_paid\":true},{\"id\":\"14\",\"user_id\":\"1\",\"label\":\"Z Quick Silver 1625\",\"due_date\":\"11\",\"category\":\"credit-card\",\"principal_balance\":null,\"interest_rate\":null,\"outstanding_balance\":null,\"maturity_date\":null,\"is_active\":\"1\",\"created_at\":\"2025-07-30 13:44:29\",\"estimated_amount\":\"35\",\"type\":\"recurring\",\"is_paid\":true},{\"id\":\"15\",\"user_id\":\"1\",\"label\":\"Melody - Discover It - 8150\",\"due_date\":\"10\",\"category\":\"credit-card\",\"principal_balance\":null,\"interest_rate\":null,\"outstanding_balance\":null,\"maturity_date\":null,\"is_active\":\"1\",\"created_at\":\"2025-07-30 13:44:50\",\"estimated_amount\":\"200\",\"type\":\"recurring\",\"is_paid\":false},{\"id\":\"16\",\"user_id\":\"1\",\"label\":\"Zack - It - 1938\",\"due_date\":\"14\",\"category\":\"credit-card\",\"principal_balance\":null,\"interest_rate\":null,\"outstanding_balance\":null,\"maturity_date\":null,\"is_active\":\"1\",\"created_at\":\"2025-07-30 13:45:08\",\"estimated_amount\":\"125\",\"type\":\"recurring\",\"is_paid\":false}]', NULL, '2025-07-30 17:10:01'),
(10, 1, '2025-08-01', '2025-08-15', 'completed', '[{\"id\":\"1\",\"user_id\":\"1\",\"label\":\"Zack\'s Check\",\"description\":null,\"frequency\":\"semi-monthly\",\"is_active\":\"1\",\"created_at\":\"2025-07-29 15:11:23\"}]', '[{\"id\":\"11\",\"user_id\":\"1\",\"label\":\"Rocket Mortgage \",\"due_date\":\"3\",\"category\":\"loan\",\"principal_balance\":null,\"interest_rate\":null,\"outstanding_balance\":null,\"maturity_date\":null,\"is_active\":\"1\",\"created_at\":\"2025-07-30 13:30:52\"},{\"id\":\"12\",\"user_id\":\"1\",\"label\":\"Greensky 8240\",\"due_date\":\"13\",\"category\":\"loan\",\"principal_balance\":\"3384.54\",\"interest_rate\":\"7.99\",\"outstanding_balance\":null,\"maturity_date\":\"2032-08-13\",\"is_active\":\"1\",\"created_at\":\"2025-07-30 13:31:17\"},{\"id\":\"13\",\"user_id\":\"1\",\"label\":\"Greensky 8164\",\"due_date\":\"13\",\"category\":\"loan\",\"principal_balance\":\"3402.06\",\"interest_rate\":\"7.99\",\"outstanding_balance\":null,\"maturity_date\":\"2032-08-13\",\"is_active\":\"1\",\"created_at\":\"2025-07-30 13:43:58\"},{\"id\":\"14\",\"user_id\":\"1\",\"label\":\"Z Quick Silver 1625\",\"due_date\":\"11\",\"category\":\"credit-card\",\"principal_balance\":null,\"interest_rate\":null,\"outstanding_balance\":null,\"maturity_date\":null,\"is_active\":\"1\",\"created_at\":\"2025-07-30 13:44:29\"},{\"id\":\"15\",\"user_id\":\"1\",\"label\":\"Melody - Discover It - 8150\",\"due_date\":\"10\",\"category\":\"credit-card\",\"principal_balance\":null,\"interest_rate\":null,\"outstanding_balance\":null,\"maturity_date\":null,\"is_active\":\"1\",\"created_at\":\"2025-07-30 13:44:50\"},{\"id\":\"16\",\"user_id\":\"1\",\"label\":\"Zack - It - 1938\",\"due_date\":\"14\",\"category\":\"credit-card\",\"principal_balance\":null,\"interest_rate\":null,\"outstanding_balance\":null,\"maturity_date\":null,\"is_active\":\"1\",\"created_at\":\"2025-07-30 13:45:08\"},{\"id\":\"var-1\",\"label\":\"Pull for Cash\",\"type\":\"variable\",\"estimated_amount\":\"\"}]', NULL, '2025-07-31 23:56:05'),
(11, 1, '2025-08-01', '2025-08-15', 'completed', '[{\"id\":\"1\",\"label\":\"Zack\'s Check\",\"amount\":\"\",\"frequency\":\"semi-monthly\"}]', '[{\"id\":\"11\",\"label\":\"Rocket Mortgage \",\"type\":\"recurring\",\"estimated_amount\":\"\",\"category\":\"loan\",\"due_date\":\"3\"},{\"id\":\"12\",\"label\":\"Greensky 8240\",\"type\":\"recurring\",\"estimated_amount\":\"\",\"category\":\"loan\",\"due_date\":\"13\"},{\"id\":\"13\",\"label\":\"Greensky 8164\",\"type\":\"recurring\",\"estimated_amount\":\"\",\"category\":\"loan\",\"due_date\":\"13\"},{\"id\":\"14\",\"label\":\"Z Quick Silver 1625\",\"type\":\"recurring\",\"estimated_amount\":\"\",\"category\":\"credit-card\",\"due_date\":\"11\"},{\"id\":\"15\",\"label\":\"Melody - Discover It - 8150\",\"type\":\"recurring\",\"estimated_amount\":\"\",\"category\":\"credit-card\",\"due_date\":\"10\"},{\"id\":\"16\",\"label\":\"Zack - It - 1938\",\"type\":\"recurring\",\"estimated_amount\":\"\",\"category\":\"credit-card\",\"due_date\":\"14\"},{\"id\":\"var-1\",\"label\":\"Pull for Cash\",\"type\":\"variable\",\"estimated_amount\":\"\"}]', NULL, '2025-08-01 00:11:22'),
(12, 1, '2025-08-01', '2025-08-15', 'completed', '[{\"id\":\"1\",\"user_id\":\"1\",\"label\":\"Zack\'s Check\",\"description\":null,\"frequency\":\"semi-monthly\",\"is_active\":\"1\",\"created_at\":\"2025-07-29 15:11:23\",\"amount\":1300},{\"label\":\"Melody Check\",\"amount\":\"1881\",\"frequency\":\"bi-weekly\"}]', '[{\"id\":\"11\",\"user_id\":\"1\",\"label\":\"Rocket Mortgage \",\"due_date\":\"3\",\"category\":\"loan\",\"principal_balance\":null,\"interest_rate\":null,\"outstanding_balance\":null,\"maturity_date\":null,\"is_active\":\"1\",\"created_at\":\"2025-07-30 13:30:52\",\"type\":\"recurring\",\"estimated_amount\":\"\",\"is_paid\":false},{\"id\":\"12\",\"user_id\":\"1\",\"label\":\"Greensky 8240\",\"due_date\":\"13\",\"category\":\"loan\",\"principal_balance\":\"3384.54\",\"interest_rate\":\"7.99\",\"outstanding_balance\":null,\"maturity_date\":\"2032-08-13\",\"is_active\":\"1\",\"created_at\":\"2025-07-30 13:31:17\",\"type\":\"recurring\",\"estimated_amount\":\"\",\"is_paid\":false},{\"id\":\"13\",\"user_id\":\"1\",\"label\":\"Greensky 8164\",\"due_date\":\"13\",\"category\":\"loan\",\"principal_balance\":\"3402.06\",\"interest_rate\":\"7.99\",\"outstanding_balance\":null,\"maturity_date\":\"2032-08-13\",\"is_active\":\"1\",\"created_at\":\"2025-07-30 13:43:58\",\"type\":\"recurring\",\"estimated_amount\":\"\",\"is_paid\":false},{\"id\":\"14\",\"user_id\":\"1\",\"label\":\"Z Quick Silver 1625\",\"due_date\":\"11\",\"category\":\"credit-card\",\"principal_balance\":null,\"interest_rate\":null,\"outstanding_balance\":null,\"maturity_date\":null,\"is_active\":\"1\",\"created_at\":\"2025-07-30 13:44:29\",\"type\":\"recurring\",\"estimated_amount\":125,\"is_paid\":false},{\"id\":\"15\",\"user_id\":\"1\",\"label\":\"Melody - Discover It - 8150\",\"due_date\":\"10\",\"category\":\"credit-card\",\"principal_balance\":null,\"interest_rate\":null,\"outstanding_balance\":null,\"maturity_date\":null,\"is_active\":\"1\",\"created_at\":\"2025-07-30 13:44:50\",\"type\":\"recurring\",\"estimated_amount\":\"\",\"is_paid\":false},{\"id\":\"16\",\"user_id\":\"1\",\"label\":\"Zack - It - 1938\",\"due_date\":\"14\",\"category\":\"credit-card\",\"principal_balance\":null,\"interest_rate\":null,\"outstanding_balance\":null,\"maturity_date\":null,\"is_active\":\"1\",\"created_at\":\"2025-07-30 13:45:08\",\"type\":\"recurring\",\"estimated_amount\":\"\",\"is_paid\":false},{\"id\":\"var-1\",\"label\":\"Pull for Cash\",\"type\":\"variable\",\"estimated_amount\":\"\"}]', NULL, '2025-08-01 00:50:33');

-- --------------------------------------------------------

--
-- Table structure for table `income_sources`
--

CREATE TABLE `income_sources` (
  `id` int(11) UNSIGNED NOT NULL,
  `user_id` int(11) UNSIGNED NOT NULL,
  `label` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `frequency` varchar(50) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `income_sources`
--

INSERT INTO `income_sources` (`id`, `user_id`, `label`, `description`, `frequency`, `is_active`, `created_at`) VALUES
(1, 1, 'Zack\'s Check', NULL, 'semi-monthly', 1, '2025-07-29 15:11:23'),
(2, 1, 'Melody\'s Check', NULL, 'semi-monthly', 1, '2025-07-29 15:11:34');

-- --------------------------------------------------------

--
-- Table structure for table `learned_spending_categories`
--

CREATE TABLE `learned_spending_categories` (
  `id` int(11) UNSIGNED NOT NULL,
  `user_id` int(11) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `learned_spending_categories`
--

INSERT INTO `learned_spending_categories` (`id`, `user_id`, `name`, `is_active`, `created_at`) VALUES
(1, 1, 'Pull for Cash', 1, '2025-07-29 15:14:36');

-- --------------------------------------------------------

--
-- Table structure for table `recurring_expenses`
--

CREATE TABLE `recurring_expenses` (
  `id` int(11) UNSIGNED NOT NULL,
  `user_id` int(11) UNSIGNED NOT NULL,
  `label` varchar(255) NOT NULL,
  `due_date` int(11) DEFAULT NULL COMMENT 'Day of the month',
  `category` varchar(50) NOT NULL,
  `principal_balance` decimal(10,2) DEFAULT NULL,
  `interest_rate` decimal(5,2) DEFAULT NULL,
  `outstanding_balance` decimal(10,2) DEFAULT NULL,
  `maturity_date` date DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `recurring_expenses`
--

INSERT INTO `recurring_expenses` (`id`, `user_id`, `label`, `due_date`, `category`, `principal_balance`, `interest_rate`, `outstanding_balance`, `maturity_date`, `is_active`, `created_at`) VALUES
(1, 1, 'RedBrick Financial', 23, 'loan', NULL, NULL, NULL, NULL, 1, '2025-07-29 15:12:51'),
(2, 1, 'Zack - Quick SIlver - 5006', 28, 'credit-card', NULL, NULL, NULL, NULL, 1, '2025-07-29 15:13:07'),
(3, 1, 'Melody - Quick Silver - 1473', 19, 'credit-card', NULL, NULL, NULL, NULL, 1, '2025-07-29 15:13:21'),
(4, 1, 'Melody - Quick Silver - 7403', 19, 'credit-card', NULL, NULL, NULL, NULL, 1, '2025-07-29 15:13:34'),
(5, 1, 'Zack - Discover It - 5869', 19, 'credit-card', NULL, NULL, NULL, NULL, 1, '2025-07-29 15:13:45'),
(6, 1, 'Zack - Custom Cash - 8486', 20, 'credit-card', NULL, NULL, NULL, NULL, 1, '2025-07-29 15:13:59'),
(7, 1, 'ONG', 16, 'utilities', NULL, NULL, NULL, NULL, 1, '2025-07-29 15:14:15'),
(8, 1, 'OGE', 17, 'utilities', NULL, NULL, NULL, NULL, 1, '2025-07-29 15:14:27'),
(9, 1, 'Some Bill', 31, 'utilities', NULL, NULL, NULL, NULL, 1, '2025-07-29 15:47:00'),
(10, 1, 'Some Bille', 31, 'other', NULL, NULL, NULL, NULL, 1, '2025-07-29 15:47:19'),
(11, 1, 'Rocket Mortgage ', 3, 'loan', NULL, NULL, NULL, NULL, 1, '2025-07-30 13:30:52'),
(12, 1, 'Greensky 8240', 13, 'loan', 3384.54, 7.99, NULL, '2032-08-13', 1, '2025-07-30 13:31:17'),
(13, 1, 'Greensky 8164', 13, 'loan', 3402.06, 7.99, NULL, '2032-08-13', 1, '2025-07-30 13:43:58'),
(14, 1, 'Z Quick Silver 1625', 11, 'credit-card', NULL, NULL, NULL, NULL, 1, '2025-07-30 13:44:29'),
(15, 1, 'Melody - Discover It - 8150', 10, 'credit-card', NULL, NULL, NULL, NULL, 1, '2025-07-30 13:44:50'),
(16, 1, 'Zack - It - 1938', 14, 'credit-card', NULL, NULL, NULL, NULL, 1, '2025-07-30 13:45:08');

-- --------------------------------------------------------

--
-- Table structure for table `savings_history`
--

CREATE TABLE `savings_history` (
  `id` int(11) UNSIGNED NOT NULL,
  `user_id` int(11) UNSIGNED NOT NULL,
  `balance` decimal(10,2) NOT NULL,
  `logged_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `savings_history`
--

INSERT INTO `savings_history` (`id`, `user_id`, `balance`, `logged_at`) VALUES
(1, 1, 3500.00, '2025-07-29 18:17:32');

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `id` int(11) UNSIGNED NOT NULL,
  `user_id` int(11) UNSIGNED NOT NULL,
  `type` enum('income','expense') NOT NULL,
  `budget_cycle_id` int(11) UNSIGNED NOT NULL,
  `category_name` varchar(255) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `description` text DEFAULT NULL,
  `transacted_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `transactions`
--

INSERT INTO `transactions` (`id`, `user_id`, `type`, `budget_cycle_id`, `category_name`, `amount`, `description`, `transacted_at`) VALUES
(1, 1, 'income', 1, 'Income', 1206.00, 'Initial income from Zack\'s Check', '2025-07-29 15:14:56'),
(2, 1, 'income', 1, 'Income', 1881.00, 'Initial income from Melody\'s Check', '2025-07-29 15:14:56'),
(3, 1, 'income', 1, 'Adjustment', -2.00, 'Adjustment for \'Zack\'s Check\' from $1206 to $1204', '2025-07-29 15:24:00'),
(4, 1, 'expense', 1, 'Pull for Cash', 20.00, 'ATM', '2025-07-29 15:24:44'),
(5, 1, 'expense', 1, 'other', 100.00, 'Some Bille', '2025-07-29 15:47:21'),
(6, 1, 'expense', 1, 'loan', 140.00, 'RedBrick Financial', '2025-07-29 15:53:29'),
(7, 1, 'expense', 1, 'credit-card', 150.00, 'Zack - Quick SIlver - 5006', '2025-07-29 15:53:33'),
(8, 1, 'expense', 1, 'credit-card', 140.00, 'Melody - Quick Silver - 1473', '2025-07-29 15:53:38'),
(9, 1, 'expense', 1, 'credit-card', 15.49, 'Melody - Quick Silver - 7403', '2025-07-29 15:53:39'),
(10, 1, 'expense', 1, 'credit-card', 140.00, 'Zack - Discover It - 5869', '2025-07-29 15:53:40'),
(11, 1, 'expense', 1, 'credit-card', 50.00, 'Zack - Custom Cash - 8486', '2025-07-29 15:53:41'),
(12, 1, 'expense', 1, 'utilities', 60.00, 'ONG', '2025-07-29 15:53:42'),
(13, 1, 'expense', 1, 'utilities', 231.00, 'OGE', '2025-07-29 15:53:43'),
(14, 1, 'income', 2, 'Income', 1206.00, 'Initial income from Zack\'s Check', '2025-07-29 16:04:30'),
(15, 1, 'income', 2, 'Income', 1881.00, 'Initial income from Melody\'s Check', '2025-07-29 16:04:30'),
(16, 1, 'expense', 2, 'loan', 140.00, 'RedBrick Financial', '2025-07-29 16:05:48'),
(17, 1, 'expense', 2, 'credit-card', 150.00, 'Zack - Quick SIlver - 5006', '2025-07-29 16:05:48'),
(18, 1, 'expense', 2, 'credit-card', 140.00, 'Melody - Quick Silver - 1473', '2025-07-29 16:05:49'),
(19, 1, 'expense', 2, 'credit-card', 15.49, 'Melody - Quick Silver - 7403', '2025-07-29 16:05:50'),
(20, 1, 'expense', 2, 'credit-card', 140.00, 'Zack - Discover It - 5869', '2025-07-29 16:05:50'),
(21, 1, 'expense', 2, 'credit-card', 50.00, 'Zack - Custom Cash - 8486', '2025-07-29 16:05:51'),
(22, 1, 'expense', 2, 'utilities', 60.00, 'ONG', '2025-07-29 16:05:51'),
(23, 1, 'expense', 2, 'utilities', 231.00, 'OGE', '2025-07-29 16:05:52'),
(24, 1, 'expense', 2, 'utilities', 100.00, 'Some Bill', '2025-07-29 16:05:52'),
(25, 1, 'expense', 2, 'other', 100.00, 'Some Bille', '2025-07-29 16:05:53'),
(26, 1, 'income', 3, 'Zack\'s Check', 1330.00, 'Initial income from Zack\'s Check', '2025-07-30 14:06:59'),
(27, 1, 'income', 3, 'Melody\'s Check', 1881.00, 'Initial income from Melody\'s Check', '2025-07-30 14:06:59'),
(28, 1, 'income', 4, 'Zack\'s Check', 1330.00, 'Initial income from Zack\'s Check', '2025-07-30 14:26:42'),
(29, 1, 'income', 4, 'Melody\'s Check', 1881.00, 'Initial income from Melody\'s Check', '2025-07-30 14:26:42'),
(30, 1, 'income', 5, 'Zack\'s Check', 1330.00, 'Initial income from Zack\'s Check', '2025-07-30 14:33:52'),
(31, 1, 'income', 5, 'Melody\'s Check', 1881.00, 'Initial income from Melody\'s Check', '2025-07-30 14:33:52'),
(32, 1, 'expense', 5, 'loan', 1300.00, 'Rocket Mortgage ', '2025-07-30 14:44:02'),
(33, 1, 'expense', 5, 'loan', 75.00, 'Greensky 8240', '2025-07-30 14:55:23'),
(34, 1, 'income', 6, 'Zack\'s Check', 1330.00, 'Initial income from Zack\'s Check', '2025-07-30 15:48:01'),
(35, 1, 'income', 6, 'Melody\'s Check', 1881.00, 'Initial income from Melody\'s Check', '2025-07-30 15:48:01'),
(36, 1, 'expense', 6, 'loan', 1300.00, 'Rocket Mortgage ', '2025-07-30 15:49:07'),
(37, 1, 'income', 7, 'Zack\'s Check', 1332.00, 'Initial income from Zack\'s Check', '2025-07-30 16:20:48'),
(38, 1, 'income', 7, 'Melody\'s Check', 1881.00, 'Initial income from Melody\'s Check', '2025-07-30 16:20:48'),
(39, 1, 'income', 8, 'Zack\'s Check', 1330.00, 'Initial income from Zack\'s Check', '2025-07-30 16:49:51'),
(40, 1, 'income', 8, 'Melody\'s Check', 1880.00, 'Initial income from Melody\'s Check', '2025-07-30 16:49:51'),
(41, 1, 'income', 9, 'Zack\'s Check', 1300.00, 'Initial income from Zack\'s Check', '2025-07-30 17:10:01'),
(42, 1, 'income', 9, 'Melody\'s Check', 1880.00, 'Initial income from Melody\'s Check', '2025-07-30 17:10:01'),
(43, 1, 'expense', 9, 'loan', 1300.00, 'Rocket Mortgage ', '2025-07-30 18:02:59'),
(44, 1, 'expense', 9, 'loan', 65.00, 'Greensky 8164', '2025-07-30 18:21:08'),
(45, 1, 'expense', 9, 'credit-card', 35.00, 'Z Quick Silver 1625', '2025-07-30 20:36:35'),
(46, 1, 'income', 12, 'Initial Income', 1300.00, 'Zack\'s Check', '2025-08-01 01:30:33'),
(47, 1, 'income', 12, 'Additional Income', 1881.00, 'Melody Check', '2025-08-01 01:44:13');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) UNSIGNED NOT NULL,
  `email` varchar(255) NOT NULL,
  `experience_mode` enum('guided','power') DEFAULT NULL,
  `demographic_zip_code` varchar(10) DEFAULT NULL,
  `demographic_age_range` varchar(20) DEFAULT NULL,
  `demographic_sex` varchar(20) DEFAULT NULL,
  `demographic_household_size` int(11) DEFAULT NULL,
  `demographic_prompt_dismissed` tinyint(1) NOT NULL DEFAULT 0,
  `financial_tier` int(11) NOT NULL DEFAULT 1,
  `status` enum('active','anonymized') NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `experience_mode`, `demographic_zip_code`, `demographic_age_range`, `demographic_sex`, `demographic_household_size`, `demographic_prompt_dismissed`, `financial_tier`, `status`, `created_at`, `updated_at`) VALUES
(1, 'zacklawhon@gmail.com', 'guided', '73127', '35-44', 'Male', 4, 0, 1, 'active', '2025-07-24 17:21:35', '2025-08-01 01:47:11');

-- --------------------------------------------------------

--
-- Table structure for table `user_financial_tools`
--

CREATE TABLE `user_financial_tools` (
  `id` int(11) UNSIGNED NOT NULL,
  `user_id` int(11) UNSIGNED NOT NULL,
  `has_checking_account` tinyint(1) NOT NULL DEFAULT 0,
  `has_savings_account` tinyint(1) NOT NULL DEFAULT 0,
  `has_credit_card` tinyint(1) NOT NULL DEFAULT 0,
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `current_savings_balance` decimal(10,2) NOT NULL DEFAULT 0.00,
  `savings_goal` decimal(10,2) NOT NULL DEFAULT 2000.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_financial_tools`
--

INSERT INTO `user_financial_tools` (`id`, `user_id`, `has_checking_account`, `has_savings_account`, `has_credit_card`, `updated_at`, `current_savings_balance`, `savings_goal`) VALUES
(1, 1, 1, 1, 1, '2025-07-31 18:20:01', 3500.00, 2500.00);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `auth_tokens`
--
ALTER TABLE `auth_tokens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `budget_cycles`
--
ALTER TABLE `budget_cycles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `income_sources`
--
ALTER TABLE `income_sources`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `learned_spending_categories`
--
ALTER TABLE `learned_spending_categories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `recurring_expenses`
--
ALTER TABLE `recurring_expenses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `savings_history`
--
ALTER TABLE `savings_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `budget_cycle_id` (`budget_cycle_id`),
  ADD KEY `transactions_user_id_fk` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `user_financial_tools`
--
ALTER TABLE `user_financial_tools`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `auth_tokens`
--
ALTER TABLE `auth_tokens`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `budget_cycles`
--
ALTER TABLE `budget_cycles`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `income_sources`
--
ALTER TABLE `income_sources`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `learned_spending_categories`
--
ALTER TABLE `learned_spending_categories`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `recurring_expenses`
--
ALTER TABLE `recurring_expenses`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `savings_history`
--
ALTER TABLE `savings_history`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=48;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `user_financial_tools`
--
ALTER TABLE `user_financial_tools`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `auth_tokens`
--
ALTER TABLE `auth_tokens`
  ADD CONSTRAINT `auth_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `budget_cycles`
--
ALTER TABLE `budget_cycles`
  ADD CONSTRAINT `budget_cycles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `income_sources`
--
ALTER TABLE `income_sources`
  ADD CONSTRAINT `income_sources_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `learned_spending_categories`
--
ALTER TABLE `learned_spending_categories`
  ADD CONSTRAINT `learned_spending_categories_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `recurring_expenses`
--
ALTER TABLE `recurring_expenses`
  ADD CONSTRAINT `recurring_expenses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `savings_history`
--
ALTER TABLE `savings_history`
  ADD CONSTRAINT `savings_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`budget_cycle_id`) REFERENCES `budget_cycles` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `transactions_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_financial_tools`
--
ALTER TABLE `user_financial_tools`
  ADD CONSTRAINT `user_financial_tools_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
