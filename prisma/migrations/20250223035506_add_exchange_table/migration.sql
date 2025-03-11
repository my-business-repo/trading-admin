-- CreateTable
CREATE TABLE `exchange` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fromCurrency` VARCHAR(191) NOT NULL,
    `toCurrency` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `exchangedAmount` DECIMAL(15, 2) NOT NULL,
    `exchangeRate` DECIMAL(15, 6) NOT NULL,
    `customerId` INTEGER NOT NULL,
    `exchangeStatus` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `exchangeType` ENUM('BUY', 'SELL') NOT NULL DEFAULT 'BUY',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Exchange_customerId_idx`(`customerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `exchange` ADD CONSTRAINT `Exchange_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
