import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
const url = Deno.env.get("SUPABASE_URL");
const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase.rpc('search_products_catalog', { brand_id: 'desembre', p_page: 1, p_page_size: 1, p_search_query: '' });
  console.log("TEST RESULT:", data);
}

run();
