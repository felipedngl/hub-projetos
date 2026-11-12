/* ==========================================================
   FINANCEIRO — Menchë Interiores
   Arquivo isolado. Não mexe no script.js principal.
   ========================================================== */
(() => {
  "use strict";

  // Referências globais (Firebase já inicializado no index.html)
  const auth = window.auth;
  const db = window.db;
  const DESIGNER_EMAIL = "mencheinteriores@outlook.com";

  // Estado local
  let configAtual = null;
  let dadosProposta = null;  // ← NOVO: guarda os dados da proposta

  /* ---------------------------------------------------------
     1. NAVEGAÇÃO ENTRE VIEWS
     --------------------------------------------------------- */
  function mostrarView(id) {
    document.querySelectorAll(".view").forEach(v => v.hidden = true);
    const view = document.getElementById(id);
    if (view) view.hidden = false;

    // marca o botão ativo
    const btn = document.getElementById("btnFinanceiro");
    if (btn) btn.classList.toggle("active", id === "view-financeiro");
  }

  /* ---------------------------------------------------------
     2. SUB-ABAS DO FINANCEIRO
     --------------------------------------------------------- */
  function ativarSubAba(tabId) {
    document.querySelectorAll(".fin-tab").forEach(t => {
      t.classList.toggle("active", t.dataset.tab === tabId);
    });
    renderizarConteudo(tabId);
    
    // Muda a URL conforme a sub-aba
    const mapa = {
      calculadora: "/financeiro/orcamento",
      propostas: "/financeiro/propostas",
      config: "/financeiro/interno",
      contratos: "/financeiro/contratos"
    };
    const novaUrl = mapa[tabId] || "/financeiro";
    window.history.replaceState({}, "", novaUrl);
  }

  function renderizarConteudo(tabId) {
    const container = document.getElementById("financeiroContent");
    if (!container) return;

    if (tabId === "config") {
      container.innerHTML = renderConfigHTML();
      ligarEventosConfig();
      carregarConfigDoFirestore();
    } else if (tabId === "calculadora") {
      container.innerHTML = renderCalculadoraHTML();
      ligarEventosCalculadora();
    } else if (tabId === "propostas") {
      container.innerHTML = renderPropostaHTML();
      ligarEventosProposta();
    } else if (tabId === "contratos") {
      container.innerHTML = `<div class="empty-state"><h3>Contratos</h3><p>Em construção.</p></div>`;
    }
  }
   
  /* ---------------------------------------------------------
     3.5. TELA DA CALCULADORA (HTML)
     --------------------------------------------------------- */
  function renderCalculadoraHTML() {
    return `
      <div class="fin-calc">
        <div class="fin-calc-header">
          <div>
            <h2 class="fin-section-title">Orçamento de Projeto</h2>
            <p class="fin-hint">Preencha os dados abaixo. O preço é calculado em tempo real.</p>
          </div>
          <button type="button" class="btn-fin-limpar" id="btnLimparCalculadora">Limpar</button>
        </div>

        <!-- ========== SEÇÃO 1: DADOS DO PROJETO ========== -->
        <div class="fin-card">
          <div class="fin-accordion-header" data-accordion="dados">
            <h3>1. Dados do Projeto</h3>
            <span class="fin-accordion-toggle" data-toggle="dados">▾</span>
          </div>
          <div class="fin-accordion-body" data-body="dados">
            <div class="fin-field" style="margin-bottom: 12px;">
              <label>Importar do Painel de Projetos (opcional)</label>
              <div style="display: flex; gap: 8px;">
                <select id="calcProjetoExistente" style="flex: 1;">
                  <option value="">— Selecione um projeto existente —</option>
                </select>
                <button type="button" class="btn-primary" id="btnImportarProjeto" style="white-space: nowrap;">Importar</button>
              </div>
            </div>

            <div class="fin-grid">
              <div class="fin-field">
                <label>Nome do Projeto</label>
                <input type="text" id="calcNome" placeholder="ex: Apartamento Silva" />
              </div>
              <div class="fin-field">
                <label>Metragem (m²)</label>
                <input type="number" id="calcM2" placeholder="ex: 120" min="0" step="0.1" />
              </div>
              <div class="fin-field">
                <label>Tipo de Projeto</label>
                <select id="calcTipo">
                  <option value="interiores">Design de Interiores</option>
                  <option value="reforma">Reforma</option>
                  <option value="consultoria">Consultoria</option>
                  <option value="3d">Modelagem 3D</option>
                </select>
              </div>
              <div class="fin-field">
                <label>Complexidade</label>
                <select id="calcComplexidade">
                  <option value="1.0">Média (x1.0)</option>
                  <option value="1.15">Alta (x1.15)</option>
                  <option value="1.25">Complexa (x1.25)</option>
                  <option value="0.95">Simples (x0.95)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- ========== SEÇÃO 2: HORAS POR ETAPA ========== -->
        <div class="fin-card">
          <div class="fin-accordion-header" data-accordion="horas">
            <h3>2. Horas por Etapa</h3>
            <span class="fin-accordion-toggle" data-toggle="horas">▾</span>
          </div>
          <div class="fin-accordion-body" data-body="horas">
            <p class="fin-hint">Distribua as horas que você vai gastar em cada etapa.</p>
            <div class="fin-grid">
              <div class="fin-field">
                <label>Briefing & Alinhamento (h)</label>
                <input type="number" id="h_briefing" placeholder="ex: 4" min="0" step="1" value="4" />
              </div>
              <div class="fin-field">
                <label>Levantamento Técnico (h)</label>
                <input type="number" id="h_levantamento" placeholder="ex: 6" min="0" step="1" value="6" />
              </div>
              <div class="fin-field">
                <label>Estudo Preliminar (h)</label>
                <input type="number" id="h_estudo" placeholder="ex: 12" min="0" step="1" value="12" />
              </div>
              <div class="fin-field">
                <label>Anteprojeto (h)</label>
                <input type="number" id="h_anteprojeto" placeholder="ex: 16" min="0" step="1" value="16" />
              </div>
              <div class="fin-field">
                <label>Projeto Executivo (h)</label>
                <input type="number" id="h_executivo" placeholder="ex: 24" min="0" step="1" value="24" />
              </div>
              <div class="fin-field">
                <label>Entrega e Finalização (h)</label>
                <input type="number" id="h_entrega" placeholder="ex: 4" min="0" step="1" value="4" />
              </div>
            </div>
          </div>
        </div>

        <!-- ========== SEÇÃO 3: CUSTOS EXTRAS ========== -->
        <div class="fin-card">
          <div class="fin-accordion-header" data-accordion="custos">
            <h3>3. Custos Extras</h3>
            <span class="fin-accordion-toggle" data-toggle="custos">▾</span>
          </div>
          <div class="fin-accordion-body" data-body="custos">
            <p class="fin-hint">Deslocamento, impressão, freelancer, etc. (serão somados ao custo final).</p>
            <div class="fin-grid">
              <div class="fin-field">
                <label>Deslocamento / Visitas (R$)</label>
                <input type="number" id="c_deslocamento" placeholder="ex: 200" min="0" step="10" value="0" />
              </div>
              <div class="fin-field">
                <label>Plotagem / Impressão (R$)</label>
                <input type="number" id="c_plotagem" placeholder="ex: 150" min="0" step="10" value="0" />
              </div>
              <div class="fin-field">
                <label>Freelancer / Terceirizado (R$)</label>
                <input type="number" id="c_freelancer" placeholder="ex: 800" min="0" step="50" value="0" />
              </div>
              <div class="fin-field">
                <label>Outros Custos (R$)</label>
                <input type="number" id="c_outros" placeholder="ex: 0" min="0" step="10" value="0" />
              </div>
            </div>
          </div>
        </div>

        <!-- ========== RESULTADO ========== -->
        <div class="fin-resultado">
          <h3>Resumo do Orçamento</h3>
          <div class="fin-res-linha"><span>Horas Totais:</span> <strong id="calcHorasTotais">0h</strong></div>
          <div class="fin-res-linha"><span>Custo da Mão de Obra:</span> <strong id="calcCustoMaoObra">R$ 0,00</strong></div>
          <div class="fin-res-linha"><span>Custos Extras:</span> <strong id="calcCustosExtras">R$ 0,00</strong></div>
          <div class="fin-res-linha"><span><b>Custo Total:</b></span> <strong id="calcCustoTotal">R$ 0,00</strong></div>
          <hr style="border-color: rgba(255,255,255,0.08); margin: 10px 0;">
          <div class="fin-res-linha destaque"><span>Preço Sugerido (com margem):</span> <strong id="calcPrecoSugerido">R$ 0,00</strong></div>
          <div class="fin-res-linha"><span>Lucro Real:</span> <strong id="calcLucro">R$ 0,00</strong></div>
        </div>

        <div class="fin-actions">
          <button type="button" class="btn-primary" id="btnGerarProposta">Gerar Proposta</button>
          <span id="calcFeedback" class="fin-feedback"></span>
        </div>
      </div>
    `;
  }

/* ---------------------------------------------------------
   3.6. LÓGICA DA CALCULADORA
   --------------------------------------------------------- */
function ligarEventosCalculadora() {

    // === ACCORDIONS ===
    document.querySelectorAll(".fin-accordion-header").forEach(header => {
      header.addEventListener("click", () => {
        const key = header.dataset.accordion;
        const body = document.querySelector(`[data-body="${key}"]`);
        const toggle = document.querySelector(`[data-toggle="${key}"]`);
        if (body) body.classList.toggle("closed");
        if (toggle) toggle.classList.toggle("closed");
      });
    });
   
  // === CARREGAR PROJETOS EXISTENTES ===
  carregarProjetosNoDropdown();

  // Botão "Importar Projeto"
  const btnImportar = document.getElementById("btnImportarProjeto");
  if (btnImportar) {
    btnImportar.addEventListener("click", importarProjetoSelecionado);
  }

  // Ao digitar em qualquer campo, recalcula tudo
  const campos = [
    "calcM2", "calcComplexidade", "h_briefing", "h_levantamento",
    "h_estudo", "h_anteprojeto", "h_executivo", "h_entrega",
    "c_deslocamento", "c_plotagem", "c_freelancer", "c_outros"
  ];

  campos.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", calcularOrcamento);
  });
  const tipo = document.getElementById("calcTipo");
  if (tipo) tipo.addEventListener("change", calcularOrcamento);

  // === SALVAR AUTOMATICAMENTE AO DIGITAR ===
  const camposParaSalvar = [
    "calcNome", "calcM2", "calcTipo", "calcComplexidade",
    "h_briefing", "h_levantamento", "h_estudo", "h_anteprojeto", "h_executivo", "h_entrega",
    "c_deslocamento", "c_plotagem", "c_freelancer", "c_outros"
  ];
  camposParaSalvar.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", salvarDadosCalculadora);
      el.addEventListener("change", salvarDadosCalculadora);
    }
  });

  // === RESTAURAR DADOS AO ABRIR ===
  restaurarDadosCalculadora();

  // Botão "Gerar Proposta" → vai para a aba de Propostas
  const btnGerar = document.getElementById("btnGerarProposta");
  if (btnGerar) {
    btnGerar.addEventListener("click", () => {
      // Congela os dados da calculadora em "propostaDados"
      const dados = {
        nome: document.getElementById("calcNome")?.value || "",
        m2: document.getElementById("calcM2")?.value || "",
        cliente: document.getElementById("calcNome")?.dataset?.cliente || "",
        hBriefing: document.getElementById("h_briefing")?.value || "0",
        hLevantamento: document.getElementById("h_levantamento")?.value || "0",
        hEstudo: document.getElementById("h_estudo")?.value || "0",
        hAnteprojeto: document.getElementById("h_anteprojeto")?.value || "0",
        hExecutivo: document.getElementById("h_executivo")?.value || "0",
        hEntrega: document.getElementById("h_entrega")?.value || "0",
        cDeslocamento: document.getElementById("c_deslocamento")?.value || "0",
        cPlotagem: document.getElementById("c_plotagem")?.value || "0",
        cFreelancer: document.getElementById("c_freelancer")?.value || "0",
        cOutros: document.getElementById("c_outros")?.value || "0",
        complexidade: document.getElementById("calcComplexidade")?.value || "1.0",
        tipo: document.getElementById("calcTipo")?.value || "interiores"
      };
      sessionStorage.setItem("propostaDados", JSON.stringify(dados));
      dadosProposta = dados;  // ← NOVO: guarda em variável global

      // Troca para a aba de Propostas
      ativarSubAba("propostas");
    });
  }

  // Botão "Limpar Orçamento"
  const btnLimpar = document.getElementById("btnLimparCalculadora");
  if (btnLimpar) {
    btnLimpar.addEventListener("click", () => {
      if (confirm("Tem certeza que quer limpar todos os dados do orçamento atual?")) {
        sessionStorage.removeItem("calcDados");
        document.getElementById("calcNome").value = "";
        document.getElementById("calcM2").value = "";
        document.getElementById("calcTipo").value = "interiores";
        document.getElementById("calcComplexidade").value = "1.0";
        document.getElementById("h_briefing").value = "4";
        document.getElementById("h_levantamento").value = "6";
        document.getElementById("h_estudo").value = "12";
        document.getElementById("h_anteprojeto").value = "16";
        document.getElementById("h_executivo").value = "24";
        document.getElementById("h_entrega").value = "4";
        document.getElementById("c_deslocamento").value = "0";
        document.getElementById("c_plotagem").value = "0";
        document.getElementById("c_freelancer").value = "0";
        document.getElementById("c_outros").value = "0";
        document.getElementById("calcNome").dataset.cliente = "";
        if (typeof calcularOrcamento === "function") calcularOrcamento();
      }
    });
  }

  // Calcula ao abrir a tela
  calcularOrcamento();
}
   
  function calcularOrcamento() {
    // 1. Pega o custo/hora da configuração
    let custoHora = 73.40; // valor de fallback
    let margemPerc = 20;
    if (configAtual) {
      const r = calcularCustoHora(configAtual);
      custoHora = r.custoHora;
      margemPerc = Number(configAtual.margem) || 20;
    } else {
      // Tenta carregar do Firestore se não estiver em memória
      db.collection("config").doc("financeiro").get().then(doc => {
        if (doc.exists) {
          configAtual = doc.data();
          calcularOrcamento(); // recalcula com os dados reais
        }
      });
    }

    // 2. Horas por etapa
    const hBriefing = Number(document.getElementById("h_briefing")?.value) || 0;
    const hLevantamento = Number(document.getElementById("h_levantamento")?.value) || 0;
    const hEstudo = Number(document.getElementById("h_estudo")?.value) || 0;
    const hAnteprojeto = Number(document.getElementById("h_anteprojeto")?.value) || 0;
    const hExecutivo = Number(document.getElementById("h_executivo")?.value) || 0;
    const hEntrega = Number(document.getElementById("h_entrega")?.value) || 0;
    
    const horasTotais = hBriefing + hLevantamento + hEstudo + hAnteprojeto + hExecutivo + hEntrega;

    // 3. Complexidade
    const complexidade = Number(document.getElementById("calcComplexidade")?.value) || 1.0;

    // 4. Custos extras
    const cDeslocamento = Number(document.getElementById("c_deslocamento")?.value) || 0;
    const cPlotagem = Number(document.getElementById("c_plotagem")?.value) || 0;
    const cFreelancer = Number(document.getElementById("c_freelancer")?.value) || 0;
    const cOutros = Number(document.getElementById("c_outros")?.value) || 0;
    
    const custosExtras = cDeslocamento + cPlotagem + cFreelancer + cOutros;

    // 5. Cálculos matemáticos
    const custoMaoObra = horasTotais * custoHora * complexidade;
    const custoTotal = custoMaoObra + custosExtras;
    const precoSugerido = custoTotal * (1 + margemPerc / 100);
    const lucroReal = precoSugerido - custoTotal;

    // 6. Atualiza a tela
    document.getElementById("calcHorasTotais").textContent = `${horasTotais}h`;
    document.getElementById("calcCustoMaoObra").textContent = formatBRL(custoMaoObra);
    document.getElementById("calcCustosExtras").textContent = formatBRL(custosExtras);
    document.getElementById("calcCustoTotal").textContent = formatBRL(custoTotal);
    document.getElementById("calcPrecoSugerido").textContent = formatBRL(precoSugerido);
    document.getElementById("calcLucro").textContent = formatBRL(lucroReal);
  }

  function salvarDadosCalculadora() {
    const dados = {
      calcNome: document.getElementById("calcNome")?.value || "",
      calcM2: document.getElementById("calcM2")?.value || "",
      calcTipo: document.getElementById("calcTipo")?.value || "interiores",
      calcComplexidade: document.getElementById("calcComplexidade")?.value || "1.0",
      h_briefing: document.getElementById("h_briefing")?.value || "4",
      h_levantamento: document.getElementById("h_levantamento")?.value || "6",
      h_estudo: document.getElementById("h_estudo")?.value || "12",
      h_anteprojeto: document.getElementById("h_anteprojeto")?.value || "16",
      h_executivo: document.getElementById("h_executivo")?.value || "24",
      h_entrega: document.getElementById("h_entrega")?.value || "4",
      c_deslocamento: document.getElementById("c_deslocamento")?.value || "0",
      c_plotagem: document.getElementById("c_plotagem")?.value || "0",
      c_freelancer: document.getElementById("c_freelancer")?.value || "0",
      c_outros: document.getElementById("c_outros")?.value || "0",
      cliente: document.getElementById("calcNome")?.dataset?.cliente || ""
    };
    sessionStorage.setItem("calcDados", JSON.stringify(dados));
  }

  function restaurarDadosCalculadora() {
    const raw = sessionStorage.getItem("calcDados");
    if (!raw) return;
    try {
      const dados = JSON.parse(raw);
      // Só restaura se o dado existir (não sobrescreve com vazio)
      if (dados.calcNome !== undefined) {
        const el = document.getElementById("calcNome");
        if (el) {
          el.value = dados.calcNome;
          if (dados.cliente) el.dataset.cliente = dados.cliente;
        }
      }
      if (dados.calcM2 !== undefined) {
        const el = document.getElementById("calcM2");
        if (el) el.value = dados.calcM2;
      }
      if (dados.calcTipo !== undefined) {
        const el = document.getElementById("calcTipo");
        if (el) el.value = dados.calcTipo;
      }
      if (dados.calcComplexidade !== undefined) {
        const el = document.getElementById("calcComplexidade");
        if (el) el.value = dados.calcComplexidade;
      }
      ["h_briefing", "h_levantamento", "h_estudo", "h_anteprojeto", "h_executivo", "h_entrega",
       "c_deslocamento", "c_plotagem", "c_freelancer", "c_outros"].forEach(id => {
        if (dados[id] !== undefined) {
          const el = document.getElementById(id);
          if (el) el.value = dados[id];
        }
      });
      if (typeof calcularOrcamento === "function") calcularOrcamento();
    } catch (err) {
      console.warn("Erro ao restaurar dados da calculadora:", err);
    }
  }
       
   /* ---------------------------------------------------------
     5. TELA DE GERAR PROPOSTA (HTML)
     --------------------------------------------------------- */
  function renderPropostaHTML() {
    return `
      <div class="fin-proposta">
        <h2>Gerar Proposta</h2>
        <p class="fin-hint">Escolha o pacote, o tom e as condições. O texto é gerado automaticamente.</p>

        <!-- BLOCO 1: PACOTE E TOM -->
        <div class="fin-card">
          <h3>1. Pacote e Tom</h3>
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-dim);">Pacote</label>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <button type="button" class="pacote-btn" data-pacote="ponto">Ponto</button>
              <button type="button" class="pacote-btn active" data-pacote="trema">Trema</button>
              <button type="button" class="pacote-btn" data-pacote="reticencias">Reticências</button>
            </div>
          </div>
          <div>
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-dim);">Tom da Proposta</label>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <button type="button" class="tom-btn active" data-tom="amigavel">Amigável</button>
              <button type="button" class="tom-btn" data-tom="formal">Formal</button>
              <button type="button" class="tom-btn" data-tom="persuasivo">Persuasivo</button>
            </div>
          </div>
        </div>

        <!-- BLOCO 1.1: MODO DE CÁLCULO -->
        <div class="fin-card">
          <h3>1.5. Modo de Cálculo</h3>
          <div style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
            <button type="button" class="calculo-btn" data-calculo="fixo">Valor fixo</button>
            <button type="button" class="calculo-btn" data-calculo="metragem">Por metragem</button>
            <button type="button" class="calculo-btn active" data-calculo="hora">Por hora (orçamento)</button>
          </div>
          <div id="calculoCampos">
            <!-- Preenchido pelo JS -->
          </div>
        </div>
        
        <!-- BLOCO 2: ADICIONAIS -->
        <div class="fin-card">
          <h3>2. Adicionais (opcional)</h3>
          <div class="fin-grid">
            <div class="fin-field">
              <label>Luminotécnico (+15%)</label>
              <select id="propLuminotecnico">
                <option value="nao">Não incluir</option>
                <option value="sim">Sim, incluir</option>
              </select>
            </div>
            <div class="fin-field">
              <label>Marcenaria (valor do Cortecloud)</label>
              <input type="number" id="propMarcenaria" placeholder="ex: 1500" min="0" step="50" value="0" />
            </div>
          </div>
        </div>

        <!-- BLOCO 3: CONDIÇÕES DE PAGAMENTO -->
        <div class="fin-card">
          <h3>3. Condições de Pagamento</h3>
          <div class="fin-grid">
            <div class="fin-field">
              <label>Entrada (%)</label>
              <input type="number" id="propEntrada" value="30" min="0" max="100" step="5" />
            </div>
            <div class="fin-field">
              <label>Parcelas no saldo</label>
              <select id="propParcelas">
                <option value="1">À vista</option>
                <option value="2">2x</option>
                <option value="3">3x</option>
                <option value="4">4x</option>
                <option value="5">5x</option>
                <option value="6">6x</option>
                <option value="7">7x</option>
                <option value="8">8x</option>
                <option value="9">9x</option>
                <option value="10">10x</option>
                <option value="11">11x</option>
                <option value="12">12x</option>
              </select>
            </div>
            <div class="fin-field">
              <label>Desconto no Pix (%)</label>
              <input type="number" id="propDescontoPix" value="5" min="0" max="100" step="1" />
            </div>
          </div>
        </div>

        <!-- BLOCO 4: PRÉVIA -->
        <div class="fin-card">
          <h3>4. Prévia da Proposta</h3>
          <p class="fin-hint">O texto abaixo é gerado automaticamente. Você pode copiar e colar.</p>
          <textarea id="propTexto" rows="20" style="width:100%; font-family: inherit; font-size:0.9rem; line-height:1.5; padding:12px; border-radius:8px; border:1px solid var(--border-strong); background: var(--surface-2); color: var(--text); resize: vertical;"></textarea>
          <div class="fin-actions" style="margin-top: 16px;">
            <button type="button" class="btn-primary" id="btnCopiarProposta">Copiar</button>
            <button type="button" class="btn-primary" id="btnSalvarProposta" style="background:#2a9d8f;">Salvar Proposta</button>
            <span id="propFeedback" class="fin-feedback"></span>
          </div>
        </div>
      </div>
    `;
  }

  /* ---------------------------------------------------------
     5.1. LÓGICA DO GERADOR DE PROPOSTA
     --------------------------------------------------------- */
  function ligarEventosProposta() {
    // === CARREGA DADOS DA CALCULADORA ===
    const dadosSalvos = sessionStorage.getItem("propostaDados");
    if (dadosSalvos) {
      const d = JSON.parse(dadosSalvos);
      dadosProposta = d;  // ← NOVO: guarda em variável global
      if (document.getElementById("calcNome")) document.getElementById("calcNome").value = d.nome;
      if (document.getElementById("calcM2")) document.getElementById("calcM2").value = d.m2;
      if (document.getElementById("calcNome")) document.getElementById("calcNome").dataset.cliente = d.cliente;
      if (document.getElementById("h_briefing")) document.getElementById("h_briefing").value = d.hBriefing;
      if (document.getElementById("h_levantamento")) document.getElementById("h_levantamento").value = d.hLevantamento;
      if (document.getElementById("h_estudo")) document.getElementById("h_estudo").value = d.hEstudo;
      if (document.getElementById("h_anteprojeto")) document.getElementById("h_anteprojeto").value = d.hAnteprojeto;
      if (document.getElementById("h_executivo")) document.getElementById("h_executivo").value = d.hExecutivo;
      if (document.getElementById("h_entrega")) document.getElementById("h_entrega").value = d.hEntrega;
      if (document.getElementById("c_deslocamento")) document.getElementById("c_deslocamento").value = d.cDeslocamento;
      if (document.getElementById("c_plotagem")) document.getElementById("c_plotagem").value = d.cPlotagem;
      if (document.getElementById("c_freelancer")) document.getElementById("c_freelancer").value = d.cFreelancer;
      if (document.getElementById("c_outros")) document.getElementById("c_outros").value = d.cOutros;
      if (document.getElementById("calcComplexidade")) document.getElementById("calcComplexidade").value = d.complexidade;
      if (document.getElementById("calcTipo")) document.getElementById("calcTipo").value = d.tipo;

      // 🔍 DEBUG: verifica se os dados foram restaurados
      console.log("[DEBUG] Dados restaurados:", {
        nome: document.getElementById("calcNome")?.value,
        m2: document.getElementById("calcM2")?.value,
        cliente: document.getElementById("calcNome")?.dataset?.cliente
      });

      // Chama o texto DEPOIS de um pequeno delay (para garantir que o DOM está pronto)
      setTimeout(() => {
        atualizarTextoProposta();
      }, 50);
    } else {
      console.warn("[DEBUG] Nenhum dado em propostaDados");
    }

    // === PACOTE (BOTÕES) ===
    let pacoteAtual = "trema";
    const botoesPacote = document.querySelectorAll(".pacote-btn");
    botoesPacote.forEach(btn => {
      btn.addEventListener("click", () => {
        botoesPacote.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        pacoteAtual = btn.dataset.pacote;
        atualizarTextoProposta();
      });
    });

    // === TOM (BOTÕES) ===
    let tomAtual = "amigavel";
    const botoesTom = document.querySelectorAll(".tom-btn");
    botoesTom.forEach(btn => {
      btn.addEventListener("click", () => {
        botoesTom.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        tomAtual = btn.dataset.tom;
        atualizarTextoProposta();
      });
    });

    // === MODO DE CÁLCULO (BOTÕES) ===
    let calculoAtual = "hora";
    const botoesCalculo = document.querySelectorAll(".calculo-btn");
    botoesCalculo.forEach(btn => {
      btn.addEventListener("click", () => {
        botoesCalculo.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        calculoAtual = btn.dataset.calculo;
        renderizarCamposCalculo(calculoAtual);
        atualizarTextoProposta();
      });
    });

    function renderizarCamposCalculo(calculo) {
      const container = document.getElementById("calculoCampos");
      if (!container) return;
      
      if (calculo === "fixo") {
        container.innerHTML = `
          <div class="fin-field">
            <label>Valor fixo (R$)</label>
            <input type="number" id="calculoValorFixo" value="400" min="0" step="50" />
          </div>
        `;
        document.getElementById("calculoValorFixo")?.addEventListener("input", atualizarTextoProposta);
      } else if (calculo === "metragem") {
        container.innerHTML = `
          <div class="fin-field">
            <label>Valor por m² (R$)</label>
            <input type="number" id="calculoValorM2" value="50" min="0" step="10" />
          </div>
        `;
        document.getElementById("calculoValorM2")?.addEventListener("input", atualizarTextoProposta);
      } else if (calculo === "hora") {
        container.innerHTML = `
          <p class="fin-hint">Valor calculado automaticamente com base no orçamento (horas × custo/hora + extras, com margem).</p>
        `;
      }
    }
    renderizarCamposCalculo("hora");

    // Botão Copiar
    const btnCopiar = document.getElementById("btnCopiarProposta");
    if (btnCopiar) {
      btnCopiar.addEventListener("click", () => {
        const texto = document.getElementById("propTexto")?.value || "";
        navigator.clipboard.writeText(texto).then(() => {
          const fb = document.getElementById("propFeedback");
          fb.textContent = "✓ Texto copiado.";
          fb.style.color = "#4CAF50";
          setTimeout(() => { fb.textContent = ""; }, 3000);
        });
      });
    }

    // Botão Salvar Proposta
    const btnSalvar = document.getElementById("btnSalvarProposta");
    if (btnSalvar) {
      btnSalvar.addEventListener("click", salvarProposta);
    }

    // Ao mudar pacote, tom, luminotécnico, parcelas ou entrada, recalcula o texto
    ["propPacote", "propTom", "propLuminotecnico", "propParcelas", "propEntrada", "propDescontoPix", "propMarcenaria"]
      .forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("change", atualizarTextoProposta);
        if (el && el.type === "number") el.addEventListener("input", atualizarTextoProposta);
      });

    // Calcula o texto ao abrir
    atualizarTextoProposta();
  }

  function atualizarTextoProposta() {
    const pacote = document.querySelector(".pacote-btn.active")?.dataset.pacote || "trema";
    const tom = document.querySelector(".tom-btn.active")?.dataset.tom || "amigavel";
    const luminotecnico = document.getElementById("propLuminotecnico")?.value === "sim";
    const marcenariaValor = Number(document.getElementById("propMarcenaria")?.value) || 0;
    const entradaPerc = Number(document.getElementById("propEntrada")?.value) || 30;
    const parcelas = Number(document.getElementById("propParcelas")?.value) || 6;
    const descontoPix = Number(document.getElementById("propDescontoPix")?.value) || 5;

    // Usa os dados da variável global (ou do sessionStorage como fallback)
    let nomeProjeto = "[Projeto]";
    let metragem = 0;
    let cliente = "[Cliente]";
    
    if (dadosProposta) {
      nomeProjeto = dadosProposta.nome || "[Projeto]";
      metragem = Number(dadosProposta.m2) || 0;
      cliente = dadosProposta.cliente || "[Cliente]";
    } else {
      // Fallback: tenta do DOM (se estiver na aba calculadora)
      nomeProjeto = document.getElementById("calcNome")?.value || "[Projeto]";
      metragem = Number(document.getElementById("calcM2")?.value) || 0;
      cliente = document.getElementById("calcNome")?.dataset?.cliente || "[Cliente]";
    }

    const custoHora = configAtual ? calcularCustoHora(configAtual).custoHora : 64;
    const margemPerc = configAtual ? (Number(configAtual.margem) || 20) : 20;

    // Usa os dados da variável global (ou do DOM como fallback)
    const hBriefing = Number(dadosProposta?.hBriefing || document.getElementById("h_briefing")?.value) || 0;
    const hLevantamento = Number(dadosProposta?.hLevantamento || document.getElementById("h_levantamento")?.value) || 0;
    const hEstudo = Number(dadosProposta?.hEstudo || document.getElementById("h_estudo")?.value) || 0;
    const hAnteprojeto = Number(dadosProposta?.hAnteprojeto || document.getElementById("h_anteprojeto")?.value) || 0;
    const hExecutivo = Number(dadosProposta?.hExecutivo || document.getElementById("h_executivo")?.value) || 0;
    const hEntrega = Number(dadosProposta?.hEntrega || document.getElementById("h_entrega")?.value) || 0;
    const horasTotais = hBriefing + hLevantamento + hEstudo + hAnteprojeto + hExecutivo + hEntrega;

    const cDeslocamento = Number(dadosProposta?.cDeslocamento || document.getElementById("c_deslocamento")?.value) || 0;
    const cPlotagem = Number(dadosProposta?.cPlotagem || document.getElementById("c_plotagem")?.value) || 0;
    const cFreelancer = Number(dadosProposta?.cFreelancer || document.getElementById("c_freelancer")?.value) || 0;
    const cOutros = Number(dadosProposta?.cOutros || document.getElementById("c_outros")?.value) || 0;
    const custosExtras = cDeslocamento + cPlotagem + cFreelancer + cOutros;

    const custoMaoObra = horasTotais * custoHora;
    const custoTotal = custoMaoObra + custosExtras;
    let precoBase = custoTotal * (1 + margemPerc / 100);

    // Verifica qual modo de cálculo está ativo
    const calculoAtivo = document.querySelector(".calculo-btn.active")?.dataset.calculo || "hora";
    
    if (calculoAtivo === "fixo") {
      const valorFixo = Number(document.getElementById("calculoValorFixo")?.value) || 400;
      precoBase = valorFixo;
    } else if (calculoAtivo === "metragem") {
      const valorM2 = Number(document.getElementById("calculoValorM2")?.value) || 50;
      precoBase = metragem * valorM2;
    } else if (calculoAtivo === "hora") {
      // Usa o valor do orçamento
      if (custoTotal > 0) {
        precoBase = custoTotal * (1 + margemPerc / 100);
      } else {
        // Fallback
        const adicionalMetragem = metragem > 25 ? (metragem - 25) * 50 : 0;
        precoBase = 1500 + adicionalMetragem;
      }
    }
    // Adicionais
    let adicionais = 0;
    if (luminotecnico) adicionais += precoBase * 0.15;
    adicionais += marcenariaValor;
    const precoFinal = precoBase + adicionais;

    // === SUGESTÃO AUTOMÁTICA DE PARCELAS (COM MÍNIMO POR PARCELA) ===
    const selectParcelas = document.getElementById("propParcelas");
    // Puxa o mínimo da configuração, se existir (senão, usa 200)
    const VALOR_MINIMO_PARCELA = (configAtual && configAtual.minParcela) ? Number(configAtual.minParcela) : 200;
    
    if (selectParcelas && !selectParcelas.dataset.manual) {
      const saldoParaParcelar = precoFinal * (1 - entradaPerc / 100);
      let parcelasSugeridas = Math.floor(saldoParaParcelar / VALOR_MINIMO_PARCELA);
      if (parcelasSugeridas < 1) parcelasSugeridas = 1;
      if (parcelasSugeridas > 12) parcelasSugeridas = 12;
      selectParcelas.value = String(parcelasSugeridas);
    }
    if (selectParcelas) {
      selectParcelas.addEventListener("change", () => {
        selectParcelas.dataset.manual = "true";
      });
    }

    // Condições de pagamento
    const valorEntrada = precoFinal * (entradaPerc / 100);
    const valorSaldo = precoFinal - valorEntrada;
    const parcelasAtual = Number(selectParcelas?.value) || parcelas;
    const valorParcela = valorSaldo / parcelasAtual;
    const valorPix = precoFinal * (1 - descontoPix / 100);

    // Textos baseados em PACOTE + TOM
    let texto = "";
    const nomeEscritorio = "Menchë Interiores";

    // --- TEXTO PONTO ---
    if (pacote === "ponto") {
      if (tom === "amigavel") {
        texto = `Oi, ${cliente}! Tudo bem?

Analisei o que você me contou sobre o ${nomeProjeto} e preparei a Consultoria Ponto, ideal para quem quer clareza antes de começar.

O QUE INCLUI:
• 1 videochamada de 1h (diagnóstico do espaço)
• Plano de Ação em PDF (o que fazer, em que ordem)
• Paleta de cores sugerida
• Mapa do que fica (o que manter, adaptar, trocar)
• Suporte por 7 dias no WhatsApp

VALOR: ${formatBRL(precoFinal)}

CONDIÇÕES:
Entrada: ${formatBRL(valorEntrada)} (${entradaPerc}%)
Saldo: ${parcelasAtual}x de ${formatBRL(valorParcela)}
Ou ${formatBRL(valorPix)} no Pix (${descontoPix}% de desconto)

Se fizer sentido, me chama que a gente marca a videochamada.

${nomeEscritorio}`;
      } else if (tom === "formal") {
        texto = `Prezado(a) ${cliente},

Segue a proposta para a Consultoria Ponto, referente ao projeto ${nomeProjeto}.

ESCOPO:
- 1 videochamada de 1h (diagnóstico)
- Plano de Ação em PDF
- Paleta de cores sugerida
- Mapa do que fica (manter/adaptar/trocar)
- Suporte por 7 dias no WhatsApp

VALOR TOTAL: ${formatBRL(precoFinal)}

CONDIÇÕES DE PAGAMENTO:
- Entrada: ${formatBRL(valorEntrada)} (${entradaPerc}%)
- Saldo: ${parcelasAtual} parcelas de ${formatBRL(valorParcela)}
- Pagamento à vista no Pix: ${formatBRL(valorPix)} (${descontoPix}% de desconto)

Atenciosamente,
${nomeEscritorio}`;
      } else {
        texto = `${cliente}, analisei tudo que você me passou sobre o ${nomeProjeto}.

Antes do valor, deixa eu te mostrar por que a Consultoria Ponto é o melhor primeiro passo:

Muitas pessoas começam a reformar sem saber por onde. Compram o móvel errado, escolhem a cor errada, gastam com o que não precisava. A Consultoria Ponto existe para você não cometer esses erros.

O QUE VOCÊ RECEBE:
• Diagnóstico completo do espaço
• Plano de Ação em PDF (o passo a passo do que fazer)
• Paleta de cores
• Mapa do que fica (o que manter, adaptar, trocar)
• Suporte por 7 dias

VALOR: ${formatBRL(precoFinal)}

CONDIÇÕES:
Entrada: ${formatBRL(valorEntrada)} (${entradaPerc}%)
Saldo: ${parcelasAtual}x de ${formatBRL(valorParcela)}
Ou ${formatBRL(valorPix)} no Pix (${descontoPix}% de desconto)

Tenho 2 vagas para esta semana. Se fecharmos agora, você já começa a clarear o projeto.

Qualquer dúvida, me chama.

${nomeEscritorio}`;
      }
    }

    // --- TEXTO TREMA ---
    else if (pacote === "trema") {
      if (tom === "amigavel") {
        texto = `Oi, ${cliente}! Tudo bem?

Analisei tudo que você me passou sobre o ${nomeProjeto} (${metragem}m²) e preparei o Trema, o projeto ideal para transformar 1 ambiente.

O QUE INCLUI:
• Briefing e Levantamento
• Estudo Preliminar (layout)
• Anteprojeto (materiais + 1 render 3D)
• Projeto Executivo (planta técnica)
• Entrega (PDF final + guia de execução)
• Suporte por 10 dias

VALOR: ${formatBRL(precoFinal)}
${adicionais > 0 ? `(inclui ${luminotecnico ? "Luminotécnico +15%" : ""} ${marcenariaValor > 0 ? `+ Marcenaria ${formatBRL(marcenariaValor)}` : ""})` : ""}

CONDIÇÕES:
Entrada: ${formatBRL(valorEntrada)} (${entradaPerc}%)
Saldo: ${parcelasAtual}x de ${formatBRL(valorParcela)}
Ou ${formatBRL(valorPix)} no Pix (${descontoPix}% de desconto)

Vamos transformar esse ambiente?

${nomeEscritorio}`;
      } else if (tom === "formal") {
        texto = `Prezado(a) ${cliente},

Segue a proposta para o projeto ${nomeProjeto} (${metragem}m²), no pacote Trema (1 ambiente).

ESCOPO:
- Briefing e Levantamento
- Estudo Preliminar (layout)
- Anteprojeto (materiais + 1 render 3D)
- Projeto Executivo (planta técnica)
- Entrega (PDF final + guia)
- Suporte por 10 dias

VALOR TOTAL: ${formatBRL(precoFinal)}
${adicionais > 0 ? `Adicionais: ${luminotecnico ? "Luminotécnico (+15%)" : ""} ${marcenariaValor > 0 ? `+ Marcenaria (${formatBRL(marcenariaValor)})` : ""}` : ""}

CONDIÇÕES DE PAGAMENTO:
- Entrada: ${formatBRL(valorEntrada)} (${entradaPerc}%)
- Saldo: ${parcelasAtual} parcelas de ${formatBRL(valorParcela)}
- Pagamento à vista no Pix: ${formatBRL(valorPix)} (${descontoPix}% de desconto)

Atenciosamente,
${nomeEscritorio}`;
      } else {
        texto = `${cliente}, analisei tudo que você me passou sobre transformar o ${nomeProjeto} (${metragem}m²).

Antes do valor, preciso te mostrar uma coisa:

Cada centímetro mal planejado é um móvel que não encaixa, uma porta que atrapalha, um ambiente que sufoca. Projetos compactos exigem mais inteligência, não menos.

É por isso que o Trema é o pacote ideal para o seu caso:

O QUE VOCÊ RECEBE:
• Briefing e Levantamento
• Estudo Preliminar (layout)
• Anteprojeto (materiais + 1 render 3D)
• Projeto Executivo (planta técnica)
• Entrega (PDF final + guia)
• Suporte por 10 dias

VALOR: ${formatBRL(precoFinal)}
${adicionais > 0 ? `(inclui ${luminotecnico ? "luminotécnico" : ""} ${marcenariaValor > 0 ? `e marcenaria` : ""})` : ""}

CONDIÇÕES:
Entrada: ${formatBRL(valorEntrada)} (${entradaPerc}%)
Saldo: ${parcelasAtual}x de ${formatBRL(valorParcela)}
Ou ${formatBRL(valorPix)} no Pix (${descontoPix}% de desconto)

Tenho 2 vagas para começar nesta semana. Se fecharmos agora, seu ambiente fica pronto no prazo.

Qualquer dúvida, me chama.

${nomeEscritorio}`;
      }
    }

    // --- TEXTO RETICÊNCIAS ---
    else if (pacote === "reticencias") {
      if (tom === "amigavel") {
        texto = `Oi, ${cliente}! Tudo bem?

Analisei tudo que você me passou sobre o ${nomeProjeto} (${metragem}m²) e preparei o Reticências, o projeto completo para a casa toda.

O QUE INCLUI:
• Todos os ambientes
• Briefing, Levantamento, Estudo, Anteprojeto
• 3 a 5 renders 3D (dependendo do tamanho)
• Projeto Executivo completo
• Memorial Descritivo (lista de compras)
• Cronograma de Obra
• Acompanhamento de obra
• Suporte por 30 dias

VALOR: ${formatBRL(precoFinal)}
${adicionais > 0 ? `(inclui ${luminotecnico ? "Luminotécnico +15%" : ""} ${marcenariaValor > 0 ? `+ Marcenaria ${formatBRL(marcenariaValor)}` : ""})` : ""}

CONDIÇÕES:
Entrada: ${formatBRL(valorEntrada)} (${entradaPerc}%)
Saldo: ${parcelasAtual}x de ${formatBRL(valorParcela)}
Ou ${formatBRL(valorPix)} no Pix (${descontoPix}% de desconto)

Vamos transformar a casa toda?

${nomeEscritorio}`;
      } else if (tom === "formal") {
        texto = `Prezado(a) ${cliente},

Segue a proposta para o projeto ${nomeProjeto} (${metragem}m²), no pacote Reticências (casa toda).

ESCOPO:
- Todos os ambientes
- Briefing, Levantamento, Estudo, Anteprojeto
- 3 a 5 renders 3D
- Projeto Executivo completo
- Memorial Descritivo
- Cronograma de Obra
- Acompanhamento de obra
- Suporte por 30 dias

VALOR TOTAL: ${formatBRL(precoFinal)}
${adicionais > 0 ? `Adicionais: ${luminotecnico ? "Luminotécnico (+15%)" : ""} ${marcenariaValor > 0 ? `+ Marcenaria (${formatBRL(marcenariaValor)})` : ""}` : ""}

CONDIÇÕES DE PAGAMENTO:
- Entrada: ${formatBRL(valorEntrada)} (${entradaPerc}%)
- Saldo: ${parcelasAtual} parcelas de ${formatBRL(valorParcela)}
- Pagamento à vista no Pix: ${formatBRL(valorPix)} (${descontoPix}% de desconto)

Atenciosamente,
${nomeEscritorio}`;
      } else {
        texto = `${cliente}, analisei tudo que você me passou sobre o ${nomeProjeto} (${metragem}m²).

Antes do valor, deixa eu te mostrar por que o Reticências é o pacote que resolve de verdade:

Projetar a casa toda não é só desenhar cada ambiente separado. É fazer tudo conversar: a luz da sala com o piso do quarto, o armário da cozinha com a circulação. É por isso que o Reticências existe:

O QUE VOCÊ RECEBE:
• Todos os ambientes
• Briefing, Levantamento, Estudo, Anteprojeto
• 3 a 5 renders 3D
• Projeto Executivo completo
• Memorial Descritivo (lista de compras)
• Cronograma de Obra
• Acompanhamento de obra
• Suporte por 30 dias

VALOR: ${formatBRL(precoFinal)}
${adicionais > 0 ? `(inclui ${luminotecnico ? "luminotécnico" : ""} ${marcenariaValor > 0 ? `e marcenaria` : ""})` : ""}

CONDIÇÕES:
Entrada: ${formatBRL(valorEntrada)} (${entradaPerc}%)
Saldo: ${parcelasAtual}x de ${formatBRL(valorParcela)}
Ou ${formatBRL(valorPix)} no Pix (${descontoPix}% de desconto)

Tenho 2 vagas para começar nesta semana. Se fecharmos agora, sua casa fica pronta no prazo.

Qualquer dúvida, me chama.

${nomeEscritorio}`;
      }
    }

    // Atualiza o textarea
    const textarea = document.getElementById("propTexto");
    if (textarea) textarea.value = texto;
  }       

  async function salvarProposta() {
    const feedback = document.getElementById("propFeedback");
    const user = auth?.currentUser;

    if (!user || user.email !== DESIGNER_EMAIL) {
      if (feedback) {
        feedback.textContent = "⚠️ Faça login como designer.";
        feedback.style.color = "#f59e0b";
      }
      return;
    }

    const pacote = document.getElementById("propPacote")?.value || "trema";
    const tom = document.getElementById("propTom")?.value || "amigavel";
    const texto = document.getElementById("propTexto")?.value || "";
    const nomeProjeto = document.getElementById("calcNome")?.value || "[Projeto]";
    const cliente = document.getElementById("calcNome")?.dataset?.cliente || "";

    if (!texto.trim()) {
      if (feedback) {
        feedback.textContent = "⚠️ Gere o texto antes de salvar.";
        feedback.style.color = "#f59e0b";
      }
      return;
    }

    if (feedback) {
      feedback.textContent = "Salvando...";
      feedback.style.color = "#aaa";
    }

    try {
      await db.collection("propostas").add({
        projeto: nomeProjeto,
        cliente: cliente,
        pacote: pacote,
        tom: tom,
        texto: texto,
        status: "rascunho",
        criadoEm: new Date().toISOString(),
        designer: user.email
      });
      if (feedback) {
        feedback.textContent = "✓ Proposta salva!";
        feedback.style.color = "#4CAF50";
      }
      setTimeout(() => { if (feedback) feedback.textContent = ""; }, 3000);
    } catch (err) {
      console.error("Erro ao salvar proposta:", err);
      if (feedback) {
        feedback.textContent = "❌ Erro ao salvar: " + (err.message || "desconhecido");
        feedback.style.color = "#ef4444";
      }
    }
  }
   
  /* ---------------------------------------------------------
     3.7. INTEGRAÇÃO COM O PAINEL DE PROJETOS
     --------------------------------------------------------- */
  async function carregarProjetosNoDropdown() {
    const select = document.getElementById("calcProjetoExistente");
    if (!select) return;

    try {
      const snapshot = await db.collection("projects").get();
      select.innerHTML = '<option value="">— Selecione um projeto existente —</option>';
      
      const lista = [];
      snapshot.forEach(doc => {
        lista.push({ id: doc.id, ...doc.data() });
      });
      
      // Ordena alfabeticamente pelo título
      lista.sort((a, b) => {
        const nomeA = String(a.title || a.name || a.nome || "").toLowerCase();
        const nomeB = String(b.title || b.name || b.nome || "").toLowerCase();
        return nomeA.localeCompare(nomeB);
      });

      // Preenche o dropdown
      lista.forEach(p => {
        const nomeProjeto = p.title || p.name || p.nome || "Sem nome";
        const cliente = p.client || p.cliente || "Sem cliente";
        const area = p.area || p.m2 || p.metragem || 0;
        
        const opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = `${nomeProjeto} — ${cliente} (${area}m²)`;
        select.appendChild(opt);
      });
    } catch (err) {
      console.warn("Erro ao carregar projetos:", err);
    }
  }

  async function importarProjetoSelecionado() {
    const select = document.getElementById("calcProjetoExistente");
    const feedback = document.getElementById("calcFeedback");
    const id = select?.value;
    if (!id) {
      if (feedback) { feedback.textContent = "Selecione um projeto primeiro."; feedback.style.color = "#f59e0b"; }
      return;
    }

    try {
      const doc = await db.collection("projects").doc(id).get();
      if (!doc.exists) return;
      const p = doc.data();

      // === NOME: procura em title, depois name, depois nome ===
      const nomeProjeto = p.title || p.name || p.nome || p.projectName || p.titulo || "";
      const nome = document.getElementById("calcNome");
      if (nome) {
        nome.value = nomeProjeto;
        nome.dataset.cliente = p.client || p.cliente || "";
      }
      
      // === METRAGEM ===
      const metragem = p.area || p.m2 || p.metragem || p.areaTotal || 0;
      const m2 = document.getElementById("calcM2");
      if (m2) m2.value = metragem;

      // === TIPO ===
      const tipo = document.getElementById("calcTipo");
      if (tipo && p.type) {
        tipo.value = p.type === "comercial" ? "interiores" : "interiores";
      }

      if (feedback) {
        feedback.textContent = `✓ Projeto "${nomeProjeto || "Sem nome"}" importado!`;
        feedback.style.color = "#4CAF50";
      }

      calcularOrcamento();
    } catch (err) {
      console.error(err);
      if (feedback) { feedback.textContent = "Erro ao importar."; feedback.style.color = "#ef4444"; }
    }
  }
   
  /* ---------------------------------------------------------
     3. TELA DE CONFIGURAÇÃO (HTML)
     --------------------------------------------------------- */
  function renderConfigHTML() {
    return `
      <div class="fin-config">
        <h2>Configuração do Escritório</h2>
        <p class="fin-hint">Preencha uma vez. O sistema calcula o custo da sua hora automaticamente.</p>

        <div class="fin-grid">
          <div class="fin-field">
            <label>Salário mensal desejado (R$)</label>
            <input type="number" id="cfgSalario" placeholder="ex: 5000" min="0" step="100" />
          </div>

          <div class="fin-field">
            <label>Custos fixos mensais (R$)</label>
            <input type="number" id="cfgFixos" placeholder="ex: 3000" min="0" step="100" />
          </div>

          <div class="fin-field">
            <label>Custos variáveis mensais (R$)</label>
            <input type="number" id="cfgVariaveis" placeholder="ex: 500" min="0" step="50" />
          </div>

          <div class="fin-field">
            <label>Imposto / Reserva fiscal (%)</label>
            <input type="number" id="cfgImposto" placeholder="ex: 6" min="0" max="100" step="0.5" />
          </div>

          <div class="fin-field">
            <label>Horas por dia</label>
            <input type="number" id="cfgHorasDia" placeholder="ex: 8" min="1" max="24" />
          </div>

          <div class="fin-field">
            <label>Dias úteis por mês</label>
            <input type="number" id="cfgDiasMes" placeholder="ex: 22" min="1" max="31" />
          </div>

          <div class="fin-field">
            <label>% de horas não faturáveis (reuniões, admin)</label>
            <input type="number" id="cfgNaoFaturavel" placeholder="ex: 30" min="0" max="100" />
          </div>

          <div class="fin-field">
            <label>Margem de lucro desejada (%)</label>
            <input type="number" id="cfgMargem" placeholder="ex: 20" min="0" max="200" />
          </div>

          <!-- NOVO CAMPO: VALOR MÍNIMO POR PARCELA -->
          <div class="fin-field">
            <label>Valor mínimo por parcela (R$)</label>
            <input type="number" id="cfgMinParcela" placeholder="ex: 200" min="0" step="50" />
          </div>
        </div>

        <div class="fin-resultado" id="finResultado">
          <h3>Resultado</h3>
          <div class="fin-res-linha"><span>Custo da sua hora:</span> <strong id="resCustoHora">—</strong></div>
          <div class="fin-res-linha"><span>Valor mínimo de venda/hora:</span> <strong id="resVendaHora">—</strong></div>
          <div class="fin-res-linha"><span>Horas faturáveis no mês:</span> <strong id="resHorasMes">—</strong></div>
        </div>

        <div class="fin-actions">
          <button type="button" class="btn-primary" id="btnSalvarConfig">Salvar Configuração</button>
          <span id="cfgFeedback" class="fin-feedback"></span>
        </div>
      </div>
    `;
  }

  /* ---------------------------------------------------------
     4. CÁLCULO DO CUSTO/HORA
     --------------------------------------------------------- */
  function calcularCustoHora(dados) {
    const salario = Number(dados.salario) || 0;
    const fixos = Number(dados.fixos) || 0;
    const variaveis = Number(dados.variaveis) || 0;
    const impostoPerc = Number(dados.imposto) || 0;
    const horasDia = Number(dados.horasDia) || 1;
    const diasMes = Number(dados.diasMes) || 1;
    const naoFaturavel = Number(dados.naoFaturavel) || 0;
    const margem = Number(dados.margem) || 0;

    const custoMensal = salario + fixos + variaveis;
    const custoComImposto = impostoPerc > 0 ? custoMensal / (1 - impostoPerc / 100) : custoMensal;
    const horasProdutivas = horasDia * diasMes * (1 - naoFaturavel / 100);
    const custoHora = horasProdutivas > 0 ? custoComImposto / horasProdutivas : 0;
    const vendaHora = custoHora * (1 + margem / 100);

    return { custoHora, vendaHora, horasProdutivas };
  }

  function atualizarResultado() {
    const dados = {
      salario: document.getElementById("cfgSalario")?.value,
      fixos: document.getElementById("cfgFixos")?.value,
      variaveis: document.getElementById("cfgVariaveis")?.value,
      imposto: document.getElementById("cfgImposto")?.value,
      horasDia: document.getElementById("cfgHorasDia")?.value,
      diasMes: document.getElementById("cfgDiasMes")?.value,
      naoFaturavel: document.getElementById("cfgNaoFaturavel")?.value,
      margem: document.getElementById("cfgMargem")?.value,
    };
    const r = calcularCustoHora(dados);

    document.getElementById("resCustoHora").textContent = formatBRL(r.custoHora);
    document.getElementById("resVendaHora").textContent = formatBRL(r.vendaHora);
    document.getElementById("resHorasMes").textContent = `${r.horasProdutivas.toFixed(0)}h`;
  }

  function formatBRL(v) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
  }

  /* ---------------------------------------------------------
     5. SALVAR / CARREGAR DO FIRESTORE
     --------------------------------------------------------- */
  async function salvarConfig() {
    const feedback = document.getElementById("cfgFeedback");
    const user = auth?.currentUser;

    if (!user || user.email !== DESIGNER_EMAIL) {
      feedback.textContent = "⚠️ Faça login como designer.";
      feedback.style.color = "#f59e0b";
      return;
    }

    const dados = {
      salario: Number(document.getElementById("cfgSalario").value) || 0,
      fixos: Number(document.getElementById("cfgFixos").value) || 0,
      variaveis: Number(document.getElementById("cfgVariaveis").value) || 0,
      imposto: Number(document.getElementById("cfgImposto").value) || 0,
      horasDia: Number(document.getElementById("cfgHorasDia").value) || 8,
      diasMes: Number(document.getElementById("cfgDiasMes").value) || 22,
      naoFaturavel: Number(document.getElementById("cfgNaoFaturavel").value) || 30,
      margem: Number(document.getElementById("cfgMargem").value) || 20,
      minParcela: Number(document.getElementById("cfgMinParcela").value) || 200,
      atualizadoEm: new Date().toISOString(),
    };

    try {
      await db.collection("config").doc("financeiro").set(dados, { merge: true });
      feedback.textContent = "✓ Configuração salva!";
      feedback.style.color = "#4CAF50";
      configAtual = dados;
    } catch (err) {
      console.error(err);
      feedback.textContent = "❌ Erro ao salvar.";
      feedback.style.color = "#ef4444";
    }
  }

  async function carregarConfigDoFirestore() {
    try {
      const doc = await db.collection("config").doc("financeiro").get();
      if (doc.exists) {
        const d = doc.data();
        configAtual = d;
        if (document.getElementById("cfgSalario")) {
          document.getElementById("cfgSalario").value = d.salario || "";
          document.getElementById("cfgFixos").value = d.fixos || "";
          document.getElementById("cfgVariaveis").value = d.variaveis || "";
          document.getElementById("cfgImposto").value = d.imposto || "";
          document.getElementById("cfgHorasDia").value = d.horasDia || "";
          document.getElementById("cfgDiasMes").value = d.diasMes || "";
          document.getElementById("cfgNaoFaturavel").value = d.naoFaturavel || "";
          document.getElementById("cfgMargem").value = d.margem || "";
          document.getElementById("cfgMinParcela").value = d.minParcela || 200;
          atualizarResultado();
        }
      }
    } catch (err) {
      console.warn("Aviso ao carregar config (pode ser normal no primeiro acesso):", err);
    }
  }

  function ligarEventosConfig() {
    // Atualiza resultado em tempo real ao digitar
    ["cfgSalario", "cfgFixos", "cfgVariaveis", "cfgImposto", "cfgHorasDia", "cfgDiasMes", "cfgNaoFaturavel", "cfgMargem"]
      .forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("input", atualizarResultado);
      });

    const btnSalvar = document.getElementById("btnSalvarConfig");
    if (btnSalvar) btnSalvar.addEventListener("click", salvarConfig);
  }

  /* ---------------------------------------------------------
     6. INICIALIZAÇÃO
     --------------------------------------------------------- */
  function init() {
    // Botão do header (Financeiro)
    const btnFin = document.getElementById("btnFinanceiro");
    if (btnFin) {
      btnFin.addEventListener("click", () => {
        mostrarView("view-financeiro");
        ativarSubAba("calculadora");
      });
    }

    // Botão Voltar ao Painel (dentro do financeiro)
    const btnVoltar = document.getElementById("btnVoltarPainel");
    if (btnVoltar) {
      btnVoltar.addEventListener("click", () => {
        mostrarView("view-dashboard");
        const b = document.getElementById("btnFinanceiro");
        if (b) b.classList.remove("active");
        window.history.replaceState({}, "", "/painel");
      });
    }

    // Sub-abas
    document.querySelectorAll(".fin-tab").forEach(tab => {
      tab.addEventListener("click", () => ativarSubAba(tab.dataset.tab));
    });

    // === LÊ A URL PARA ABRIR A ABA CORRETA ===
    const pathParts = window.location.pathname.split("/").filter(Boolean);
    const isFinanceiroPath = pathParts[0] === "financeiro";
    const subAba = pathParts[1] || "";

    if (isFinanceiroPath) {
      const mapa = {
        orcamento: "calculadora",
        propostas: "propostas",
        interno: "config",
        contratos: "contratos"
      };
      const tabId = mapa[subAba] || "calculadora";
      mostrarView("view-financeiro");
      ativarSubAba(tabId);
    }
  }

  // Expõe a função para o script.js chamar quando a URL for /financeiro
  window.financeiroInit = function() {
    mostrarView("view-financeiro");

    const pathParts = window.location.pathname.split("/").filter(Boolean);
    const subAba = pathParts[1] || "";
    const mapa = {
      orcamento: "calculadora",
      propostas: "propostas",
      interno: "config",
      contratos: "contratos"
    };
    const tabId = mapa[subAba] || "calculadora";
    ativarSubAba(tabId);
  };

  // Aguarda o DOM estar pronto
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
   
})();
