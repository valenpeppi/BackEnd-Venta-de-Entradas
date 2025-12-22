-- DropForeignKey
ALTER TABLE `ticket` DROP FOREIGN KEY `ticket_idSale_dateSaleItem_fkey`;

-- AlterTable
ALTER TABLE `event` MODIFY `date` DATETIME NOT NULL;

-- AlterTable
ALTER TABLE `saleitem` DROP PRIMARY KEY,
    MODIFY `dateSaleItem` DATETIME NOT NULL,
    ADD PRIMARY KEY (`idSale`, `dateSaleItem`);

-- AlterTable
ALTER TABLE `sales` MODIFY `date` DATETIME NOT NULL;

-- AlterTable
ALTER TABLE `ticket` ADD COLUMN `reservedAt` DATETIME(3) NULL,
    MODIFY `dateSaleItem` DATETIME NULL;

-- AddForeignKey
ALTER TABLE `ticket` ADD CONSTRAINT `ticket_idSale_dateSaleItem_fkey` FOREIGN KEY (`idSale`, `dateSaleItem`) REFERENCES `saleitem`(`idSale`, `dateSaleItem`) ON DELETE SET NULL ON UPDATE CASCADE;
