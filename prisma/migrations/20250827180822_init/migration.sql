-- CreateTable
CREATE TABLE `event` (
    `idEvent` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(45) NOT NULL,
    `description` VARCHAR(60) NOT NULL,
    `date` DATETIME NOT NULL,
    `state` VARCHAR(45) NOT NULL,
    `image` VARCHAR(255) NULL,
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `idEventType` INTEGER NOT NULL,
    `idOrganiser` INTEGER NOT NULL,

    PRIMARY KEY (`idEvent`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_sector` (
    `idEvent` INTEGER NOT NULL,
    `idPlace` INTEGER NOT NULL,
    `idSector` INTEGER NOT NULL,

    PRIMARY KEY (`idEvent`, `idPlace`, `idSector`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `eventtype` (
    `idType` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(45) NOT NULL,

    PRIMARY KEY (`idType`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `organiser_company` (
    `idOrganiser` INTEGER NOT NULL AUTO_INCREMENT,
    `company_name` VARCHAR(100) NULL,
    `cuil` VARCHAR(20) NULL,
    `contact_email` VARCHAR(100) NULL,
    `password` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `address` VARCHAR(100) NULL,

    UNIQUE INDEX `organiser_company_cuil_key`(`cuil`),
    UNIQUE INDEX `organiser_company_contact_email_key`(`contact_email`),
    PRIMARY KEY (`idOrganiser`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `places` (
    `idPlace` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(45) NOT NULL,
    `totalCap` INTEGER NOT NULL,
    `address` VARCHAR(45) NOT NULL,

    PRIMARY KEY (`idPlace`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prices` (
    `idEvent` INTEGER NOT NULL,
    `idPlace` INTEGER NOT NULL,
    `idSector` INTEGER NOT NULL,
    `dateSince` DATETIME NOT NULL,
    `price` DOUBLE NOT NULL,

    PRIMARY KEY (`idEvent`, `idPlace`, `idSector`, `dateSince`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `saleitem` (
    `idSale` INTEGER NOT NULL,
    `dateSaleItem` DATETIME NOT NULL,
    `quantity` INTEGER NOT NULL,

    PRIMARY KEY (`idSale`, `dateSaleItem`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sales` (
    `idSale` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATETIME NOT NULL,
    `dniClient` INTEGER NOT NULL,

    PRIMARY KEY (`idSale`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seats` (
    `idSeat` INTEGER NOT NULL,
    `idSector` INTEGER NOT NULL,
    `idPlace` INTEGER NOT NULL,
    `state` VARCHAR(45) NOT NULL,

    INDEX `seats_idPlace_idSector_idSeat_idx`(`idPlace`, `idSector`, `idSeat`),
    PRIMARY KEY (`idSeat`, `idSector`, `idPlace`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sectors` (
    `idSector` INTEGER NOT NULL,
    `idPlace` INTEGER NOT NULL,
    `name` VARCHAR(45) NOT NULL,
    `capacity` INTEGER NOT NULL,

    PRIMARY KEY (`idSector`, `idPlace`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ticket` (
    `idEvent` INTEGER NOT NULL,
    `idPlace` INTEGER NOT NULL,
    `idSector` INTEGER NOT NULL,
    `idTicket` INTEGER NOT NULL,
    `state` VARCHAR(45) NOT NULL,
    `idSeat` INTEGER NOT NULL,
    `dateSaleItem` DATETIME NULL,
    `idSale` INTEGER NULL,

    PRIMARY KEY (`idEvent`, `idPlace`, `idSector`, `idTicket`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `dni` INTEGER NOT NULL,
    `name` VARCHAR(25) NOT NULL,
    `surname` VARCHAR(25) NOT NULL,
    `mail` VARCHAR(60) NOT NULL,
    `birthDate` DATE NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('user', 'admin') NOT NULL DEFAULT 'user',

    UNIQUE INDEX `users_mail_key`(`mail`),
    PRIMARY KEY (`dni`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `event` ADD CONSTRAINT `event_idEventType_fkey` FOREIGN KEY (`idEventType`) REFERENCES `eventtype`(`idType`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event` ADD CONSTRAINT `event_idOrganiser_fkey` FOREIGN KEY (`idOrganiser`) REFERENCES `organiser_company`(`idOrganiser`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_sector` ADD CONSTRAINT `event_sector_idEvent_fkey` FOREIGN KEY (`idEvent`) REFERENCES `event`(`idEvent`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_sector` ADD CONSTRAINT `event_sector_idSector_idPlace_fkey` FOREIGN KEY (`idSector`, `idPlace`) REFERENCES `sectors`(`idSector`, `idPlace`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prices` ADD CONSTRAINT `prices_idEvent_idPlace_idSector_fkey` FOREIGN KEY (`idEvent`, `idPlace`, `idSector`) REFERENCES `event_sector`(`idEvent`, `idPlace`, `idSector`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `saleitem` ADD CONSTRAINT `saleitem_idSale_fkey` FOREIGN KEY (`idSale`) REFERENCES `sales`(`idSale`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales` ADD CONSTRAINT `sales_dniClient_fkey` FOREIGN KEY (`dniClient`) REFERENCES `users`(`dni`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seats` ADD CONSTRAINT `seats_idSector_idPlace_fkey` FOREIGN KEY (`idSector`, `idPlace`) REFERENCES `sectors`(`idSector`, `idPlace`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sectors` ADD CONSTRAINT `sectors_idPlace_fkey` FOREIGN KEY (`idPlace`) REFERENCES `places`(`idPlace`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ticket` ADD CONSTRAINT `ticket_idEvent_idPlace_idSector_fkey` FOREIGN KEY (`idEvent`, `idPlace`, `idSector`) REFERENCES `event_sector`(`idEvent`, `idPlace`, `idSector`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ticket` ADD CONSTRAINT `ticket_idSale_dateSaleItem_fkey` FOREIGN KEY (`idSale`, `dateSaleItem`) REFERENCES `saleitem`(`idSale`, `dateSaleItem`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ticket` ADD CONSTRAINT `ticket_idPlace_idSector_idSeat_fkey` FOREIGN KEY (`idPlace`, `idSector`, `idSeat`) REFERENCES `seats`(`idPlace`, `idSector`, `idSeat`) ON DELETE RESTRICT ON UPDATE CASCADE;
