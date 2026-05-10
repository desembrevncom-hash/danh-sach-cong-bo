import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient('https://rhawuzlpwlzqfxluifyv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoYXd1emxwd2x6cWZ4bHVpZnl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MTk4OTUsImV4cCI6MjA5Mjk5NTg5NX0.xhYXfbS1L3o7HRd70mUVz4xfYevzCeAd4fAGCsi8psg');

// Mock sections from desembreProducts.ts
const sections = [
  { title: "CLEANSER", products: 7 },
  { title: "PEELING", products: 4 },
  { title: "TONER", products: 5 },
  { title: "AMPOULE", products: 8 },
  { title: "SERUM / ESSENCE / OIL", products: 11 },
  { title: "FLUID", products: 5 },
  { title: "CREAM", products: 10 },
  { title: "EYE CARE", products: 2 },
  { title: "SUN CARE", products: 2 },
  { title: "BB CREAM", products: 2 },
  { title: "MODELING MASK", products: 8 },
  { title: "THERAPY TREATMENT / SET", products: 5 }
];

const flatProducts = [];
let counter = 0;
for (const s of sections) {
  for (let i = 0; i < s.products; i++) {
    counter++;
    flatProducts.push({ no: counter, name: `Product ${counter}`, section: s.title });
  }
}

async function check() {
  const { data: overridesList } = await supabase.from('product_overrides').select('*');
  const overrides = {};
  overridesList.forEach(o => overrides[o.no] = o);

  const list = [];
  const processedNos = new Set();

  for (const p of flatProducts) {
    const o = overrides[p.no];
    if (o?.deleted) {
      processedNos.add(p.no);
      continue;
    }
    list.push({ no: p.no, name: o?.name || p.name });
    processedNos.add(p.no);
  }

  for (const o of Object.values(overrides)) {
    if (processedNos.has(o.no) || o.deleted) continue;
    list.push({ no: o.no, name: o.name });
  }

  console.log('Final product count:', list.length);
  console.log('Product list:', list.map(i => `${i.no}: ${i.name}`).join(', '));
}

check();
