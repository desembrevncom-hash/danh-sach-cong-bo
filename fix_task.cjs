
const fs = require('fs');
let c = fs.readFileSync('C:\\Users\\NC\\.gemini\\antigravity\\brain\\00e43bd6-2872-4dc5-9f1a-5b1e8bb5aff3\\task.md', 'utf8');
c = c.replace('- [/] 6. Update Product Transforms and tests', '- [x] 6. Update Product Transforms and tests');
c = c.replace('- [ ] 7. Update QA Checklist', '- [x] 7. Update QA Checklist');
c = c.replace('- [ ] 8. Verification (lint, uild, 	est)', '- [x] 8. Verification (lint, uild, 	est)');
fs.writeFileSync('C:\\Users\\NC\\.gemini\\antigravity\\brain\\00e43bd6-2872-4dc5-9f1a-5b1e8bb5aff3\\task.md', c);

