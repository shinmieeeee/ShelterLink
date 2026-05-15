-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 15, 2026 at 11:43 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `shelterlinkdb`
--

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `AdminId` int(11) NOT NULL,
  `UserId` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`AdminId`, `UserId`) VALUES
(1, 5);

-- --------------------------------------------------------

--
-- Table structure for table `adopters`
--

CREATE TABLE `adopters` (
  `AdopterId` int(11) NOT NULL,
  `Name` longtext NOT NULL,
  `Age` int(11) NOT NULL,
  `Address` longtext NOT NULL,
  `UserId` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `adoptionapplications`
--

CREATE TABLE `adoptionapplications` (
  `ApplicationId` int(11) NOT NULL,
  `AdopterId` int(11) NOT NULL,
  `AnimalId` int(11) NOT NULL,
  `SubmittedAt` datetime(6) NOT NULL,
  `Status` longtext NOT NULL DEFAULT 'Pending',
  `ReviewedBy` int(11) DEFAULT NULL,
  `RejectionReason` longtext DEFAULT NULL,
  `ApplicantFullName` longtext DEFAULT NULL,
  `ApplicantAddress` longtext DEFAULT NULL,
  `ApplicantPhone` longtext DEFAULT NULL,
  `HousingType` longtext DEFAULT NULL,
  `HasYard` tinyint(1) DEFAULT NULL,
  `HasOtherPets` tinyint(1) DEFAULT NULL,
  `OtherPetsDetails` longtext DEFAULT NULL,
  `HasChildren` tinyint(1) DEFAULT NULL,
  `ChildrenAges` longtext DEFAULT NULL,
  `AdoptionReason` longtext DEFAULT NULL,
  `DailyRoutine` longtext DEFAULT NULL,
  `VetReference` longtext DEFAULT NULL,
  `AgreeToTerms` tinyint(1) DEFAULT NULL,
  `InterviewScheduledAt` datetime(6) DEFAULT NULL,
  `AdopterConfirmed` tinyint(1) DEFAULT NULL,
  `RescheduleRequested` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `adoptionrecords`
--

CREATE TABLE `adoptionrecords` (
  `RecordId` int(11) NOT NULL,
  `AppId` int(11) NOT NULL,
  `AnimalId` int(11) NOT NULL,
  `AdopterId` int(11) NOT NULL,
  `CompletedAt` datetime(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `animals`
--

CREATE TABLE `animals` (
  `AnimalId` int(11) NOT NULL,
  `Name` longtext NOT NULL,
  `Species` longtext NOT NULL,
  `Breed` longtext NOT NULL,
  `Age` float NOT NULL,
  `Status` longtext NOT NULL DEFAULT 'Available',
  `PhotoPath` longtext NOT NULL,
  `SpecialNotes` longtext NOT NULL,
  `DateAdmitted` datetime(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `auditlogs`
--

CREATE TABLE `auditlogs` (
  `LogId` int(11) NOT NULL,
  `ActorId` int(11) NOT NULL,
  `Action` longtext NOT NULL,
  `TargetId` int(11) NOT NULL,
  `Timestamp` datetime(6) NOT NULL,
  `IsFlagged` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `NotifId` int(11) NOT NULL,
  `RecipientId` int(11) NOT NULL,
  `Message` longtext NOT NULL,
  `SentAt` datetime(6) NOT NULL,
  `IsRead` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `shelters`
--

CREATE TABLE `shelters` (
  `ShelterId` int(11) NOT NULL,
  `Name` longtext NOT NULL,
  `Capacity` int(11) NOT NULL,
  `CurrentCount` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `UserId` int(11) NOT NULL,
  `Name` longtext NOT NULL,
  `Email` varchar(255) NOT NULL,
  `PasswordHash` longtext NOT NULL,
  `Role` longtext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`UserId`, `Name`, `Email`, `PasswordHash`, `Role`) VALUES
(5, 'Admin', 'admin@shelterlink.com', 'admin123', 'Admin');

-- --------------------------------------------------------

--
-- Table structure for table `__efmigrationshistory`
--

CREATE TABLE `__efmigrationshistory` (
  `MigrationId` varchar(150) NOT NULL,
  `ProductVersion` varchar(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `__efmigrationshistory`
--

INSERT INTO `__efmigrationshistory` (`MigrationId`, `ProductVersion`) VALUES
('20260425005730_InitialCreate', '10.0.0-preview.4.25258.110'),
('20260428052622_UpdateSchema', '9.0.0'),
('20260507125015_AddApplicationFormAndInterview', '9.0.0'),
('20260507125502_AddApplicationFormAndInterviewV2', '9.0.0');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`AdminId`),
  ADD KEY `IX_Admins_UserId` (`UserId`);

--
-- Indexes for table `adopters`
--
ALTER TABLE `adopters`
  ADD PRIMARY KEY (`AdopterId`),
  ADD KEY `IX_Adopters_UserId` (`UserId`);

--
-- Indexes for table `adoptionapplications`
--
ALTER TABLE `adoptionapplications`
  ADD PRIMARY KEY (`ApplicationId`),
  ADD KEY `IX_AdoptionApplications_AdopterId` (`AdopterId`),
  ADD KEY `IX_AdoptionApplications_AnimalId` (`AnimalId`),
  ADD KEY `IX_AdoptionApplications_ReviewedBy` (`ReviewedBy`);

--
-- Indexes for table `adoptionrecords`
--
ALTER TABLE `adoptionrecords`
  ADD PRIMARY KEY (`RecordId`),
  ADD KEY `IX_AdoptionRecords_AdopterId` (`AdopterId`),
  ADD KEY `IX_AdoptionRecords_AnimalId` (`AnimalId`),
  ADD KEY `IX_AdoptionRecords_AppId` (`AppId`);

--
-- Indexes for table `animals`
--
ALTER TABLE `animals`
  ADD PRIMARY KEY (`AnimalId`);

--
-- Indexes for table `auditlogs`
--
ALTER TABLE `auditlogs`
  ADD PRIMARY KEY (`LogId`),
  ADD KEY `IX_AuditLogs_ActorId` (`ActorId`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`NotifId`),
  ADD KEY `IX_Notifications_RecipientId` (`RecipientId`);

--
-- Indexes for table `shelters`
--
ALTER TABLE `shelters`
  ADD PRIMARY KEY (`ShelterId`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`UserId`),
  ADD UNIQUE KEY `IX_Users_Email` (`Email`);

--
-- Indexes for table `__efmigrationshistory`
--
ALTER TABLE `__efmigrationshistory`
  ADD PRIMARY KEY (`MigrationId`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `AdminId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `adopters`
--
ALTER TABLE `adopters`
  MODIFY `AdopterId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `adoptionapplications`
--
ALTER TABLE `adoptionapplications`
  MODIFY `ApplicationId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `adoptionrecords`
--
ALTER TABLE `adoptionrecords`
  MODIFY `RecordId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `animals`
--
ALTER TABLE `animals`
  MODIFY `AnimalId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `auditlogs`
--
ALTER TABLE `auditlogs`
  MODIFY `LogId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `NotifId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `shelters`
--
ALTER TABLE `shelters`
  MODIFY `ShelterId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `UserId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `admins`
--
ALTER TABLE `admins`
  ADD CONSTRAINT `FK_Admins_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `users` (`UserId`) ON DELETE CASCADE;

--
-- Constraints for table `adopters`
--
ALTER TABLE `adopters`
  ADD CONSTRAINT `FK_Adopters_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `users` (`UserId`) ON DELETE CASCADE;

--
-- Constraints for table `adoptionapplications`
--
ALTER TABLE `adoptionapplications`
  ADD CONSTRAINT `FK_AdoptionApplications_Adopters_AdopterId` FOREIGN KEY (`AdopterId`) REFERENCES `adopters` (`AdopterId`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_AdoptionApplications_Animals_AnimalId` FOREIGN KEY (`AnimalId`) REFERENCES `animals` (`AnimalId`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_AdoptionApplications_Users_ReviewedBy` FOREIGN KEY (`ReviewedBy`) REFERENCES `users` (`UserId`);

--
-- Constraints for table `adoptionrecords`
--
ALTER TABLE `adoptionrecords`
  ADD CONSTRAINT `FK_AdoptionRecords_Adopters_AdopterId` FOREIGN KEY (`AdopterId`) REFERENCES `adopters` (`AdopterId`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_AdoptionRecords_AdoptionApplications_AppId` FOREIGN KEY (`AppId`) REFERENCES `adoptionapplications` (`ApplicationId`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_AdoptionRecords_Animals_AnimalId` FOREIGN KEY (`AnimalId`) REFERENCES `animals` (`AnimalId`) ON DELETE CASCADE;

--
-- Constraints for table `auditlogs`
--
ALTER TABLE `auditlogs`
  ADD CONSTRAINT `FK_AuditLogs_Users_ActorId` FOREIGN KEY (`ActorId`) REFERENCES `users` (`UserId`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `FK_Notifications_Users_RecipientId` FOREIGN KEY (`RecipientId`) REFERENCES `users` (`UserId`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
