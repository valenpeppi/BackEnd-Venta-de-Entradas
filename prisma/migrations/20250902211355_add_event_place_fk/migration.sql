-- DropForeignKey
ALTER TABLE `ticket` DROP FOREIGN KEY `ticket_idSale_dateSaleItem_fkey`;

-- DropIndex
DROP INDEX `ticket_idSale_dateSaleItem_fkey` ON `ticket`;

-- AlterTable
ALTER TABLE `event` ADD COLUMN `idPlace` INTEGER NOT NULL,
    MODIFY `date` DATETIME NOT NULL;

-- AlterTable
ALTER TABLE `prices` DROP PRIMARY KEY,
    MODIFY `dateSince` DATETIME NOT NULL,
    ADD PRIMARY KEY (`idEvent`, `idPlace`, `idSector`, `dateSince`);

-- AlterTable
ALTER TABLE `saleitem` DROP PRIMARY KEY,
    MODIFY `dateSaleItem` DATETIME NOT NULL,
    ADD PRIMARY KEY (`idSale`, `dateSaleItem`);

-- AlterTable
ALTER TABLE `sales` MODIFY `date` DATETIME NOT NULL;

-- AlterTable
ALTER TABLE `ticket` MODIFY `dateSaleItem` DATETIME NULL;

-- AddForeignKey
ALTER TABLE `event` ADD CONSTRAINT `event_idPlace_fkey` FOREIGN KEY (`idPlace`) REFERENCES `places`(`idPlace`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ticket` ADD CONSTRAINT `ticket_idSale_dateSaleItem_fkey` FOREIGN KEY (`idSale`, `dateSaleItem`) REFERENCES `saleitem`(`idSale`, `dateSaleItem`) ON DELETE SET NULL ON UPDATE CASCADE;
