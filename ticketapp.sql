-- Script de la base de datos ticketapp

SET FOREIGN_KEY_CHECKS = 0;

DROP DATABASE IF EXISTS ticketapp;
CREATE DATABASE ticketapp;
USE ticketapp;

-- Tabla users
CREATE TABLE users (
  dni INT NOT NULL,
  name VARCHAR(25) NOT NULL,
  surname VARCHAR(25) NOT NULL,
  mail VARCHAR(60) NOT NULL,
  birthDate DATE NOT NULL,
  password VARCHAR(45) NOT NULL,
  PRIMARY KEY (dni),
  UNIQUE (dni),
  UNIQUE (mail)
);

-- Tabla eventtype
CREATE TABLE eventtype (
  idType INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(45) NOT NULL,
  PRIMARY KEY (idType),
  UNIQUE (idType)
);

-- Tabla places
CREATE TABLE places (
  idPlace INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(45) NOT NULL,
  totalCap INT NOT NULL,
  adress VARCHAR(45) NOT NULL,
  PRIMARY KEY (idPlace),
  UNIQUE (idPlace)
);

-- Tabla sectors
CREATE TABLE sectors (
  idSector INT NOT NULL,
  idPlace INT NOT NULL,
  name VARCHAR(45) NOT NULL,
  capacity VARCHAR(45) NOT NULL,
  PRIMARY KEY (idSector, idPlace),
  KEY idx_idPlace (idPlace),
  CONSTRAINT fk_sector_place FOREIGN KEY (idPlace) REFERENCES places(idPlace)
);

-- Tabla event
CREATE TABLE event (
  idEvent INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(45) NOT NULL,
  description VARCHAR(60) NOT NULL,
  date DATETIME NOT NULL,
  state VARCHAR(45) NOT NULL,
  idEventType INT NOT NULL,
  dniOrganiser INT NOT NULL,
  PRIMARY KEY (idEvent),
  UNIQUE (idEvent),
  KEY idx_dniOrganiser (dniOrganiser),
  KEY idx_idEventType (idEventType),
  CONSTRAINT fk_event_user FOREIGN KEY (dniOrganiser) REFERENCES users(dni),
  CONSTRAINT fk_event_type FOREIGN KEY (idEventType) REFERENCES eventtype(idType)
);

-- Tabla event_sector
CREATE TABLE event_sector (
  idEvent INT NOT NULL,
  idPlace INT NOT NULL,
  idSector INT NOT NULL,
  PRIMARY KEY (idEvent, idPlace, idSector),
  KEY idx_sector_place (idSector, idPlace),
  CONSTRAINT fk_eventsector_event FOREIGN KEY (idEvent) REFERENCES event(idEvent),
  CONSTRAINT fk_eventsector_sector FOREIGN KEY (idSector, idPlace) REFERENCES sectors(idSector, idPlace)
);

-- Tabla prices
CREATE TABLE prices (
  idEvent INT NOT NULL,
  idPlace INT NOT NULL,
  idSector INT NOT NULL,
  dateSince DATETIME NOT NULL,
  price FLOAT NOT NULL,
  PRIMARY KEY (idEvent, idPlace, idSector, dateSince),
  CONSTRAINT fk_prices_eventsector FOREIGN KEY (idEvent, idPlace, idSector) REFERENCES event_sector(idEvent, idPlace, idSector)
);

-- Tabla sales
CREATE TABLE sales (
  idSale INT NOT NULL AUTO_INCREMENT,
  date DATETIME NOT NULL,
  dniClient INT NOT NULL,
  PRIMARY KEY (idSale),
  UNIQUE (idSale),
  KEY idx_dniClient (dniClient),
  CONSTRAINT fk_sale_user FOREIGN KEY (dniClient) REFERENCES users(dni)
);

-- Tabla saleitem
CREATE TABLE saleitem (
  idSale INT NOT NULL,
  dateSaleItem DATETIME NOT NULL,
  quantity VARCHAR(45) NOT NULL,
  PRIMARY KEY (idSale, dateSaleItem),
  CONSTRAINT fk_saleitem_sale FOREIGN KEY (idSale) REFERENCES sales(idSale)
);

-- Tabla seats
CREATE TABLE seats (
  idSeat INT NOT NULL,
  idSector INT NOT NULL,
  idPlace INT NOT NULL,
  state VARCHAR(45) NOT NULL,
  PRIMARY KEY (idSeat, idSector, idPlace),
  CONSTRAINT fk_seat_sector FOREIGN KEY (idSector, idPlace) REFERENCES sectors(idSector, idPlace)
);

ALTER TABLE seats
ADD INDEX idx_seats_place_sector_seat (idPlace, idSector, idSeat);


-- Tabla ticket
CREATE TABLE ticket (
  idEvent INT NOT NULL,
  idPlace INT NOT NULL,
  idSector INT NOT NULL,
  idTicket INT NOT NULL,
  state VARCHAR(45) NOT NULL,
  idSeat INT NOT NULL,
  dateSaleItem DATETIME DEFAULT NULL,
  idSale INT DEFAULT NULL,
  PRIMARY KEY (idEvent, idPlace, idSector, idTicket),
  KEY idx_ticket_seat (idPlace, idSector, idSeat),
  KEY idx_ticket_saleitem (dateSaleItem, idSale),
  CONSTRAINT fk_ticket_saleitem FOREIGN KEY (idSale, dateSaleItem) REFERENCES saleitem(idSale, dateSaleItem),
  CONSTRAINT fk_ticket_eventsector FOREIGN KEY (idEvent, idPlace, idSector) REFERENCES event_sector(idEvent, idPlace, idSector),
  CONSTRAINT fk_ticket_seat FOREIGN KEY (idPlace, idSector, idSeat) REFERENCES seats(idPlace, idSector, idSeat)
);

SET FOREIGN_KEY_CHECKS = 1;
