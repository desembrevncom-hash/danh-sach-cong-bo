import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://rhawuzlpwlzqfxluifyv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoYXd1emxwd2x6cWZ4bHVpZnl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MTk4OTUsImV4cCI6MjA5Mjk5NTg5NX0.xhYXfbS1L3o7HRd70mUVz4xfYevzCeAd4fAGCsi8psg');

const PASSWORD = "B@ckup2026";
const EDGE_URL = "https://rhawuzlpwlzqfxluifyv.supabase.co/functions/v1/save-product-override";
const AUTH_HEADER = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoYXd1emxwd2x6cWZ4bHVpZnl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MTk4OTUsImV4cCI6MjA5Mjk5NTg5NX0.xhYXfbS1L3o7HRd70mUVz4xfYevzCeAd4fAGCsi8psg";

async function fixLinks() {
  console.log("Fetching overrides...");
  const { data: overrides, error } = await supabase.from('product_overrides').select('*').order('no');
  if (error) {
    console.error(error);
    return;
  }

  const overrideMap = {};
  overrides.forEach(o => overrideMap[o.no] = o);

  console.log("Planning link shifts...");
  const updates = [];

  // Link for product 67 was at no 68 (I have this from previous logs)
  const link67 = overrideMap[68]?.link_url || "https://www.canva.com/design/DAHJJDw69kA/rcko-GqaIGbBVSQuzJKPlg/view";

  for (let i = 1; i <= 66; i++) {
    const nextNo = i + 1;
    const nextLink = overrideMap[nextNo]?.link_url || null;
    updates.push({
      no: i,
      link_url: nextLink
    });
  }

  updates.push({
    no: 67,
    link_url: link67
  });

  console.log(`Executing ${updates.length} link updates via Edge Function...`);
  
  for (const update of updates) {
    const existing = overrideMap[update.no] || { no: update.no };
    const payload = {
      password: PASSWORD,
      action: "upsert",
      ...existing,
      link_url: update.link_url
    };
    
    const response = await fetch(EDGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': AUTH_HEADER
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log(`Updated link for no ${update.no}`);
    } else {
      const errText = await response.text();
      console.error(`Error updating link for no ${update.no}:`, errText);
    }
  }

  console.log("Done!");
}

fixLinks();
