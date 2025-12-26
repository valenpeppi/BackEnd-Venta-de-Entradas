-- DropForeignKey
ALTER TABLE `event` DROP FOREIGN KEY `event_idEventType_fkey`;

-- DropForeignKey
ALTER TABLE `event` DROP FOREIGN KEY `event_idOrganiser_fkey`;

-- DropForeignKey
ALTER TABLE `event` DROP FOREIGN KEY `event_idPlace_fkey`;

-- DropForeignKey
ALTER TABLE `prices` DROP FOREIGN KEY `prices_idEvent_idPlace_idSector_fkey`;

-- DropForeignKey
ALTER TABLE `ticket` DROP FOREIGN KEY `ticket_idSale_dateSaleItem_fkey`;

-- DropIndex
DROP INDEX `ticket_idSale_dateSaleItem_fkey` ON `ticket`;

-- AlterTable
ALTER TABLE `event` MODIFY `description` VARCHAR(255) NOT NULL,
    MODIFY `date` DATETIME NOT NULL;

-- AlterTable
ALTER TABLE `event_sector` ADD COLUMN `price` DECIMAL(10, 2) NOT NULL;

-- AlterTable
ALTER TABLE `places` ADD COLUMN `placeType` VARCHAR(45) NOT NULL;

-- AlterTable
ALTER TABLE `saleitem` DROP PRIMARY KEY,
    MODIFY `dateSaleItem` DATETIME NOT NULL,
    ADD PRIMARY KEY (`idSale`, `dateSaleItem`);

-- AlterTable
ALTER TABLE `sales` MODIFY `date` DATETIME NOT NULL;

-- AlterTable
ALTER TABLE `seats` DROP COLUMN `state`;

-- AlterTable
ALTER TABLE `sectors` ADD COLUMN `sectorType` VARCHAR(45) NOT NULL;

-- AlterTable
ALTER TABLE `ticket` MODIFY `state` VARCHAR(45) NOT NULL DEFAULT 'available',
    MODIFY `dateSaleItem` DATETIME NULL;

-- DropTable
DROP TABLE `prices`;

-- CreateTable
CREATE TABLE `seat_event` (
    `idEvent` INTEGER NOT NULL,
    `idPlace` INTEGER NOT NULL,
    `idSector` INTEGER NOT NULL,
    `idSeat` INTEGER NOT NULL,
    `state` VARCHAR(45) NOT NULL DEFAULT 'available',

    PRIMARY KEY (`idEvent`, `idPlace`, `idSector`, `idSeat`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_idPlace_fkey` FOREIGN KEY (`idPlace`) REFERENCES `places`(`idPlace`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_idEventType_fkey` FOREIGN KEY (`idEventType`) REFERENCES `eventtype`(`idType`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_idOrganiser_fkey` FOREIGN KEY (`idOrganiser`) REFERENCES `organiser_company`(`idOrganiser`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seat_event` ADD CONSTRAINT `seat_event_idEvent_fkey` FOREIGN KEY (`idEvent`) REFERENCES `Event`(`idEvent`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seat_event` ADD CONSTRAINT `seat_event_idSeat_idSector_idPlace_fkey` FOREIGN KEY (`idSeat`, `idSector`, `idPlace`) REFERENCES `seats`(`idSeat`, `idSector`, `idPlace`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ticket` ADD CONSTRAINT `ticket_idEvent_fkey` FOREIGN KEY (`idEvent`) REFERENCES `Event`(`idEvent`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ticket` ADD CONSTRAINT `ticket_idSale_dateSaleItem_fkey` FOREIGN KEY (`idSale`, `dateSaleItem`) REFERENCES `saleitem`(`idSale`, `dateSaleItem`) ON DELETE SET NULL ON UPDATE CASCADE;
