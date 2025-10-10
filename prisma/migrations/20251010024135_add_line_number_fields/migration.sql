/*
  Warnings:

  - You are about to alter the column `date` on the `event` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - The primary key for the `saleitem` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `dateSaleItem` on the `saleitem` table. All the data in the column will be lost.
  - You are about to alter the column `date` on the `sales` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to drop the column `dateSaleItem` on the `seat_event` table. All the data in the column will be lost.
  - You are about to drop the column `dateSaleItem` on the `ticket` table. All the data in the column will be lost.
  - You are about to drop the column `reservedAt` on the `ticket` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[idEvent,idPlace,idSector,idSeat]` on the table `ticket` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `lineNumber` to the `saleitem` table without a default value. This is not possible if the table is not empty.

*/
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
