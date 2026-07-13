// ============================================================
//  Sistema de Temas Dinâmicos
//  Carrega as cores/logo da hamburgueria e injeta como
//  variáveis CSS. Usa cache em localStorage (offline-first).
// ============================================================

function aplicarTema(tema) {
  const raiz = document.documentElement;
  raiz.style.setProperty('--cor-primaria',   tema.cor_primaria);
  raiz.style.setProperty('--cor-secundaria', tema.cor_secundaria);
  raiz.style.setProperty('--cor-background', tema.cor_background);
  raiz.style.setProperty('--cor-texto',      tema.cor_texto);
  raiz.style.setProperty('--fonte-principal', tema.fonte_principal);

  // Logo (se existir elemento .logo na página)
  if (tema.logo_url) {
    document.querySelectorAll('img.logo').forEach(img => img.src = tema.logo_url);
  }
}

// Carrega o tema de uma hamburgueria pelo slug.
// Retorna o objeto { hamburgueria, tema } ou null.
async function carregarTema(slug) {
  if (!slug) return null;

  // 1. Aplica cache imediatamente (sem esperar rede)
  const cache = localStorage.getItem(`tema_${slug}`);
  if (cache) {
    try { aplicarTema(JSON.parse(cache)); } catch (_) {}
  }

  // 2. Busca versão fresca no Supabase
  const { data, error } = await window.db
    .from('hamburguerias')
    .select('id, nome, slug, temas(*)')
    .eq('slug', slug)
    .eq('ativa', true)
    .single();

  if (error || !data) return null;

  const tema = data.temas || {};
  aplicarTema(tema);
  localStorage.setItem(`tema_${slug}`, JSON.stringify(tema));

  return { hamburgueria: data, tema };
}

window.carregarTema = carregarTema;
window.aplicarTema  = aplicarTema;
