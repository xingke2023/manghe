import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 返回用户头像 URL。
 * 若用户已上传头像则直接使用；否则用 DiceBear open-peeps 按 userId 生成卡通头像。
 */
export function getAvatarUrl(userId: number, avatarUrl?: string | null): string {
  if (avatarUrl) return avatarUrl;
  return `https://api.dicebear.com/9.x/open-peeps/svg?seed=${userId}`;
}
