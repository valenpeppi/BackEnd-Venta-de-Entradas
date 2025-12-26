-- DropForeignKey
ALTER TABLE `event` DROP FOREIGN KEY `Event_idOrganiser_fkey`;

-- AlterTable
ALTER TABLE `event` MODIFY `date` DATETIME NOT NULL,
    MODIFY `idOrganiser` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `sales` MODIFY `date` DATETIME NOT NULL;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_idOrganiser_fkey` FOREIGN KEY (`idOrganiser`) REFERENCES `organiser_company`(`idOrganiser`) ON DELETE SET NULL ON UPDATE CASCADE;
