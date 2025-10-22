/*
  Warnings:

  - Added the required column `from` to the `message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `to` to the `message` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `message` ADD COLUMN `from` VARCHAR(191) NOT NULL,
    ADD COLUMN `to` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE INDEX `Message_from_idx` ON `message`(`from`);

-- CreateIndex
CREATE INDEX `Message_to_idx` ON `message`(`to`);
