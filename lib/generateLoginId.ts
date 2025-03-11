export function generateLoginId(): string {
  // Generate a random 8-digit number
  const min = 10000000; // 8 digits (starting from 10000000)
  const max = 99999999; // 8 digits (ending at 99999999)
  const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
  return randomNum.toString();
}
