-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3306
-- Généré le : mer. 29 oct. 2025 à 23:40
-- Version du serveur : 11.8.3-MariaDB-log
-- Version de PHP : 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `u815934570_flynova_dev`
--

-- --------------------------------------------------------

--
-- Structure de la table `achievements`
--

CREATE TABLE `achievements` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `icon` varchar(255) DEFAULT NULL,
  `criteria` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Achievement criteria as JSON' CHECK (json_valid(`criteria`)),
  `points` int(11) DEFAULT 0,
  `badge_color` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `aircraft`
--

CREATE TABLE `aircraft` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `iata_code` varchar(3) DEFAULT NULL,
  `icao_code` varchar(4) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `airports`
--

CREATE TABLE `airports` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `city` varchar(255) DEFAULT NULL,
  `country` varchar(255) DEFAULT NULL,
  `iata_code` varchar(3) DEFAULT NULL,
  `icao_code` varchar(4) DEFAULT NULL,
  `latitude` decimal(10,6) DEFAULT NULL,
  `longitude` decimal(10,6) DEFAULT NULL,
  `altitude` int(11) DEFAULT NULL,
  `timezone_offset` decimal(4,2) DEFAULT NULL,
  `dst` varchar(1) DEFAULT NULL,
  `timezone` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `bug_reports`
--

CREATE TABLE `bug_reports` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL COMMENT 'User who submitted the bug (NULL for non-logged users)',
  `username` varchar(100) NOT NULL COMMENT 'Username or name of person reporting',
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `image_url` varchar(500) DEFAULT NULL COMMENT 'Screenshot or image URL',
  `status` enum('pending','in_progress','resolved','closed') DEFAULT 'pending',
  `admin_notes` text DEFAULT NULL COMMENT 'Notes from admin reviewing the bug',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `downloads`
--

CREATE TABLE `downloads` (
  `id` int(11) NOT NULL,
  `va_id` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `file_type` enum('livery','tracker','document','other') DEFAULT 'other',
  `file_name` varchar(255) DEFAULT NULL,
  `file_url` varchar(500) NOT NULL COMMENT 'Local file path or external URL for downloads',
  `is_external_url` tinyint(1) DEFAULT 0,
  `file_size` int(11) DEFAULT NULL,
  `download_count` int(11) DEFAULT 0,
  `aircraft_id` int(11) DEFAULT NULL COMMENT 'For liveries',
  `uploaded_by` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `status` enum('active','archived') DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `events`
--

CREATE TABLE `events` (
  `id` int(11) NOT NULL,
  `va_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `event_type` enum('focus_airport','route_challenge','special_event','competition') DEFAULT 'special_event',
  `cover_image` varchar(255) DEFAULT NULL,
  `focus_airport_id` int(11) DEFAULT NULL,
  `start_date` timestamp NOT NULL,
  `end_date` timestamp NOT NULL,
  `bonus_points` int(11) DEFAULT 0,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `status` enum('upcoming','active','completed','cancelled') DEFAULT 'upcoming'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déclencheurs `events`
--
DELIMITER $$
CREATE TRIGGER `event_status_before_insert` BEFORE INSERT ON `events` FOR EACH ROW BEGIN
    -- Only update if status is not 'cancelled'
    IF NEW.status != 'cancelled' THEN
        IF NEW.end_date < NOW() THEN
            SET NEW.status = 'completed';
        ELSEIF NEW.start_date <= NOW() AND NEW.end_date >= NOW() THEN
            SET NEW.status = 'active';
        ELSE
            SET NEW.status = 'upcoming';
        END IF;
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `event_status_before_update` BEFORE UPDATE ON `events` FOR EACH ROW BEGIN
    -- Only update if status is not being set to 'cancelled' and was not already 'cancelled'
    IF NEW.status != 'cancelled' AND OLD.status != 'cancelled' THEN
        IF NEW.end_date < NOW() THEN
            SET NEW.status = 'completed';
        ELSEIF NEW.start_date <= NOW() AND NEW.end_date >= NOW() THEN
            SET NEW.status = 'active';
        ELSE
            SET NEW.status = 'upcoming';
        END IF;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Structure de la table `flights`
--

CREATE TABLE `flights` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `va_id` int(11) NOT NULL,
  `route_id` int(11) NOT NULL,
  `fleet_id` int(11) DEFAULT NULL,
  `flight_number` varchar(20) DEFAULT NULL,
  `status` enum('reserved','in_progress','completed','cancelled') DEFAULT 'reserved',
  `departure_time` timestamp NULL DEFAULT NULL,
  `arrival_time` timestamp NULL DEFAULT NULL,
  `reserved_at` timestamp NULL DEFAULT current_timestamp(),
  `simbrief_ofp_id` varchar(50) DEFAULT NULL COMMENT 'SimBrief OFP ID for flight plan'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `flight_reports`
--

CREATE TABLE `flight_reports` (
  `id` int(11) NOT NULL,
  `flight_id` int(11) NOT NULL,
  `validation_status` enum('pending','approved','rejected') DEFAULT 'pending',
  `admin_id` int(11) DEFAULT NULL,
  `admin_notes` text DEFAULT NULL,
  `actual_departure_time` timestamp NULL DEFAULT NULL,
  `actual_arrival_time` timestamp NULL DEFAULT NULL,
  `flight_duration` int(11) DEFAULT NULL COMMENT 'Duration in minutes',
  `distance_flown` decimal(10,2) DEFAULT NULL,
  `fuel_used` decimal(10,2) DEFAULT NULL,
  `landing_rate` decimal(6,2) DEFAULT NULL COMMENT 'Landing rate in fpm',
  `telemetry_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Full flight telemetry data' CHECK (json_valid(`telemetry_data`)),
  `points_awarded` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `validated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `used` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `username` varchar(100) NOT NULL,
  `simbrief_username` varchar(100) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `avatar_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `last_login` timestamp NULL DEFAULT NULL,
  `status` enum('active','suspended','inactive') DEFAULT 'active',
  `is_super_admin` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `user_achievements`
--

CREATE TABLE `user_achievements` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `achievement_id` int(11) NOT NULL,
  `va_id` int(11) DEFAULT NULL COMMENT 'VA-specific achievement',
  `earned_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `va_cabin_announcements`
--

CREATE TABLE `va_cabin_announcements` (
  `id` int(11) NOT NULL,
  `va_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `audio_url` varchar(500) NOT NULL,
  `announcement_type` enum('boarding','safety','takeoff','cruise','descent','landing','arrival','custom') DEFAULT 'custom',
  `duration` int(11) DEFAULT 0 COMMENT 'Duration in seconds',
  `file_size` int(11) DEFAULT 0 COMMENT 'File size in bytes',
  `uploaded_by` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `va_fleet`
--

CREATE TABLE `va_fleet` (
  `id` int(11) NOT NULL,
  `va_id` int(11) NOT NULL,
  `registration` varchar(20) NOT NULL,
  `aircraft_type` varchar(50) NOT NULL,
  `aircraft_name` varchar(255) NOT NULL,
  `home_airport` varchar(4) DEFAULT NULL,
  `status` enum('active','maintenance','retired') DEFAULT 'active',
  `total_flights` int(11) DEFAULT 0,
  `total_hours` decimal(10,2) DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `va_members`
--

CREATE TABLE `va_members` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `va_id` int(11) NOT NULL,
  `role` enum('Owner','Admin','Pilot','Member') DEFAULT 'Member',
  `points` int(11) DEFAULT 0,
  `total_flights` int(11) DEFAULT 0,
  `total_hours` decimal(10,2) DEFAULT 0.00,
  `join_date` timestamp NULL DEFAULT current_timestamp(),
  `status` enum('active','suspended','left') DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `va_routes`
--

CREATE TABLE `va_routes` (
  `id` int(11) NOT NULL,
  `va_id` int(11) NOT NULL,
  `flight_number` varchar(20) NOT NULL,
  `route_type` enum('Civil','Cargo','Private') DEFAULT 'Civil',
  `departure_icao` varchar(4) DEFAULT NULL,
  `departure_name` varchar(255) DEFAULT NULL,
  `arrival_icao` varchar(4) DEFAULT NULL,
  `arrival_name` varchar(255) DEFAULT NULL,
  `aircraft_type` varchar(50) DEFAULT NULL,
  `status` enum('active','inactive','seasonal') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `va_tours`
--

CREATE TABLE `va_tours` (
  `id` int(11) NOT NULL,
  `va_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `banner_image` varchar(500) DEFAULT NULL COMMENT 'Banner image URL uploaded to FTP or external URL',
  `award_image` varchar(500) DEFAULT NULL COMMENT 'Award badge image URL uploaded to FTP or external URL',
  `award_title` varchar(255) DEFAULT NULL COMMENT 'Title of the award given upon completion',
  `award_description` text DEFAULT NULL COMMENT 'Description of the award',
  `status` enum('draft','active','completed','cancelled') DEFAULT 'draft',
  `start_date` timestamp NULL DEFAULT NULL,
  `end_date` timestamp NULL DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `va_tour_awards`
--

CREATE TABLE `va_tour_awards` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `tour_id` int(11) NOT NULL,
  `va_id` int(11) NOT NULL,
  `award_title` varchar(255) NOT NULL,
  `award_description` text DEFAULT NULL,
  `award_image` varchar(500) DEFAULT NULL COMMENT 'Award badge image URL',
  `earned_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `va_tour_legs`
--

CREATE TABLE `va_tour_legs` (
  `id` int(11) NOT NULL,
  `tour_id` int(11) NOT NULL,
  `leg_number` int(11) NOT NULL COMMENT 'Order of this leg in the tour (1, 2, 3...)',
  `departure_icao` varchar(4) NOT NULL,
  `departure_name` varchar(255) DEFAULT NULL,
  `arrival_icao` varchar(4) NOT NULL,
  `arrival_name` varchar(255) DEFAULT NULL,
  `required_aircraft` varchar(100) DEFAULT NULL COMMENT 'Optional: specific aircraft type required',
  `min_flight_time` int(11) DEFAULT NULL COMMENT 'Minimum flight time in minutes',
  `notes` text DEFAULT NULL COMMENT 'Special notes or requirements for this leg',
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `va_tour_progress`
--

CREATE TABLE `va_tour_progress` (
  `id` int(11) NOT NULL,
  `tour_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `va_id` int(11) NOT NULL,
  `current_leg` int(11) DEFAULT 1 COMMENT 'Current leg number the pilot is on',
  `completed_legs` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Array of completed leg IDs with timestamps' CHECK (json_valid(`completed_legs`)),
  `status` enum('not_started','in_progress','completed','abandoned') DEFAULT 'not_started',
  `started_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `award_claimed` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `virtual_airlines`
--

CREATE TABLE `virtual_airlines` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `callsign` varchar(10) NOT NULL,
  `icao_code` varchar(4) DEFAULT NULL,
  `iata_code` varchar(3) DEFAULT NULL,
  `owner_id` int(11) NOT NULL,
  `logo_url` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `contact_email` varchar(255) DEFAULT NULL,
  `contact_discord` varchar(255) DEFAULT NULL,
  `contact_other` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `status` enum('active','suspended','inactive') DEFAULT 'active',
  `primary_color` varchar(7) DEFAULT '#00c853' COMMENT 'Couleur principale (hex)',
  `secondary_color` varchar(7) DEFAULT '#00a843' COMMENT 'Couleur secondaire (hex)',
  `accent_color` varchar(7) DEFAULT '#00ff7f' COMMENT 'Couleur accent (hex)',
  `text_on_primary` varchar(7) DEFAULT '#ffffff' COMMENT 'Couleur texte sur primaire (hex)',
  `background_color` varchar(7) DEFAULT '#f8fafc' COMMENT 'Couleur de fond du dashboard (hex)',
  `navbar_color` varchar(7) DEFAULT '#1e293b' COMMENT 'Couleur de la navbar (hex)',
  `card_background_color` varchar(7) DEFAULT '#ffffff' COMMENT 'Background color for cards/panels',
  `navbar_title_color` varchar(7) DEFAULT '#1e293b' COMMENT 'Color for navbar title text',
  `heading_color` varchar(7) DEFAULT '#0f172a' COMMENT 'Color for main headings/titles (h1, h2)',
  `subheading_color` varchar(7) DEFAULT '#334155' COMMENT 'Color for secondary headings (h3, h4)',
  `text_color` varchar(7) DEFAULT '#475569' COMMENT 'Color for general body text'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `achievements`
--
ALTER TABLE `achievements`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `aircraft`
--
ALTER TABLE `aircraft`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_icao` (`icao_code`),
  ADD KEY `idx_iata` (`iata_code`);

--
-- Index pour la table `airports`
--
ALTER TABLE `airports`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `iata_code` (`iata_code`),
  ADD UNIQUE KEY `icao_code` (`icao_code`),
  ADD KEY `idx_iata` (`iata_code`),
  ADD KEY `idx_icao` (`icao_code`),
  ADD KEY `idx_country` (`country`);

--
-- Index pour la table `bug_reports`
--
ALTER TABLE `bug_reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created` (`created_at`),
  ADD KEY `idx_status_created` (`status`,`created_at` DESC);

--
-- Index pour la table `downloads`
--
ALTER TABLE `downloads`
  ADD PRIMARY KEY (`id`),
  ADD KEY `aircraft_id` (`aircraft_id`),
  ADD KEY `uploaded_by` (`uploaded_by`),
  ADD KEY `idx_va` (`va_id`),
  ADD KEY `idx_type` (`file_type`),
  ADD KEY `idx_status` (`status`);

--
-- Index pour la table `events`
--
ALTER TABLE `events`
  ADD PRIMARY KEY (`id`),
  ADD KEY `focus_airport_id` (`focus_airport_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_va` (`va_id`),
  ADD KEY `idx_dates` (`start_date`,`end_date`),
  ADD KEY `idx_status` (`status`);

--
-- Index pour la table `flights`
--
ALTER TABLE `flights`
  ADD PRIMARY KEY (`id`),
  ADD KEY `route_id` (`route_id`),
  ADD KEY `fleet_id` (`fleet_id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_va` (`va_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_departure_time` (`departure_time`),
  ADD KEY `idx_simbrief` (`simbrief_ofp_id`);

--
-- Index pour la table `flight_reports`
--
ALTER TABLE `flight_reports`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `flight_id` (`flight_id`),
  ADD KEY `admin_id` (`admin_id`),
  ADD KEY `idx_flight` (`flight_id`),
  ADD KEY `idx_status` (`validation_status`),
  ADD KEY `idx_created` (`created_at`);

--
-- Index pour la table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `idx_token` (`token`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_expires` (`expires_at`);

--
-- Index pour la table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_username` (`username`),
  ADD KEY `idx_simbrief_username` (`simbrief_username`),
  ADD KEY `idx_super_admin` (`is_super_admin`);

--
-- Index pour la table `user_achievements`
--
ALTER TABLE `user_achievements`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_achievement` (`user_id`,`achievement_id`,`va_id`),
  ADD KEY `achievement_id` (`achievement_id`),
  ADD KEY `va_id` (`va_id`),
  ADD KEY `idx_user` (`user_id`);

--
-- Index pour la table `va_cabin_announcements`
--
ALTER TABLE `va_cabin_announcements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `uploaded_by` (`uploaded_by`),
  ADD KEY `idx_va_id` (`va_id`),
  ADD KEY `idx_announcement_type` (`announcement_type`);

--
-- Index pour la table `va_fleet`
--
ALTER TABLE `va_fleet`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_registration` (`va_id`,`registration`),
  ADD KEY `idx_va` (`va_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_home_airport` (`home_airport`);

--
-- Index pour la table `va_members`
--
ALTER TABLE `va_members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_membership` (`user_id`,`va_id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_va` (`va_id`),
  ADD KEY `idx_points` (`points` DESC);

--
-- Index pour la table `va_routes`
--
ALTER TABLE `va_routes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_flight` (`va_id`,`flight_number`),
  ADD KEY `idx_va` (`va_id`),
  ADD KEY `idx_route_type` (`route_type`),
  ADD KEY `idx_departure_icao` (`departure_icao`),
  ADD KEY `idx_arrival_icao` (`arrival_icao`);

--
-- Index pour la table `va_tours`
--
ALTER TABLE `va_tours`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_va_id` (`va_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_dates` (`start_date`,`end_date`);

--
-- Index pour la table `va_tour_awards`
--
ALTER TABLE `va_tour_awards`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_tour_award` (`user_id`,`tour_id`),
  ADD KEY `va_id` (`va_id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_tour` (`tour_id`),
  ADD KEY `idx_earned` (`earned_at` DESC);

--
-- Index pour la table `va_tour_legs`
--
ALTER TABLE `va_tour_legs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_leg` (`tour_id`,`leg_number`),
  ADD KEY `idx_tour_id` (`tour_id`),
  ADD KEY `idx_leg_number` (`tour_id`,`leg_number`);

--
-- Index pour la table `va_tour_progress`
--
ALTER TABLE `va_tour_progress`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_tour` (`tour_id`,`user_id`),
  ADD KEY `va_id` (`va_id`),
  ADD KEY `idx_tour_user` (`tour_id`,`user_id`),
  ADD KEY `idx_user_va` (`user_id`,`va_id`),
  ADD KEY `idx_status` (`status`);

--
-- Index pour la table `virtual_airlines`
--
ALTER TABLE `virtual_airlines`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `callsign` (`callsign`),
  ADD UNIQUE KEY `icao_code` (`icao_code`),
  ADD UNIQUE KEY `iata_code` (`iata_code`),
  ADD KEY `idx_owner` (`owner_id`),
  ADD KEY `idx_callsign` (`callsign`),
  ADD KEY `idx_branding` (`primary_color`,`logo_url`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `achievements`
--
ALTER TABLE `achievements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `aircraft`
--
ALTER TABLE `aircraft`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `airports`
--
ALTER TABLE `airports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `bug_reports`
--
ALTER TABLE `bug_reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `downloads`
--
ALTER TABLE `downloads`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `events`
--
ALTER TABLE `events`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `flights`
--
ALTER TABLE `flights`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `flight_reports`
--
ALTER TABLE `flight_reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `user_achievements`
--
ALTER TABLE `user_achievements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `va_cabin_announcements`
--
ALTER TABLE `va_cabin_announcements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `va_fleet`
--
ALTER TABLE `va_fleet`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `va_members`
--
ALTER TABLE `va_members`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `va_routes`
--
ALTER TABLE `va_routes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `va_tours`
--
ALTER TABLE `va_tours`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `va_tour_awards`
--
ALTER TABLE `va_tour_awards`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `va_tour_legs`
--
ALTER TABLE `va_tour_legs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `va_tour_progress`
--
ALTER TABLE `va_tour_progress`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `virtual_airlines`
--
ALTER TABLE `virtual_airlines`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `bug_reports`
--
ALTER TABLE `bug_reports`
  ADD CONSTRAINT `bug_reports_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `downloads`
--
ALTER TABLE `downloads`
  ADD CONSTRAINT `downloads_ibfk_1` FOREIGN KEY (`va_id`) REFERENCES `virtual_airlines` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `downloads_ibfk_2` FOREIGN KEY (`aircraft_id`) REFERENCES `aircraft` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `downloads_ibfk_3` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`);

--
-- Contraintes pour la table `events`
--
ALTER TABLE `events`
  ADD CONSTRAINT `events_ibfk_1` FOREIGN KEY (`va_id`) REFERENCES `virtual_airlines` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `events_ibfk_2` FOREIGN KEY (`focus_airport_id`) REFERENCES `airports` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `events_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Contraintes pour la table `flights`
--
ALTER TABLE `flights`
  ADD CONSTRAINT `flights_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `flights_ibfk_2` FOREIGN KEY (`va_id`) REFERENCES `virtual_airlines` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `flights_ibfk_3` FOREIGN KEY (`route_id`) REFERENCES `va_routes` (`id`),
  ADD CONSTRAINT `flights_ibfk_4` FOREIGN KEY (`fleet_id`) REFERENCES `va_fleet` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `flight_reports`
--
ALTER TABLE `flight_reports`
  ADD CONSTRAINT `flight_reports_ibfk_1` FOREIGN KEY (`flight_id`) REFERENCES `flights` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `flight_reports_ibfk_2` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD CONSTRAINT `password_reset_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `user_achievements`
--
ALTER TABLE `user_achievements`
  ADD CONSTRAINT `user_achievements_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_achievements_ibfk_2` FOREIGN KEY (`achievement_id`) REFERENCES `achievements` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_achievements_ibfk_3` FOREIGN KEY (`va_id`) REFERENCES `virtual_airlines` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `va_cabin_announcements`
--
ALTER TABLE `va_cabin_announcements`
  ADD CONSTRAINT `va_cabin_announcements_ibfk_1` FOREIGN KEY (`va_id`) REFERENCES `virtual_airlines` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `va_cabin_announcements_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `va_fleet`
--
ALTER TABLE `va_fleet`
  ADD CONSTRAINT `va_fleet_ibfk_1` FOREIGN KEY (`va_id`) REFERENCES `virtual_airlines` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `va_members`
--
ALTER TABLE `va_members`
  ADD CONSTRAINT `va_members_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `va_members_ibfk_2` FOREIGN KEY (`va_id`) REFERENCES `virtual_airlines` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `va_routes`
--
ALTER TABLE `va_routes`
  ADD CONSTRAINT `va_routes_ibfk_1` FOREIGN KEY (`va_id`) REFERENCES `virtual_airlines` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `va_tours`
--
ALTER TABLE `va_tours`
  ADD CONSTRAINT `va_tours_ibfk_1` FOREIGN KEY (`va_id`) REFERENCES `virtual_airlines` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `va_tours_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `va_tour_awards`
--
ALTER TABLE `va_tour_awards`
  ADD CONSTRAINT `va_tour_awards_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `va_tour_awards_ibfk_2` FOREIGN KEY (`tour_id`) REFERENCES `va_tours` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `va_tour_awards_ibfk_3` FOREIGN KEY (`va_id`) REFERENCES `virtual_airlines` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `va_tour_legs`
--
ALTER TABLE `va_tour_legs`
  ADD CONSTRAINT `va_tour_legs_ibfk_1` FOREIGN KEY (`tour_id`) REFERENCES `va_tours` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `va_tour_progress`
--
ALTER TABLE `va_tour_progress`
  ADD CONSTRAINT `va_tour_progress_ibfk_1` FOREIGN KEY (`tour_id`) REFERENCES `va_tours` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `va_tour_progress_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `va_tour_progress_ibfk_3` FOREIGN KEY (`va_id`) REFERENCES `virtual_airlines` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `virtual_airlines`
--
ALTER TABLE `virtual_airlines`
  ADD CONSTRAINT `virtual_airlines_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
