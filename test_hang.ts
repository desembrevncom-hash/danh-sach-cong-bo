import { supabase } from './src/integrations/supabase/client';
async function test() {
  console.log('Starting test');
  const res = await supabase.auth.getSession();
  console.log('Session:', res.data.session?.user?.id || 'none');
  const res2 = await supabase.functions.invoke('save-product-override', { body: {} });
  console.log('Invoke res:', res2.error?.message || 'success');
}
test();
