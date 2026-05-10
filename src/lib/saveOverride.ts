import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type OverrideRow = {
  no: number;
  image_url: string | null;
  link_url: string | null;
  section: string | null;
  name: string | null;
  desc: string | null;
  deleted: boolean;
  is_custom: boolean;
};

type SavePayload = {
  no?: number;
  original_no?: number;
  password: string;
  action?: "upsert" | "create" | "hard_delete";
  image_data_url?: string | null;
  image_url?: string | null;
  link_url?: string | null;
  section?: string | null;
  name?: string | null;
  desc?: string | null;
  deleted?: boolean;
};

export async function saveProductOverride(payload: SavePayload) {
  // If the edge function is old, it doesn't support action="create". We must allocate ID manually.
  if (payload.action === "create") {
    const { data: maxRow } = await supabase
      .from("product_overrides")
      .select("no")
      .gte("no", 1000)
      .order("no", { ascending: false })
      .limit(1)
      .maybeSingle();
      
    payload.no = (maxRow?.no ?? 999) + 1;
    payload.action = "upsert"; // Fallback to standard upsert for old edge function
  }

  // CLient-side shifting logic because the user cannot deploy the Edge Function
  if (payload.original_no && payload.no && payload.original_no !== payload.no && payload.action !== "create") {
    const originalNo = payload.original_no;
    const no = payload.no;
    const isMovingUp = originalNo > no;
    const minNo = isMovingUp ? no : originalNo + 1;
    const maxNo = isMovingUp ? originalNo - 1 : no;

    toast.info("Đang tính toán dịch chuyển số thứ tự...");
    const { data: toShift } = await supabase
      .from("product_overrides")
      .select("*")
      .gte("no", minNo)
      .lte("no", maxNo)
      .order("no", { ascending: isMovingUp ? false : true });

    if (toShift && toShift.length > 0) {
      toast.info(`Đang dịch chuyển ${toShift.length} sản phẩm... vui lòng chờ.`);
      
      // 1. Delete original first to avoid primary key collision
      await supabase.functions.invoke("save-product-override", {
        body: { password: payload.password, action: "hard_delete", no: originalNo }
      });

      // 2. Shift items sequentially
      let count = 0;
      for (const item of toShift) {
        count++;
        if (count % 10 === 0) {
          toast.info(`Đã dịch chuyển ${count}/${toShift.length}...`);
        }
        const newNo = isMovingUp ? item.no + 1 : item.no - 1;
        await supabase.functions.invoke("save-product-override", {
          body: {
            password: payload.password,
            action: "upsert",
            no: newNo,
            image_url: item.image_url ?? null,
            link_url: item.link_url ?? null,
            section: item.section ?? null,
            name: item.name ?? null,
            desc: item.desc ?? null,
            deleted: Boolean(item.deleted),
            is_custom: Boolean(item.is_custom),
          }
        });
      }
      toast.success("Đã hoàn tất dịch chuyển!");
    }
  }

  const { data, error } = await supabase.functions.invoke("save-product-override", {
    body: payload,
  });
  if (error) {
    return { ok: false as const, error: error.message ?? "Lỗi mạng" };
  }
  if (data?.error) {
    return { ok: false as const, error: data.error as string };
  }
  return { ok: true as const, row: data?.row as OverrideRow | undefined };
}
