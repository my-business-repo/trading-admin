/*
  Warnings:

  - You are about to alter the column `amount` on the `exchange` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,2)` to `Decimal(30,18)`.
  - You are about to alter the column `exchangedAmount` on the `exchange` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,2)` to `Decimal(30,18)`.
  - You are about to alter the column `exchangeRate` on the `exchange` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,6)` to `Decimal(30,18)`.

*/
-- AlterTable
ALTER TABLE `exchange` MODIFY `amount` DECIMAL(30, 18) NOT NULL,
    MODIFY `exchangedAmount` DECIMAL(30, 18) NOT NULL,
    MODIFY `exchangeRate` DECIMAL(30, 18) NOT NULL;
