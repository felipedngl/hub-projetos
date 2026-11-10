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
      container.innerHTML = `<div class="empty-state"><h3>📄 Propostas</h3><p>Em construção.</p></div>`;
    } else if (tabId === "contratos") {
      container.innerHTML = `<div class="empty-state"><h3>✍️ Contratos</h3><p>Em construção.</p></div>`;
    }
  }

  /* ---------------------------------------------------------
     3.5. TELA DA CALCULADORA (HTML)
     --------------------------------------------------------- */
  function renderCalculadoraHTML() {
    return `
      <div class="fin-calc">
        <h2>🧮 Calculadora de Projeto</h2>
        <p class="fin-hint">Preencha os dados abaixo. O preço é calculado em tempo real.</p>

        <!-- BLOCO 1: DADOS BÁSICOS -->
        <div class="fin-card">
          <h3>1. Dados do Projeto</h3>
          
          <!-- DROPDOWN DE IMPORTAR (NOVO) -->
          <div class="fin-field" style="margin-bottom: 16px;">
            <label>Importar do Painel de Projetos (opcional)</label>
            <div style="display: flex; gap: 8px;">
              <select id="calcProjetoExistente" style="flex: 1;">
                <option value="">— Selecione um projeto existente —</option>
              </select>
              <button type="button" class="btn-primary" id="btnImportarProjeto" style="white-space: nowrap;">Importar</button>
            </div>
          </div>

          <!-- CAMPOS NORMAIS (UMA VEZ SÓ) -->
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

        
        <!-- BLOCO 2: HORAS POR ETAPA -->
        <div class="fin-card">
          <h3>2. Horas por Etapa</h3>
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

        <!-- BLOCO 3: CUSTOS EXTRAS -->
        <div class="fin-card">
          <h3>3. Custos Extras do Projeto</h3>
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

        <!-- BLOCO 4: RESULTADO -->
        <div class="fin-resultado">
          <h3>📊 Resumo do Orçamento</h3>
          <div class="fin-res-linha"><span>Horas Totais:</span> <strong id="calcHorasTotais">0h</strong></div>
          <div class="fin-res-linha"><span>Custo da Mão de Obra:</span> <strong id="calcCustoMaoObra">R$ 0,00</strong></div>
          <div class="fin-res-linha"><span>Custos Extras:</span> <strong id="calcCustosExtras">R$ 0,00</strong></div>
          <div class="fin-res-linha"><span><b>Custo Total:</b></span> <strong id="calcCustoTotal">R$ 0,00</strong></div>
          <hr style="border-color: rgba(255,255,255,0.1); margin: 8px 0;">
          <div class="fin-res-linha"><span>Preço Sugerido (com margem):</span> <strong id="calcPrecoSugerido" style="color: #2a9d8f; font-size: 1.3rem;">R$ 0,00</strong></div>
          <div class="fin-res-linha"><span>Lucro Real:</span> <strong id="calcLucro" style="color: #4CAF50;">R$ 0,00</strong></div>
        </div>

        <div class="fin-actions" style="margin-top: 20px;">
          <button type="button" class="btn-primary" id="btnGerarProposta">📄 Gerar Proposta</button>
          <span id="calcFeedback" class="fin-feedback"></span>
        </div>
      </div>
    `;
  }

  /* ---------------------------------------------------------
     3.6. LÓGICA DA CALCULADORA
     --------------------------------------------------------- */
  function ligarEventosCalculadora() {

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

    // Botão "Gerar Proposta" (por enquanto, só um alerta)
    const btnGerar = document.getElementById("btnGerarProposta");
    if (btnGerar) {
      btnGerar.addEventListener("click", () => {
        const feedback = document.getElementById("calcFeedback");
        feedback.textContent = "⚠️ A geração de proposta será implementada no próximo passo!";
        feedback.style.color = "#f59e0b";
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
      if (nome) nome.value = nomeProjeto;
      
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
        <h2>⚙️ Configuração do Escritório</h2>
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
        </div>

        <div class="fin-resultado" id="finResultado">
          <h3>📊 Resultado</h3>
          <div class="fin-res-linha"><span>Custo da sua hora:</span> <strong id="resCustoHora">—</strong></div>
          <div class="fin-res-linha"><span>Valor mínimo de venda/hora:</span> <strong id="resVendaHora">—</strong></div>
          <div class="fin-res-linha"><span>Horas faturáveis no mês:</span> <strong id="resHorasMes">—</strong></div>
        </div>

        <div class="fin-actions">
          <button type="button" class="btn-primary" id="btnSalvarConfig">💾 Salvar Configuração</button>
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
        // Remove o destaque verde do botão Financeiro
        const b = document.getElementById("btnFinanceiro");
        if (b) b.classList.remove("active");
      });
    }

    // Sub-abas
    document.querySelectorAll(".fin-tab").forEach(tab => {
      tab.addEventListener("click", () => ativarSubAba(tab.dataset.tab));
    });
  }

  // Aguarda o DOM estar pronto
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
