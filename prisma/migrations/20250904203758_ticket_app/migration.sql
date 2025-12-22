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
ALTER TABLE `ticket` MODIFY `dateSaleItem` DATETIME NULL;

-- CreateIndex
CREATE INDEX `saleitem_idSale_idx` ON `saleitem`(`idSale`);

-- AddForeignKey
ALTER TABLE `ticket` ADD CONSTRAINT `ticket_idSale_dateSaleItem_fkey` FOREIGN KEY (`idSale`, `dateSaleItem`) REFERENCES `saleitem`(`idSale`, `dateSaleItem`) ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `event` RENAME INDEX `Event_idEventType_fkey` TO `Event_idEventType_idx`;

-- RenameIndex
ALTER TABLE `event` RENAME INDEX `Event_idOrganiser_fkey` TO `Event_idOrganiser_idx`;

-- RenameIndex
ALTER TABLE `event` RENAME INDEX `Event_idPlace_fkey` TO `Event_idPlace_idx`;

-- RenameIndex
ALTER TABLE `event_sector` RENAME INDEX `event_sector_idSector_idPlace_fkey` TO `event_sector_idSector_idPlace_idx`;

-- RenameIndex
ALTER TABLE `sales` RENAME INDEX `sales_dniClient_fkey` TO `sales_dniClient_idx`;

-- RenameIndex
ALTER TABLE `seat_event` RENAME INDEX `seat_event_idSeat_idSector_idPlace_fkey` TO `seat_event_idSeat_idSector_idPlace_idx`;

-- RenameIndex
ALTER TABLE `seats` RENAME INDEX `seats_idSector_idPlace_fkey` TO `seats_idSector_idPlace_idx`;

-- RenameIndex
ALTER TABLE `sectors` RENAME INDEX `sectors_idPlace_fkey` TO `sectors_idPlace_idx`;

-- RenameIndex
ALTER TABLE `ticket` RENAME INDEX `ticket_idPlace_idSector_idSeat_fkey` TO `ticket_idPlace_idSector_idSeat_idx`;

-- RenameIndex
ALTER TABLE `ticket` RENAME INDEX `ticket_idSale_dateSaleItem_fkey` TO `ticket_idSale_dateSaleItem_idx`;
