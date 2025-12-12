/*
  Warnings:

  - You are about to alter the column `date` on the `event` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to drop the column `dniClient` on the `sales` table. All the data in the column will be lost.
  - You are about to alter the column `date` on the `sales` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[dni]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[google_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `idUserClient` to the `sales` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_user` to the `users` table without a default value. This is not possible if the table is not empty.

*/
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
