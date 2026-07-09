const fs = require('fs');
const path = require('path');

const overridePath = 'e:/Downloads/danh-sach-cong-bo-main/danh-sach-cong-bo-main/supabase/functions/save-product-override/index.ts';
let overrideStr = fs.readFileSync(overridePath, 'utf8');

// 1. Remove body.no usage and bulk upsert
overrideStr = overrideStr.replace(/if \(Array\.isArray\(body\.products\)\) \{[\s\S]*?const action = String\(body\.action \?\? "upsert"\);/, 'const action = String(body.action ?? "upsert");');

// 2. Rewrite action logic
const logicRegex = /if \(action === "hard_delete"\) \{[\s\S]*?return json\(200, \{ success: true, row: saved \}\);/m;

const newLogic = `
  let productId: string;
  let legacy_no: number;
  let brand: string = "desembre"; // default

  if (action === "create") {
    brand = ("brand" in body && typeof body.brand === "string" && body.brand.trim() !== "") ? body.brand.trim() : "desembre";

    // Allocate next no >= 1000 for custom items per brand
    const { data: maxRow } = await supabase
      .from("product_identities")
      .select("legacy_no")
      .eq("brand", brand)
      .gte("legacy_no", 1000)
      .order("legacy_no", { ascending: false })
      .limit(1)
      .maybeSingle();
    legacy_no = (maxRow?.legacy_no ?? 999) + 1;

    // Insert into product_identities
    const { data: newIdentity, error: idErr } = await supabase
      .from("product_identities")
      .insert({ brand, legacy_no })
      .select("id")
      .single();
    
    if (idErr) return json(500, { success: false, error: "Lỗi tạo Identity: " + idErr.message });
    productId = newIdentity.id;

  } else {
    productId = String(body.productId);
    if (!productId || productId === "undefined") {
      return json(400, { success: false, error: "Thiếu productId" });
    }

    // Lookup legacy_no
    const { data: idRow, error: idErr } = await supabase
      .from("product_identities")
      .select("legacy_no, brand")
      .eq("id", productId)
      .single();
    
    if (idErr || !idRow) return json(400, { success: false, error: "Không tìm thấy Product Identity UUID" });
    legacy_no = idRow.legacy_no;
    brand = idRow.brand;
  }

  if (action === "hard_delete") {
    const { error } = await supabase.from("product_overrides").delete().eq("id", productId);
    if (error) return json(500, { success: false, error: \`Lỗi DB: \${error.message}\` });
    return json(200, { success: true });
  }

  // Fetch existing record
  const { data: existing } = await supabase
    .from("product_overrides")
    .select("*")
    .eq("id", productId)
    .maybeSingle();

  // Optional image upload
  let image_url: string | null | undefined = undefined;
  if ("image_data_url" in body) {
    const dataUrl = body.image_data_url as string | null;
    if (dataUrl === null || dataUrl === "") {
      image_url = null;
    } else if (typeof dataUrl === "string" && dataUrl.startsWith("data:")) {
      const match = dataUrl.match(/^data:(image\\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
      if (!match) return json(200, { error: "Ảnh không hợp lệ" });
      const mime = match[1];
      const ext = mime.split("/")[1].split("+")[0].replace("jpeg", "jpg");
      const bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
      if (bytes.length > 2 * 1024 * 1024) return json(200, { error: "Ảnh quá lớn (tối đa 2MB)" });
      const path = \`product-\${legacy_no}-\${Date.now()}.\${ext}\`;
      const { error: upErr } = await supabase.storage
        .from("product-images")
        .upload(path, bytes, { contentType: mime, upsert: true });
      if (upErr) {
        console.error("Storage upload error:", upErr);
        return json(500, { error: \`Không thể tải ảnh lên Storage. Chi tiết: \${upErr.message}\` });
      }
      const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
      image_url = pub.publicUrl;
    }
  } else if ("image_url" in body) {
    const v = body.image_url;
    image_url = v === null || v === "" ? null : String(v);
  }

  const pickStr = (k: string): string | null | undefined => {
    if (!(k in body)) return undefined;
    const v = body[k];
    if (v === null || v === "") return null;
    return String(v);
  };
  const link_url = pickStr("link_url");
  const link_url_2 = pickStr("link_url_2");
  const section = pickStr("section");
  const name = pickStr("name");
  const desc = pickStr("desc");

  const deleted = "deleted" in body ? Boolean(body.deleted) : undefined;
  const is_custom = action === "create" ? true : ("is_custom" in body ? Boolean(body.is_custom) : undefined);

  const row: Record<string, unknown> = {
    id: productId,
    no: legacy_no,
    brand,
    image_url: image_url === undefined ? existing?.image_url ?? null : image_url,
    link_url: link_url === undefined ? existing?.link_url ?? null : link_url,
    link_url_2: link_url_2 === undefined ? existing?.link_url_2 ?? null : link_url_2,
    section: section === undefined ? existing?.section ?? null : section,
    name: name === undefined ? existing?.name ?? null : name,
    desc: desc === undefined ? existing?.desc ?? null : desc,
    deleted: deleted === undefined ? existing?.deleted ?? false : deleted,
    is_custom: is_custom === undefined ? existing?.is_custom ?? false : is_custom,
    updated_at: new Date().toISOString(),
  };

  const { data: saved, error } = await supabase
    .from("product_overrides")
    .upsert(row, { onConflict: "id" })
    .select()
    .maybeSingle();
  if (error) return json(500, { success: false, error: \`Lỗi DB: \${error.message}\` });

  // Update audit log placeholder (TODO)
  // ...

  return json(200, { success: true, row: { ...saved, productId } });
`;

overrideStr = overrideStr.replace(logicRegex, newLogic);
fs.writeFileSync(overridePath, overrideStr);

// PATCH save-product-order
const orderPath = 'e:/Downloads/danh-sach-cong-bo-main/danh-sach-cong-bo-main/supabase/functions/save-product-order/index.ts';
let orderStr = fs.readFileSync(orderPath, 'utf8');

const orderLogicRegex = /  for \(const no of orderedIds\) \{[\s\S]*?return json\(200, \{ success: true, count: rows\.length, rows \}\);/m;

const newOrderLogic = `
  for (const id of orderedIds) {
    if (typeof id !== "string" || id.trim() === "") {
      return json(200, { error: \`Dữ liệu không hợp lệ: id=\${id} không hợp lệ\` });
    }
  }
  // Check duplicates
  const idsSet = new Set(orderedIds);
  if (idsSet.size !== orderedIds.length) {
    return json(200, { error: "Dữ liệu không hợp lệ: ordered_ids có chứa giá trị trùng lặp" });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  // Lookup identities
  const { data: identities, error: idErr } = await supabase
    .from("product_identities")
    .select("id, legacy_no, brand")
    .in("id", orderedIds);

  if (idErr) return json(500, { success: false, error: \`Lỗi DB lookup identities: \${idErr.message}\` });
  
  const idMap = new Map(identities?.map(r => [r.id, r]));

  // Fetch existing overrides to preserve data
  const { data: existingList } = await supabase
    .from("product_overrides")
    .select("*")
    .in("id", orderedIds);

  const existingMap = new Map(existingList?.map((r) => [r.id, r]));

  const rowsToUpsert = orderedIds.map((id, index) => {
    const ident = idMap.get(id);
    if (!ident) throw new Error(\`Không tìm thấy identity cho \${id}\`);

    const existing = existingMap.get(id);
    return {
      id: id,
      no: ident.legacy_no,
      brand: ident.brand,
      sort_order: index + 1,
      section: section,
      name: existing?.name ?? null,
      desc: existing?.desc ?? null,
      image_url: existing?.image_url ?? null,
      link_url: existing?.link_url ?? null,
      link_url_2: existing?.link_url_2 ?? null,
      deleted: existing?.deleted ?? false,
      is_custom: existing?.is_custom ?? false,
      updated_at: new Date().toISOString(),
    };
  });

  const { data: rows, error } = await supabase
    .from("product_overrides")
    .upsert(rowsToUpsert, { onConflict: "id" })
    .select();

  if (error) {
    return json(500, { success: false, error: \`Lỗi DB khi lưu order: \${error.message}\` });
  }

  return json(200, { success: true, count: rows.length, rows: rows.map(r => ({ ...r, productId: r.id })) });
`;

orderStr = orderStr.replace(orderLogicRegex, newOrderLogic);
fs.writeFileSync(orderPath, orderStr);
console.log('done!');
