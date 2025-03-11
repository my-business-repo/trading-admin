/*
  Warnings:

  - You are about to alter the column `amount` on the `transaction` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,2)` to `Decimal(30,18)`.

*/
-- AlterTable
ALTER TABLE `admin` ADD COLUMN `avatar` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `transaction` MODIFY `amount` DECIMAL(30, 18) NOT NULL;
