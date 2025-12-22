-- AlterTable
ALTER TABLE `event` MODIFY `date` DATETIME NOT NULL;

-- AlterTable
ALTER TABLE `messages` ADD COLUMN `response` VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE `sales` MODIFY `date` DATETIME NOT NULL;
