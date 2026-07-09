import { supabase } from "@/integrations/supabase/client";

export type UploadResult = {
  url?: string;
  error?: string;
};

export async function uploadProductImage(file: File): Promise<UploadResult> {
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
  const MAX_SIZE_MB = 5;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

  // 1. Validate định dạng
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Chỉ cho phép tải lên các định dạng ảnh .jpg, .jpeg, .png, .webp." };
  }

  // 2. Validate dung lượng
  if (file.size > MAX_SIZE_BYTES) {
    return { error: `Dung lượng file vượt quá giới hạn ${MAX_SIZE_MB}MB.` };
  }

  try {
    // Tạo tên file duy nhất tránh trùng lặp
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;

    // 3. Upload lên bucket 'product-images'
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error("Lỗi upload Supabase:", error);
      return { error: "Không thể tải ảnh lên máy chủ. Vui lòng thử lại sau." };
    }

    // 4. Lấy Public URL sau khi upload thành công
    const { data: publicUrlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    return { url: publicUrlData.publicUrl };
  } catch (err) {
    console.error("Lỗi không xác định khi upload:", err);
    return { error: "Đã xảy ra lỗi hệ thống trong quá trình tải ảnh." };
  }
}
