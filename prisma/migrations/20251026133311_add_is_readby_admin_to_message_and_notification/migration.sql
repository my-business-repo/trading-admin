-- AlterTable
ALTER TABLE `message` ADD COLUMN `isReadbyAdmin` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `notification` ADD COLUMN `isReadbyAdmin` BOOLEAN NOT NULL DEFAULT false;
