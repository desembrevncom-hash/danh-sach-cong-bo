const fs = require('fs');

function updateSaveProductOverride() {
  let c = fs.readFileSync('supabase/functions/save-product-override/index.ts', 'utf8');

  // Change `no` checks to `productId`
  c = c.replace(/if \("no" in body && typeof body\.no !== "number"\) return json\(400, \{ success: false, error: "Dữ liệu không hợp lệ: no" \}\);\n/g, '');
  c = c.replace(/if \("original_no" in body && typeof body\.original_no !== "number"\) return json\(400, \{ success: false, error: "Dữ liệu không hợp lệ: original_no" \}\);\n/g, '');
  
  c = c.replace(/if \("productId" in body/g, 'if ("no" in body'); // Just in case, clean it
  
  const validateId = `  if ("productId" in body && typeof body.productId !== "string") return json(400, { success: false, error: "Dữ liệu không hợp lệ: productId" });\n`;
  const insertPoint = c.indexOf('if ("name" in body');
  c = c.substring(0, insertPoint) + validateId + c.substring(insertPoint);

  // Update backend SQL logic (from no to id)
  c = c.replace(/\.eq\("no", body\.no\)/g, '.eq("id", body.productId)');
  c = c.replace(/\.eq\("no", body\.original_no\)/g, '.eq("id", body.productId)');
  c = c.replace(/no: body\.no/g, 'id: body.productId');
  c = c.replace(/const productNo = body\.no;/g, 'const productId = body.productId;');
  c = c.replace(/!productNo/g, '!productId');

  fs.writeFileSync('supabase/functions/save-product-override/index.ts', c);
}

function updateSaveProductOrder() {
  let c = fs.readFileSync('supabase/functions/save-product-order/index.ts', 'utf8');

  c = c.replace(/ordered_nos/g, 'ordered_ids');
  c = c.replace(/no: body\.no/g, 'id: body.productId');
  c = c.replace(/const orderedNos = body\.ordered_ids;/g, 'const orderedIds = body.ordered_ids;');
  c = c.replace(/orderedNos/g, 'orderedIds');
  c = c.replace(/Number\.isInteger\(no\) \|\| no < 1 \|\| no > 99999/g, 'typeof no !== "string" || no.trim() === ""');
  c = c.replace(/in\("no", orderedIds\)/g, 'in("id", orderedIds)');
  c = c.replace(/no → existing row/g, 'id → existing row');
  c = c.replace(/existingMap\[row\.no\]/g, 'existingMap[row.id]');
  c = c.replace(/row\.no/g, 'row.id');
  c = c.replace(/\{ no \}/g, '{ id: no }');

  fs.writeFileSync('supabase/functions/save-product-order/index.ts', c);
}

updateSaveProductOverride();
updateSaveProductOrder();
