-- AlterTable
ALTER TABLE `transaction` ADD COLUMN `address` VARCHAR(191) NULL,
    ADD COLUMN `sentAddress` BOOLEAN NOT NULL DEFAULT false;
