// ============================================================
//  FASE 3 — Editor Visual de Temas
//  Usado por admin/hamburgueria.html (aba Temas)
//  Cores, logo, fonte, horários e pagamento — com preview ao vivo
// ============================================================

(function () {
  const $ = s => document.querySelector(s);

  let H = null;
  let tema = null;

  const FONTES = [
    'Inter, sans-serif',
    'Poppins, sans-serif',
    'Montserrat, sans-serif',
    'Roboto, sans-serif',
    'Playfair Display, serif',
    'Bebas Neue, sans-serif'
  ];

  // ---------------------------------------------------------
  // INIT
  // ---------------------------------------------------------
  async function initTemas(hamburgueria) {
    H = hamburgueria;
    const { data } = await db.from('temas')
      .select('*').eq('hamburgueria_id', H.id).single();
    tema = data || {};

    // preenche select de fontes
    $('#tema-fonte').innerHTML = FONTES.map(f => {
      const nome = f.split(',')[0];
      return `<option value="${f}" style="font-family:${f}">${nome}</option>`;
    }).join('');

    preencherForm();
    atualizarPreview();

    // preview ao vivo em qualquer mudança
    ['tema-cor-primaria', 'tema-cor-secundaria', 'tema-cor-bg', 'tema-cor-texto',
     'tema-fonte', 'tema-abre', 'tema-fecha'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', atualizarPreview);
    });
    $('#tema-logo').addEventListener('change', previewLogoLocal);
  }

  function preencherForm() {
    $('#tema-cor-primaria').value   = tema.cor_primaria   || '#D4AF37';
    $('#tema-cor-secundaria').value = tema.cor_secundaria || '#000000';
    $('#tema-cor-bg').value         = tema.cor_background || '#1a1a1a';
    $('#tema-cor-texto').value      = tema.cor_texto      || '#ffffff';
    $('#tema-fonte').value          = tema.fonte_principal || 'Inter, sans-serif';
    $('#tema-abre').value           = tema.horario_abertura   || '18:00';
    $('#tema-fecha').value          = tema.horario_fechamento || '23:00';

    const metodos = tema.metodos_pagamento || ['pix', 'cartao', 'dinheiro'];
    $('#pg-pix').checked      = metodos.includes('pix');
    $('#pg-cartao').checked   = metodos.includes('cartao');
    $('#pg-dinheiro').checked = metodos.includes('dinheiro');
  }

  // ---------------------------------------------------------
  // PREVIEW AO VIVO
  // ---------------------------------------------------------
  function valoresAtuais() {
    return {
      cor_primaria:   $('#tema-cor-primaria').value,
      cor_secundaria: $('#tema-cor-secundaria').value,
      cor_background: $('#tema-cor-bg').value,
      cor_texto:      $('#tema-cor-texto').value,
      fonte_principal: $('#tema-fonte').value,
      horario_abertura: $('#tema-abre').value,
      horario_fechamento: $('#tema-fecha').value
    };
  }

  function atualizarPreview() {
    const v = valoresAtuais();
    const pv = $('#pv-tema');
    pv.style.background = v.cor_background;
    pv.style.color = v.cor_texto;
    pv.style.fontFamily = v.fonte_principal;

    $('#pv-nome').textContent = H.nome;
    $('#pv-horario').textContent = `Aberto das ${v.horario_abertura} às ${v.horario_fechamento}`;
    $('#pv-horario').style.color = mixCinza(v.cor_texto);

    $('#pv-preco').style.color = v.cor_primaria;

    const btn = $('#pv-btn');
    btn.style.background = v.cor_primaria;
    btn.style.color = v.cor_secundaria;

    const card = $('#pv-card');
    card.style.border = '1px solid ' + hexAlpha(v.cor_texto, 0.15);
    card.style.background = hexAlpha(v.cor_texto, 0.06);
  }

  function previewLogoLocal() {
    const file = $('#tema-logo').files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    $('#pv-logo').src = url;
    $('#pv-logo').style.display = 'block';
  }

  // helpers de cor
  function hexAlpha(hex, a) {
    const n = hex.replace('#', '');
    const r = parseInt(n.substr(0, 2), 16),
          g = parseInt(n.substr(2, 2), 16),
          b = parseInt(n.substr(4, 2), 16);
    return `rgba(${r},${g},${b},${a})`;
  }
  function mixCinza(hex) { return hexAlpha(hex, 0.55); }

  // ---------------------------------------------------------
  // SALVAR
  // ---------------------------------------------------------
  async function salvarTema() {
    $('#btn-salvar-tema').disabled = true;
    $('#tema-msg').className = 'muted';
    $('#tema-msg').textContent = 'Salvando…';

    // upload do logo (se escolheu arquivo)
    let logo_url = tema.logo_url || null;
    const file = $('#tema-logo').files[0];
    if (file) {
      $('#tema-msg').textContent = 'Enviando logo…';
      const nomeLimpo = file.name.replace(/[^a-zA-Z0-9._-]/g, '');
      const path = `${H.id}/logo_${Date.now()}_${nomeLimpo}`;
      const { error: upErr } = await db.storage.from('imagens').upload(path, file);
      if (upErr) {
        $('#btn-salvar-tema').disabled = false;
        $('#tema-msg').className = 'erro';
        $('#tema-msg').textContent = 'Erro no upload do logo: ' + upErr.message;
        return;
      }
      logo_url = db.storage.from('imagens').getPublicUrl(path).data.publicUrl;
    }

    const metodos = [];
    if ($('#pg-pix').checked)      metodos.push('pix');
    if ($('#pg-cartao').checked)   metodos.push('cartao');
    if ($('#pg-dinheiro').checked) metodos.push('dinheiro');

    const dados = {
      hamburgueria_id: H.id,
      ...valoresAtuais(),
      metodos_pagamento: metodos,
      logo_url,
      atualizado_em: new Date().toISOString()
    };

    const { error } = await db.from('temas')
      .upsert(dados, { onConflict: 'hamburgueria_id' });

    $('#btn-salvar-tema').disabled = false;

    if (error) {
      $('#tema-msg').className = 'erro';
      $('#tema-msg').textContent = 'Erro ao salvar: ' + error.message;
      return;
    }

    tema = { ...tema, ...dados };
    // limpa cache local do tema pra loja pegar a versão nova
    localStorage.removeItem(`tema_${H.slug}`);

    $('#tema-msg').className = 'ok';
    $('#tema-msg').textContent = '✓ Tema salvo! A loja já está com o novo visual.';
  }

  Object.assign(window, { initTemas, salvarTema });
})();
