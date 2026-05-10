import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://rhawuzlpwlzqfxluifyv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoYXd1emxwd2x6cWZ4bHVpZnl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MTk4OTUsImV4cCI6MjA5Mjk5NTg5NX0.xhYXfbS1L3o7HRd70mUVz4xfYevzCeAd4fAGCsi8psg');

async function saveProductOverride(payload) {
  if (payload.action === "create") {
    const { data: maxRow } = await supabase
      .from("product_overrides")
      .select("no")
      .gte("no", 1000)
      .order("no", { ascending: false })
      .limit(1)
      .maybeSingle();
      
    payload.no = (maxRow?.no ?? 999) + 1;
    payload.action = "upsert"; 
  }
  console.log("Payload:", payload);
  const { data, error } = await supabase.functions.invoke("save-product-override", {
    body: payload,
  });
  console.log("Data:", data, "Error:", error);
}

saveProductOverride({
  password: "B@ckup2026",
  action: "create",
  no: 0,
  section: "CLEANSER",
  name: "Test Node",
  desc: "Test Node desc"
});
