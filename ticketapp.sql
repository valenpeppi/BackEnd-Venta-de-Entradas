-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: localhost    Database: ticketapp
-- ------------------------------------------------------
-- Server version	9.3.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `event`
--

DROP TABLE IF EXISTS `event`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event` (
  `idEvent` int NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL,
  `description` varchar(60) NOT NULL,
  `date` datetime NOT NULL,
  `state` varchar(45) NOT NULL,
  `idEventType` int NOT NULL,
  `dniOrganiser` int NOT NULL,
  PRIMARY KEY (`idEvent`),
  UNIQUE KEY `idEvent_UNIQUE` (`idEvent`),
  KEY `dniOrganiser_idx` (`dniOrganiser`),
  KEY `idEventType_idx` (`idEventType`),
  CONSTRAINT `fk_event_dniOrganiser` FOREIGN KEY (`dniOrganiser`) REFERENCES `users` (`dni`),
  CONSTRAINT `fk_event_idEventType` FOREIGN KEY (`idEventType`) REFERENCES `eventtype` (`idType`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event`
--

LOCK TABLES `event` WRITE;
/*!40000 ALTER TABLE `event` DISABLE KEYS */;
/*!40000 ALTER TABLE `event` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `event_sector`
--

DROP TABLE IF EXISTS `event_sector`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_sector` (
  `idEvent` int NOT NULL,
  `idPlace` int NOT NULL,
  `idSector` int NOT NULL,
  PRIMARY KEY (`idEvent`,`idPlace`,`idSector`),
  KEY `idPlace_idSector_idx` (`idSector`,`idPlace`),
  CONSTRAINT `fk_eventsector_event` FOREIGN KEY (`idEvent`) REFERENCES `event` (`idEvent`),
  CONSTRAINT `fk_eventsector_sector` FOREIGN KEY (`idSector`, `idPlace`) REFERENCES `sectors` (`idSector`, `idPlace`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_sector`
--

LOCK TABLES `event_sector` WRITE;
/*!40000 ALTER TABLE `event_sector` DISABLE KEYS */;
/*!40000 ALTER TABLE `event_sector` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `eventtype`
--

DROP TABLE IF EXISTS `eventtype`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `eventtype` (
  `idType` int NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL,
  PRIMARY KEY (`idType`),
  UNIQUE KEY `idType_UNIQUE` (`idType`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `eventtype`
--

LOCK TABLES `eventtype` WRITE;
/*!40000 ALTER TABLE `eventtype` DISABLE KEYS */;
INSERT INTO `eventtype` VALUES (1,'Concierto'),(2,'Stand Up'),(3,'Jornada de Lectura'),(4,'Fiesta'),(5,'Evento Deportivo'),(6,'Arte');
/*!40000 ALTER TABLE `eventtype` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `organiser_company`
--

DROP TABLE IF EXISTS `organiser_company`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `organiser_company` (
  `idOrganiser` int NOT NULL AUTO_INCREMENT,
  `company_name` varchar(100) DEFAULT NULL,
  `cuil` varchar(20) DEFAULT NULL,
  `contact_email` varchar(100) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`idOrganiser`),
  UNIQUE KEY `cuit` (`cuil`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `organiser_company`
--

LOCK TABLES `organiser_company` WRITE;
/*!40000 ALTER TABLE `organiser_company` DISABLE KEYS */;
INSERT INTO `organiser_company` VALUES (1,'Eventos SRL','30-12345678-9','contacto@eventos.com','password_hash_ejemplo','3411234567','Av. San Martín 123');
/*!40000 ALTER TABLE `organiser_company` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `places`
--

DROP TABLE IF EXISTS `places`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `places` (
  `idPlace` int NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL,
  `totalCap` int NOT NULL,
  `address` varchar(45) NOT NULL,
  PRIMARY KEY (`idPlace`),
  UNIQUE KEY `idPlace_UNIQUE` (`idPlace`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `places`
--

LOCK TABLES `places` WRITE;
/*!40000 ALTER TABLE `places` DISABLE KEYS */;
INSERT INTO `places` VALUES (1,'Anfiteatro',100,'Av. Belgrano 100 bis'),(2,'Estadio Gigante de Arroyito',200,'Av. Génova 640'),(3,'Bioceres Arena',50,'Cafferata 729'),(4,'El Ateneo',25,'Cordoba 1473');
/*!40000 ALTER TABLE `places` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prices`
--

DROP TABLE IF EXISTS `prices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prices` (
  `idEvent` int NOT NULL,
  `idPlace` int NOT NULL,
  `idSector` int NOT NULL,
  `dateSince` datetime NOT NULL,
  `price` float NOT NULL,
  PRIMARY KEY (`idEvent`,`idPlace`,`idSector`,`dateSince`),
  CONSTRAINT `fk_prices_eventsector` FOREIGN KEY (`idEvent`, `idPlace`, `idSector`) REFERENCES `event_sector` (`idEvent`, `idPlace`, `idSector`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prices`
--

LOCK TABLES `prices` WRITE;
/*!40000 ALTER TABLE `prices` DISABLE KEYS */;
/*!40000 ALTER TABLE `prices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `saleitem`
--

DROP TABLE IF EXISTS `saleitem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `saleitem` (
  `idSale` int NOT NULL,
  `dateSaleItem` datetime NOT NULL,
  `quantity` int NOT NULL,
  PRIMARY KEY (`idSale`,`dateSaleItem`),
  UNIQUE KEY `idx_saleitem_idsaledatesaleitem` (`idSale`,`dateSaleItem`),
  CONSTRAINT `fk_saleitem_sales` FOREIGN KEY (`idSale`) REFERENCES `sales` (`idSale`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `saleitem`
--

LOCK TABLES `saleitem` WRITE;
/*!40000 ALTER TABLE `saleitem` DISABLE KEYS */;
/*!40000 ALTER TABLE `saleitem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales`
--

DROP TABLE IF EXISTS `sales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales` (
  `idSale` int NOT NULL AUTO_INCREMENT,
  `date` datetime NOT NULL,
  `dniClient` int NOT NULL,
  PRIMARY KEY (`idSale`),
  UNIQUE KEY `idSale_UNIQUE` (`idSale`),
  KEY `idClient_idx` (`dniClient`),
  CONSTRAINT `fk_sales_users` FOREIGN KEY (`dniClient`) REFERENCES `users` (`dni`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales`
--

LOCK TABLES `sales` WRITE;
/*!40000 ALTER TABLE `sales` DISABLE KEYS */;
/*!40000 ALTER TABLE `sales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `seats`
--

DROP TABLE IF EXISTS `seats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `seats` (
  `idSeat` int NOT NULL,
  `idSector` int NOT NULL,
  `idPlace` int NOT NULL,
  `state` varchar(45) NOT NULL,
  PRIMARY KEY (`idSeat`,`idSector`,`idPlace`),
  UNIQUE KEY `idx_place_sector_seat` (`idPlace`,`idSector`,`idSeat`),
  KEY `idSector_idPlace_idx` (`idSector`,`idPlace`),
  CONSTRAINT `fk_seats_sectors` FOREIGN KEY (`idSector`, `idPlace`) REFERENCES `sectors` (`idSector`, `idPlace`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `seats`
--

LOCK TABLES `seats` WRITE;
/*!40000 ALTER TABLE `seats` DISABLE KEYS */;
/*!40000 ALTER TABLE `seats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sectors`
--

DROP TABLE IF EXISTS `sectors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sectors` (
  `idSector` int NOT NULL,
  `idPlace` int NOT NULL,
  `name` varchar(45) NOT NULL,
  `capacity` int NOT NULL,
  PRIMARY KEY (`idSector`,`idPlace`),
  KEY `idPlace_idx` (`idPlace`),
  CONSTRAINT `fk_sectors_places` FOREIGN KEY (`idPlace`) REFERENCES `places` (`idPlace`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sectors`
--

LOCK TABLES `sectors` WRITE;
/*!40000 ALTER TABLE `sectors` DISABLE KEYS */;
INSERT INTO `sectors` VALUES (1,1,'Platea',40),(1,2,'Campo',80),(1,3,'VIP',20),(1,4,'Sala Principal',25),(2,1,'Pullman',60),(2,2,'Tribuna Norte',60),(2,3,'General',30),(3,2,'Tribuna Sur',60);
/*!40000 ALTER TABLE `sectors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket`
--

DROP TABLE IF EXISTS `ticket`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ticket` (
  `idEvent` int NOT NULL,
  `idPlace` int NOT NULL,
  `idSector` int NOT NULL,
  `idTicket` int NOT NULL,
  `state` varchar(45) NOT NULL,
  `idSeat` int NOT NULL,
  `dateSaleItem` datetime DEFAULT NULL,
  `idSale` int DEFAULT NULL,
  PRIMARY KEY (`idEvent`,`idPlace`,`idSector`,`idTicket`),
  KEY `idSeat_idPlace_idSector_idx` (`idPlace`,`idSector`,`idSeat`),
  KEY `dateSaleItem_idSale_fk` (`idSale`,`dateSaleItem`),
  CONSTRAINT `fk_ticket_eventsector` FOREIGN KEY (`idEvent`, `idPlace`, `idSector`) REFERENCES `event_sector` (`idEvent`, `idPlace`, `idSector`),
  CONSTRAINT `fk_ticket_saleitem` FOREIGN KEY (`idSale`, `dateSaleItem`) REFERENCES `saleitem` (`idSale`, `dateSaleItem`),
  CONSTRAINT `fk_ticket_seat` FOREIGN KEY (`idPlace`, `idSector`, `idSeat`) REFERENCES `seats` (`idPlace`, `idSector`, `idSeat`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket`
--

LOCK TABLES `ticket` WRITE;
/*!40000 ALTER TABLE `ticket` DISABLE KEYS */;
/*!40000 ALTER TABLE `ticket` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `dni` int NOT NULL,
  `name` varchar(25) NOT NULL,
  `surname` varchar(25) NOT NULL,
  `mail` varchar(60) NOT NULL,
  `birthDate` date NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  PRIMARY KEY (`dni`),
  UNIQUE KEY `mail_UNIQUE` (`mail`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (45500050,'peppi','','peppi@gmail.com','2005-04-14','$2b$10$Z7PACw9ViPwDBQigQCYY8ODKtGCr/KgCv5A8x9I5VgT1u9UJ.4wBG','admin'),(46187000,'gian','','gian@hotmail.com','2005-01-02','$2b$10$hMdQajMzMI1W6a4bysyO/ujN9Ug9tfV0uA5pskfeJKaTUsrFsH63a','user');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-08-08 12:54:28
