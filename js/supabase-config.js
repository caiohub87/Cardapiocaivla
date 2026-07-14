// ============================================================
//  Configuração do Supabase
//  1. Crie um projeto em https://supabase.com
//  2. Vá em Project Settings > API
//  3. Cole a URL e a anon/public key abaixo
// ============================================================

const SUPABASE_URL  = 'https://aglnzxpabovrzdlthfzs.supabase.co';
const SUPABASE_ANON = 'sb_publishable_b_Z9OxX85pbkIf0zSMsYUA_aVyBESsP';

// Cliente global (carregado via CDN no HTML)
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

// Helper: pega o slug da hamburgueria a partir da URL
// Ex: /burger-king            -> "burger-king"  (Vercel)
//     /burger-king/checkout   -> "burger-king"  (Vercel)
//     /cliente.html?slug=x    -> "x"             (teste local)
function slugDaURL() {
  const q = new URLSearchParams(window.location.search).get('slug');
  if (q) return q;
  const partes = window.location.pathname.split('/').filter(Boolean);
  const primeiro = partes[0] || null;
  if (primeiro && primeiro.endsWith('.html')) return null;
  return primeiro;
}

// Exporta pro escopo global
window.db = db;
window.slugDaURL = slugDaURL;
