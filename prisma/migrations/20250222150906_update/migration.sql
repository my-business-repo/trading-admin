/*
  Warnings:

  - You are about to drop the column `sentAddress` on the `transaction` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `transaction` DROP COLUMN `sentAddress`,
    ADD COLUMN `currency` VARCHAR(191) NULL,
    ADD COLUMN `sent` BOOLEAN NOT NULL DEFAULT false;
