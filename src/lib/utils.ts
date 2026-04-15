import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function maskRegNo(regNo: string): string {
  if (regNo.length < 12) return regNo;
  // 927624BEC001 -> 927624***001
  return regNo.substring(0, 6) + '***' + regNo.substring(9);
}
