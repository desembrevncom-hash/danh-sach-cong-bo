import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://rhawuzlpwlzqfxluifyv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoYXd1emxwd2x6cWZ4bHVpZnl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MTk4OTUsImV4cCI6MjA5Mjk5NTg5NX0.xhYXfbS1L3o7HRd70mUVz4xfYevzCeAd4fAGCsi8psg');

const PASSWORD = "B@ckup2026";
const EDGE_URL = "https://rhawuzlpwlzqfxluifyv.supabase.co/functions/v1/save-product-override";
const AUTH_HEADER = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoYXd1emxwd2x6cWZ4bHVpZnl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MTk4OTUsImV4cCI6MjA5Mjk5NTg5NX0.xhYXfbS1L3o7HRd70mUVz4xfYevzCeAd4fAGCsi8psg";

async function fixImages() {
  console.log("Fetching overrides...");
  const { data: overrides, error } = await supabase.from('product_overrides').select('*').order('no');
  if (error) {
    console.error(error);
    return;
  }

  const overrideMap = {};
  overrides.forEach(o => overrideMap[o.no] = o);

  console.log("Planning shifts...");
  const updates = [];

  const img67 = overrideMap[68]?.image_url || "https://rhawuzlpwlzqfxluifyv.supabase.co/storage/v1/object/public/product-images/product-67-1777883960843.jpg";

  for (let i = 3; i <= 66; i++) {
    const nextNo = i + 1;
    const nextImg = overrideMap[nextNo]?.image_url;
    if (nextImg) {
      updates.push({
        no: i,
        image_url: nextImg
      });
    }
  }

  updates.push({
    no: 67,
    image_url: img67
  });

  console.log(`Executing ${updates.length} updates via Edge Function...`);
  
  for (const update of updates) {
    const existing = overrideMap[update.no] || { no: update.no };
    const payload = {
      password: PASSWORD,
      action: "upsert",
      ...existing,
      image_url: update.image_url
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
      console.log(`Updated no ${update.no}`);
    } else {
      const errText = await response.text();
      console.error(`Error updating no ${update.no}:`, errText);
    }
  }

  console.log("Done!");
}

fixImages();
