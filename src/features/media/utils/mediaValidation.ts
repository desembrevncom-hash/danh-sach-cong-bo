import { MediaAssetType } from "./types";

const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/x-icon'];

export function validateMediaFile(file: File, assetType: MediaAssetType): string | null {
  if (file.size > MAX_SIZE_BYTES) {
    return `Kích thước file vượt quá ${MAX_SIZE_MB}MB.`;
  }
  
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return `Định dạng file không được hỗ trợ. Chỉ chấp nhận: PNG, JPEG, WEBP, ICO.`;
  }

  // Cảnh báo (không chặn upload) sẽ được xử lý ở component UI khi lấy được dimensions.
  // Nhưng đối với validation cứng, chúng ta chỉ trả về error cho các lỗi nghiêm trọng.
  return null;
}

export function generateSafeFileName(originalName: string): string {
  // Loại bỏ các ký tự đặc biệt, dấu cách, tiếng Việt có dấu
  const safeName = originalName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, "-")
    .replace(/-+/g, "-") // Tránh multiple hyphens
    .replace(/^-|-$/g, ""); // Tránh hyphen đầu cuối

  const timestamp = Date.now();
  return `${timestamp}-${safeName}`;
}
