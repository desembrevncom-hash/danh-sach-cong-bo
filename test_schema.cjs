const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://toytykbimcpkieocozzm.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRveXR5a2JpbWNwa2llb2NvenptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwOTI1NDksImV4cCI6MjA5NTY2ODU0OX0.zajJ4iasRzqSJagw84KiKa-SQfBaFv1zqTaTsl-gYFk');
async function run() {
  const { data, error } = await supabase.rpc('execute_sql', {
    query: `select column_name, data_type, is_nullable from information_schema.columns where table_schema = 'public' and table_name = 'product_identities' order by ordinal_position;`
  });
  console.log(data || error);
}
run();
