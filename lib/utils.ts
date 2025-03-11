import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateTransactionId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `TXN${timestamp}${randomStr}`.toUpperCase();
}


// calculate isSuccess or not based on winRate
export function calculateIsSuccess(winRate: number, tradeSettingWindRate: number): boolean {
  if (winRate) {
    let isSuccess = Math.random() <= winRate; // Assuming winRate.value is between 0 and 1
    if (isSuccess) {
      isSuccess = Math.random() <= tradeSettingWindRate; // Assuming winRate.value is between 0 and 1
    }
    return isSuccess;
  } else {
    return false;
  }
}
