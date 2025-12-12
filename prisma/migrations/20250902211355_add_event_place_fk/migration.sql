/*
  Warnings:

  - You are about to alter the column `date` on the `event` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - The primary key for the `prices` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `dateSince` on the `prices` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - The primary key for the `saleitem` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `dateSaleItem` on the `saleitem` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `date` on the `sales` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `dateSaleItem` on the `ticket` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - Added the required column `idPlace` to the `event` table without a default value. This is not possible if the table is not empty.

*/
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
