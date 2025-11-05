/*
  Warnings:

  - Added the required column `type` to the `notification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `notification` ADD COLUMN `type` ENUM('NEW_CUSTOMER', 'NEW_MESSAGE', 'SYSTEM_ALERT', 'TRANSACTION_UPDATE', 'WITHDRAWAL_REQUEST', 'DEPOSIT_REQUEST', 'DEPOSIT_SUCCESS', 'ACCOUNT_VERIFIED') NOT NULL;
