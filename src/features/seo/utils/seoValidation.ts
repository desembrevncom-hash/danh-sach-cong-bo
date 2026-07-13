export function validateSeoCanonicalUrl(url?: string | null): string | null {
  if (!url || url.trim() === '') return null;
  const trimmed = url.trim();
  
  try {
    const parsed = new URL(trimmed);
    if (parsed.hostname !== 'cong-bo.hjcnt.com.vn') {
      return 'Canonical URL phải thuộc domain cong-bo.hjcnt.com.vn';
    }
    return null;
  } catch {
    return 'URL không hợp lệ';
  }
}

export function validateSeoImageUrl(url?: string | null): string | null {
  if (!url || url.trim() === '') return null;
  const trimmed = url.trim();
  
  try {
    new URL(trimmed);
    return null;
  } catch {
    return 'Image URL không hợp lệ';
  }
}

export function validateSeoSchemaJson(jsonStr?: string | null): string | null {
  if (!jsonStr || jsonStr.trim() === '') return null;
  
  try {
    const parsed = JSON.parse(jsonStr);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return 'Schema phải là một JSON Object (không phải mảng hoặc chuỗi)';
    }
    return null;
  } catch {
    return 'JSON không hợp lệ';
  }
}

export function validateSeoRobots(robots: string): string | null {
  const allowed = ['index,follow', 'noindex,nofollow', 'noindex,follow'];
  // We can normalize spaces
  const normalized = robots.replace(/\s+/g, '');
  if (!allowed.includes(normalized)) {
    return 'Robots không hợp lệ. Chỉ chấp nhận: index,follow | noindex,nofollow | noindex,follow';
  }
  return null;
}

export function validateAssetUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.trim().startsWith('data:')) {
    return 'Không hỗ trợ data URI. Vui lòng dùng đường dẫn thực.';
  }
  if (url.trim().startsWith('blob:')) {
    return 'Không hỗ trợ blob URI. Vui lòng dùng đường dẫn thực.';
  }
  try {
    if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
      return null;
    }
    new URL(url);
    return null;
  } catch (e) {
    return 'Đường dẫn không hợp lệ';
  }
}
