-- AlterTable
ALTER TABLE `event` ADD COLUMN `id_creator_user` VARCHAR(191) NULL,
    MODIFY `date` DATETIME NOT NULL;

-- AlterTable
ALTER TABLE `sales` MODIFY `date` DATETIME NOT NULL;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_id_creator_user_fkey` FOREIGN KEY (`id_creator_user`) REFERENCES `users`(`id_user`) ON DELETE SET NULL ON UPDATE CASCADE;
