/*
  Warnings:

  - The primary key for the `event` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `date` on the `event` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - The primary key for the `event_sector` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `eventtype` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `messages` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `organiser_company` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `places` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `saleitem` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `sales` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `date` on the `sales` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - The primary key for the `seat_event` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `seats` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `sectors` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `ticket` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE `event` DROP FOREIGN KEY `Event_idEventType_fkey`;

-- DropForeignKey
ALTER TABLE `event` DROP FOREIGN KEY `Event_idOrganiser_fkey`;

-- DropForeignKey
ALTER TABLE `event` DROP FOREIGN KEY `Event_idPlace_fkey`;

-- DropForeignKey
ALTER TABLE `event_sector` DROP FOREIGN KEY `event_sector_idEvent_fkey`;

-- DropForeignKey
ALTER TABLE `event_sector` DROP FOREIGN KEY `event_sector_idSector_idPlace_fkey`;

-- DropForeignKey
ALTER TABLE `saleitem` DROP FOREIGN KEY `saleitem_idSale_fkey`;

-- DropForeignKey
ALTER TABLE `sales` DROP FOREIGN KEY `sales_idUserClient_fkey`;

-- DropForeignKey
ALTER TABLE `seat_event` DROP FOREIGN KEY `seat_event_idEvent_fkey`;

-- DropForeignKey
ALTER TABLE `seat_event` DROP FOREIGN KEY `seat_event_idSale_lineNumber_fkey`;

-- DropForeignKey
ALTER TABLE `seat_event` DROP FOREIGN KEY `seat_event_idSeat_idSector_idPlace_fkey`;

-- DropForeignKey
ALTER TABLE `seats` DROP FOREIGN KEY `seats_idSector_idPlace_fkey`;

-- DropForeignKey
ALTER TABLE `sectors` DROP FOREIGN KEY `sectors_idPlace_fkey`;

-- DropForeignKey
ALTER TABLE `ticket` DROP FOREIGN KEY `ticket_idEvent_fkey`;

-- DropForeignKey
ALTER TABLE `ticket` DROP FOREIGN KEY `ticket_idEvent_idPlace_idSector_fkey`;

-- DropForeignKey
ALTER TABLE `ticket` DROP FOREIGN KEY `ticket_idPlace_idSector_idSeat_fkey`;

-- DropForeignKey
ALTER TABLE `ticket` DROP FOREIGN KEY `ticket_idSale_lineNumber_fkey`;

-- AlterTable
ALTER TABLE `event` DROP PRIMARY KEY,
    MODIFY `idEvent` VARCHAR(191) NOT NULL,
    MODIFY `date` DATETIME NOT NULL,
    MODIFY `idEventType` VARCHAR(191) NOT NULL,
    MODIFY `idOrganiser` VARCHAR(191) NOT NULL,
    MODIFY `idPlace` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`idEvent`);

-- AlterTable
ALTER TABLE `event_sector` DROP PRIMARY KEY,
    MODIFY `idEvent` VARCHAR(191) NOT NULL,
    MODIFY `idPlace` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`idEvent`, `idPlace`, `idSector`);

-- AlterTable
ALTER TABLE `eventtype` DROP PRIMARY KEY,
    MODIFY `idType` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`idType`);

-- AlterTable
ALTER TABLE `messages` DROP PRIMARY KEY,
    MODIFY `idMessage` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`idMessage`);

-- AlterTable
ALTER TABLE `organiser_company` DROP PRIMARY KEY,
    MODIFY `idOrganiser` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`idOrganiser`);

-- AlterTable
ALTER TABLE `places` DROP PRIMARY KEY,
    MODIFY `idPlace` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`idPlace`);

-- AlterTable
ALTER TABLE `saleitem` DROP PRIMARY KEY,
    MODIFY `idSale` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`idSale`, `lineNumber`);

-- AlterTable
ALTER TABLE `sales` DROP PRIMARY KEY,
    MODIFY `idSale` VARCHAR(191) NOT NULL,
    MODIFY `date` DATETIME NOT NULL,
    MODIFY `idUserClient` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`idSale`);

-- AlterTable
ALTER TABLE `seat_event` DROP PRIMARY KEY,
    MODIFY `idEvent` VARCHAR(191) NOT NULL,
    MODIFY `idPlace` VARCHAR(191) NOT NULL,
    MODIFY `idSale` VARCHAR(191) NULL,
    ADD PRIMARY KEY (`idEvent`, `idPlace`, `idSector`, `idSeat`);

-- AlterTable
ALTER TABLE `seats` DROP PRIMARY KEY,
    MODIFY `idPlace` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`idSeat`, `idSector`, `idPlace`);

-- AlterTable
ALTER TABLE `sectors` DROP PRIMARY KEY,
    MODIFY `idPlace` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`idSector`, `idPlace`);

-- AlterTable
ALTER TABLE `ticket` DROP PRIMARY KEY,
    MODIFY `idEvent` VARCHAR(191) NOT NULL,
    MODIFY `idPlace` VARCHAR(191) NOT NULL,
    MODIFY `idSale` VARCHAR(191) NULL,
    ADD PRIMARY KEY (`idEvent`, `idPlace`, `idSector`, `idTicket`);

-- AlterTable
ALTER TABLE `users` DROP PRIMARY KEY,
    MODIFY `id_user` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id_user`);

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_idPlace_fkey` FOREIGN KEY (`idPlace`) REFERENCES `places`(`idPlace`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_idEventType_fkey` FOREIGN KEY (`idEventType`) REFERENCES `eventtype`(`idType`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_idOrganiser_fkey` FOREIGN KEY (`idOrganiser`) REFERENCES `organiser_company`(`idOrganiser`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_sector` ADD CONSTRAINT `event_sector_idEvent_fkey` FOREIGN KEY (`idEvent`) REFERENCES `Event`(`idEvent`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_sector` ADD CONSTRAINT `event_sector_idSector_idPlace_fkey` FOREIGN KEY (`idSector`, `idPlace`) REFERENCES `sectors`(`idSector`, `idPlace`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `saleitem` ADD CONSTRAINT `saleitem_idSale_fkey` FOREIGN KEY (`idSale`) REFERENCES `sales`(`idSale`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales` ADD CONSTRAINT `sales_idUserClient_fkey` FOREIGN KEY (`idUserClient`) REFERENCES `users`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seats` ADD CONSTRAINT `seats_idSector_idPlace_fkey` FOREIGN KEY (`idSector`, `idPlace`) REFERENCES `sectors`(`idSector`, `idPlace`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seat_event` ADD CONSTRAINT `seat_event_idEvent_fkey` FOREIGN KEY (`idEvent`) REFERENCES `Event`(`idEvent`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seat_event` ADD CONSTRAINT `seat_event_idSeat_idSector_idPlace_fkey` FOREIGN KEY (`idSeat`, `idSector`, `idPlace`) REFERENCES `seats`(`idSeat`, `idSector`, `idPlace`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seat_event` ADD CONSTRAINT `seat_event_idSale_lineNumber_fkey` FOREIGN KEY (`idSale`, `lineNumber`) REFERENCES `saleitem`(`idSale`, `lineNumber`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sectors` ADD CONSTRAINT `sectors_idPlace_fkey` FOREIGN KEY (`idPlace`) REFERENCES `places`(`idPlace`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ticket` ADD CONSTRAINT `ticket_idEvent_fkey` FOREIGN KEY (`idEvent`) REFERENCES `Event`(`idEvent`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ticket` ADD CONSTRAINT `ticket_idEvent_idPlace_idSector_fkey` FOREIGN KEY (`idEvent`, `idPlace`, `idSector`) REFERENCES `event_sector`(`idEvent`, `idPlace`, `idSector`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ticket` ADD CONSTRAINT `ticket_idSale_lineNumber_fkey` FOREIGN KEY (`idSale`, `lineNumber`) REFERENCES `saleitem`(`idSale`, `lineNumber`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ticket` ADD CONSTRAINT `ticket_idPlace_idSector_idSeat_fkey` FOREIGN KEY (`idPlace`, `idSector`, `idSeat`) REFERENCES `seats`(`idPlace`, `idSector`, `idSeat`) ON DELETE RESTRICT ON UPDATE CASCADE;
