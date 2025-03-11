/*
  Warnings:

  - Added the required column `fromAccountNo` to the `exchange` table without a default value. This is not possible if the table is not empty.
  - Added the required column `toAccountNo` to the `exchange` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `exchange` ADD COLUMN `fromAccountNo` VARCHAR(191) NOT NULL,
    ADD COLUMN `toAccountNo` VARCHAR(191) NOT NULL;
