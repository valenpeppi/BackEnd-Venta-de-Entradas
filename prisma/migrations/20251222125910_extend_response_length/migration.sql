/*
  Warnings:

  - You are about to alter the column `date` on the `event` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `date` on the `sales` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.

*/
-- AlterTable
ALTER TABLE `event` MODIFY `date` DATETIME NOT NULL;

-- AlterTable
ALTER TABLE `messages` MODIFY `response` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `sales` MODIFY `date` DATETIME NOT NULL;
