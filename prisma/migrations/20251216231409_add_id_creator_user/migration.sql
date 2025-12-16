/*
  Warnings:

  - You are about to alter the column `date` on the `event` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `date` on the `sales` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.

*/
-- AlterTable
ALTER TABLE `event` ADD COLUMN `id_creator_user` VARCHAR(191) NULL,
    MODIFY `date` DATETIME NOT NULL;

-- AlterTable
ALTER TABLE `sales` MODIFY `date` DATETIME NOT NULL;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_id_creator_user_fkey` FOREIGN KEY (`id_creator_user`) REFERENCES `users`(`id_user`) ON DELETE SET NULL ON UPDATE CASCADE;
