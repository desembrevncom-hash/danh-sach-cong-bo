const fs = require('fs');

let c = fs.readFileSync('src/features/products/services/productOverrideService.test.ts', 'utf8');

c = c.replace(/no: 1/g, 'productId: "1"');
c = c.replace(/no: 1001/g, 'productId: "1001"');
c = c.replace(/ordered_nos/g, 'ordered_ids');
c = c.replace(/\[1, 2, 3\]/g, '["1", "2", "3"]');
c = c.replace(/body\?\.no/g, 'body?.productId');

fs.writeFileSync('src/features/products/services/productOverrideService.test.ts', c);

let c2 = fs.readFileSync('src/features/products/utils/productTransforms.test.ts', 'utf8');
c2 = c2.replace(/no: 1/g, 'id: "1"');
c2 = c2.replace(/no: 1001/g, 'id: "1001"');
c2 = c2.replace(/no: 9999/g, 'id: "9999"');
c2 = c2.replace(/original_no: 1/g, 'legacyNo: 1');
fs.writeFileSync('src/features/products/utils/productTransforms.test.ts', c2);

let c3 = fs.readFileSync('src/features/products/mappers.test.ts', 'utf8');
c3 = c3.replace(/row\.no/g, 'row.display_no');
c3 = c3.replace(/\{ no: 1/g, '{ id: "1", display_no: 1');
c3 = c3.replace(/no: 10/g, 'id: "10", display_no: 10');
c3 = c3.replace(/id_alias: 10/g, 'id: "10"');
fs.writeFileSync('src/features/products/mappers.test.ts', c3);
