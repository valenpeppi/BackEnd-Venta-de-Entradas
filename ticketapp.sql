CREATE DATABASE IF NOT EXISTS ticketapp;
USE ticketapp;

-- -- Table structure for table `users` --
DROP TABLE IF EXISTS `users`;
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

-- -- Table structure for table `eventtype` --
DROP TABLE IF EXISTS `eventtype`;
CREATE TABLE `eventtype` (
  `idType` int NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL,
  PRIMARY KEY (`idType`),
  UNIQUE KEY `idType_UNIQUE` (`idType`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -- Table structure for table `places` --
DROP TABLE IF EXISTS `places`;
CREATE TABLE `places` (
  `idPlace` int NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL,
  `totalCap` int NOT NULL,
  `address` varchar(45) NOT NULL,
  PRIMARY KEY (`idPlace`),
  UNIQUE KEY `idPlace_UNIQUE` (`idPlace`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -- Table structure for table `sectors` --
DROP TABLE IF EXISTS `sectors`;
CREATE TABLE `sectors` (
  `idSector` int NOT NULL,
  `idPlace` int NOT NULL,
  `name` varchar(45) NOT NULL,
  `capacity` int NOT NULL,
  PRIMARY KEY (`idSector`,`idPlace`),
  KEY `idPlace_idx` (`idPlace`),
  CONSTRAINT `fk_sectors_places` FOREIGN KEY (`idPlace`) REFERENCES `places` (`idPlace`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -- Table structure for table `seats` --
DROP TABLE IF EXISTS `seats`;
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

-- -- Table structure for table `organiser_company` --
DROP TABLE IF EXISTS `organiser_company`;
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

-- -- Table structure for table `event` --
DROP TABLE IF EXISTS `event`;
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

-- -- Table structure for table `event_sector` --
DROP TABLE IF EXISTS `event_sector`;
CREATE TABLE `event_sector` (
  `idEvent` int NOT NULL,
  `idPlace` int NOT NULL,
  `idSector` int NOT NULL,
  PRIMARY KEY (`idEvent`,`idPlace`,`idSector`),
  KEY `idPlace_idSector_idx` (`idSector`,`idPlace`),
  CONSTRAINT `fk_eventsector_event` FOREIGN KEY (`idEvent`) REFERENCES `event` (`idEvent`),
  CONSTRAINT `fk_eventsector_sector` FOREIGN KEY (`idSector`, `idPlace`) REFERENCES `sectors` (`idSector`, `idPlace`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -- Table structure for table `prices` --
DROP TABLE IF EXISTS `prices`;
CREATE TABLE `prices` (
  `idEvent` int NOT NULL,
  `idPlace` int NOT NULL,
  `idSector` int NOT NULL,
  `dateSince` datetime NOT NULL,
  `price` float NOT NULL,
  PRIMARY KEY (`idEvent`,`idPlace`,`idSector`,`dateSince`),
  CONSTRAINT `fk_prices_eventsector` FOREIGN KEY (`idEvent`, `idPlace`, `idSector`) REFERENCES `event_sector` (`idEvent`, `idPlace`, `idSector`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -- Table structure for table `sales` --
DROP TABLE IF EXISTS `sales`;
CREATE TABLE `sales` (
  `idSale` int NOT NULL AUTO_INCREMENT,
  `date` datetime NOT NULL,
  `dniClient` int NOT NULL,
  PRIMARY KEY (`idSale`),
  UNIQUE KEY `idSale_UNIQUE` (`idSale`),
  KEY `idClient_idx` (`dniClient`),
  CONSTRAINT `fk_sales_users` FOREIGN KEY (`dniClient`) REFERENCES `users` (`dni`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -- Table structure for table `saleitem` --
DROP TABLE IF EXISTS `saleitem`;
CREATE TABLE `saleitem` (
  `idSale` int NOT NULL,
  `dateSaleItem` datetime NOT NULL,
  `quantity` int NOT NULL,
  PRIMARY KEY (`idSale`,`dateSaleItem`),
  UNIQUE KEY `idx_saleitem_idsaledatesaleitem` (`idSale`,`dateSaleItem`),
  CONSTRAINT `fk_saleitem_sales` FOREIGN KEY (`idSale`) REFERENCES `sales` (`idSale`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -- Table structure for table `ticket` --
DROP TABLE IF EXISTS `ticket`;
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

-- -- Dumping data for table `users` --
LOCK TABLES `users` WRITE;
INSERT INTO `users` VALUES 
(11223344,'Martín','López','martin.lopez@mail.com','1988-03-15','qwerty','user'),
(12345678,'Juan','Peppino','juan.perez@mail.com','1990-05-10','1234','user'),
(46789000,'Marto','Garcia','marto@gmail.com','1999-02-10','123456','admin'),
(55667788,'Ana','Rodríguez','ana.rodriguez@mail.com','1992-08-30','test123','user'),
(87654321,'Lucía','Gómez','lucia.gomez@mail.com','1995-11-22','abcd','user');
UNLOCK TABLES;

-- -- Dumping data for table `eventtype` --
LOCK TABLES `eventtype` WRITE;
INSERT INTO `eventtype` VALUES 
(1,'Concierto'),(2,'Stand Up'),(3,'Jornada de Lectura'),
(4,'Fiesta'),(5,'Evento Deportivo'),(6,'Arte');
UNLOCK TABLES;

-- -- Dumping data for table `places` --
LOCK TABLES `places` WRITE;
INSERT INTO `places` VALUES 
(1,'Anfiteatro',100,'Av. Belgrano 100 bis'),
(2,'Estadio Gigante de Arroyito',200,'Av. Génova 640'),
(3,'Bioceres Arena',50,'Cafferata 729'),
(4,'El Ateneo',25,'Cordoba 1473');
UNLOCK TABLES;

-- -- Dumping data for table `organiser_company` --
LOCK TABLES `organiser_company` WRITE;
-- Corregida la sentencia INSERT para incluir el campo 'password' y alinear los valores
INSERT INTO `organiser_company` (`idOrganiser`, `company_name`, `cuil`, `contact_email`, `password`, `phone`, `address`) 
VALUES (1,'Eventos SRL','30-12345678-9','contacto@eventos.com','password_hash_ejemplo','3411234567','Av. San Martín 123');
UNLOCK TABLES;

-- -- Dumping data para las demás tablas (event, event_sector, seats, sectors, prices, saleitem, sales, ticket) --
-- (Mantengo los datos originales ya que no pediste cambios allí. Si querés que los incluya, avisame)
