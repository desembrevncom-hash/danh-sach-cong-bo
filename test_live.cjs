
const https = require('https');
https.get('https://cong-bo.hjcnt.com.vn/', (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    const match = body.match(/src=\"(\/assets\/index-.*?\.js)\"/);
    if(match) {
       const url = 'https://cong-bo.hjcnt.com.vn' + match[1];
       console.log('Fetching JS:', url);
       https.get(url, (r) => {
          let js = '';
          r.on('data', d => js += d);
          r.on('end', () => {
             console.log('Found resolveBrandLogoUrl?', js.includes('resolveBrandLogoUrl') ? 'YES' : 'NO');
          })
       });
    } else console.log('No js script found');
  });
})
