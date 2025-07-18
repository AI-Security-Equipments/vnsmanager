-- Schema generato il Fri Jul 18 10:48:07 CEST 2025
CREATE DATABASE IF NOT EXISTS `vnsmanager_device`;
USE `vnsmanager_device`;

-- MySQL dump 10.13  Distrib 8.0.42, for Linux (x86_64)
--
-- Host: localhost    Database: vnsmanager_device
-- ------------------------------------------------------
-- Server version	8.0.42-0ubuntu0.24.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `_idomain`
--

DROP TABLE IF EXISTS `_idomain`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `_idomain` (
  `ID_id` int NOT NULL AUTO_INCREMENT,
  `ID_sub` int NOT NULL,
  `ID_name` varchar(100) NOT NULL,
  `ID_status` varchar(2) NOT NULL,
  `ID_contract` int NOT NULL,
  `ID_contract_end` date NOT NULL,
  `ID_contract_type` varchar(200) NOT NULL,
  `ID_active` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'S',
  `ID_current` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `_igroups`
--

DROP TABLE IF EXISTS `_igroups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `_igroups` (
  `IG_id` int NOT NULL AUTO_INCREMENT,
  `IG_order` int NOT NULL DEFAULT '0',
  `IG_name` varchar(100) NOT NULL,
  `IG_active` varchar(2) NOT NULL DEFAULT 'S',
  `IG_current` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`IG_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `_ijuser_groups`
--

DROP TABLE IF EXISTS `_ijuser_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `_ijuser_groups` (
  `IJ_IU_id` int NOT NULL,
  `IJ_IG_id` int NOT NULL,
  `IJ_IP_id` int NOT NULL,
  `IJ_ID_id` int NOT NULL DEFAULT '0',
  `IJ_adv` varchar(2) NOT NULL DEFAULT 'N',
  PRIMARY KEY (`IJ_IU_id`,`IJ_IG_id`,`IJ_IP_id`,`IJ_ID_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `_ilog_data`
--

DROP TABLE IF EXISTS `_ilog_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `_ilog_data` (
  `ILD_id` int NOT NULL AUTO_INCREMENT,
  `ILD_IU_id` int NOT NULL,
  `ILD_area` varchar(100) NOT NULL,
  `ILD_text` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `ILD_created` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ILD_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `_imac_vendors`
--

DROP TABLE IF EXISTS `_imac_vendors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `_imac_vendors` (
  `MV_id` int NOT NULL AUTO_INCREMENT,
  `MV_mac` varchar(15) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `MV_vendor` varchar(120) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `MV_family` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `MV_private` int DEFAULT NULL,
  `MV_type` varchar(4) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `MV_custom_type` varchar(20) NOT NULL,
  `MV_custom_type_ver` int NOT NULL DEFAULT '1',
  `MV_update` varchar(10) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  PRIMARY KEY (`MV_id`),
  UNIQUE KEY `Mac` (`MV_mac`),
  UNIQUE KEY `Family` (`MV_family`,`MV_mac`) USING BTREE,
  KEY `Private_2` (`MV_private`,`MV_type`,`MV_update`),
  KEY `OUI` (`MV_mac`,`MV_custom_type`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=53919 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `_ipages`
--

DROP TABLE IF EXISTS `_ipages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `_ipages` (
  `IP_id` int NOT NULL AUTO_INCREMENT,
  `IP_order` int NOT NULL DEFAULT '0',
  `IP_name` varchar(100) NOT NULL,
  `IP_alias` varchar(100) NOT NULL,
  `IP_internal` varchar(100) NOT NULL,
  `IP_path` varchar(100) NOT NULL,
  `IP_icon` varchar(100) NOT NULL,
  `IP_group` int DEFAULT NULL,
  `IP_active` varchar(2) NOT NULL DEFAULT 'S',
  `IP_current` int NOT NULL,
  `IP_admin` varchar(2) NOT NULL DEFAULT 'N',
  PRIMARY KEY (`IP_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `_iquery`
--

DROP TABLE IF EXISTS `_iquery`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `_iquery` (
  `IQ_id` int NOT NULL AUTO_INCREMENT,
  `IQ_group` varchar(100) NOT NULL,
  `IQ_name` varchar(100) NOT NULL,
  `IQ_query` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `IQ_active` varchar(2) NOT NULL DEFAULT 'S',
  `IQ_current` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`IQ_id`),
  UNIQUE KEY `IQ_name` (`IQ_name`)
) ENGINE=InnoDB AUTO_INCREMENT=1020 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `_itmp_data`
--

DROP TABLE IF EXISTS `_itmp_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `_itmp_data` (
  `ITD_id` int NOT NULL AUTO_INCREMENT,
  `ITD_IU_id` int NOT NULL,
  `ITD_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `ITD_created` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ITD_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `_itranslations`
--

DROP TABLE IF EXISTS `_itranslations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `_itranslations` (
  `IT_id` int NOT NULL AUTO_INCREMENT,
  `IT_lang_code` varchar(5) NOT NULL,
  `IT_label` varchar(100) NOT NULL,
  `IT_value` text NOT NULL,
  PRIMARY KEY (`IT_id`),
  UNIQUE KEY `IT_lang_code` (`IT_lang_code`,`IT_label`)
) ENGINE=InnoDB AUTO_INCREMENT=103 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `_iusers`
--

DROP TABLE IF EXISTS `_iusers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `_iusers` (
  `IU_id` int NOT NULL AUTO_INCREMENT,
  `IU_dom` int NOT NULL,
  `IU_sub` int NOT NULL,
  `IU_group` int DEFAULT NULL,
  `IU_lang` varchar(3) NOT NULL DEFAULT 'IT',
  `IU_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `IU_username` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `IU_report` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `IU_report_day` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `iu_report_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `iu_report_mails` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `IU_active` varchar(2) NOT NULL DEFAULT 'S',
  `IU_contract` int DEFAULT NULL,
  `ID_contract_end` date DEFAULT NULL,
  `ID_contract_type` varchar(30) DEFAULT NULL,
  `IU_current` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `IU_salt` varchar(100) NOT NULL,
  `IU_password` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `IU_secret_2fa` varchar(64) NOT NULL,
  `IU_custom` text,
  `IU_alert` varchar(2) NOT NULL DEFAULT 'S',
  `IU_alert_phone` varchar(200) NOT NULL,
  `IU_alert_mails` varchar(200) NOT NULL,
  `IU_alert_type` json NOT NULL,
  `IU_login_attempts` int NOT NULL DEFAULT '0',
  `IU_last_attempt` timestamp NULL DEFAULT NULL,
  `IU_blocked_until` datetime DEFAULT NULL,
  PRIMARY KEY (`IU_id`),
  UNIQUE KEY `IU_username` (`IU_username`,`IU_salt`,`IU_password`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `_log_alert`
--

DROP TABLE IF EXISTS `_log_alert`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `_log_alert` (
  `AL_id` int NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`AL_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `_log_login`
--

DROP TABLE IF EXISTS `_log_login`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `_log_login` (
  `LL_id` int NOT NULL AUTO_INCREMENT,
  `LL_day` timestamp NOT NULL,
  `LL_action` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `LL_data` json NOT NULL,
  `LL_user` int NOT NULL,
  PRIMARY KEY (`LL_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `_log_nmap_scan`
--

DROP TABLE IF EXISTS `_log_nmap_scan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `_log_nmap_scan` (
  `id` int NOT NULL AUTO_INCREMENT,
  `scan_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `total_found` int DEFAULT '0',
  `new_devices` int DEFAULT '0',
  `failed_devices` int DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `actions`
--

DROP TABLE IF EXISTS `actions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `actions` (
  `AC_id` int NOT NULL AUTO_INCREMENT,
  `AC_name` varchar(255) NOT NULL,
  `AC_type` varchar(16) DEFAULT 'MQTT',
  `AC_payload` text,
  `AC_description` text,
  `AC_active` varchar(2) DEFAULT 'S',
  `AC_current` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`AC_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `alerts`
--

DROP TABLE IF EXISTS `alerts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `alerts` (
  `AL_id` int NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`AL_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `alerts_templates`
--

DROP TABLE IF EXISTS `alerts_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `alerts_templates` (
  `AT_id` int NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`AT_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `alerts_type`
--

DROP TABLE IF EXISTS `alerts_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `alerts_type` (
  `AT_id` int NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`AT_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `device_self`
--

DROP TABLE IF EXISTS `device_self`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `device_self` (
  `DS_id` int NOT NULL AUTO_INCREMENT,
  `DS_licence` varchar(100) NOT NULL,
  `DS_end_date` date NOT NULL,
  `DS_uuid` varchar(255) NOT NULL,
  PRIMARY KEY (`DS_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `devices`
--

DROP TABLE IF EXISTS `devices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `devices` (
  `DE_id` int NOT NULL AUTO_INCREMENT COMMENT 'GR:Device:GR:DEH',
  `DE_gateway` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'GR:Details:GR;',
  `DE_link_to` int DEFAULT '0' COMMENT 'GR:Details:GR;',
  `DE_hops` int DEFAULT '0',
  `DE_status` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'S' COMMENT 'GR:Device:GR;AUTOLOCK',
  `DE_type` varchar(100) NOT NULL,
  `DE_ip` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT 'GR:Device:GR:DEF',
  `DE_mac` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'GR:Device:GR:DEF',
  `DE_hostname` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'GR:Device:GR:DEF',
  `DE_alias` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'GR:Device:GR:DEF',
  `DE_vendor` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'GR:Device:GR:DEF',
  `DE_http` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci COMMENT 'GR:Port:GR;LOCKED',
  `DE_http_conn` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'N',
  `DE_https` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci COMMENT 'GR:Port:GR;LOCKED',
  `DE_https_conn` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'N',
  `DE_rtsp` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci COMMENT 'GR:Port:GR;LOCKED',
  `DE_rtsp_conn` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'N',
  `DE_rtsps` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `DE_rtsps_conn` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `DE_mqtt` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `DE_mqtt_conn` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `DE_mqtts_conn` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `DE_mqtts` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `DE_ports` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci COMMENT 'GR:Port:GR;LOCKED',
  `DE_so` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'GR:Details:GR;',
  `DE_sw` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'GR:Details:GR;',
  `DE_current` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `DE_last_check` timestamp NULL DEFAULT NULL COMMENT 'GR:Details:GR;ALIAS:LAST VIEW:ALIAS',
  `DE_user` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'GR:Details:GR;',
  `DE_password` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'GR:Details:GR;',
  `DE_note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci COMMENT 'GR:Others:GR;',
  `DE_location` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'GR:Others:GR;AUTO',
  `DE_server` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'N',
  PRIMARY KEY (`DE_id`),
  UNIQUE KEY `uniq_mac` (`DE_mac`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=522 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `devices_mqtt`
--

DROP TABLE IF EXISTS `devices_mqtt`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `devices_mqtt` (
  `MQ_id` int NOT NULL AUTO_INCREMENT,
  `MQ_DE_id` int NOT NULL,
  `MQ_topic` varchar(255) NOT NULL,
  `MQ_payload` text,
  `MQ_description` varchar(255) DEFAULT NULL,
  `MQ_qos` tinyint DEFAULT '0',
  `MQ_retain` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`MQ_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `devices_onvif`
--

DROP TABLE IF EXISTS `devices_onvif`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `devices_onvif` (
  `ON_id` int NOT NULL AUTO_INCREMENT,
  `ON_DE_id` int NOT NULL,
  `ON_capability` varchar(255) NOT NULL,
  `ON_detail` text,
  `ON_api_call` varchar(255) DEFAULT NULL,
  `ON_enabled` tinyint(1) DEFAULT '1',
  `ON_active` varchar(2) DEFAULT 'N',
  `ON_current` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ON_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `devices_onvif_actions`
--

DROP TABLE IF EXISTS `devices_onvif_actions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `devices_onvif_actions` (
  `OA_id` int NOT NULL AUTO_INCREMENT,
  `OA_ON_id` int NOT NULL,
  `OA_AC_id` int NOT NULL,
  `OA_DE_id` int NOT NULL,
  `OA_trigger_device` int DEFAULT NULL,
  `OA_order` int DEFAULT '0',
  `OA_active` varchar(2) DEFAULT 'S',
  `OA_current` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`OA_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `devices_type`
--

DROP TABLE IF EXISTS `devices_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `devices_type` (
  `DT_id` int NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`DT_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `nmap_devices`
--

DROP TABLE IF EXISTS `nmap_devices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `nmap_devices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ip` varchar(45) DEFAULT NULL,
  `hostname` varchar(255) DEFAULT NULL,
  `mac` varchar(64) DEFAULT NULL,
  `vendor` varchar(255) DEFAULT NULL,
  `ports` text,
  `services` text,
  `device_type` varchar(255) DEFAULT NULL,
  `scan_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `status` char(1) DEFAULT 'N',
  `last_seen` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stream_data`
--

DROP TABLE IF EXISTS `stream_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `stream_data` (
  `SD_id` int NOT NULL AUTO_INCREMENT,
  `SD_timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`SD_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stream_evidence`
--

DROP TABLE IF EXISTS `stream_evidence`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `stream_evidence` (
  `SE_id` int NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`SE_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping routines for database 'vnsmanager_device'
--
/*!50003 DROP FUNCTION IF EXISTS `_do` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` FUNCTION `_do`(`i` VARCHAR(255)) RETURNS text CHARSET utf8mb3
    NO SQL
BEGIN
	DECLARE q TEXT;
    IF i REGEXP '^[0-9]+$' THEN
 		SET q = (SELECT `IQ_query` FROM `_iquery` WHERE `IQ_id` = i AND `IQ_active` = 'S');
    ELSE 
 		SET q = (SELECT `IQ_query` FROM `_iquery` WHERE `IQ_name` = i AND `IQ_active` = 'S');    
    END IF;
    RETURN q;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-07-18 10:48:07
