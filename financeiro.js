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
      container.innerHTML = `<div class="empty-state"><h3>🧮 Calculadora</h3><p>Em construção (próximo pedaço).</p></div>`;
    } else if (tabId === "propostas") {
      container.innerHTML = `<div class="empty-state"><h3>📄 Propostas</h3><p>Em construção.</p></div>`;
    } else if (tabId === "contratos") {
      container.innerHTML = `<div class="empty-state"><h3>✍️ Contratos</h3><p>Em construção.</p></div>`;
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
    // Botão do header
    const btnFin = document.getElementById("btnFinanceiro");
    if (btnFin) {
      btnFin.addEventListener("click", () => {
        mostrarView("view-financeiro");
        ativarSubAba("config");
      });
    }

    // Sub-abas
    document.querySelectorAll(".fin-tab").forEach(tab => {
      tab.addEventListener("click", () => ativarSubAba(tab.dataset.tab));
    });

    // Se já existe a view no DOM, inicializa o conteúdo de config
    if (document.getElementById("view-financeiro")) {
      // Não renderiza automaticamente — só quando o usuário clicar no botão
    }
  }

  // Aguarda o DOM estar pronto
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
