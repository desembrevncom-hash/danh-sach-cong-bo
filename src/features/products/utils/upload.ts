// Using import.meta.env to read the keys for raw fetch
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export type UploadResult = {
  url?: string;
  error?: string;
};

export async function uploadProductImage(file: File, accessToken: string): Promise<UploadResult> {
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
  const MAX_SIZE_MB = 5;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

  console.log("[add-product:upload-image:file]", { 
    name: file?.name, 
    type: file?.type, 
    size: file?.size,
    isFileInstance: file instanceof File
  });

  if (!(file instanceof File)) {
    console.error("[add-product:error]", { step: "upload", message: "Đối tượng không phải là File hợp lệ" });
    return { error: "Dữ liệu ảnh không hợp lệ." };
  }

  if (!accessToken) {
    return { error: "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại." };
  }

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
    const fileExt = file.name.split('.').pop() || "jpg";
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    
    console.log("[add-product:upload-image:path]", fileName);
    console.log("[add-product:upload-image:raw-fetch:start]");

    // 3. Upload lên bucket 'product-images' bằng raw fetch
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/product-images/${fileName}`;
    
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 30000);

    let res;
    try {
      res = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "apikey": SUPABASE_ANON_KEY,
          "Content-Type": file.type || "application/octet-stream",
          "x-upsert": "false"
        },
        body: file,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[add-product:upload-image:raw-fetch:error]", res.status, errorText);
      return { error: `Upload ảnh thất bại (${res.status}): ${errorText}` };
    }

    console.log("[add-product:upload-image:raw-fetch:success]");
    
    // 4. Trả về public url
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/product-images/${fileName}`;

    return { url: publicUrl };
  } catch (err: unknown) {
    console.error("Lỗi không xác định khi upload:", err);
    if (err instanceof Error && err.name === 'AbortError') {
      return { error: "Upload ảnh quá lâu. Vui lòng thử lại." };
    }
    return { error: "Đã xảy ra lỗi hệ thống trong quá trình tải ảnh." };
  }
}
