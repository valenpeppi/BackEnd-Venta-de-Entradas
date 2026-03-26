-- DropForeignKey
ALTER TABLE `seat_event` DROP FOREIGN KEY `seat_event_idSale_dateSaleItem_fkey`;

-- DropForeignKey
ALTER TABLE `ticket` DROP FOREIGN KEY `ticket_idSale_dateSaleItem_fkey`;

-- DropIndex
DROP INDEX `seat_event_idSale_dateSaleItem_idx` ON `seat_event`;

-- DropIndex
DROP INDEX `ticket_idSale_dateSaleItem_idx` ON `ticket`;

-- AlterTable
ALTER TABLE `event` MODIFY `date` DATETIME NOT NULL;

-- AlterTable
ALTER TABLE `saleitem` DROP PRIMARY KEY,
    DROP COLUMN `dateSaleItem`,
    ADD COLUMN `lineNumber` INTEGER NOT NULL,
    ADD PRIMARY KEY (`idSale`, `lineNumber`);

-- AlterTable
ALTER TABLE `sales` MODIFY `date` DATETIME NOT NULL;

-- AlterTable
ALTER TABLE `seat_event` DROP COLUMN `dateSaleItem`,
    ADD COLUMN `lineNumber` INTEGER NULL;

-- AlterTable
ALTER TABLE `ticket` DROP COLUMN `dateSaleItem`,
    DROP COLUMN `reservedAt`,
    ADD COLUMN `lineNumber` INTEGER NULL;

-- CreateIndex
CREATE INDEX `seat_event_idSale_lineNumber_idx` ON `seat_event`(`idSale`, `lineNumber`);

-- CreateIndex
CREATE INDEX `ticket_idSale_lineNumber_idx` ON `ticket`(`idSale`, `lineNumber`);

-- CreateIndex
CREATE UNIQUE INDEX `ticket_idEvent_idPlace_idSector_idSeat_key` ON `ticket`(`idEvent`, `idPlace`, `idSector`, `idSeat`);

-- AddForeignKey
ALTER TABLE `seat_event` ADD CONSTRAINT `seat_event_idSale_lineNumber_fkey` FOREIGN KEY (`idSale`, `lineNumber`) REFERENCES `saleitem`(`idSale`, `lineNumber`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ticket` ADD CONSTRAINT `ticket_idSale_lineNumber_fkey` FOREIGN KEY (`idSale`, `lineNumber`) REFERENCES `saleitem`(`idSale`, `lineNumber`) ON DELETE SET NULL ON UPDATE CASCADE;
