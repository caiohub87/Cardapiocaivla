// ============================================================
//  FASE 2 — CRUD do Cardápio (categorias, produtos, adicionais)
//  Usado por admin/hamburgueria.html
//  Depende de: window.db (supabase-config.js) e da hamburgueria
//  carregada na página (passada via initCardapio)
// ============================================================

(function () {
  const $ = s => document.querySelector(s);
  const money = v => 'R$ ' + Number(v).toFixed(2).replace('.', ',');
  const parseMoney = s => parseFloat(String(s).replace(',', '.')) || 0;

  let H = null;           // hamburgueria atual
  let cats = [], prods = [], adits = [];

  // ---------------------------------------------------------
  // INIT + LOAD
  // ---------------------------------------------------------
  async function initCardapio(hamburgueria) {
    H = hamburgueria;
    await recarregar();
  }

  async function recarregar() {
    const [c, p, a] = await Promise.all([
      db.from('categorias').select('*').eq('hamburgueria_id', H.id).order('ordem'),
      db.from('produtos').select('*').eq('hamburgueria_id', H.id).order('ordem'),
      db.from('aditivos').select('*').eq('hamburgueria_id', H.id).order('nome')
    ]);
    cats  = c.data || [];
    prods = p.data || [];
    adits = a.data || [];
    renderCategorias();
    renderProdutos();
    renderAditivos();
  }

  // ---------------------------------------------------------
  // CATEGORIAS
  // ---------------------------------------------------------
  function renderCategorias() {
    const el = $('#cats-list');
    if (!cats.length) {
      el.innerHTML = '<p class="muted" style="padding:10px 0;">Nenhuma categoria. Crie a primeira (ex: 🍔 Hambúrgueres).</p>';
      return;
    }
    el.innerHTML = cats.map((c, i) => `
      <div class="linha-item">
        <div style="flex:1;">
          <strong>${c.icone || ''} ${c.nome}</strong>
          ${c.ativa ? '' : '<span class="muted"> · inativa</span>'}
        </div>
        <div class="linha-acoes">
          <button class="btn-mini" ${i === 0 ? 'disabled' : ''} onclick="moverCategoria('${c.id}',-1)">↑</button>
          <button class="btn-mini" ${i === cats.length - 1 ? 'disabled' : ''} onclick="moverCategoria('${c.id}',1)">↓</button>
          <button class="btn-mini" onclick="editarCategoria('${c.id}')">✏️</button>
          <button class="btn-mini" onclick="excluirCategoria('${c.id}')">🗑️</button>
        </div>
      </div>`).join('');
  }

  function abrirModalCategoria(cat) {
    $('#cat-id').value = cat ? cat.id : '';
    $('#cat-nome').value = cat ? cat.nome : '';
    $('#cat-icone').value = cat ? (cat.icone || '') : '';
    $('#cat-msg').textContent = '';
    $('#modal-categoria').classList.add('open');
    $('#cat-nome').focus();
  }

  function editarCategoria(id) {
    const cat = cats.find(c => c.id === id);
    if (cat) abrirModalCategoria(cat);
  }

  async function salvarCategoria() {
    const id = $('#cat-id').value;
    const nome = $('#cat-nome').value.trim();
    const icone = $('#cat-icone').value.trim();
    if (!nome) { $('#cat-msg').textContent = 'Digite o nome.'; return; }

    $('#btn-salvar-cat').disabled = true;
    let error;
    if (id) {
      ({ error } = await db.from('categorias').update({ nome, icone }).eq('id', id));
    } else {
      ({ error } = await db.from('categorias').insert({
        hamburgueria_id: H.id, nome, icone, ordem: cats.length
      }));
    }
    $('#btn-salvar-cat').disabled = false;

    if (error) { $('#cat-msg').textContent = 'Erro: ' + error.message; return; }
    fecharModal('modal-categoria');
    recarregar();
  }

  async function excluirCategoria(id) {
    const temProdutos = prods.some(p => p.categoria_id === id);
    const msg = temProdutos
      ? 'Esta categoria tem produtos! Eles ficarão sem categoria. Excluir mesmo assim?'
      : 'Excluir esta categoria?';
    if (!confirm(msg)) return;
    const { error } = await db.from('categorias').delete().eq('id', id);
    if (error) { alert('Erro: ' + error.message); return; }
    recarregar();
  }

  async function moverCategoria(id, dir) {
    const i = cats.findIndex(c => c.id === id);
    const j = i + dir;
    if (j < 0 || j >= cats.length) return;
    await Promise.all([
      db.from('categorias').update({ ordem: j }).eq('id', cats[i].id),
      db.from('categorias').update({ ordem: i }).eq('id', cats[j].id)
    ]);
    recarregar();
  }

  // ---------------------------------------------------------
  // PRODUTOS
  // ---------------------------------------------------------
  function renderProdutos() {
    const el = $('#prods-list');
    if (!prods.length) {
      el.innerHTML = '<p class="muted" style="padding:10px 0;">Nenhum produto ainda.</p>';
      return;
    }

    let html = '';
    const grupos = [...cats.map(c => ({ c, lista: prods.filter(p => p.categoria_id === c.id) })),
                    { c: null, lista: prods.filter(p => !p.categoria_id) }];

    grupos.forEach(({ c, lista }) => {
      if (!lista.length) return;
      html += `<h4 class="grupo-titulo">${c ? `${c.icone || ''} ${c.nome}` : 'Sem categoria'}</h4>`;
      html += '<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr));">';
      lista.forEach((p, i) => {
        html += `
          <div class="card prod-card ${p.disponivel ? '' : 'off'}">
            ${p.imagem_url ? `<img src="${p.imagem_url}" alt="">` : '<div class="sem-img">🍔</div>'}
            <strong>${p.nome}</strong>
            <span class="prod-preco">${money(p.preco)}</span>
            <div class="linha-acoes" style="margin-top:8px;">
              <button class="btn-mini" ${i === 0 ? 'disabled' : ''} onclick="moverProduto('${p.id}',-1)">↑</button>
              <button class="btn-mini" ${i === lista.length - 1 ? 'disabled' : ''} onclick="moverProduto('${p.id}',1)">↓</button>
              <button class="btn-mini" onclick="editarProduto('${p.id}')">✏️</button>
              <button class="btn-mini" onclick="excluirProduto('${p.id}')">🗑️</button>
              <button class="btn-mini toggle ${p.disponivel ? 'on' : ''}" onclick="toggleDisponivel('${p.id}')">
                ${p.disponivel ? 'Disponível' : 'Esgotado'}
              </button>
            </div>
          </div>`;
      });
      html += '</div>';
    });
    el.innerHTML = html;
  }

  function abrirModalProduto(p) {
    $('#prod-id').value = p ? p.id : '';
    $('#prod-nome').value = p ? p.nome : '';
    $('#prod-desc').value = p ? (p.descricao || '') : '';
    $('#prod-preco').value = p ? String(p.preco).replace('.', ',') : '';
    $('#prod-img-atual').value = p ? (p.imagem_url || '') : '';
    $('#prod-imagem').value = '';
    $('#prod-msg').textContent = '';

    // preenche select de categorias
    $('#prod-categoria').innerHTML =
      '<option value="">Sem categoria</option>' +
      cats.map(c => `<option value="${c.id}" ${p && p.categoria_id === c.id ? 'selected' : ''}>${c.icone || ''} ${c.nome}</option>`).join('');

    $('#prod-img-preview').innerHTML = p && p.imagem_url
      ? `<img src="${p.imagem_url}" style="width:100%;height:120px;object-fit:cover;border-radius:10px;margin-bottom:10px;">`
      : '';

    $('#modal-produto').classList.add('open');
    $('#prod-nome').focus();
  }

  function editarProduto(id) {
    const p = prods.find(x => x.id === id);
    if (p) abrirModalProduto(p);
  }

  async function salvarProduto() {
    const id = $('#prod-id').value;
    const nome = $('#prod-nome').value.trim();
    const descricao = $('#prod-desc').value.trim();
    const preco = parseMoney($('#prod-preco').value);
    const categoria_id = $('#prod-categoria').value || null;
    if (!nome) { $('#prod-msg').textContent = 'Digite o nome.'; return; }
    if (preco <= 0) { $('#prod-msg').textContent = 'Digite um preço válido.'; return; }

    $('#btn-salvar-prod').disabled = true;
    $('#prod-msg').textContent = '';

    // upload da imagem (se escolheu arquivo novo)
    let imagem_url = $('#prod-img-atual').value || null;
    const file = $('#prod-imagem').files[0];
    if (file) {
      $('#prod-msg').textContent = 'Enviando imagem…';
      const nomeLimpo = file.name.replace(/[^a-zA-Z0-9._-]/g, '');
      const path = `${H.id}/${Date.now()}_${nomeLimpo}`;
      const { error: upErr } = await db.storage.from('imagens').upload(path, file);
      if (upErr) {
        $('#btn-salvar-prod').disabled = false;
        $('#prod-msg').textContent = 'Erro no upload: ' + upErr.message;
        return;
      }
      imagem_url = db.storage.from('imagens').getPublicUrl(path).data.publicUrl;
    }

    const dados = { nome, descricao, preco, categoria_id, imagem_url };
    let error;
    if (id) {
      ({ error } = await db.from('produtos').update(dados).eq('id', id));
    } else {
      ({ error } = await db.from('produtos').insert({
        ...dados, hamburgueria_id: H.id, ordem: prods.length
      }));
    }
    $('#btn-salvar-prod').disabled = false;

    if (error) { $('#prod-msg').textContent = 'Erro: ' + error.message; return; }
    fecharModal('modal-produto');
    recarregar();
  }

  async function excluirProduto(id) {
    if (!confirm('Excluir este produto?')) return;
    const { error } = await db.from('produtos').delete().eq('id', id);
    if (error) { alert('Erro: ' + error.message); return; }
    recarregar();
  }

  async function toggleDisponivel(id) {
    const p = prods.find(x => x.id === id);
    if (!p) return;
    await db.from('produtos').update({ disponivel: !p.disponivel }).eq('id', id);
    recarregar();
  }

  async function moverProduto(id, dir) {
    const p = prods.find(x => x.id === id);
    // move dentro da mesma categoria
    const lista = prods.filter(x => x.categoria_id === p.categoria_id);
    const i = lista.findIndex(x => x.id === id);
    const j = i + dir;
    if (j < 0 || j >= lista.length) return;
    await Promise.all([
      db.from('produtos').update({ ordem: lista[j].ordem }).eq('id', lista[i].id),
      db.from('produtos').update({ ordem: lista[i].ordem }).eq('id', lista[j].id)
    ]);
    recarregar();
  }

  // ---------------------------------------------------------
  // ADITIVOS (adicionais)
  // ---------------------------------------------------------
  function renderAditivos() {
    const el = $('#adits-list');
    if (!adits.length) {
      el.innerHTML = '<p class="muted" style="padding:10px 0;">Nenhum adicional (ex: bacon extra, queijo).</p>';
      return;
    }
    el.innerHTML = adits.map(a => `
      <div class="linha-item ${a.disponivel ? '' : 'off'}">
        <div style="flex:1;">
          <strong>${a.nome}</strong>
          <span class="muted"> · +${money(a.preco_adicional)}</span>
        </div>
        <div class="linha-acoes">
          <button class="btn-mini" onclick="editarAditivo('${a.id}')">✏️</button>
          <button class="btn-mini" onclick="excluirAditivo('${a.id}')">🗑️</button>
          <button class="btn-mini toggle ${a.disponivel ? 'on' : ''}" onclick="toggleAditivo('${a.id}')">
            ${a.disponivel ? 'Disponível' : 'Esgotado'}
          </button>
        </div>
      </div>`).join('');
  }

  function abrirModalAditivo(a) {
    $('#adit-id').value = a ? a.id : '';
    $('#adit-nome').value = a ? a.nome : '';
    $('#adit-preco').value = a ? String(a.preco_adicional).replace('.', ',') : '';
    $('#adit-msg').textContent = '';
    $('#modal-aditivo').classList.add('open');
    $('#adit-nome').focus();
  }

  function editarAditivo(id) {
    const a = adits.find(x => x.id === id);
    if (a) abrirModalAditivo(a);
  }

  async function salvarAditivo() {
    const id = $('#adit-id').value;
    const nome = $('#adit-nome').value.trim();
    const preco_adicional = parseMoney($('#adit-preco').value);
    if (!nome) { $('#adit-msg').textContent = 'Digite o nome.'; return; }

    $('#btn-salvar-adit').disabled = true;
    let error;
    if (id) {
      ({ error } = await db.from('aditivos').update({ nome, preco_adicional }).eq('id', id));
    } else {
      ({ error } = await db.from('aditivos').insert({
        hamburgueria_id: H.id, nome, preco_adicional
      }));
    }
    $('#btn-salvar-adit').disabled = false;

    if (error) { $('#adit-msg').textContent = 'Erro: ' + error.message; return; }
    fecharModal('modal-aditivo');
    recarregar();
  }

  async function excluirAditivo(id) {
    if (!confirm('Excluir este adicional?')) return;
    const { error } = await db.from('aditivos').delete().eq('id', id);
    if (error) { alert('Erro: ' + error.message); return; }
    recarregar();
  }

  async function toggleAditivo(id) {
    const a = adits.find(x => x.id === id);
    if (!a) return;
    await db.from('aditivos').update({ disponivel: !a.disponivel }).eq('id', id);
    recarregar();
  }

  // ---------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------
  function fecharModal(idModal) {
    document.getElementById(idModal).classList.remove('open');
  }

  // exporta pro escopo global (onclick nos templates)
  Object.assign(window, {
    initCardapio,
    abrirModalCategoria: () => abrirModalCategoria(null),
    editarCategoria, salvarCategoria, excluirCategoria, moverCategoria,
    abrirModalProduto: () => abrirModalProduto(null),
    editarProduto, salvarProduto, excluirProduto, toggleDisponivel, moverProduto,
    abrirModalAditivo: () => abrirModalAditivo(null),
    editarAditivo, salvarAditivo, excluirAditivo, toggleAditivo,
    fecharModal
  });
})();
