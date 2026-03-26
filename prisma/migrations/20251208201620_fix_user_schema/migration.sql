-- DropForeignKey
ALTER TABLE `sales` DROP FOREIGN KEY `sales_dniClient_fkey`;

-- DropIndex
DROP INDEX `sales_dniClient_idx` ON `sales`;

-- AlterTable
ALTER TABLE `event` MODIFY `date` DATETIME NOT NULL;

-- AlterTable
ALTER TABLE `sales` DROP COLUMN `dniClient`,
    ADD COLUMN `idUserClient` INTEGER NOT NULL,
    MODIFY `date` DATETIME NOT NULL;

-- AlterTable
ALTER TABLE `users` DROP PRIMARY KEY,
    ADD COLUMN `google_id` VARCHAR(191) NULL,
    ADD COLUMN `id_user` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id_user`);

-- CreateIndex
CREATE INDEX `sales_idUserClient_idx` ON `sales`(`idUserClient`);

-- CreateIndex
CREATE UNIQUE INDEX `users_dni_key` ON `users`(`dni`);

-- CreateIndex
CREATE UNIQUE INDEX `users_google_id_key` ON `users`(`google_id`);

-- AddForeignKey
ALTER TABLE `sales` ADD CONSTRAINT `sales_idUserClient_fkey` FOREIGN KEY (`idUserClient`) REFERENCES `users`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;
