CREATE DATABASE IF NOT EXISTS ticketapp;
USE ticketapp;

-- 🔹 Desactivar chequeo de claves foráneas para permitir drops en cualquier orden
SET FOREIGN_KEY_CHECKS = 0;

-- Eliminar tablas (orden no importa porque está desactivado el chequeo)
DROP TABLE IF EXISTS `ticket`;
DROP TABLE IF EXISTS `saleitem`;
DROP TABLE IF EXISTS `sales`;
DROP TABLE IF EXISTS `prices`;
DROP TABLE IF EXISTS `event_sector`;
DROP TABLE IF EXISTS `event`;
DROP TABLE IF EXISTS `organiser_company`;
DROP TABLE IF EXISTS `seats`;
DROP TABLE IF EXISTS `sectors`;
DROP TABLE IF EXISTS `places`;
DROP TABLE IF EXISTS `eventtype`;
DROP TABLE IF EXISTS `users`;

-- Volver a activar chequeo
SET FOREIGN_KEY_CHECKS = 1;

-- =========================
-- CREACIÓN DE TABLAS
-- =========================

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

CREATE TABLE `eventtype` (
  `idType` int NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL,
  PRIMARY KEY (`idType`),
  UNIQUE KEY `idType_UNIQUE` (`idType`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `places` (
  `idPlace` int NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL,
  `totalCap` int NOT NULL,
  `address` varchar(45) NOT NULL,
  PRIMARY KEY (`idPlace`),
  UNIQUE KEY `idPlace_UNIQUE` (`idPlace`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `sectors` (
  `idSector` int NOT NULL,
  `idPlace` int NOT NULL,
  `name` varchar(45) NOT NULL,
  `capacity` int NOT NULL,
  PRIMARY KEY (`idSector`,`idPlace`),
  KEY `idPlace_idx` (`idPlace`),
  CONSTRAINT `fk_sectors_places` FOREIGN KEY (`idPlace`) REFERENCES `places` (`idPlace`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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

CREATE TABLE `event_sector` (
  `idEvent` int NOT NULL,
  `idPlace` int NOT NULL,
  `idSector` int NOT NULL,
  PRIMARY KEY (`idEvent`,`idPlace`,`idSector`),
  KEY `idPlace_idSector_idx` (`idSector`,`idPlace`),
  CONSTRAINT `fk_eventsector_event` FOREIGN KEY (`idEvent`) REFERENCES `event` (`idEvent`),
  CONSTRAINT `fk_eventsector_sector` FOREIGN KEY (`idSector`, `idPlace`) REFERENCES `sectors` (`idSector`, `idPlace`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `prices` (
  `idEvent` int NOT NULL,
  `idPlace` int NOT NULL,
  `idSector` int NOT NULL,
  `dateSince` datetime NOT NULL,
  `price` float NOT NULL,
  PRIMARY KEY (`idEvent`,`idPlace`,`idSector`,`dateSince`),
  CONSTRAINT `fk_prices_eventsector` FOREIGN KEY (`idEvent`, `idPlace`, `idSector`) REFERENCES `event_sector` (`idEvent`, `idPlace`, `idSector`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `sales` (
  `idSale` int NOT NULL AUTO_INCREMENT,
  `date` datetime NOT NULL,
  `dniClient` int NOT NULL,
  PRIMARY KEY (`idSale`),
  UNIQUE KEY `idSale_UNIQUE` (`idSale`),
  KEY `idClient_idx` (`dniClient`),
  CONSTRAINT `fk_sales_users` FOREIGN KEY (`dniClient`) REFERENCES `users` (`dni`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `saleitem` (
  `idSale` int NOT NULL,
  `dateSaleItem` datetime NOT NULL,
  `quantity` int NOT NULL,
  PRIMARY KEY (`idSale`,`dateSaleItem`),
  UNIQUE KEY `idx_saleitem_idsaledatesaleitem` (`idSale`,`dateSaleItem`),
  CONSTRAINT `fk_saleitem_sales` FOREIGN KEY (`idSale`) REFERENCES `sales` (`idSale`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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

-- =========================
-- INSERCIÓN DE DATOS
-- =========================

LOCK TABLES `users` WRITE;
INSERT INTO `users` VALUES 
(11223344,'Martín','López','martin.lopez@mail.com','1988-03-15','qwerty','user'),
(12345678,'Juan','Peppino','juan.perez@mail.com','1990-05-10','1234','user'),
(46789000,'Marto','Garcia','marto@gmail.com','1999-02-10','123456','admin'),
(55667788,'Ana','Rodríguez','ana.rodriguez@mail.com','1992-08-30','test123','user'),
(87654321,'Lucía','Gómez','lucia.gomez@mail.com','1995-11-22','abcd','user');
UNLOCK TABLES;

LOCK TABLES `eventtype` WRITE;
INSERT INTO `eventtype` VALUES 
(1,'Concierto'),(2,'Stand Up'),(3,'Jornada de Lectura'),
(4,'Fiesta'),(5,'Evento Deportivo'),(6,'Arte');
UNLOCK TABLES;

LOCK TABLES `places` WRITE;
INSERT INTO `places` VALUES 
(1,'Anfiteatro',100,'Av. Belgrano 100 bis'),
(2,'Estadio Gigante de Arroyito',200,'Av. Génova 640'),
(3,'Bioceres Arena',50,'Cafferata 729'),
(4,'El Ateneo',25,'Cordoba 1473');
UNLOCK TABLES;

LOCK TABLES `organiser_company` WRITE;
INSERT INTO `organiser_company` (`idOrganiser`, `company_name`, `cuil`, `contact_email`, `password`, `phone`, `address`) 
VALUES (1,'Eventos SRL','30-12345678-9','contacto@eventos.com','password_hash_ejemplo','3411234567','Av. San Martín 123');
UNLOCK TABLES;

LOCK TABLES `sectors` WRITE;
INSERT INTO `sectors` VALUES 
(1,1,'Platea',40),
(2,1,'Pullman',60),
(1,2,'Campo',80),
(2,2,'Tribuna Norte',60),
(3,2,'Tribuna Sur',60),
(1,3,'VIP',20),
(2,3,'General',30),
(1,4,'Sala Principal',25);
UNLOCK TABLES;