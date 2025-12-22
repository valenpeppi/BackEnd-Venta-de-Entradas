-- AlterTable
ALTER TABLE `event` MODIFY `date` DATETIME NOT NULL;

-- AlterTable
ALTER TABLE `sales` MODIFY `date` DATETIME NOT NULL;

-- CreateTable
CREATE TABLE `messages` (
    `idMessage` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(100) NOT NULL,
    `state` VARCHAR(20) NOT NULL DEFAULT 'unread',
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `description` TEXT NOT NULL,
    `sender_email` VARCHAR(100) NOT NULL,

    PRIMARY KEY (`idMessage`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
