/*
  Warnings:

  - You are about to alter the column `balance` on the `account` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,2)` to `Decimal(30,18)`.
  - You are about to alter the column `inreview_balance` on the `account` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,2)` to `Decimal(30,18)`.

*/
-- AlterTable
ALTER TABLE `account` MODIFY `balance` DECIMAL(30, 18) NOT NULL DEFAULT 0.00,
    MODIFY `inreview_balance` DECIMAL(30, 18) NOT NULL DEFAULT 0.00;
