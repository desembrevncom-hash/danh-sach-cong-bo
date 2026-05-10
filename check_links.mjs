import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://rhawuzlpwlzqfxluifyv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoYXd1emxwd2x6cWZ4bHVpZnl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MTk4OTUsImV4cCI6MjA5Mjk5NTg5NX0.xhYXfbS1L3o7HRd70mUVz4xfYevzCeAd4fAGCsi8psg');

// Mock products to match desembreProducts.ts (just for indices)
const productLinks = {
  6: "https://www.canva.com/design/DAHIHl0FELs/pZpKKIN0gn69eKFCKCLSEw/view",
  // ... let's check others
};

async function checkLinks() {
  const { data: overrides } = await supabase.from('product_overrides').select('*').order('no');
  const overrideMap = {};
  overrides.forEach(o => overrideMap[o.no] = o);

  const results = [];
  for (let i = 1; i <= 67; i++) {
    results.push({
      no: i,
      link: overrideMap[i]?.link_url || "NONE"
    });
  }

  console.log(JSON.stringify(results, null, 2));
}

checkLinks();
