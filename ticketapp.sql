SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET TIME_ZONE = "+00:00";

CREATE DATABASE IF NOT EXISTS ticketapp DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE ticketapp;

-- Tablas básicas (sin dependencias)
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  dni int NOT NULL,
  name varchar(25) NOT NULL,
  surname varchar(25) NOT NULL,
  mail varchar(60) NOT NULL,
  birthDate date NOT NULL,
  password varchar(45) NOT NULL,
  PRIMARY KEY (dni),
  UNIQUE KEY mail_UNIQUE (mail)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS eventtype;
CREATE TABLE eventtype (
  idType int NOT NULL AUTO_INCREMENT,
  name varchar(45) NOT NULL,
  PRIMARY KEY (idType),
  UNIQUE KEY idType_UNIQUE (idType)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS places;
CREATE TABLE places (
  idPlace int NOT NULL AUTO_INCREMENT,
  name varchar(45) NOT NULL,
  totalCap int NOT NULL,
  address varchar(45) NOT NULL,
  PRIMARY KEY (idPlace),
  UNIQUE KEY idPlace_UNIQUE (idPlace)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tablas intermedias
DROP TABLE IF EXISTS event;
CREATE TABLE event (
  idEvent int NOT NULL AUTO_INCREMENT,
  name varchar(45) NOT NULL,
  description varchar(60) NOT NULL,
  date datetime NOT NULL,
  state varchar(45) NOT NULL,
  idEventType int NOT NULL,
  dniOrganiser int NOT NULL,
  PRIMARY KEY (idEvent),
  UNIQUE KEY idEvent_UNIQUE (idEvent),
  KEY dniOrganiser_idx (dniOrganiser),
  KEY idEventType_idx (idEventType),
  CONSTRAINT fk_event_dniOrganiser FOREIGN KEY (dniOrganiser) REFERENCES users (dni),
  CONSTRAINT fk_event_idEventType FOREIGN KEY (idEventType) REFERENCES eventtype (idType)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS sectors;
CREATE TABLE sectors (
  idSector int NOT NULL,
  idPlace int NOT NULL,
  name varchar(45) NOT NULL,
  capacity INT NOT NULL,
  PRIMARY KEY (idSector,idPlace),
  KEY idPlace_idx (idPlace),
  CONSTRAINT fk_sectors_places FOREIGN KEY (idPlace) REFERENCES places (idPlace)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tablas dependientes
DROP TABLE IF EXISTS seats;
CREATE TABLE seats (
  idSeat int NOT NULL,
  idSector int NOT NULL,
  idPlace int NOT NULL,
  state varchar(45) NOT NULL,
  PRIMARY KEY (idSeat,idSector,idPlace),
  UNIQUE KEY idx_place_sector_seat (idPlace,idSector,idSeat),
  KEY idSector_idPlace_idx (idSector,idPlace),
  CONSTRAINT fk_seats_sectors FOREIGN KEY (idSector, idPlace) REFERENCES sectors (idSector, idPlace)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS sales;
CREATE TABLE sales (
  idSale int NOT NULL AUTO_INCREMENT,
  date datetime NOT NULL,
  dniClient int NOT NULL,
  PRIMARY KEY (idSale),
  UNIQUE KEY idSale_UNIQUE (idSale),
  KEY idClient_idx (dniClient),
  CONSTRAINT fk_sales_users FOREIGN KEY (dniClient) REFERENCES users (dni)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS event_sector;
CREATE TABLE event_sector (
  idEvent int NOT NULL,
  idPlace int NOT NULL,
  idSector int NOT NULL,
  PRIMARY KEY (idEvent,idPlace,idSector),
  KEY idPlace_idSector_idx (idSector,idPlace),
  CONSTRAINT fk_eventsector_event FOREIGN KEY (idEvent) REFERENCES event (idEvent),
  CONSTRAINT fk_eventsector_sector FOREIGN KEY (idSector, idPlace) REFERENCES sectors (idSector, idPlace)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS saleitem;
CREATE TABLE saleitem (
  idSale int NOT NULL,
  dateSaleItem datetime NOT NULL,
  quantity INT NOT NULL,
  PRIMARY KEY (idSale,dateSaleItem),
  UNIQUE KEY idx_saleitem_idsaledatesaleitem (idSale,dateSaleItem),
  CONSTRAINT fk_saleitem_sales FOREIGN KEY (idSale) REFERENCES sales (idSale)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS prices;
CREATE TABLE prices (
  idEvent int NOT NULL,
  idPlace int NOT NULL,
  idSector int NOT NULL,
  dateSince datetime NOT NULL,
  price float NOT NULL,
  PRIMARY KEY (idEvent,idPlace,idSector,dateSince),
  CONSTRAINT fk_prices_eventsector FOREIGN KEY (idEvent, idPlace, idSector) REFERENCES event_sector (idEvent, idPlace, idSector)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS ticket;
CREATE TABLE ticket (
  idEvent int NOT NULL,
  idPlace int NOT NULL,
  idSector int NOT NULL,
  idTicket int NOT NULL,
  state varchar(45) NOT NULL,
  idSeat int NOT NULL,
  dateSaleItem datetime DEFAULT NULL,
  idSale int DEFAULT NULL,
  PRIMARY KEY (idEvent,idPlace,idSector,idTicket),
  KEY idSeat_idPlace_idSector_idx (idPlace,idSector,idSeat),
  KEY dateSaleItem_idSale_fk (idSale,dateSaleItem),
  CONSTRAINT fk_ticket_eventsector FOREIGN KEY (idEvent, idPlace, idSector) REFERENCES event_sector (idEvent, idPlace, idSector),
  CONSTRAINT fk_ticket_seat FOREIGN KEY (idPlace, idSector, idSeat) REFERENCES seats (idPlace, idSector, idSeat),
  CONSTRAINT fk_ticket_saleitem FOREIGN KEY (idSale, dateSaleItem) REFERENCES saleitem (idSale, dateSaleItem)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Insertar datos
INSERT INTO users (dni, name, surname, mail, birthDate, password) VALUES
(11223344, 'Martín', 'López', 'martin.lopez@mail.com', '1988-03-15', 'qwerty'),
(12345678, 'Juan', 'Peppino', 'juan.perez@mail.com', '1990-05-10', '1234'),
(46789000, 'Marto', 'Garcia', 'marto@gmail.com', '1999-02-10', '123456'),
(55667788, 'Ana', 'Rodríguez', 'ana.rodriguez@mail.com', '1992-08-30', 'test123'),
(87654321, 'Lucía', 'Gómez', 'lucia.gomez@mail.com', '1995-11-22', 'abcd');

INSERT INTO eventtype (idType, name) VALUES
(1, 'Concierto'),
(2, 'Stand Up'),
(3, 'Jornada de Lectura'),
(4, 'Fiesta'),
(5, 'Evento Deportivo'),
(6, 'Arte');

INSERT INTO places (idPlace, name, totalCap, address) VALUES
(1, 'Anfiteatro', 100, 'Av. Belgrano 100 bis'),
(2, 'Estadio Gigante de Arroyito', 200, 'Av. Génova 640'),
(3, 'Bioceres Arena', 50, 'Cafferata 729'),
(4, 'El Ateneo', 25, 'Cordoba 1473');

INSERT INTO sectors (idSector, idPlace, name, capacity) VALUES
(1, 1, 'Anfiteatro', 100),
(1, 2, 'Campo', 100),
(1, 3, 'Campo', 100),
(1, 4, 'El Ateneo', 25),
(2, 2, 'Platea Norte Baja', 25),
(2, 3, 'Platea Gold', 25),
(3, 2, 'Platea Norte Alta', 25),
(3, 3, 'Platea Trasera', 25),
(4, 2, 'Platea Sur Baja', 25),
(4, 3, 'Platea Alta', 25),
(5, 2, 'Platea Sur Alta', 25),
(6, 2, 'Popular Baja', 25),
(7, 2, 'Popular Alta', 25);

INSERT INTO seats (idSeat, idSector, idPlace, state) VALUES 
(1, 2, 2, 'D'), (1, 2, 3, 'D'), (1, 3, 2, 'D'), (1, 3, 3, 'D'), (1, 4, 2, 'D'),
(1, 4, 3, 'D'), (1, 5, 2, 'D'), (1, 6, 2, 'D'), (1, 7, 2, 'D'), (2, 2, 2, 'D'),
(2, 2, 3, 'D'), (2, 3, 2, 'D'), (2, 3, 3, 'D'), (2, 4, 2, 'D'), (2, 4, 3, 'D'),
(2, 5, 2, 'D'), (2, 6, 2, 'D'), (2, 7, 2, 'D'), (3, 2, 2, 'D'), (3, 2, 3, 'D'),
(3, 3, 2, 'D'), (3, 3, 3, 'D'), (3, 4, 2, 'D'), (3, 4, 3, 'D'), (3, 5, 2, 'D'),
(3, 6, 2, 'D'), (3, 7, 2, 'D'), (4, 2, 2, 'D'), (4, 2, 3, 'D'), (4, 3, 2, 'D'),
(4, 3, 3, 'D'), (4, 4, 2, 'D'), (4, 4, 3, 'D'), (4, 5, 2, 'D'), (4, 6, 2, 'D'),
(4, 7, 2, 'D'), (5, 2, 2, 'D'), (5, 2, 3, 'D'), (5, 3, 2, 'D'), (5, 3, 3, 'D'),
(5, 4, 2, 'D'), (5, 4, 3, 'D'), (5, 5, 2, 'D'), (5, 6, 2, 'D'), (5, 7, 2, 'D'),
(6, 2, 2, 'D'), (6, 2, 3, 'D'), (6, 3, 2, 'D'), (6, 3, 3, 'D'), (6, 4, 2, 'D'),
(6, 4, 3, 'D'), (6, 5, 2, 'D'), (6, 6, 2, 'D'), (6, 7, 2, 'D'), (7, 2, 2, 'D'),
(7, 2, 3, 'D'), (7, 3, 2, 'D'), (7, 3, 3, 'D'), (7, 4, 2, 'D'), (7, 4, 3, 'D'),
(7, 5, 2, 'D'), (7, 6, 2, 'D'), (7, 7, 2, 'D'), (8, 2, 2, 'D'), (8, 2, 3, 'D'),
(8, 3, 2, 'D'), (8, 3, 3, 'D'), (8, 4, 2, 'D'), (8, 4, 3, 'D'), (8, 5, 2, 'D'),
(8, 6, 2, 'D'), (8, 7, 2, 'D'), (9, 2, 2, 'D'), (9, 2, 3, 'D'), (9, 3, 2, 'D'),
(9, 3, 3, 'D'), (9, 4, 2, 'D'), (9, 4, 3, 'D'), (9, 5, 2, 'D'), (9, 6, 2, 'D'),
(9, 7, 2, 'D'), (10, 2, 2, 'D'), (10, 2, 3, 'D'), (10, 3, 2, 'D'), (10, 3, 3, 'D'),
(10, 4, 2, 'D'), (10, 4, 3, 'D'), (10, 5, 2, 'D'), (10, 6, 2, 'D'), (10, 7, 2, 'D'),
(11, 2, 2, 'D'), (11, 2, 3, 'D'), (11, 3, 2, 'D'), (11, 3, 3, 'D'), (11, 4, 2, 'D'),
(11, 4, 3, 'D'), (11, 5, 2, 'D'), (11, 6, 2, 'D'), (11, 7, 2, 'D'), (12, 2, 2, 'D'),
(12, 2, 3, 'D'), (12, 3, 2, 'D'), (12, 3, 3, 'D'), (12, 4, 2, 'D'), (12, 4, 3, 'D'),
(12, 5, 2, 'D'), (12, 6, 2, 'D'), (12, 7, 2, 'D'), (13, 2, 2, 'D'), (13, 2, 3, 'D'),
(13, 3, 2, 'D'), (13, 3, 3, 'D'), (13, 4, 2, 'D'), (13, 4, 3, 'D'), (13, 5, 2, 'D'),
(13, 6, 2, 'D'), (13, 7, 2, 'D'), (14, 2, 2, 'D'), (14, 2, 3, 'D'), (14, 3, 2, 'D'),
(14, 3, 3, 'D'), (14, 4, 2, 'D'), (14, 4, 3, 'D'), (14, 5, 2, 'D'), (14, 6, 2, 'D'),
(14, 7, 2, 'D'), (15, 2, 2, 'D'), (15, 2, 3, 'D'), (15, 3, 2, 'D'), (15, 3, 3, 'D'),
(15, 4, 2, 'D'), (15, 4, 3, 'D'), (15, 5, 2, 'D'), (15, 6, 2, 'D'), (15, 7, 2, 'D'),
(16, 2, 2, 'D'), (16, 2, 3, 'D'), (16, 3, 2, 'D'), (16, 3, 3, 'D'), (16, 4, 2, 'D'),
(16, 4, 3, 'D'), (16, 5, 2, 'D'), (16, 6, 2, 'D'), (16, 7, 2, 'D'), (17, 2, 2, 'D'),
(17, 2, 3, 'D'), (17, 3, 2, 'D'), (17, 3, 3, 'D'), (17, 4, 2, 'D'), (17, 4, 3, 'D'),
(17, 5, 2, 'D'), (17, 6, 2, 'D'), (17, 7, 2, 'D'), (18, 2, 2, 'D'), (18, 2, 3, 'D'),
(18, 3, 2, 'D'), (18, 3, 3, 'D'), (18, 4, 2, 'D'), (18, 4, 3, 'D'), (18, 5, 2, 'D'),
(18, 6, 2, 'D'), (18, 7, 2, 'D'), (19, 2, 2, 'D'), (19, 2, 3, 'D'), (19, 3, 2, 'D'),
(19, 3, 3, 'D'), (19, 4, 2, 'D'), (19, 4, 3, 'D'), (19, 5, 2, 'D'), (19, 6, 2, 'D'),
(19, 7, 2, 'D'), (20, 2, 2, 'D'), (20, 2, 3, 'D'), (20, 3, 2, 'D'), (20, 3, 3, 'D'),
(20, 4, 2, 'D'), (20, 4, 3, 'D'), (20, 5, 2, 'D'), (20, 6, 2, 'D'), (20, 7, 2, 'D'),
(21, 2, 2, 'D'), (21, 2, 3, 'D'), (21, 3, 2, 'D'), (21, 3, 3, 'D'), (21, 4, 2, 'D'),
(21, 4, 3, 'D'), (21, 5, 2, 'D'), (21, 6, 2, 'D'), (21, 7, 2, 'D'), (22, 2, 2, 'D'),
(22, 2, 3, 'D'), (22, 3, 2, 'D'), (22, 3, 3, 'D'), (22, 4, 2, 'D'), (22, 4, 3, 'D'),
(22, 5, 2, 'D'), (22, 6, 2, 'D'), (22, 7, 2, 'D'), (23, 2, 2, 'D'), (23, 2, 3, 'D'),
(23, 3, 2, 'D'), (23, 3, 3, 'D'), (23, 4, 2, 'D'), (23, 4, 3, 'D'), (23, 5, 2, 'D'),
(23, 6, 2, 'D'), (23, 7, 2, 'D'), (24, 2, 2, 'D'), (24, 2, 3, 'D'), (24, 3, 2, 'D'),
(24, 3, 3, 'D'), (24, 4, 2, 'D'), (24, 4, 3, 'D'), (24, 5, 2, 'D'), (24, 6, 2, 'D'),
(24, 7, 2, 'D'), (25, 2, 2, 'D'), (25, 2, 3, 'D'), (25, 3, 2, 'D'), (25, 3, 3, 'D'),
(25, 4, 2, 'D'), (25, 4, 3, 'D'), (25, 5, 2, 'D'), (25, 6, 2, 'D'), (25, 7, 2, 'D');

-- Reactivar restricciones
SET FOREIGN_KEY_CHECKS = 1;

-- Mensaje de confirmación
SELECT 'Base de datos y datos importados correctamente' AS Resultado;
