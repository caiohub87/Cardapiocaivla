// ============================================================
//  FASE 4 — Carrinho (localStorage, um carrinho por loja)
//  Item: { uid, produto_id, nome, preco, qtd, aditivos:[{id,nome,preco}] }
// ============================================================

(function () {
  let slug = null;

  function initCarrinho(slugLoja) { slug = slugLoja; }
  const chave = () => `carrinho_${slug}`;

  function getCarrinho() {
    try { return JSON.parse(localStorage.getItem(chave())) || []; }
    catch (_) { return []; }
  }

  function salvar(itens) {
    localStorage.setItem(chave(), JSON.stringify(itens));
  }

  // preço de 1 unidade (produto + adicionais)
  function precoUnitario(item) {
    return Number(item.preco) +
      (item.aditivos || []).reduce((s, a) => s + Number(a.preco), 0);
  }

  function subtotalItem(item) { return precoUnitario(item) * item.qtd; }

  function totalCarrinho() {
    return getCarrinho().reduce((s, i) => s + subtotalItem(i), 0);
  }

  function qtdCarrinho() {
    return getCarrinho().reduce((s, i) => s + i.qtd, 0);
  }

  function addItem(produto, qtd, aditivos) {
    const itens = getCarrinho();
    itens.push({
      uid: Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      produto_id: produto.id,
      nome: produto.nome,
      preco: Number(produto.preco),
      qtd: qtd,
      aditivos: aditivos || []
    });
    salvar(itens);
  }

  function mudarQtd(uid, delta) {
    const itens = getCarrinho();
    const item = itens.find(i => i.uid === uid);
    if (!item) return;
    item.qtd += delta;
    if (item.qtd <= 0) {
      salvar(itens.filter(i => i.uid !== uid));
    } else {
      salvar(itens);
    }
  }

  function removerItem(uid) {
    salvar(getCarrinho().filter(i => i.uid !== uid));
  }

  function limparCarrinho() {
    localStorage.removeItem(chave());
  }

  Object.assign(window, {
    initCarrinho, getCarrinho, addItem, mudarQtd, removerItem,
    limparCarrinho, totalCarrinho, qtdCarrinho, precoUnitario, subtotalItem
  });
})();
