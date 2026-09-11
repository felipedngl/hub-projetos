(() => {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* Senha mestre do designer (altere aqui) e chave de persistência do desbloqueio */
const STORAGE_KEY = "archDashV3";
const DESIGNER_KEY = "archDashV3_designer";
const DESIGNER_EMAIL = "mencheinteriores@outlook.com";
const CLIENT_ACCESS_TTL = 7 * 24 * 60 * 60 * 1000;

function getClientAccessKey(projectId) {
  return `hub_client_access_${projectId}`;
}

function hasValidClientAccess(projectId) {
  if (!projectId) return false;

  const value = localStorage.getItem(
    getClientAccessKey(projectId)
  );

  if (!value) return false;

  const lastAccess = Number(value);

  if (!Number.isFinite(lastAccess)) {
    localStorage.removeItem(getClientAccessKey(projectId));
    return false;
  }

  if (Date.now() - lastAccess >= CLIENT_ACCESS_TTL) {
    localStorage.removeItem(getClientAccessKey(projectId));
    return false;
  }

  return true;
}

function rememberClientAccess(projectId) {
  if (!projectId) return;

  localStorage.setItem(
    getClientAccessKey(projectId),
    String(Date.now())
  );
}

  /* ---------------- Configuração de etapas ---------------- */
  const STAGES = [
    { id: "briefing", label: "Briefing & Alinhamento", hint: "Coleta de preferências, necessidades, estilo de vida e orçamento." },
    { id: "levantamento", label: "Levantamento Técnico", hint: "Medição precisa do espaço, registro fotográfico e análise estrutural." },
    { id: "estudo", label: "Estudo Preliminar", hint: "Primeiras propostas conceituais e distribuição de ambientes." },
    { id: "anteprojeto", label: "Anteprojeto", hint: "Detalhamento de acabamentos, iluminação, revestimentos e imagens 3D." },
    { id: "executivo", label: "Projeto Executivo", hint: "Detalhamento técnico para execução, compatibilização e orçamento." },
    { id: "pos", label: "Pós-projeto", hint: "Acompanhamento de obra, decoração, as-built e entrega final." },
    { id: "memorial", label: "Memorial Descritivo", hint: "Lista de compras com especificações de produtos, fornecedores e links diretos.", special: "memorial" },
    { id: "cronograma", label: "Cronograma de Obra", hint: "Planejamento das fases de execução, prazos de fornecedores e datas de entrega.", special: "schedule" },
	{ id: "contratos", label: "Contratos & Documentos", hint: "Registre e visualize contratos, aditivos, documentos e links.", special: "contracts" },
  ];

  const MEMORIAL_TABLES = {
    moveis: {
      title: "Móveis Soltos",
      cols: [
        { key: "item", label: "Item" },
        { key: "ambiente", label: "Ambiente" },
        { key: "fornecedor", label: "Fornecedor" },
        { key: "qty", label: "Quantidade" },
        { key: "preco", label: "Preço" },
        { key: "link", label: "Link do Produto" },
      ],
    },
    marcenaria: {
      title: "Marcenaria",
      cols: [
        { key: "item", label: "Item" },
        { key: "ambiente", label: "Ambiente" },
        { key: "fornecedor", label: "Fornecedor" },
        { key: "qty", label: "Quantidade" },
        { key: "preco", label: "Preço" },
        { key: "link", label: "Link do Produto" },
      ],
    },
    fornecedores: {
      title: "Fornecedores",
      cols: [
        { key: "item", label: "Item" },
        { key: "ambiente", label: "Ambiente" },
        { key: "fornecedor", label: "Fornecedor" },
        { key: "qty", label: "Quantidade" },
        { key: "preco", label: "Preço" },
        { key: "link", label: "Link do Produto" },
      ],
    },
  };

  /* ---------------- Ícones ---------------- */
  function svg(paths, size = 18) {
    return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
  }

  const ICONS = {
    briefing: svg('<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 11h6M9 15h6"/>'),
    levantamento: svg('<path d="M3 17 17 3l4 4L7 21z"/><path d="m7 11 6 6"/><path d="m10 8 2 2"/>'),
    estudo: svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'),
    anteprojeto: svg('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>'),
    executivo: svg('<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18"/><path d="M2 22h20"/><path d="M10 6h4M10 10h4M10 14h4"/>'),
    pos: svg('<path d="M4 22V5"/><path d="M4 5h15l-3 4 3 4H4"/>'),
    contratos: svg('<path d="M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M12 8v8M8 12h8"/>'),
    memorial: svg('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>'),
	cronograma: svg('<path d="M4 6h16M4 12h16M4 18h16"/><path d="M8 3v18M14 3v18"/>'),
    eye: svg('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>'),
    eyeOff: svg('<path d="M2 12s3.5-7 10-7a10 10 0 0 1 4.4 1.1"/><path d="M21.2 14.6A11 11 0 0 0 22 12s-3.5-7-10-7"/><path d="M14.8 14.9a3 3 0 0 1-5.6-2.1"/><path d="m3 3 18 18"/>'),
    client: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/>', 14),
    area: svg('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>', 14),
    upload: svg('<path d="M12 16V4"/><path d="m6 10 6-6 6 6"/><path d="M4 20h16"/>', 22),
    fileDoc: svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h6"/>', 20),
    table: svg('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>', 18),
    openLink: svg('<path d="M7 17 17 7"/><path d="M8 7h9v9"/>', 14),
  };

  const PLACEHOLDER =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3B4B52"/><stop offset="1" stop-color="#1f292d"/></linearGradient></defs><rect width="800" height="600" fill="url(#g)"/><g fill="none" stroke="#F1EAE3" stroke-opacity="0.25" stroke-width="3"><rect x="160" y="130" width="480" height="340" rx="8"/><path d="M160 380 L320 260 L420 330 L520 250 L640 340"/><circle cx="520" cy="200" r="22"/></g></svg>`
    );

const STATUS_LABELS = {
  "nao-iniciado": "Não iniciado",
  "em-producao": "Em Produção",
  "aguardando-aprovacao": "Aguardando sua Aprovação",
  concluida: "Concluída",
};

const STATUS_CLASS = {
  "nao-iniciado": "status-nao-iniciado",
  "em-producao": "status-em-producao",
  "aguardando-aprovacao": "status-aguardando-aprovacao",
  concluida: "status-concluida",
};

  /* ---------------- Estado ---------------- */
  let projects = [];
  let activeFilter = "todos";
  let searchTerm = "";
  let currentProjectId = null;
  let currentStage = "briefing";
  let uploadedImage = null;
  let clientMode = false;
  let localPreview = false;
  let designerUnlocked = false;
  let authStateReady = false;
  let authStateUser = null;
  let currentScheduleDate = new Date();

/* ---------------- Acesso / modos de exibição ---------------- */
  function readOnlyView() {
    return clientMode || localPreview || !designerUnlocked;
  }

  function applyAccessUI() {
    const inProject = currentProjectId != null;
    const readOnly = inProject && readOnlyView();
    document.body.classList.toggle("client-mode", readOnly);
    document.body.classList.toggle("project-restricted", inProject && !clientMode && !localPreview && !designerUnlocked);
    document.body.classList.toggle("shared-client", clientMode);
    document.body.classList.toggle("designer-unlocked", designerUnlocked);
    updateDesignerButton();
  }

  function unlockDesigner() {
    designerUnlocked = true;
    sessionStorage.setItem(DESIGNER_KEY, "true");
    applyAccessUI();
    updateClientButton();
    if (currentProjectId != null) {
      renderSidebar();
      renderStage();
    }
  }

  function lockDesigner() {
    designerUnlocked = false;
    if (currentStage === "contratos") currentStage = "briefing";
    sessionStorage.removeItem(DESIGNER_KEY);
    applyAccessUI();
    updateClientButton();
  }

  function updateDesignerButton() {
    const btn = $("#btnDesignerAccess");
    if (!btn) return;
    if (designerUnlocked) {
      btn.classList.add("active");
      btn.textContent = btn.dataset.unlockedLabel || "Bloquear acesso";
    } else {
      btn.classList.remove("active");
      btn.textContent = btn.dataset.lockedLabel || "Acesso Restrito";
    }
  }

  /* ---------------- Helpers ---------------- */
  function uid() {
    return "id" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

function countUnreadClientMessages(project) {
  let total = 0;

  Object.values(project.stages || {}).forEach((stage) => {
    if (!Array.isArray(stage.clientMessages)) return;

    total += stage.clientMessages.filter(
      (message) =>
        message.author === "client" &&
        message.readByDesigner !== true
    ).length;
  });

  return total;
}

function hasUnreadDesignerMessage(stage) {
  if (!stage || !Array.isArray(stage.clientMessages)) return false;

  return stage.clientMessages.some(
    (message) =>
      message.author === "designer" &&
      message.readByClient !== true
  );
}

function hasUnreadClientMessage(stage) {
  if (!stage || !Array.isArray(stage.clientMessages)) return false;

  return stage.clientMessages.some(
    (message) =>
      message.author === "client" &&
      message.readByDesigner !== true
  );
}

async function markDesignerMessagesAsReadByClient(stage) {
  if (!stage || !Array.isArray(stage.clientMessages)) return false;

  let changed = false;

  stage.clientMessages.forEach((message) => {
    if (
      message.author === "designer" &&
      message.readByClient !== true
    ) {
      message.readByClient = true;
      changed = true;
    }
  });

  if (!changed) return false;

  await saveProjects();
  return true;
}

async function markClientMessagesAsReadByDesigner(stage) {
  if (!stage || !Array.isArray(stage.clientMessages)) return false;

  let changed = false;

  stage.clientMessages.forEach((message) => {
    if (
      message.author === "client" &&
      message.readByDesigner !== true
    ) {
      message.readByDesigner = true;
      changed = true;
    }
  });

  if (!changed) return false;

  await saveProjects();
  return true;
}

  function genKey() {
    return Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 8);
  }

  function formatArea(area) {
    return Number(area).toLocaleString("pt-BR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    });
  }

  function formatBytes(bytes) {
    if (!bytes) return "";
    const kb = bytes / 1024;
    if (kb < 1024) return kb.toFixed(0) + " KB";
    return (kb / 1024).toFixed(1) + " MB";
  }

  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizeUrl(url) {
    url = String(url || "").trim();
    if (!url) return url;
    if (!/^https?:\/\//i.test(url)) return "https://" + url;
    return url;
  }

  function parsePrice(value) {
    if (value === null || value === undefined) return 0;
    let v = String(value).trim();
    if (!v) return 0;
    if (v.includes(",")) {
      v = v.replace(/\./g, "").replace(",", ".");
    }
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  }

  function slugify(s) {
    return (
      String(s)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "projeto"
    );
  }

  /* ---------------- Modelo ---------------- */
const DEFAULT_STAGE_CHECKLISTS = {
  briefing: [
    "Dados e contatos do cliente registrados",
    "Perfil e rotina dos moradores levantados",
    "Necessidades e prioridades identificadas",
    "Ambientes e necessidades de cada ambiente definidos",
    "Problemas e pontos de atenção identificados",
    "Estilo e preferências definidos",
    "Referências visuais recebidas",
    "Móveis e equipamentos existentes identificados",
    "Orçamento e prioridades alinhados",
    "Briefing revisado",
    "Briefing concluído"
  ],

  levantamento: [
    "Medidas gerais dos ambientes levantadas",
    "Pé-direito e alturas relevantes conferidos",
    "Portas e janelas levantadas",
    "Paredes, pilares e elementos construtivos conferidos",
    "Pontos elétricos levantados",
    "Pontos hidráulicos levantados",
    "Pontos de gás e esgoto levantados",
    "Pontos de ar-condicionado levantados",
    "Equipamentos e mobiliários existentes registrados",
    "Registro fotográfico e em vídeo realizado",
    "Planta base do imóvel elaborada",
    "Levantamento conferido e concluído"
  ],

  estudo: [
    "Briefing analisado e diretrizes definidas",
    "Conceito do projeto desenvolvido",
    "Estudos de layout realizados",
    "Circulação e distribuição dos ambientes definidas",
    "Modelagem 3D dos ambientes desenvolvida",
    "Mobiliário e elementos decorativos definidos",
    "Iluminação e elementos do ambiente incorporados",
    "Materiais e revestimentos aplicados ao projeto",
    "Equipamentos e elementos existentes incorporados",
    "Moodboards dos ambientes desenvolvidos",
    "Materiais e acabamentos definidos",
    "Mobiliário e peças especificadas",
    "Moodboard completo",
    "Plantas de layout finalizadas",
    "Imagens 3D produzidas",
    "Apresentação do estudo preparada",
    "Estudo Preliminar apresentado ao cliente",
    "Ajustes após apresentação concluídos",
    "Estudo Preliminar aprovado pelo cliente"
  ],

  anteprojeto: [
    "Desenvolvimento criativo concluído",
    "Layout dos ambientes desenvolvido",
    "Layout revisado e definido",
    "Materiais e acabamentos definidos",
    "Moodboards atualizados",
    "Vistas humanizadas produzidas",
    "Perspectivas dos ambientes produzidas",
    "Imagens renderizadas produzidas",
    "Modelos de marcenaria desenvolvidos",
    "Considerações e informações complementares incluídas",
    "Apresentação do Anteprojeto preparada",
    "Anteprojeto apresentado ao cliente",
    "Ajustes após apresentação concluídos",
    "Anteprojeto aprovado pelo cliente"
  ],

  executivo: [
    "Planta de layout finalizada",
    "Planta de demolição finalizada",
    "Documentação construtiva geral concluída",
    "Pontos elétricos definidos",
    "Projeto de forro definido",
    "Projeto luminotécnico definido",
    "Circuitos elétricos definidos",
    "Acabamentos de pisos e paredes definidos",
    "Paginação e detalhamentos de acabamentos concluídos",
    "Rodapés definidos",
    "Vistas e detalhamentos de acabamentos concluídos",
    "Projeto de marmoraria concluído",
    "Projeto de marcenaria concluído",
    "Documentação executiva revisada",
    "Projeto Executivo concluído",
    "Documentação final preparada para execução"
  ],

  pos: [
    "Projeto entregue para execução",
    "Acompanhamento da execução iniciado",
    "Conferência da execução realizada",
    "Pendências identificadas",
    "Pendências acompanhadas",
    "Ajustes finais realizados",
    "Projeto conferido após execução",
    "Registro final do projeto realizado",
    "Entrega final concluída"
  ]
};

function emptyStage() {
  return {
    text: "",
    files: [],
    status: "nao-iniciado",
    deadline: "",
    checklist: []
  };
}

function getStageProgress(stage) {
  const checklist = Array.isArray(stage?.checklist)
    ? stage.checklist
    : [];

  if (!checklist.length) return 0;

  const completed = checklist.filter(item => item.done).length;

  return Math.round((completed / checklist.length) * 100);
}

  function seedProject(data) {
    const p = Object.assign(
      {
        shareKey: genKey(),
        createdAt: new Date().toISOString(),
        stages: {},
        contracts: [],
        clientPassword: "",
        memorial: { moveis: [], marcenaria: [], acabamentos: [] },
        memorialFiles: [],
      },
      data
    );
    p.shareKey = p.shareKey || genKey();
    p.clientPassword = p.clientPassword || "";
    p.stages = Object.assign(
      { briefing: emptyStage(), levantamento: emptyStage(), estudo: emptyStage(), anteprojeto: emptyStage(), executivo: emptyStage(), pos: emptyStage() },
      p.stages || {}
    );
    ["briefing", "levantamento", "estudo", "anteprojeto", "executivo", "pos"].forEach((k) => {
      p.stages[k] = Object.assign(emptyStage(), p.stages[k] || {});
      p.stages[k].files = p.stages[k].files || [];
      p.stages[k].text = p.stages[k].text || "";
	  p.stages[k].checklist =
  Array.isArray(p.stages[k].checklist) && p.stages[k].checklist.length
    ? p.stages[k].checklist
    : (DEFAULT_STAGE_CHECKLISTS[k] || []).map((label) => ({
        label,
        done: false
      }));
    });
    p.memorial = Object.assign({ moveis: [], marcenaria: [], fornecedores: [] }, p.memorial || {});
    if (Array.isArray(p.memorial.acabamentos) && !Array.isArray(p.memorial.fornecedores)) {
      p.memorial.fornecedores = p.memorial.acabamentos.map((r) => ({
        item: r.material || r.item || "",
        ambiente: r.ambiente || "",
        fornecedor: r.fornecedor || "",
        qty: r.qty || r.area || "",
        preco: r.preco || "",
        link: r.link || "",
      }));
    }
    delete p.memorial.acabamentos;
    Object.keys(MEMORIAL_TABLES).forEach((k) => {
      if (!Array.isArray(p.memorial[k])) p.memorial[k] = [];
      p.memorial[k] = p.memorial[k].map((r) => {
        const row = {};
        MEMORIAL_TABLES[k].cols.forEach((col) => {
          row[col.key] = r[col.key] != null ? r[col.key] : "";
        });
        return row;
      });
    });
    p.contracts = p.contracts || [];
    p.memorialFiles = p.memorialFiles || [];
    return p;
  }

  const initialProjects = [
    seedProject({
      id: "p1",
      title: "NAMO",
      client: "Nathalia",
      area: 124,
      type: "residencial",
      status: "concluido",
      image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80",
      stages: {
        briefing: {
          text: "Apartamento de 3 dormitórios para casal e 2 filhos.\nDesejam estilo contemporâneo, tons neutros, e prioridade para conforto e integração dos ambientes.\nOrçamento total previsto: R$ 180.000.",
          files: [],
        },
      },
      memorial: {
        moveis: [
          { item: "Sofá 3 lugares", ambiente: "Sala de estar", fornecedor: "Tok & Stok", qty: "1", preco: "5800", link: "https://www.exemplo.com.br/sofa-linho" },
          { item: "Mesa de jantar", ambiente: "Sala de jantar", fornecedor: "Lojas KD", qty: "1", preco: "3200", link: "" },
        ],
        marcenaria: [
          { item: "Painel TV", ambiente: "Sala de estar", fornecedor: "Marcenaria Pinus", qty: "1", preco: "4500", link: "" },
          { item: "Cozinha completa", ambiente: "Cozinha", fornecedor: "Marcenaria Pinus", qty: "1", preco: "28000", link: "" },
        ],
        fornecedores: [
          { item: "Porcelanato 120x120", ambiente: "Sala", fornecedor: "Cerâmica Atlas", qty: "35", preco: "6900", link: "https://www.exemplo.com.br/porcelanato" },
          { item: "Pastilha cimento", ambiente: "Banheiros", fornecedor: "Cerâmica Atlas", qty: "12", preco: "1400", link: "" },
        ],
      },
    }),
    seedProject({
      id: "p2",
      title: "SAFIRA",
      client: "Vitória",
      area: 86,
      type: "residencial",
      status: "em andamento",
      image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=900&q=80",
      stages: {
        briefing: {
          text: "Loft para jovem profissional.\nEstética industrial, pé-direito duplo, espaço de home office e ampla área social integrada.",
          files: [],
        },
      },
    }),
    seedProject({
      id: "p3",
      title: "Café Aurora",
      client: "Aurora Bistrô Ltda.",
      area: 210,
      type: "comercial",
      status: "concluido",
      image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80",
    }),
    seedProject({
      id: "p4",
      title: "Escritório Studio Vetor",
      client: "Studio Vetor Arquitetura",
      area: 345,
      type: "comercial",
      status: "em andamento",
      image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=80",
    }),
  ];

  /* ---------------- Persistência ---------------- */

async function loadClientProject(projectId) {
  try {
    if (!projectId) return null;

    const snapshot = await db
      .collection("projects")
      .doc(String(projectId))
      .get();

    if (!snapshot.exists) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    };
  } catch (error) {
    console.error("Erro ao carregar projeto do cliente:", error);
    return null;
  }
}

async function loadProjects() {
  try {
    if (typeof db === "undefined" || !db) {
      console.warn("Firestore 'db' não está definido globalmente.");
      return null;
    }
    const snapshot = await db.collection("projects").get();
    const projectsList = [];
    snapshot.forEach((doc) => {
      projectsList.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    return projectsList;
  } catch (error) {
    console.error("Erro ao carregar do Firebase:", error);
    return null;
  }
}

let unsubscribeProjectListener = null;
let projectListenerSnapshot = null;
let messageAudioContext = null;

function armMessageAudio() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!messageAudioContext) messageAudioContext = new AudioCtx();
    if (messageAudioContext.state === "suspended") {
      messageAudioContext.resume().catch(() => {});
    }
  } catch (error) {
    console.debug("Áudio de mensagens indisponível:", error);
  }
}

document.addEventListener("pointerdown", armMessageAudio, { once: true });
document.addEventListener("keydown", armMessageAudio, { once: true });

function playMessageSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    if (!messageAudioContext) messageAudioContext = new AudioCtx();

    const ctx = messageAudioContext;
    const start = () => {
      const now = ctx.currentTime;
      const gain = ctx.createGain();
      const osc = ctx.createOscillator();

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.11);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.045, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    };

    if (ctx.state === "suspended") {
      ctx.resume().then(start).catch(() => {});
    } else {
      start();
    }
  } catch (error) {
    console.debug("Som de mensagem indisponível:", error);
  }
}

function listenToCurrentProject(projectId) {
  if (!projectId) return null;

  if (typeof unsubscribeProjectListener === "function") {
    unsubscribeProjectListener();
    unsubscribeProjectListener = null;
  }

  projectListenerSnapshot = null;

  unsubscribeProjectListener = db.collection("projects").doc(projectId).onSnapshot(
    (doc) => {
      if (!doc.exists) return;

      const updatedProject = {
        id: doc.id,
        ...doc.data(),
      };

      const previous = projectListenerSnapshot;
      const previousMessages = new Map();

      if (previous?.stages) {
        Object.values(previous.stages).forEach((stage) => {
          (stage?.clientMessages || []).forEach((message) => {
            previousMessages.set(message.id, message);
          });
        });
      }

      const incomingMessages = [];
      Object.values(updatedProject.stages || {}).forEach((stage) => {
        (stage?.clientMessages || []).forEach((message) => {
          if (!previousMessages.has(message.id)) incomingMessages.push(message);
        });
      });

      projectListenerSnapshot = updatedProject;

		const index = projects.findIndex((p) => p.id === projectId);

		if (index !== -1) {
		  projects[index] = {
		    ...projects[index],
		    ...updatedProject,
		  };
		} else {
		  projects.push(updatedProject);
		}

      incomingMessages.forEach((message) => {
        const fromOtherSide =
          (clientMode && message.author === "designer") ||
          (!clientMode && !localPreview && message.author === "client");

        if (fromOtherSide) {
          playMessageSound();
          showToast(
            message.author === "client"
              ? "Nova mensagem do cliente."
              : "Nova mensagem da Menchë Interiores."
          );
        }
      });

      if (currentProject()?.id === projectId) {
        // Atualização automática não marca mensagens como lidas.
        // Elas só são marcadas quando a etapa é aberta pelo usuário.
        renderStage(true);
      }

      renderSidebar();
    },
    (error) => {
      console.error("Erro no listener do projeto:", error);
    }
  );

  return unsubscribeProjectListener;
}

let saveQueue = Promise.resolve();

async function saveProjects(customProjects = null) {
  saveQueue = saveQueue.then(async () => {
    try {
      let listToSave = customProjects;

      if (!listToSave) {
        const current = currentProject();

        if (current) {
          listToSave = [current];
        } else {
          listToSave = projects;
        }
      }

      for (const proj of listToSave) {
        await db.collection("projects").doc(proj.id).set(proj, {
          merge: true
        });
      }

      return true;
    } catch (error) {
      console.error("Erro ao salvar no Firebase:", error);

      if (typeof showToast === "function") {
        showToast("Erro ao salvar na nuvem.", true);
      }

      return false;
    }
  });

  return saveQueue;
}

async function saveClientFCMToken(projectId, token) {
  if (!projectId || !token || !window.db) return;

  try {
    await window.db
      .collection("fcmTokens")
      .doc(token)
      .set({
        projectId: projectId,
        token: token,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

    console.log("Token FCM salvo para o projeto:", projectId);
  } catch (error) {
    console.error("Erro ao salvar token FCM:", error);
  }
}

async function registerClientNotifications(projectId) {
  if (!projectId) return;
  if (!window.messaging) return;
  if (!("serviceWorker" in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.getRegistration(
      "/firebase-messaging-sw.js"
    );

    if (!registration) {
      console.error("Service Worker do Firebase não encontrado.");
      return;
    }

    const token = await window.messaging.getToken({
      vapidKey: "BDorpWYNAa_hPDGQMimAWCJoSGbacbdcoQQpyFl8fVVEr1Eu5Mb5ba71tbFWMPlZphEBkzo23VHb9faRH6UOs3o",
      serviceWorkerRegistration: registration
    });

    if (!token) {
      console.warn("Firebase não retornou um token FCM.");
      return;
    }

    console.log("Token FCM do cliente obtido.");

    await saveClientFCMToken(projectId, token);

  } catch (error) {
    console.error(
      "Erro ao registrar notificações do cliente:",
      error
    );
  }
}

if (window.messaging) {
  window.messaging.onMessage((payload) => {
    console.log("🔔 FCM CHEGOU EM TEMPO REAL:", payload);

    const title =
      payload.notification?.title || "Menchë Interiores";

    const body =
      payload.notification?.body ||
      "Você recebeu uma nova mensagem no Hub.";

    playMessageSound();
    showToast(body);

    if (Notification.permission === "granted") {
      try {
        new Notification(title, {
          body,
          icon: "/favicon.ico"
        });
      } catch (error) {
        console.debug("Notificação do navegador indisponível:", error);
      }
    }
  });
}

  async function deleteProjectFromCloud(projectId) {
    try {
      await db.collection("projects").doc(projectId).delete();
      if (typeof showToast === "function") showToast("Projeto removido da nuvem!");
    } catch (error) {
      console.error("Erro ao deletar do Firebase:", error);
      if (typeof showToast === "function") showToast("Erro ao excluir o projeto.", true);
    }
  }

  function currentProject() {
    return projects.find((p) => p.id === currentProjectId) || null;
  }

  /* ---------------- Arquivos ---------------- */
  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
          try {
            const MAX = 1000;
            const scale = Math.min(1, MAX / Math.max(img.width, img.height));
            const canvas = document.createElement("canvas");
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL("image/jpeg", 0.72));
          } catch (err) {
            resolve(url);
          } finally {
            setTimeout(() => URL.revokeObjectURL(url), 0);
          }
        };
        img.onerror = () => resolve(url);
        img.src = url;
      } else {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader);
        reader.readAsDataURL(file);
      }
    });
  }

// Insira sua chave pública/anon do Supabase entre as aspas:
const SUPABASE_URL = "https://mmdruvmhkjyiywpeagkr.supabase.co";
const SUPABASE_KEY = "sb_publishable_g6hxFIxf-_-xjmJ5PKYR5Q_BMiJhu41"; 

async function importFiles(files, arr) {
  if (!files || !files.length) return false;
  let count = 0;

  for (const file of files) {
    try {
      showToast(`Enviando ${file.name}...`, false);

// Sanitiza o nome do arquivo
      const cleanName = file.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9.-]/g, "_");

      const fileNameOnStorage = `${Date.now()}_${cleanName}`;
      const bucketName = "menche-files";

      const cleanBaseUrl = SUPABASE_URL.replace(/\/$/, "");
      const uploadUrl = `${cleanBaseUrl}/storage/v1/object/${bucketName}/${fileNameOnStorage}`;

      // Envia o arquivo
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'apikey': SUPABASE_KEY,
          'Content-Type': file.type || 'application/octet-stream',
          'x-upsert': 'true'
        },
        body: file
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || `Erro HTTP ${response.status}`);
      }

// URL pública com encode para caracteres especiais
      const publicUrl = `${cleanBaseUrl}/storage/v1/object/public/${bucketName}/${encodeURIComponent(fileNameOnStorage)}`;

      // Objeto com todas as variações de propriedade para garantir a renderização do preview (<img>) e suporte aos botões
      const fileObj = {
        id: typeof uid === 'function' ? uid("file") : "file_" + Date.now(),
        name: file.name,
        type: file.type || "application/octet-stream",
        size: file.size,
        url: publicUrl,
        fileUrl: publicUrl,
        dataUrl: publicUrl,       
        value: publicUrl,
        src: publicUrl,           // Adicionado para cobrir a tag <img>
        thumb: publicUrl,         // Adicionado para sistemas de miniaturas
        allowClientDownload: true,
        unreadByClient: true,     // Notificação em laranja no sidebar
        unreadByDesigner: false,
        uploadedAt: new Date().toISOString()
      };
      if (Array.isArray(arr)) {
        arr.push(fileObj);
      }

      showToast(`${file.name} enviado com sucesso!`, false);
      count++;

    } catch (err) {
      console.error("Erro no upload para o Supabase:", err);
      showToast("Erro ao processar " + file.name, true);
    }
  }

  if (!count) return false;

  try {
    await saveProjects();
    return true;
  } catch (err) {
    console.error("Erro ao salvar projeto:", err);
    return false;
  }
}

  function makeDropzoneHTML(accept) {
    return `
      <div class="dropzone" data-dropzone>
        <input type="file" data-file-input accept="${accept}" multiple />
        <div class="dropzone-inner">
          ${ICONS.upload}
          <p>Arraste arquivos aqui ou <span>clique para escolher</span></p>
        </div>
      </div>`;
  }

  function attachDropzone(container, arr, rerender) {
const dz = container?.matches?.("[data-dropzone]")
  ? container
  : $("[data-dropzone]", container);

if (!dz) return;

const input = $("[data-file-input]", dz);
if (!input) return;
    input.addEventListener("change", async () => {
      if (input.files.length && (await importFiles(Array.from(input.files), arr))) rerender();
      input.value = "";
    });
    dz.addEventListener("dragover", (e) => {
      e.preventDefault();
      dz.classList.add("dragover");
    });
    dz.addEventListener("dragleave", () => dz.classList.remove("dragover"));
    dz.addEventListener("drop", async (e) => {
      e.preventDefault();
      dz.classList.remove("dragover");
      if (e.dataTransfer.files.length && (await importFiles(Array.from(e.dataTransfer.files), arr))) rerender();
    });
  }

function fileListHTML(files) {
  if (!files.length) {
    return '<div class="file-empty">Nenhum arquivo nesta etapa ainda.</div>';
  }

  return files
    .map((f) => {
      const isExternalLink = f.kind === "link" && f.value;
      const isImg = !isExternalLink && f.type && f.type.startsWith("image/");

const thumbUrl = f.dataUrl || f.url || f.fileUrl || f.src || f.value;

const thumb = isImg
  ? `<img src="${thumbUrl}" alt="${escapeHTML(f.name)}" onerror="this.onerror=null; this.src='${PLACEHOLDER}'" />`
  : ICONS.fileDoc;
		
      // Por segurança, arquivos antigos que ainda não possuem
      // a propriedade allowClientDownload começam bloqueados.
      const canDownload = f.allowClientDownload === true;

      const openAction = isExternalLink
        ? `
          <a
            class="file-open"
            href="${escapeHTML(f.value)}"
            target="_blank"
            rel="noopener noreferrer"
          >Abrir link</a>
        `
        : `
          <a
            class="file-open"
            href="${f.dataUrl}"
            target="_blank"
            rel="noopener"
          >Abrir</a>
        `;

      return `
        <div class="file-item" data-file-id="${f.id}">
          <div class="file-thumb">${thumb}</div>

          <div class="file-meta">
            <span class="file-name">${escapeHTML(f.name)}</span>
            <span class="file-size">
              ${isExternalLink ? "Link externo" : `${f.type || "Arquivo"} · ${formatBytes(f.size)}`}
            </span>

            ${
              !isExternalLink
                ? `
                  <label class="file-client-download">
                    <input
                      type="checkbox"
                      class="file-download-toggle"
                      data-file-id="${f.id}"
                      ${canDownload ? "checked" : ""}
                    />
                    Permitir download pelo cliente
                  </label>
                `
                : ""
            }
          </div>

          ${openAction}

          <button
            class="file-remove"
            title="Remover arquivo"
          >✕</button>
        </div>`;
    })
    .join("");
}
  /* ---------------- Render: painel ---------------- */
function cardHTML(p, index) {
  const statusLabel = STATUS_LABELS[p.status] || p.status;
  const statusClass = STATUS_CLASS[p.status] || "";

  const unreadMessages = countUnreadClientMessages(p);

console.log("Projeto:", p.title, "Mensagens não lidas:", unreadMessages);

return `
<article class="card project-card" data-id="${p.id}" data-project-id="${p.id}" tabindex="0" style="animation-delay: ${Math.min(index * 60, 360)}ms">    <div class="card-cover">
        <span class="card-badge badge-type-${p.type}">${p.type}</span>


        <img src="${p.image}" alt="Capa do projeto ${escapeHTML(p.title)}" loading="lazy" onerror="this.src='${PLACEHOLDER}'" />
      </div>

      <div class="card-body">
        <h3 class="card-title">${escapeHTML(p.title)}</h3>

        <div class="card-meta">
          <span title="Cliente">${ICONS.client} ${escapeHTML(p.client)}</span>
          <span title="Metragem">${ICONS.area} ${formatArea(p.area)} m²</span>
        </div>

<div class="card-footer">
  ${
    unreadMessages > 0
      ? `
        <div class="card-message-row">
          <span class="card-message-notification">
            <span class="notification-dot"></span>
            ${unreadMessages === 1 ? "Nova mensagem" : `${unreadMessages} novas mensagens`}
          </span>
        </div>
      `
      : ""
  }

  <div class="card-action-row">
    <span class="status-tag ${statusClass}">${statusLabel}</span>
    <span class="btn-detail">Ver Detalhes</span>
  </div>
</div>
      </div>
    </article>`;
}

function renderDashboard() {
  // Trava de segurança: se 'projects' não for uma lista (array), transforma em lista vazia
  if (!Array.isArray(projects)) projects = [];

  // Esconde barra de busca e filtros se estiver no modo cliente
  const isClient = typeof isClientView !== "undefined" && isClientView;
  const controls = document.querySelector(".search-bar-container") || document.querySelector(".dashboard-controls") || document.querySelector(".filters-container") || $("#searchProjects")?.parentElement;
  if (controls) {
    controls.style.display = isClient ? "none" : "flex";
  }

  const term = searchTerm.trim().toLowerCase();
  const filtered = projects.filter((p) => {
    const pType = (p.type || "").toLowerCase();
    const pStatus = (p.status || "").toLowerCase();
    const currentFilter = activeFilter.toLowerCase();

    const matchFilter =
      currentFilter === "todos" ||
      pType === currentFilter ||
      pStatus === currentFilter;
    const matchSearch =
      !term ||
      (p.title && p.title.toLowerCase().includes(term)) ||
      (p.client && p.client.toLowerCase().includes(term));
    return matchFilter && matchSearch;
  });

  const grid = $("#projectsGrid");
  const emptyState = $("#emptyState");
  if (filtered.length === 0) {
    grid.innerHTML = "";
    emptyState.hidden = false;
  } else {
    emptyState.hidden = true;
    grid.innerHTML = filtered.map(cardHTML).join("");
  }

  const totalM2 = projects.reduce((s, p) => s + (Number(p.area) || 0), 0);
  const filteredM2 = filtered.reduce((s, p) => s + (Number(p.area) || 0), 0);
  const activeCount = projects.filter((p) => p.status === "em andamento").length;
  const stats = $("#statsBar");
  if (stats) {
    stats.innerHTML = filtered.length === projects.length
      ? `<strong>${projects.length}</strong> projetos · <strong>${formatArea(totalM2)} m²</strong> totais · <strong>${activeCount}</strong> em andamento`
      : `<strong>${filtered.length}</strong> de <strong>${projects.length}</strong> projetos · <strong>${formatArea(filteredM2)} m²</strong>`;
  }

  // --- Atribui o evento de clique aos cards ---
  $$(".project-card, .card").forEach((card) => {
    card.style.cursor = "pointer"; // Garante a mãozinha ao passar o mouse
    card.addEventListener("click", (e) => {
      if (e.target.closest("button") || e.target.closest("a")) return;

      // Pega o ID seja via data-project-id ou data-id
      const projectId = card.dataset.projectId || card.dataset.id || card.getAttribute("data-id");
      
      if (projectId) {
        openProject(projectId);
      } else {
        console.error("ID não encontrado no card:", card);
      }
    });
  });

  // Ativa a função de arrastar os cards pela tela
  enableCardDragging();
}

  /* ---------------- Render: visão interna ---------------- */
function stageHasContent(project, stage) {
  if (stage.special === "schedule") {
    return Array.isArray(project.schedule) && project.schedule.length > 0;
  }

  if (stage.special === "contracts") return (project.contracts || []).length > 0;
  if (stage.special === "memorial") {
    const m = project.memorial || {};
    const hasRows = Object.values(m).some((rows) => rows.length > 0);
    return hasRows || (project.memorialFiles || []).length > 0;
  }

  const s = project.stages[stage.id];
  return s && (s.text.trim().length > 0 || (s.files || []).length > 0);
}
  function renderSidebar() {
    const p = currentProject();
    if (!p) return;

    const fullAccess = designerUnlocked && !clientMode && !localPreview;

    $("#projCover").src = p.image;
    $("#projCover").onerror = () => ($("#projCover").src = PLACEHOLDER);
    $("#projTitle").textContent = p.title;
    $("#projMeta").textContent = `${p.client} · ${formatArea(p.area)} m² · ${p.type}`;

    const statusTag = $("#projStatusTag");
    const statusSel = $("#projStatus");
    if (fullAccess) {
      statusTag.hidden = true;
      statusSel.hidden = false;
      statusSel.value = p.status;
 statusSel.onchange = async () => {
  p.status = statusSel.value;

  if (await saveProjects()) {
    showToast("Status atualizado.");
  }
};
    } else {
      statusSel.hidden = true;
      statusTag.textContent = STATUS_LABELS[p.status] || p.status;
      statusTag.className = "status-tag " + (STATUS_CLASS[p.status] || "");
      statusTag.hidden = false;
    }

    $("#btnShareProject").hidden = !fullAccess;
    $("#btnDeleteProject").hidden = !fullAccess;

const navStages = STAGES;

    $("#stageNav").innerHTML =
      '<div class="stage-nav-title">Etapas do projeto</div>' +
      navStages.map((stage, index) => {
        const done = stageHasContent(p, stage);
        const stageData = p.stages?.[stage.id];

        // Checa se há mensagens não lidas
        const unreadMsg = clientMode
          ? hasUnreadDesignerMessage(stageData)
          : hasUnreadClientMessage(stageData);

        // Checa se há arquivos novos não lidos na etapa
        const unreadFiles = Array.isArray(stageData?.files) && stageData.files.some((f) => {
          return clientMode ? f.unreadByClient === true : f.unreadByDesigner === true;
        });

        const unread = unreadMsg || unreadFiles;

        return `
          <button class="stage-link ${
            stage.id === currentStage ? "active" : ""
          } ${unread ? "has-unread-message" : ""}" data-stage="${stage.id}">
            ${ICONS[stage.id] || ""}
            <span class="nav-label">${
              index < 7 ? `${index + 1}. ` : ""
            }${stage.label}</span>
            <span class="nav-dot ${done ? "done" : ""}" title="${done ? "Etapa com conteúdo" : "Etapa vazia"}"></span>
          </button>`;
      }).join("");

    $$("#stageNav .stage-link").forEach((btn) => {
      btn.addEventListener("click", () => {
        currentStage = btn.dataset.stage;

        // Atualiza visualmente qual etapa está selecionada
        $$("#stageNav .stage-link").forEach((item) => {
          item.classList.toggle("active", item === btn);
        });

        // Abre a etapa imediatamente
        renderStage();

        // Marca como lidas as mensagens E os arquivos da etapa que acabou de ser aberta
        const p = currentProject();
        const stage = p?.stages?.[currentStage];

        if (stage) {
          let changed = false;

          // 1. Limpa mensagens não lidas
          if (Array.isArray(stage.clientMessages)) {
            stage.clientMessages.forEach((message) => {
              if (clientMode) {
                if (message.author === "designer" && message.readByClient !== true) {
                  message.readByClient = true;
                  changed = true;
                }
              } else {
                if (message.author === "client" && message.readByDesigner !== true) {
                  message.readByDesigner = true;
                  changed = true;
                }
              }
            });
          }

          // 2. Limpa arquivos não lidos
          if (Array.isArray(stage.files)) {
            stage.files.forEach((file) => {
              if (clientMode) {
                if (file.unreadByClient === true) {
                  file.unreadByClient = false;
                  changed = true;
                }
              } else {
                if (file.unreadByDesigner === true) {
                  file.unreadByDesigner = false;
                  changed = true;
                }
              }
            });
          }

          if (changed) {
            renderSidebar();
            saveProjects();
          }
        }
      });
    });
  }
	  
function openProject(id) {
  currentProjectId = id;
  listenToCurrentProject(id);
  
  currentStage = "briefing";
  $("#view-dashboard").hidden = true;
  $("#view-project").hidden = false;
  $("#btnBack").hidden = clientMode;
  if (clientMode) document.title = `${id ? currentProjectTitle() : "Projeto"} — HUB de Projetos`;
  updateClientButton();
  applyAccessUI();
  renderSidebar();
  renderStage();
  window.scrollTo({ top: 0 });

  if (clientMode) {
    setupClientNotificationPrompt();
  }
}

  function currentProjectTitle() {
    const p = currentProject();
    return p ? p.title : "Projeto";
  }

  function showDashboard() {
  if (!designerUnlocked && !clientMode) {
    showHubLocked();
    return;
  }
    if (typeof unsubscribeProjectListener === "function") {
      unsubscribeProjectListener();
      unsubscribeProjectListener = null;
    }
    projectListenerSnapshot = null;
    currentProjectId = null;
    document.querySelectorAll(".hub-locked").forEach((el) => el.remove());
    $("#view-project").hidden = true;
    $("#view-dashboard").hidden = false;
    $("#btnBack").hidden = true;
    updateClientButton();
    applyAccessUI();
    renderDashboard();
  }

/* ---------- Modo Cliente (visualização) ---------- */
  function setClientMode(active) {
    clientMode = active;
    updateClientButton();
    applyAccessUI();
  }

  function updateClientButton() {
    const btn = $("#btnClientView");
    if (!btn) return;
    if (currentProjectId == null || !designerUnlocked || (clientMode && !localPreview)) {
      btn.hidden = true;
      return;
    }
    btn.hidden = false;
    if (clientMode && localPreview) {
      btn.classList.add("active");
      btn.innerHTML = `${ICONS.eyeOff}<span>${btn.dataset.exitLabel || "Sair do modo Cliente"}</span>`;
    } else {
      btn.classList.remove("active");
      btn.innerHTML = `${ICONS.eye}<span>${btn.dataset.viewLabel || "Visualizar como Cliente"}</span>`;
    }
  }

  // =================================================================
  // FERRAMENTA: Modal bonito para substituir o prompt cinza do navegador
  // =================================================================
  function customPrompt(title, defaultValue) {
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0,0,0,0.7); display: flex; align-items: center;
        justify-content: center; z-index: 9999; backdrop-filter: blur(3px);
      `;

      overlay.innerHTML = `
        <div style="background: #1e1e1e; border: 1px solid #333; border-radius: 8px; padding: 20px; width: 90%; max-width: 400px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); font-family: inherit; color: #fff;">
          <h4 style="margin: 0 0 12px 0; font-size: 1rem; color: #fff;">${title}</h4>
          <textarea id="customPromptInput" style="width: 100%; min-height: 80px; padding: 8px; border-radius: 6px; background: #2a2a2a; color: #fff; border: 1px solid #444; font-family: inherit; resize: vertical; box-sizing: border-box;">${defaultValue}</textarea>
          <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px;">
            <button id="customPromptCancel" style="padding: 6px 12px; border-radius: 4px; background: transparent; border: 1px solid #555; color: #ccc; cursor: pointer;">Cancelar</button>
            <button id="customPromptSave" style="padding: 6px 12px; border-radius: 4px; background: #e0a96d; border: none; color: #111; font-weight: bold; cursor: pointer;">Salvar</button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      const input = overlay.querySelector("#customPromptInput");
      input.focus();
      input.select();

      const cleanup = (value) => {
        document.body.removeChild(overlay);
        resolve(value);
      };

      overlay.querySelector("#customPromptCancel").addEventListener("click", () => cleanup(null));
      overlay.querySelector("#customPromptSave").addEventListener("click", () => cleanup(input.value));
    });
  }

  /* ---------------- Render: etapa (proprietário) ---------------- */
  function renderStage(autoRefresh = false) {
    const project = currentProject();
    const stage = STAGES.find((s) => s.id === currentStage);
    if (!project || !stage) return;

    if (readOnlyView()) return renderStageClient(project, stage);

    if (stage.special === "contracts") return renderContracts(project);
    if (stage.special === "memorial") return renderMemorial(project);
    if (stage.special === "schedule") return renderSchedule(project);

    const s = project.stages[stage.id];
    const container = $("#stageContainer");
    if (!container) return;

    container.innerHTML = `
      <div class="stage-header">
        <h2>${stage.label}</h2>
        <p class="stage-hint">${stage.hint}</p>
      </div>

      <div class="panel stage-progress-panel">
        <h3>📊 Status da Etapa</h3>
        <div class="stage-checklist">
          <h4>Entregas da etapa</h4>
          <button type="button" class="btn-secondary" id="btnAddChecklistItem">
            Adicionar entrega
          </button>

          ${
            (s.checklist || []).length
              ? s.checklist.map((item, index) => `
                  <label class="stage-checklist-item">
                    <input
                      type="checkbox"
                      data-checklist-index="${index}"
                      ${item.done ? "checked" : ""}
                    />
                    <span>${item.label}</span>
                  </label>
                `).join("")
              : `<p class="stage-checklist-empty">Nenhuma entrega adicionada ainda.</p>`
          }
        </div>
        <div class="stage-progress-grid">
          <div>
            <label for="stageStatus">Situação</label>
            <select id="stageStatus">
              <option value="nao-iniciado" ${s.status === "nao-iniciado" ? "selected" : ""}>
                Não iniciado
              </option>
              <option value="em-producao" ${s.status === "em-producao" ? "selected" : ""}>
                Em Produção
              </option>
              <option value="aguardando-aprovacao" ${s.status === "aguardando-aprovacao" ? "selected" : ""}>
                Aguardando sua Aprovação
              </option>
              <option value="concluida" ${s.status === "concluida" ? "selected" : ""}>
                Concluída
              </option>
            </select>
          </div>

          <div>
            <label for="stageDeadline">Entrega prevista</label>
            <input
              type="date"
              id="stageDeadline"
              value="${s.deadline || ""}"
            />
          </div>
        </div>

        <button type="button" class="btn-primary" id="btnSaveStageProgress">
          Salvar status da etapa
        </button>
      </div>

      <div class="panel">
        <h3>${ICONS.upload} Arquivos da etapa</h3>
        <label>Upload de PDFs, imagens de renders, plantas e documentos</label>

        ${makeDropzoneHTML("image/*,application/pdf,.dwg,.dxf")}

        <div class="file-link-actions">
          <button type="button" class="btn-secondary" id="btnAddExternalLink">
            + Adicionar link externo
          </button>
        </div>

        <div id="externalLinkForm" class="file-link-form" hidden>
          <div class="file-link-form-grid">
            <div>
              <label for="externalLinkName">Nome do arquivo</label>
              <input
                type="text"
                id="externalLinkName"
                placeholder="Ex.: Projeto Executivo em PDF"
              />
            </div>

            <div>
              <label for="externalLinkUrl">Link</label>
              <input
                type="url"
                id="externalLinkUrl"
                placeholder="Cole aqui o link do Google Drive"
              />
            </div>
          </div>

          <div class="file-link-form-actions">
            <button type="button" class="btn-primary" id="btnSaveExternalLink">
              Salvar link
            </button>

            <button type="button" class="btn-secondary" id="btnCancelExternalLink">
              Cancelar
            </button>
          </div>
        </div>

        <div class="file-list" id="stageFiles">${fileListHTML(s.files)}</div>
      </div>

      <div class="panel client-conversation-panel">
        <h3>💬 Chat e Observações</h3>

        <div id="stageConversation">
          ${stageConversationHTML(s.clientMessages || [])}
        </div>

        <div class="conversation-form">
          <textarea
            id="designerMessageInput"
            class="stage-textarea"
            placeholder="Escreva uma resposta para o cliente..."
          ></textarea>

          <button
            type="button"
            class="btn-primary"
            id="btnSendDesignerMessage"
          >
            Enviar resposta
          </button>
        </div>
      </div>`;

    const btnAddExternalLink = $("#btnAddExternalLink");
    const externalLinkForm = $("#externalLinkForm");
    const btnSaveExternalLink = $("#btnSaveExternalLink");
    const btnCancelExternalLink = $("#btnCancelExternalLink");

    if (btnAddExternalLink) {
      btnAddExternalLink.addEventListener("click", () => {
        externalLinkForm.hidden = false;
        $("#externalLinkName").value = "";
        $("#externalLinkUrl").value = "";
        $("#externalLinkName").focus();
      });
    }

    if (btnCancelExternalLink) {
      btnCancelExternalLink.addEventListener("click", () => {
        externalLinkForm.hidden = true;
      });
    }

    if (btnSaveExternalLink) {
      btnSaveExternalLink.addEventListener("click", async () => {
        const name = $("#externalLinkName").value.trim();
        const url = $("#externalLinkUrl").value.trim();

        if (!name) {
          showToast("Informe o nome do arquivo.", true);
          return;
        }

        if (!url) {
          showToast("Cole o link do arquivo.", true);
          return;
        }

        let parsedUrl;
        try {
          parsedUrl = new URL(url);
        } catch {
          showToast("Informe um link válido.", true);
          return;
        }

        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
          showToast("O link precisa começar com http:// ou https://.", true);
          return;
        }

        if (!Array.isArray(s.files)) {
          s.files = [];
        }

        s.files.push({
          id: uid(),
          name,
          kind: "link",
          value: url,
          type: "link",
          size: 0,
          allowClientDownload: false
        });

        const saved = await saveProjects([project]);
        if (!saved) return;

        showToast("Link adicionado.");
        externalLinkForm.hidden = true;
        renderStage();
      });
    }

    const dz = $("[data-dropzone]", container);
    if (dz) attachDropzone(dz, s.files, () => renderStage());

    const stageStatus = $("#stageStatus");
    const stageDeadline = $("#stageDeadline");
    const btnSaveStageProgress = $("#btnSaveStageProgress");

    if (btnSaveStageProgress) {
      btnSaveStageProgress.addEventListener("click", async () => {
        s.status = stageStatus.value;
        s.deadline = stageDeadline.value;
        s.progress = getStageProgress(s);
          
        if (await saveProjects([project])) {
          showToast("Status da etapa atualizado.");
          renderStage();
        }
      });
    }

    const btnAddChecklistItem = $("#btnAddChecklistItem");
    if (btnAddChecklistItem) {
      btnAddChecklistItem.addEventListener("click", async () => {
        const label = prompt("Nome da entrega:");
        if (!label || !label.trim()) return;

        s.checklist = Array.isArray(s.checklist) ? s.checklist : [];
        s.checklist.push({
          label: label.trim(),
          done: false
        });

        if (await saveProjects([project])) {
          showToast("Entrega adicionada.");
          renderStage();
        }
      });
    }

    const checklistInputs = $$("[data-checklist-index]", container);
    checklistInputs.forEach((input) => {
      input.addEventListener("change", async () => {
        const index = Number(input.dataset.checklistIndex);

        if (!Array.isArray(s.checklist) || !s.checklist[index]) return;

        s.checklist[index].done = input.checked;
        const progress = getStageProgress(s);

        if (progress === 0) {
          s.status = "nao-iniciado";
        } else if (progress === 100) {
          s.status = "concluida";
        } else if (
          s.status === "nao-iniciado" ||
          s.status === "concluida"
        ) {
          s.status = "em-producao";
        }

        s.progress = progress;

        if (await saveProjects([project])) {
          renderStage();
        }
      });
    });
      
    $$("#stageFiles .file-remove").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.closest(".file-item").dataset.fileId;
        s.files = s.files.filter((f) => f.id !== id);
        saveProjects().then(() => {
          renderStage();
        }).catch((err) => console.error("Erro ao salvar estágio:", err));
      });
    });

    const designerInput = $("#designerMessageInput");
    const designerButton = $("#btnSendDesignerMessage");

    // EDIÇÃO DE MENSAGENS (Unificada para Cliente e Designer)
    $$("#stageConversation .btn-message-edit").forEach((button) => {
      button.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const messageId = button.dataset.messageId;
        const message = s.clientMessages?.find((m) => m.id === messageId);

        if (!message) return;

        if (!designerUnlocked && message.author !== "client") return;
        if (designerUnlocked && message.author !== "designer") return;

        const newText = await customPrompt("Edite sua mensagem:", message.text);
        if (newText === null) return;

        const text = newText.trim();
        if (!text) {
          if (typeof showToast === "function") showToast("A mensagem não pode ficar vazia.", true);
          return;
        }

        message.text = text;
        message.edited = true;

        if (typeof saveProjects === "function") await saveProjects();
        renderStage();
      });
    });

    if (designerButton) {
      designerButton.addEventListener("click", async () => {
        const text = designerInput ? designerInput.value.trim() : "";

        if (!text) {
          showToast("Escreva uma resposta antes de enviar.", true);
          return;
        }

        if (!Array.isArray(s.clientMessages)) {
          s.clientMessages = [];
        }

        s.clientMessages.push({
          id: uid(),
          author: "designer",
          text,
          createdAt: Date.now(),
          readByClient: false,
        });

        designerButton.disabled = true;
        designerButton.textContent = "Enviando...";

        const saved = await saveProjects();

        if (saved) {
          renderStage();
          showToast("Resposta enviada.");
        } else {
          s.clientMessages.pop();
          designerButton.disabled = false;
          designerButton.textContent = "Enviar resposta";
        }
      });
    }

    // Permissão individual de download para o cliente
    $$("#stageFiles .file-download-toggle").forEach((checkbox) => {
      checkbox.addEventListener("change", async () => {
        const id = checkbox.dataset.fileId;
        const file = s.files.find((f) => f.id === id);

        if (!file) return;

        file.allowClientDownload = checkbox.checked;

        if (await saveProjects()) {
          showToast(
            checkbox.checked
              ? "Download liberado para o cliente."
              : "Download bloqueado para o cliente."
          );
        }
      });
    });
  }

  /* ---------------- Render: etapa (cliente, leitura) ---------------- */
  function renderStageClient(project, stage) {
    if (!project) return;
    const container = $("#stageContainer");
    if (!container) return;

    const adminPanelBtn = $("#btnAdminPanel");
    const newProjectBtn = $("#btnNewProject");
    const lockAccessBtn = $("#btnLockAccess");

    if (adminPanelBtn) adminPanelBtn.style.display = "none";
    if (newProjectBtn) newProjectBtn.style.display = "none";
    if (lockAccessBtn) lockAccessBtn.style.display = "none";

    if (!stage || typeof stage !== "object") {
      const stageId = typeof stage === "string" ? stage : "projeto_executivo";
      stage = {
        id: stageId,
        label: stageId.replace(/_/g, " ").toUpperCase(),
        hint: "Acompanhe as entregas e observações desta etapa."
      };
    }

    const header = `
      <div class="stage-header">
        <h2>${stage.label || "Etapa"}</h2>
        <p class="stage-hint">${stage.hint || ""}</p>
      </div>`;

    if (stage.special === "contracts") {
      container.innerHTML = header + clientContractsHTML(project);
      attachClientContractViewers(project);
      return;
    }

    if (stage.special === "memorial") {
      container.innerHTML = header + memorialClientHTML(project);
      return;
    }
    if (stage.special === "schedule") {
      container.innerHTML = header + renderScheduleClientHTML(project);
      return;
    }

    const stagesData = project.stages || {};
    const stageKey = stage.id || "projeto_executivo";
    const s = stagesData[stageKey] || { checklist: [], files: [], clientMessages: [], status: "nao_iniciado" };
    const checklist = Array.isArray(s.checklist) ? s.checklist : [];

    const checklistHTML = checklist.length
      ? `
        <div class="panel stage-checklist-client">
          <div class="stage-checklist-client-header">
            <div>
              <span class="stage-checklist-client-label">Entregas da etapa</span>
              <strong>${checklist.filter(item => item.done).length}/${checklist.length} concluídas</strong>
            </div>

            <button
              type="button"
              class="stage-checklist-client-button"
              id="btnViewChecklist"
            >
              Ver entregas ›
            </button>
          </div>
        </div>
      `
      : "";
    const stageStatus = (typeof STATUS_LABELS !== "undefined" && STATUS_LABELS[s.status]) ? STATUS_LABELS[s.status] : "Não iniciado";
    const stageProgress = typeof getStageProgress === "function" ? getStageProgress(s) : 0;
    const deadlineText = s.deadline
      ? new Date(`${s.deadline}T00:00:00`).toLocaleDateString("pt-BR")
      : "";

    const stageStatusHTML = `
      <div class="panel stage-status-card ${(typeof STATUS_CLASS !== "undefined" && STATUS_CLASS[s.status]) || "status-nao-iniciado"}">
        <div class="stage-status-top">
          <div>
            <span class="stage-status-label">Status da etapa</span>
            <strong>${stageStatus}</strong>
          </div>

          ${
            deadlineText
              ? `<div class="stage-deadline">
                  <span>Entrega prevista</span>
                  <strong>📅 ${deadlineText}</strong>
                </div>`
              : ""
          }
        </div>

        <div class="stage-progress-wrap">
          <div class="stage-progress-info">
            <span>Progresso</span>
            <strong>${stageProgress}% concluído</strong>
          </div>

          <div class="stage-progress-bar">
            <div
              class="stage-progress-fill"
              style="width: ${stageProgress}%"
            ></div>
          </div>
        </div>
      </div>
    `;

    const iconText = (typeof ICONS !== "undefined" && stage.id && ICONS[stage.id]) ? ICONS[stage.id] : "📁";

    container.innerHTML = header + stageStatusHTML + checklistHTML + `
      <div class="panel">
        <h3>${iconText} Arquivos da etapa</h3>
        <label>Renders, plantas e documentos desta etapa</label>
        ${typeof clientFilesHTML === "function" ? clientFilesHTML(s.files || []) : ""}
      </div>

      <div class="panel client-conversation-panel">
        <h3>💬 Chat e Observações</h3>
        <p class="conversation-hint">
          Envie uma observação, dúvida ou solicitação sobre esta etapa.
        </p>

        <div id="stageConversation">
          ${typeof stageConversationHTML === "function" ? stageConversationHTML(s.clientMessages || []) : ""}
        </div>

        <div class="conversation-form">
          <textarea
            id="clientMessageInput"
            class="stage-textarea"
            placeholder="Escreva sua observação..."
          ></textarea>

          <button
            type="button"
            class="btn-primary"
            id="btnSendClientMessage"
          >
            Enviar observação
          </button>
        </div>
      </div>`;

    const btnViewChecklist = $("#btnViewChecklist");

    if (btnViewChecklist) {
      btnViewChecklist.addEventListener("click", () => {
        const completed = checklist.filter(item => item.done).length;

        const modal = document.createElement("div");
        modal.className = "checklist-modal-overlay";

        modal.innerHTML = `
          <div class="checklist-modal">
            <div class="checklist-modal-header">
              <div>
                <span class="checklist-modal-label">Entregas da etapa</span>
                <h3>${completed}/${checklist.length} concluídas</h3>
              </div>

              <button
                type="button"
                class="checklist-modal-close"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            <div class="checklist-modal-list">
              ${checklist
                .map(
                  (item) => `
                    <div class="checklist-modal-item ${item.done ? "done" : ""}">
                      <span class="checklist-modal-check">
                        ${item.done ? "✓" : ""}
                      </span>
                      <span>${typeof escapeHTML === "function" ? escapeHTML(item.label) : item.label}</span>
                    </div>
                  `
                )
                .join("")}
            </div>
          </div>
        `;

        document.body.appendChild(modal);

        const closeModal = () => {
          modal.remove();
        };

        modal
          .querySelector(".checklist-modal-close")
          .addEventListener("click", closeModal);

        modal.addEventListener("click", (event) => {
          if (event.target === modal) {
            closeModal();
          }
        });
      });
    }

    const input = $("#clientMessageInput");
    const sendButton = $("#btnSendClientMessage");

    $$("#stageContainer .client-file-download").forEach((button) => {
      button.addEventListener("click", async () => {
        const fileId = button.dataset.fileId;
        const file = (s.files || []).find((f) => f.id === fileId);
        const targetUrl = file ? (file.url || file.dataUrl || file.fileUrl || file.value) : null;

        if (!file || !targetUrl) {
          if (typeof showToast === "function") showToast("Arquivo não encontrado.", true);
          return;
        }

        if (typeof showToast === "function") showToast("Iniciando download...", false);

        if (targetUrl.startsWith("http")) {
          try {
            const resp = await fetch(targetUrl);
            const blob = await resp.blob();
            const blobUrl = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = file.name || "arquivo";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
          } catch (err) {
            console.error("Erro no download direto via Blob:", err);
            window.open(targetUrl, "_blank");
          }
        } else {
          if (typeof openClientFile === "function") openClientFile(targetUrl, file.name, true);
        }
      });
    });

    $$("#stageContainer .client-file-view").forEach((button) => {
      button.addEventListener("click", () => {
        const fileId = button.dataset.fileId;
        const file = (s.files || []).find((f) => f.id === fileId);
        const targetUrl = file ? (file.url || file.dataUrl || file.fileUrl || file.value) : null;

        if (!file || !targetUrl) {
          if (typeof showToast === "function") showToast("Arquivo não encontrado.", true);
          return;
        }

        if (targetUrl.startsWith("http")) {
          window.open(targetUrl, "_blank");
        } else {
          if (typeof openClientFile === "function") openClientFile(targetUrl, file.name, false);
        }
      });
    });

    $$("#stageConversation .btn-message-delete").forEach((button) => {
      button.addEventListener("click", async () => {
        const messageId = button.dataset.messageId;
        const index = s.clientMessages?.findIndex((m) => m.id === messageId);

        if (index === -1 || index === undefined) return;

        const message = s.clientMessages[index];
        if (!message || message.author !== "client") return;

        if (!confirm("Apagar esta mensagem?")) return;

        s.clientMessages.splice(index, 1);

        if (typeof saveProjects === "function" && await saveProjects()) {
          renderStageClient(project, stage);
          if (typeof showToast === "function") showToast("Mensagem apagada.");
        }
      });
    });

    if (sendButton) {
      sendButton.addEventListener("click", async () => {
        const text = input ? input.value.trim() : "";

        if (!text) {
          if (typeof showToast === "function") showToast("Escreva uma observação antes de enviar.", true);
          return;
        }

        if (!Array.isArray(s.clientMessages)) {
          s.clientMessages = [];
        }

        s.clientMessages.push({
          id: typeof uid === "function" ? uid() : String(Date.now()),
          author: "client",
          text,
          createdAt: Date.now(),
          readByDesigner: false,
        });

        sendButton.disabled = true;
        sendButton.textContent = "Enviando...";

        const saved = (typeof saveProjects === "function") ? await saveProjects() : false;

        if (saved) {
          if (input) input.value = "";
          renderStageClient(project, stage);
          if (typeof showToast === "function") showToast("Observação enviada.");
        } else {
          s.clientMessages.pop();
          sendButton.disabled = false;
          sendButton.textContent = "Enviar observação";
        }
      });
    }
  }

function stageConversationHTML(messages) {
  if (!messages || !messages.length) {
    return `
      <div class="conversation-empty">
        Nenhuma observação enviada ainda.
      </div>`;
  }

  const canEditMessage = (message) => {
    if (clientMode) {
      return message.author === "client";
    }

    return message.author === "designer";
  };

  return messages
    .map((message) => {
      const isClient = message.author === "client";

      const date = message.createdAt
        ? new Date(message.createdAt).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "";

      return `
        <div
          class="conversation-message ${isClient ? "client" : "designer"}"
          data-message-id="${message.id}"
        >
          <div class="conversation-message-head">
            <strong>${isClient ? escapeHTML(currentProject()?.title || "Cliente") : "Menchë Interiores"}</strong>
            <span>
              ${date}${message.editedAt ? " · editada" : ""}
            </span>
          </div>

          <div class="conversation-message-text">
            ${escapeHTML(message.text).replace(/\n/g, "<br>")}
          </div>

          ${
            canEditMessage(message)
              ? `
                <div class="conversation-message-actions">
                  <button
                    type="button"
                    class="btn-message-edit"
                    data-message-id="${message.id}"
                    title="Editar mensagem"
                    aria-label="Editar mensagem"
                  >
                    ✎
                  </button>

                  <button
                    type="button"
                    class="btn-message-delete"
                    data-message-id="${message.id}"
                    title="Apagar mensagem"
                    aria-label="Apagar mensagem"
                  >
                    ×
                  </button>
                </div>
              `
              : ""
          }
        </div>`;
    })
    .join("");
}

function clientFilesHTML(files) {
  if (!files || !files.length) {
    return '<div class="file-empty">Nenhum arquivo disponível nesta etapa.</div>';
  }

  const uniqueFiles = files.filter((file, index, array) => {
    return (
      index ===
      array.findIndex(
        (item) =>
          item.id === file.id ||
          (
            item.name === file.name &&
            item.dataUrl === file.dataUrl &&
            item.value === file.value
          )
      )
    );
  });

  return uniqueFiles
    .map((f) => {
      const isExternalLink = f.kind === "link" && f.value;
      const isImg =
        !isExternalLink &&
        f.type &&
        f.type.startsWith("image/");

      const thumbUrl = f.dataUrl || f.url || f.fileUrl || f.src || f.value;

      const thumb = isImg
        ? `<img src="${thumbUrl}" alt="${escapeHTML(f.name)}" onerror="this.onerror=null; this.src='${typeof PLACEHOLDER !== "undefined" ? PLACEHOLDER : ""}'" />`
        : (typeof ICONS !== "undefined" ? ICONS.fileDoc : "📄");
		
      const canDownload = f.allowClientDownload === true;
      const targetLink = isExternalLink ? (typeof normalizeUrl === "function" ? normalizeUrl(f.value) : f.value) : "#";

      const action = isExternalLink
        ? `
          <div class="file-actions">
            <a
              class="file-open"
              href="${escapeHTML(targetLink)}"
              target="_blank"
              rel="noopener noreferrer"
            >Visualizar</a>
          </div>
        `
        : `
          <div class="file-actions">
            <button
              type="button"
              class="file-open client-file-view"
              data-file-id="${f.id}"
            >Visualizar</button>

            ${
              canDownload
                ? `
                  <button
                    type="button"
                    class="file-open client-file-download"
                    data-file-id="${f.id}"
                  >Baixar</button>`
                : ""
            }
          </div>
        `;

      return `
        <div class="file-item">
          <div class="file-thumb">${thumb}</div>

          <div class="file-meta">
            <span class="file-name">${escapeHTML(f.name)}</span>

            <span class="file-size">
              ${
                isExternalLink
                  ? "Link externo"
                  : `${f.type || "Arquivo"} · ${typeof formatBytes === "function" ? formatBytes(f.size) : f.size || "0 B"}`
              }
            </span>
          </div>

          ${action}
        </div>`;
    })
    .join("");
}

function openClientFile(dataUrl, fileName, download = false) {
  try {
    const parts = dataUrl.split(",");
    const mime =
      parts[0].match(/data:(.*?);base64/)?.[1] ||
      "application/octet-stream";

    const binary = atob(parts[1]);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: mime });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;

    if (download) {
      link.download = fileName || "arquivo";
    } else {
      link.target = "_blank";
      link.rel = "noopener";
    }

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (error) {
    console.error("Erro ao abrir arquivo:", error);
    if (typeof showToast === "function") showToast("Não foi possível abrir este arquivo.", true);
  }
}

function memorialClientHTML(project) {
  return (
    Object.keys(MEMORIAL_TABLES)
      .map((key) => {
        const table = MEMORIAL_TABLES[key];
        const rows = project.memorial ? project.memorial[key] || [] : [];
        const qtyTotal = rows.reduce((total, r) => {
          return total + (parseFloat(String(r.qty || "").replace(",", ".")) || 0);
        }, 0);

        const priceTotal = rows.reduce((total, r) => {
          const qty = parseFloat(String(r.qty || "").replace(",", ".")) || 0;
          const price = typeof parsePrice === "function" ? parsePrice(r.preco) : 0;
          return total + qty * price;
        }, 0);
        
        const head = `<tr>${table.cols.map((c) => `<th>${escapeHTML(c.label)}</th>`).join("")}</tr>`;
        let body;
        if (!rows.length) {
          body = `<tr class="row-empty"><td colspan="${table.cols.length}">Nenhum item cadastrado.</td></tr>`;
        } else {
          body = rows
            .map((r) => {
              const cells = table.cols.map((col) => {
                if (col.key === "link") {
                  const urlFormatted = typeof normalizeUrl === "function" ? normalizeUrl(r[col.key]) : r[col.key];
                  return r[col.key]
                    ? `<td><a class="memorial-link" href="${escapeHTML(urlFormatted)}" target="_blank" rel="noopener">${escapeHTML(r[col.key])}</a></td>`
                    : "<td>—</td>";
                }
                if (col.key === "preco") {
                  const valor = typeof parsePrice === "function" ? parsePrice(r[col.key]) : 0;
                  return `<td>${valor > 0 ? (typeof formatCurrency === "function" ? formatCurrency(valor) : valor) : ""}</td>`;
                }

                return `<td>${escapeHTML(r[col.key] || "")}</td>`;
              });
              return `<tr>${cells.join("")}</tr>`;
            })
            .join("");
        }
        return `
          <div class="memorial-section">
            <div class="memorial-head"><h3>${ICONS.table} ${table.title}</h3></div>
            <div class="table-wrap">
              <table class="memorial-table"><thead>${head}</thead><tbody>${body}</tbody></table>
            </div>

            ${qtyTotal > 0 || priceTotal > 0
              ? `<div class="memorial-summary">
                  <strong>${table.title}:</strong>
                  ${rows.length} item(ns)
                  ${qtyTotal > 0 ? " · Qtd. total " + (typeof formatArea === "function" ? formatArea(qtyTotal) : qtyTotal) : ""}
                  ${priceTotal > 0 ? " · " + (typeof formatCurrency === "function" ? formatCurrency(priceTotal) : priceTotal) : ""}
                </div>`
              : ""}
          </div>`;
      })
      .join("") +
    memorialGrandTotalHTML(project) +
    (project.memorialFiles && project.memorialFiles.length
      ? `<div class="panel"><h3>${ICONS.upload} Arquivos do memorial</h3>${clientFilesHTML(project.memorialFiles)}</div>`
      : "")
  );
}

/* ---------------- Contratos (proprietário) ---------------- */
function renderContracts(project) {
  const stage = STAGES.find((s) => s.id === "contratos");
  const container = $("#stageContainer");
  container.innerHTML = `
    <div class="stage-header">
      <h2>${stage.label}</h2>
      <p class="stage-hint">${stage.hint}</p>
    </div>
    <div class="panel">
      <h3>${ICONS.contratos} Documentos e links</h3>
      <div class="contract-list" id="contractList">
        ${project.contracts && project.contracts.length ? contractListHTML(project.contracts) : '<div class="file-empty">Nenhum contrato registrado.</div>'}
      </div>
      <div class="contract-form">
        <div class="field-row">
          <div class="field">
            <label for="cName">Nome do documento</label>
            <input type="text" id="cName" placeholder="Ex.: Contrato de prestação de serviços" />
          </div>
          <div class="field">
            <label for="cKind">Tipo</label>
            <select id="cKind">
              <option value="link">Link (URL)</option>
              <option value="file">Arquivo (PDF / imagem)</option>
            </select>
          </div>
        </div>
        <div class="field" id="cLinkField">
          <label for="cLink">Link</label>
          <input type="url" id="cLink" placeholder="https://drive.google.com/..." />
        </div>
        <div class="field" id="cFileField" hidden>
          <label for="cFile">Arquivo</label>
          <input type="file" id="cFile" accept=".pdf,image/*,.doc,.docx" />
        </div>
        <div class="contract-download-permission">
          <label>
            <input type="checkbox" id="cAllowDownload" />
            Permitir que o cliente faça download deste documento
          </label>
        </div>

        <div>
          <button type="button" class="btn-small" id="btnAddContract">+ Adicionar documento</button>
        </div>
      </div>
    </div>`;

  const kindSel = $("#cKind");
  const linkField = $("#cLinkField");
  const fileField = $("#cFileField");

  const toggle = () => {
    const isLink = kindSel.value === "link";
    linkField.hidden = !isLink;
    fileField.hidden = isLink;
  };
  kindSel.addEventListener("change", toggle);

  $("#btnAddContract").addEventListener("click", async () => {
    const name = $("#cName").value.trim();
    const isLink = kindSel.value === "link";
    const link = isLink ? $("#cLink").value.trim() : "";
    const fileInput = $("#cFile");

    if (!name) {
      if (typeof showToast === "function") showToast("Informe o nome do documento.", true);
      return;
    }
    if (isLink && !link) {
      if (typeof showToast === "function") showToast("Informe o link.", true);
      return;
    }
    if (!isLink && !fileInput.files.length) {
      if (typeof showToast === "function") showToast("Selecione um arquivo.", true);
      return;
    }

    const allowClientDownload = $("#cAllowDownload").checked;
    let item;

    try {
      if (isLink) {
        item = {
          id: typeof uid === "function" ? uid() : String(Date.now()),
          name,
          kind: "link",
          value: typeof normalizeUrl === "function" ? normalizeUrl(link) : link,
          allowClientDownload,
        };
      } else {
        const file = fileInput.files[0];
        if (file.size > 4 * 1024 * 1024) {
          if (typeof showToast === "function") showToast("O arquivo excede 4MB.", true);
          return;
        }
        const dataUrl = await readFileAsDataUrl(file);
        item = {
          id: typeof uid === "function" ? uid() : String(Date.now()),
          name,
          kind: "file",
          value: dataUrl,
          fileName: file.name,
          fileType: file.type,
          allowClientDownload,
        };
      }

      if (!Array.isArray(project.contracts)) {
        project.contracts = [];
      }

      project.contracts.push(item);
      if (typeof saveProjects === "function" && (await saveProjects())) {
        $("#cName").value = "";
        if ($("#cLink")) $("#cLink").value = "";
        fileInput.value = "";
        renderContracts(project);
        if (typeof showToast === "function") showToast("Documento adicionado.");
      }
    } catch (err) {
      console.error("Erro ao adicionar documento:", err);
      if (typeof showToast === "function") showToast("Erro ao processar o arquivo.", true);
    }
  });

  $$("#contractList .contract-download-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", async () => {
      const id = checkbox.dataset.contractId;
      const contract = project.contracts.find((c) => c.id === id);

      if (!contract) return;

      contract.allowClientDownload = checkbox.checked;

      if (typeof saveProjects === "function" && (await saveProjects())) {
        if (typeof showToast === "function") {
          showToast(
            checkbox.checked
              ? "Download liberado para o cliente."
              : "Download bloqueado para o cliente."
          );
        }
      }
    });
  });

  $$("#contractList .file-remove").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const contractItem = btn.closest(".contract-item");
      const id = contractItem ? contractItem.dataset.id : null;
      if (!id) return;

      project.contracts = project.contracts.filter((c) => c.id !== id);
      if (typeof saveProjects === "function" && (await saveProjects())) {
        renderContracts(project);
        if (typeof showToast === "function") showToast("Documento removido.");
      }
    });
  });
}

/* ---------------- Contratos (cliente, leitura) ---------------- */
function clientContractsHTML(project) {
  const contracts = project.contracts || [];

  if (!contracts.length) {
    return `
      <div class="panel">
        <h3>${ICONS.contratos} Documentos e links</h3>
        <div class="file-empty">Nenhum documento disponível.</div>
      </div>`;
  }

  const items = contracts
    .map((c) => {
      const kindLabel = c.kind === "link" ? "Link" : "Arquivo";
      const kindClass = c.kind === "link" ? "kind-link" : "kind-file";

      if (c.kind === "link") {
        const linkUrl = typeof normalizeUrl === "function" ? normalizeUrl(c.value) : c.value;
        return `
          <div class="contract-item">
            <span class="contract-kind ${kindClass}">${kindLabel}</span>

            <div class="contract-meta">
              <strong>${escapeHTML(c.name)}</strong>
              <span>${escapeHTML(c.value)}</span>
            </div>

            <a
              class="file-open"
              href="${escapeHTML(linkUrl)}"
              target="_blank"
              rel="noopener"
            >Abrir</a>
          </div>`;
      }

      const canDownload = c.allowClientDownload === true;

      const action = `
        <div class="file-actions">
          <button
            type="button"
            class="file-open contract-view-file"
            data-contract-id="${c.id}"
          >Visualizar</button>

          ${
            canDownload
              ? `
                <a
                  class="file-open"
                  href="${c.value}"
                  download="${escapeHTML(c.fileName || c.name)}"
                >Baixar</a>`
              : ""
          }
        </div>
      `;

      return `
        <div class="contract-item">
          <span class="contract-kind ${kindClass}">${kindLabel}</span>

          <div class="contract-meta">
            <strong>${escapeHTML(c.name)}</strong>
            <span>${escapeHTML(c.fileName || "Documento")}</span>
          </div>

          ${action}
        </div>`;
    })
    .join("");

  return `
    <div class="panel">
      <h3>${ICONS.contratos} Documentos e links</h3>
      <div class="contract-list">
        ${items}
      </div>
    </div>`;
}

function openContractFile(dataUrl) {
  try {
    const parts = dataUrl.split(",");
    const mime = parts[0].match(/data:(.*?);base64/)?.[1] || "application/octet-stream";
    const binary = atob(parts[1]);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: mime });
    const url = URL.createObjectURL(blob);

    window.open(url, "_blank", "noopener,noreferrer");

    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (error) {
    console.error("Erro ao visualizar arquivo:", error);
    if (typeof showToast === "function") showToast("Não foi possível visualizar este arquivo.", true);
  }
}

function attachClientContractViewers(project) {
  $$(".contract-view-file").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.contractId;
      const contract = (project.contracts || []).find((c) => c.id === id);

      if (!contract || !contract.value) {
        if (typeof showToast === "function") showToast("Arquivo não encontrado.", true);
        return;
      }

      openContractFile(contract.value);
    });
  });
}

function contractListHTML(contracts) {
  return contracts
    .map((c) => {
      const kindLabel = c.kind === "link" ? "Link" : "Arquivo";
      const kindClass = c.kind === "link" ? "kind-link" : "kind-file";
      const sub =
        c.kind === "link"
          ? c.value
          : `${c.fileName} · ${c.fileType || "arquivo"}`;

      const downloadControl =
        c.kind === "file"
          ? `
            <label class="contract-download-toggle">
              <input
                type="checkbox"
                class="contract-download-checkbox"
                data-contract-id="${c.id}"
                ${c.allowClientDownload === true ? "checked" : ""}
              />
              <span>Cliente pode baixar</span>
            </label>`
          : "";

      const linkTarget = c.kind === "link" ? (typeof normalizeUrl === "function" ? normalizeUrl(c.value) : c.value) : c.value;

      return `
        <div class="contract-item" data-id="${c.id}">
          <span class="contract-kind ${kindClass}">${kindLabel}</span>

          <div class="contract-meta">
            <strong>${escapeHTML(c.name)}</strong>
            <span>${escapeHTML(sub)}</span>
          </div>

          ${downloadControl}

          <a
            class="file-open"
            href="${escapeHTML(linkTarget)}"
            target="_blank"
            rel="noopener"
          >Abrir</a>

          <button
            class="file-remove"
            title="Remover documento"
          >✕</button>
        </div>`;
    })
    .join("");
}

/* ---------------- Memorial Descritivo (proprietário) ---------------- */
function memorialSectionHTML(project, key) {
  const table = MEMORIAL_TABLES[key];
  const rows = project.memorial ? project.memorial[key] || [] : [];

  const qtyTotal = rows.reduce((total, r) => total + (parseFloat(String(r.qty || "").replace(",", ".")) || 0), 0);
  const priceTotal = rows.reduce((total, r) => total + (parseFloat(String(r.qty || "").replace(",", ".")) || 0) * (typeof parsePrice === "function" ? parsePrice(r.preco) : 0), 0);

  const head = `<tr>${table.cols.map((c) => `<th>${escapeHTML(c.label)}</th>`).join("")}<th>Ações</th></tr>`;

  let body = "";
  if (!rows.length) {
    body = `<tr class="row-empty"><td colspan="${table.cols.length + 1}">Nenhum item cadastrado.</td></tr>`;
  } else {
    body = rows.map((r, rowIndex) => {
      const cells = table.cols.map((col) => {
        return `<td><input type="text" class="memorial-input" data-key="${key}" data-row="${rowIndex}" data-field="${col.key}" value="${escapeHTML(r[col.key] || "")}" /></td>`;
      });
      return `<tr>${cells.join("")}<td><button type="button" class="file-remove btn-delete-row" data-key="${key}" data-row="${rowIndex}">✕</button></td></tr>`;
    }).join("");
  }

  return `
    <div class="panel memorial-section" data-memorial-key="${key}">
      <div class="memorial-head">
        <h3>${ICONS.table} ${table.title}</h3>
        <button type="button" class="btn-secondary btn-add-row" data-key="${key}">+ Adicionar Item</button>
      </div>
      <div class="table-wrap">
        <table class="memorial-table">
          <thead>${head}</thead>
          <tbody>${body}</tbody>
        </table>
      </div>
      ${qtyTotal > 0 || priceTotal > 0 ? `
        <div class="memorial-summary">
          <strong>${table.title}:</strong> ${rows.length} item(ns)
          ${qtyTotal > 0 ? " · Qtd. total " + (typeof formatArea === "function" ? formatArea(qtyTotal) : qtyTotal) : ""}
          ${priceTotal > 0 ? " · Total: " + (typeof formatCurrency === "function" ? formatCurrency(priceTotal) : priceTotal) : ""}
        </div>` : ""}
    </div>`;
}

function memorialGrandTotalHTML(project) {
  let grandTotal = 0;
  if (project.memorial) {
    Object.keys(MEMORIAL_TABLES).forEach((key) => {
      const rows = project.memorial[key] || [];
      rows.forEach((r) => {
        const qty = parseFloat(String(r.qty || "").replace(",", ".")) || 0;
        const price = typeof parsePrice === "function" ? parsePrice(r.preco) : 0;
        grandTotal += qty * price;
      });
    });
  }

  if (grandTotal <= 0) return "";
  return `
    <div class="panel grand-total-panel">
      <h3>💰 Total Geral Estimado: <span>${typeof formatCurrency === "function" ? formatCurrency(grandTotal) : grandTotal}</span></h3>
    </div>`;
}

function renderMemorial(project) {
  const stage = STAGES.find((s) => s.id === "memorial");
  const container = $("#stageContainer");
  container.innerHTML = `
    <div class="stage-header">
      <h2>${stage.label}</h2>
      <p class="stage-hint">${stage.hint}</p>
    </div>
    <div class="panel">
      <h3>${ICONS.upload} Arquivos do memorial</h3>
      <label>Upload de PDFs, tabelas e orçamentos externos</label>
      ${makeDropzoneHTML("image/*,application/pdf,.dwg,.dxf,.xlsx,.csv")}
      <div class="file-list" id="memorialFiles">${fileListHTML(project.memorialFiles || [])}</div>
    </div>
    ${Object.keys(MEMORIAL_TABLES).map((key) => memorialSectionHTML(project, key)).join("")}
    ${memorialGrandTotalHTML(project)}`;

  if (!Array.isArray(project.memorialFiles)) {
    project.memorialFiles = [];
  }

  attachDropzone(container, project.memorialFiles, () => renderMemorial(project));

  $$("#memorialFiles .file-remove").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.closest(".file-item").dataset.fileId;
      project.memorialFiles = project.memorialFiles.filter((f) => f.id !== id);
      if (typeof saveProjects === "function") saveProjects().then(() => renderMemorial(project));
    });
  });

  $$(".btn-add-row").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.key;
      const row = {};
      MEMORIAL_TABLES[key].cols.forEach((col) => (row[col.key] = ""));
      if (!project.memorial) project.memorial = {};
      if (!Array.isArray(project.memorial[key])) project.memorial[key] = [];
      project.memorial[key].push(row);
      if (typeof saveProjects === "function") saveProjects().then(() => renderMemorial(project));
    });
  });

  $$(".btn-delete-row").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.key;
      const rowIndex = Number(btn.dataset.row);
      if (project.memorial && project.memorial[key]) {
        project.memorial[key].splice(rowIndex, 1);
        if (typeof saveProjects === "function") saveProjects().then(() => renderMemorial(project));
      }
    });
  });

  $$(".memorial-input").forEach((input) => {
    input.addEventListener("change", () => {
      const key = input.dataset.key;
      const rowIndex = Number(input.dataset.row);
      const field = input.dataset.field;
      if (project.memorial && project.memorial[key] && project.memorial[key][rowIndex]) {
        project.memorial[key][rowIndex][field] = input.value;
        if (typeof saveProjects === "function") saveProjects();
      }
    });
  });
}

/* ---------------- Cronograma de Obra ---------------- */
function renderSchedule(project) {
  const stage = STAGES.find((s) => s.id === "cronograma");
  const container = $("#stageContainer");
  if (!container || !stage) return;

  project.schedule = project.schedule || [];

  const rows = project.schedule.map((item, index) => `
    <tr>
      <td><input type="text" class="sched-input" data-idx="${index}" data-field="task" value="${escapeHTML(item.task || "")}" /></td>
      <td><input type="date" class="sched-input" data-idx="${index}" data-field="start" value="${item.start || ""}" /></td>
      <td><input type="date" class="sched-input" data-idx="${index}" data-field="end" value="${item.end || ""}" /></td>
      <td>
        <select class="sched-input" data-idx="${index}" data-field="status">
          <option value="A Fazer" ${item.status === "A Fazer" ? "selected" : ""}>A Fazer</option>
          <option value="Em Andamento" ${item.status === "Em Andamento" ? "selected" : ""}>Em Andamento</option>
          <option value="Concluído" ${item.status === "Concluído" ? "selected" : ""}>Concluído</option>
        </select>
      </td>
      <td><button type="button" class="file-remove btn-del-sched" data-idx="${index}">✕</button></td>
    </tr>
  `).join("");

  container.innerHTML = `
    <div class="stage-header">
      <h2>${stage.label}</h2>
      <p class="stage-hint">${stage.hint}</p>
    </div>
    <div class="panel">
      <div class="memorial-head">
        <h3>📅 Planejamento de Etapas</h3>
        <button type="button" class="btn-secondary" id="btnAddSched">+ Adicionar Atividade</button>
      </div>
      <div class="table-wrap">
        <table class="memorial-table">
          <thead>
            <tr>
              <th>Atividade / Fase</th>
              <th>Início Previsto</th>
              <th>Término Previsto</th>
              <th>Status</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            ${rows.length ? rows : '<tr class="row-empty"><td colspan="5">Nenhuma atividade cadastrada.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
    ${renderScheduleClientHTML(project)}`;

  $("#btnAddSched")?.addEventListener("click", () => {
    project.schedule.push({ task: "", start: "", end: "", status: "A Fazer" });
    saveProjects().then(() => renderSchedule(project)).catch((err) => console.error(err));
  });

  $$(".btn-del-sched").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.idx);
      project.schedule.splice(idx, 1);
      saveProjects().then(() => renderSchedule(project)).catch((err) => console.error(err));
    });
  });

  $$(".sched-input").forEach((input) => {
    input.addEventListener("change", () => {
      const idx = Number(input.dataset.idx);
      const field = input.dataset.field;
      if (project.schedule[idx]) {
        project.schedule[idx][field] = input.value;
        saveProjects().then(() => {
          const ganttWrapper = document.querySelector("#scheduleGanttBox");
          if (ganttWrapper) {
            ganttWrapper.outerHTML = renderScheduleClientHTML(project);
          }
        }).catch((err) => console.error(err));
      }
    });
  });
}

function changeScheduleMonth(delta) {
  currentScheduleDate.setMonth(currentScheduleDate.getMonth() + delta);
  const ganttWrapper = document.querySelector("#scheduleGanttBox");
  if (ganttWrapper && currentProject) {
    const proj = typeof currentProject === "function" ? currentProject() : currentProject;
    ganttWrapper.outerHTML = renderScheduleClientHTML(proj);
  }
}

function renderScheduleClientHTML(project) {
  const schedule = project && project.schedule ? project.schedule : [];
  const year = currentScheduleDate.getFullYear();
  const month = currentScheduleDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentScheduleDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  let daysHeaderHTML = "";
  for (let day = 1; day <= daysInMonth; day++) {
    daysHeaderHTML += `
      <div style="flex: 1; min-width: 24px; text-align: center; font-size: 0.7rem; color: #888; border-left: 1px solid #2a2a2a; padding: 4px 0;">
        ${day}
      </div>
    `;
  }

  let rowsHTML = "";
  if (schedule.length === 0) {
    rowsHTML = `<div style="padding: 20px; color: #888; font-size: 0.9rem; text-align: center;">Nenhum evento cadastrado no cronograma.</div>`;
  } else {
    rowsHTML = schedule.map((item) => {
      const itemTitle = item.task || item.title || item.activity || item.name || "Sem título";
      const rawStart = item.start || item.inicio || item.startDate;
      const rawEnd = item.end || item.termino || item.endDate;

      const startDate = rawStart ? new Date(`${rawStart}T00:00:00`) : null;
      const endDate = rawEnd ? new Date(`${rawEnd}T00:00:00`) : null;

      let barHTML = "";
      if (startDate && endDate) {
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month, daysInMonth);

        if (endDate >= monthStart && startDate <= monthEnd) {
          let startDay = (startDate.getFullYear() === year && startDate.getMonth() === month) ? startDate.getDate() : 1;
          let endDay = (endDate.getFullYear() === year && endDate.getMonth() === month) ? endDate.getDate() : daysInMonth;

          const leftPercent = ((startDay - 1) / daysInMonth) * 100;
          const widthPercent = ((endDay - startDay + 1) / daysInMonth) * 100;

          const startText = startDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
          const endText = endDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

          barHTML = `
            <div title="${itemTitle}: ${startText} a ${endText}"
                 style="position: absolute; left: ${leftPercent}%; width: ${widthPercent}%; top: 6px; bottom: 6px; background: linear-gradient(90deg, #e0a96d, #c48b4d); border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; overflow: hidden;">
              <span style="font-size: 0.65rem; color: #111; font-weight: bold; white-space: nowrap; padding: 0 4px;">
                ${startText} - ${endText}
              </span>
            </div>
          `;
        }
      }

      let gridCols = "";
      for (let d = 1; d <= daysInMonth; d++) {
        gridCols += `<div style="flex: 1; min-width: 24px; border-left: 1px solid #222; height: 100%;"></div>`;
      }

      return `
        <div style="display: flex; align-items: center; border-bottom: 1px solid #222; min-height: 44px; background: #161616;">
          <div style="width: 200px; min-width: 200px; padding: 8px 12px; color: #fff; font-size: 0.85rem; font-weight: 500; border-right: 1px solid #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${itemTitle}
          </div>
          <div style="position: relative; flex: 1; display: flex; height: 44px; align-items: center; background: #1a1a1a;">
            ${gridCols}
            ${barHTML}
          </div>
        </div>
      `;
    }).join("");
  }

  return `
    <div id="scheduleGanttBox" class="panel" style="padding: 0; border-radius: 12px; overflow: hidden; border: 1px solid #333; background: #141414; margin-top: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: #1a1a1a; border-bottom: 1px solid #333;">
        <div>
          <h3 style="margin: 0; color: #fff; font-size: 1.1rem;">📅 Visão do Cronograma (Gantt)</h3>
          <p style="margin: 4px 0 0 0; color: #888; font-size: 0.8rem;">Gráfico de barras e prazos mensais</p>
        </div>
        <div style="display: flex; align-items: center; gap: 12px; background: #222; padding: 6px 12px; border-radius: 8px; border: 1px solid #333;">
          <button type="button" onclick="changeScheduleMonth(-1)" style="background: none; border: none; color: #e0a96d; font-size: 1.1rem; cursor: pointer; padding: 0 4px;">◄</button>
          <span style="color: #fff; font-weight: 600; font-size: 0.9rem; text-transform: capitalize; min-width: 120px; text-align: center;">
            ${monthName}
          </span>
          <button type="button" onclick="changeScheduleMonth(1)" style="background: none; border: none; color: #e0a96d; font-size: 1.1rem; cursor: pointer; padding: 0 4px;">►</button>
        </div>
      </div>
      <div style="overflow-x: auto;">
        <div style="min-width: 800px;">
          <div style="display: flex; align-items: center; background: #222; border-bottom: 1px solid #333;">
            <div style="width: 200px; min-width: 200px; padding: 8px 12px; color: #aaa; font-size: 0.75rem; font-weight: bold; border-right: 1px solid #333;">
              SERVIÇOS / ETAPAS
            </div>
            <div style="flex: 1; display: flex;">${daysHeaderHTML}</div>
          </div>
          ${rowsHTML}
        </div>
      </div>
    </div>
  `;
}

function setupNewProjectModal() {
  const btnNew = $("#btnNewProject");
  const modal = $("#modalNewProject") || $("#newProjectModal") || document.querySelector(".modal");
  const form = $("#formNewProject") || document.querySelector("form");

  if (btnNew && modal) {
    btnNew.addEventListener("click", () => {
      modal.style.display = "flex";
      modal.removeAttribute("hidden");
    });
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      // Pega todos os inputs e selects do formulário
      const textInputs = Array.from(form.querySelectorAll("input[type='text'], input[type='number'], input:not([type])"));
      const selects = Array.from(form.querySelectorAll("select"));

      // 1. TÍTULO: Procura por ID/name ou pega o 1º campo de texto
      const titleInput = form.querySelector('#newProjectTitle, #projectTitleInput, [name="title"], [name="nome"]') || textInputs[0];
      
      // 2. CLIENTE: Procura por ID/name contendo 'client'/'cliente' ou pega o 2º campo de texto
      const clientInput = form.querySelector('#newProjectClient, #projectClientInput, [name="client"], [name="cliente"], [id*="client"], [name*="client"]') || textInputs[1];
      
      // 3. ÁREA: Procura por ID/name contendo 'area'/'metragem' ou pega o 3º campo de texto
      const areaInput = form.querySelector('#newProjectArea, [name="area"], [name="metragem"], [id*="area"]') || textInputs[2];

      // 4. SELECTS: Tipo e Status
      const typeSelect = form.querySelector('#newProjectType, [name="type"], [name="tipo"]') || selects[0];
      const statusSelect = form.querySelector('#newProjectStatus, [name="status"]') || selects[1];
      
      // 5. SENHA: Procura por campo de senha ou o 4º campo de texto
      const passwordInput = form.querySelector('input[type="password"], #newProjectPassword, [name="password"], [name="senha"]') || textInputs[3];

      const titleValue = titleInput ? titleInput.value.trim() : "";
      const clientValue = clientInput ? clientInput.value.trim() : "";

      if (!titleValue) {
        if (typeof showToast === "function") showToast("Preencha o título do projeto.", true);
        return;
      }

      const parsedArea = areaInput ? parseFloat(areaInput.value) : 0;

      // Objeto com mapeamento duplo (client / clientName) para suportar qualquer estrutura de card
      const rawProj = {
        id: "proj_" + Date.now(),
        title: titleValue,
        client: clientValue,
        clientName: clientValue,
        area: isNaN(parsedArea) ? 0 : parsedArea,
        type: typeSelect ? typeSelect.value : "Residencial",
        status: statusSelect ? statusSelect.value : "Em Andamento",
        clientPassword: passwordInput ? passwordInput.value.trim() : "",
        updatedAt: new Date().toISOString()
      };

      const newProj = typeof seedProject === "function" ? seedProject(rawProj) : rawProj;

      // 1. Adiciona o projeto à lista local imediatamente
      if (typeof projects !== "undefined" && Array.isArray(projects)) {
        projects.unshift(newProj);
      }

      // 2. Atualiza os filtros e re-renderiza o painel na hora
      if (typeof activeFilter !== "undefined") activeFilter = "todos";
      if (typeof searchTerm !== "undefined") searchTerm = "";

      if (typeof renderDashboard === "function") {
        renderDashboard();
      }

      // 3. Limpa e fecha o modal IMEDIATAMENTE (sem esperar o Firebase)
      form.reset();

      if (typeof closeAllOpenModals === "function") {
        closeAllOpenModals();
      } else {
        if (modal) {
          modal.style.display = "none";
          modal.setAttribute("hidden", "");
        }
        document.querySelectorAll(".modal-overlay, .modal-backdrop, .overlay, .backdrop").forEach((el) => {
          el.style.display = "none";
          el.classList.remove("active", "show", "open");
        });
      }

      if (typeof showToast === "function") {
        showToast("Projeto criado com sucesso!");
      }

      // 4. Salva no Firebase em segundo plano (background) para não travar a interface
      if (typeof saveProjects === "function") {
        saveProjects().catch((err) => {
          console.warn("Aviso: Falha ao sincronizar com o Firebase em segundo plano:", err);
        });
      }
    });
  }
}

/* ---------------- Modal & Toasts & Utilitários de Inicialização ---------------- */
function showToast(message, isError = false) {
  // Remove toast anterior se existir
  const existing = document.querySelector(".toast-popup");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = "toast-popup";
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: ${isError ? "#e74c3c" : "#27ae60"};
    color: #fff;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000;
    transition: opacity 0.3s ease;
  `;

  document.body.appendChild(toast);

  // Faz sumir após 3 segundos
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function showHubLocked() {
  let lockedEl = $(".hub-locked");
  if (!lockedEl) {
    lockedEl = document.createElement("div");
    lockedEl.className = "hub-locked";
    lockedEl.innerHTML = `
      <div class="hub-locked-card" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 50vh; text-align: center; gap: 15px;">
        <h2>Acesso Restrito</h2>
        <p>Esta área é reservada para a equipe de design.</p>
        <button type="button" class="btn-primary" id="btnUnlockHub">Desbloquear Painel</button>
      </div>`;
    document.body.appendChild(lockedEl);

    const unlockBtn = $("#btnUnlockHub");
    const modal = $("#pwdModal") || $("#passwordModal");
    const input = $("#pwdInput") || $("#passwordInput");
    const btnConfirm = $("#btnConfirmPwd") || $("#btnConfirmPassword");
    const btnCancel = $("#btnCancelPwd");

    if (unlockBtn && modal) {
      unlockBtn.addEventListener("click", () => {
        modal.style.display = "flex";
        modal.removeAttribute("hidden");
        if (input) {
          input.value = "";
          input.focus();
        }
      });

      btnCancel?.addEventListener("click", () => {
        modal.style.display = "none";
      });

      const verifyPassword = async () => {
        const pwd = input ? input.value.trim() : "";
        if (!pwd) {
          showToast("Digite a senha para continuar.", true);
          return;
        }

        try {
          showToast("Verificando credenciais...");
          if (typeof db !== "undefined" && db) {
            const configDoc = await db.collection("settings").doc("access").get();
            if (configDoc.exists && configDoc.data().password === pwd) {
              if (typeof unlockDesigner === "function") unlockDesigner();
              modal.style.display = "none";
              lockedEl.remove();
              showDashboard();
              showToast("Acesso liberado com sucesso!");
              return;
            }
          }
          showToast("Senha incorreta.", true);
        } catch (error) {
          console.error("Erro na validação do Firestore:", error);
          showToast("Erro ao conectar com o banco de dados.", true);
        }
      };

      btnConfirm?.addEventListener("click", verifyPassword);
    }
  }
}

/* ---------------- Compartilhamento ---------------- */
function openShareModal() {
  const p = typeof currentProject === "function" ? currentProject() : currentProject;
  if (!p) {
    showToast("Nenhum projeto selecionado.", true);
    return;
  }

  const modal = $("#shareModal") || document.querySelector("#shareModal") || document.querySelector(".share-modal");
  if (!modal) return;

  const nameEl = $("#shareProjectName");
  if (nameEl) nameEl.textContent = `Projeto: ${p.title}`;

  const pwdInput = $("#shareClientPasswordInput");
  if (pwdInput) pwdInput.value = p.clientPassword || "";

  const feedback = $("#savePasswordFeedback");
  if (feedback) feedback.style.display = "none";

  const projectSlug = p.slug || (typeof slugify === "function" ? slugify(p.title) : p.id) || p.id;
  const shareUrl = `${window.location.origin}${window.location.pathname}?p=${encodeURIComponent(projectSlug)}`;

  const linkInput = $("#shareLinkInput");
  if (linkInput) linkInput.value = shareUrl;

  // Garante que qualquer overlay existente fique ativo E clicável para fechar
  let overlay = document.querySelector(".modal-overlay, .backdrop, .modal-backdrop");
  if (!overlay) {
    // Se não existir overlay no HTML, cria um dinamicamente
    overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    document.body.appendChild(overlay);
  }

  // Estiliza e exibe o overlay
  overlay.style.display = "block";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100vw";
  overlay.style.height = "100vh";
  overlay.style.zIndex = "9998";
  overlay.classList.add("active", "show");

  // Configura o evento de clique NO OVERLAY para fechar tudo
  overlay.onclick = () => {
    closeShareModal();
  };

  // Exibe o modal acima do overlay
  modal.removeAttribute("hidden");
  modal.style.display = "flex";
  modal.style.position = "fixed";
  modal.style.zIndex = "9999";
  modal.classList.add("active", "show", "open");
}

function closeShareModal() {
  const modal = $("#shareModal") || document.querySelector("#shareModal") || document.querySelector(".share-modal");
  
  if (modal) {
    modal.setAttribute("hidden", "");
    modal.style.display = "none";
    modal.classList.remove("active", "show", "open");
  }

  // Esconde e desativa TODOS os overlays
  const overlays = document.querySelectorAll(".modal-overlay, .backdrop, .modal-backdrop");
  overlays.forEach((overlay) => {
    overlay.style.display = "none";
    overlay.classList.remove("active", "show", "open");
    overlay.onclick = null; // Limpa o evento
  });
}

/* ---------------- Listener Global para Fechar Modais ao Clicar Fora ---------------- */
window.addEventListener("click", (e) => {
  const shareModal = document.querySelector("#shareModal");
  const overlay = document.querySelector(".modal-overlay, .backdrop, .modal-backdrop");

  // Se o clique for exatamente no fundo escuro/overlay ou na área externa do modal
  if (e.target === shareModal || e.target === overlay) {
    closeShareModal();
  }
});

async function saveClientPassword() {
  const p = typeof currentProject === "function" ? currentProject() : currentProject;
  const pwdInput = $("#shareClientPasswordInput");
  const feedback = $("#savePasswordFeedback");

  if (!p || !pwdInput) return;

  p.clientPassword = pwdInput.value.trim();

  if (typeof saveProjects === "function") {
    await saveProjects();
  }

  if (feedback) feedback.style.display = "block";
  showToast("Senha do cliente salva!");
}

function copyShareLink() {
  const linkInput = $("#shareLinkInput");
  if (!linkInput || !linkInput.value) return;

  linkInput.select();
  navigator.clipboard.writeText(linkInput.value).then(() => {
    showToast("📋 Link copiado com sucesso!");
  }).catch(() => {
    prompt("Copie o link abaixo:", linkInput.value);
  });
}

function promptClientPassword(project) {
  const modal = $("#passwordModal") || $("#pwdModal");
  if (!modal) {
    openProject(project.id);
    return;
  }

  const hint = $("#passwordModalHint");
  if (hint) {
    hint.textContent = `Digite a senha de acesso para visualizar o projeto "${project.title}":`;
  }

  modal.removeAttribute("hidden");
  modal.style.display = "flex";

  const btnConfirm = $("#btnConfirmPassword") || $("#btnConfirmPwd");
  const pwdInput = $("#passwordInput") || $("#pwdInput");

  if (pwdInput) {
    pwdInput.value = "";
    pwdInput.focus();
  }

  const handleAuth = () => {
    const entered = pwdInput ? pwdInput.value.trim() : "";
    if (entered === project.clientPassword) {
      modal.setAttribute("hidden", "");
      modal.style.display = "none";
      openProject(project.id);
    } else {
      showToast("Senha incorreta. Tente novamente.", true);
    }
  };

  if (btnConfirm) {
    btnConfirm.onclick = handleAuth;
  }
}

function bindEvents() {
  setupNewProjectModal();

  const btnBack = $("#btnBack");
  if (btnBack) {
  $("#btnBack")?.addEventListener("click", showDashboard);
  }

  $("#btnNewProject")?.addEventListener("click", () => {
    const modal = $("#modalOverlay");
    if (!modal) {
      console.error("Modal de novo projeto não encontrado.");
      return;
    }

    modal.removeAttribute("hidden");
    modal.style.display = "flex";

    const form = $("#projectForm");
    if (form) form.reset();

    const preview = $("#dropzonePreview");
    const inner = $("#dropzoneInner");

    if (preview) preview.hidden = true;
    if (inner) inner.hidden = false;
  });
	
  $("#btnDesignerAccess")?.addEventListener("click", () => {
    if (typeof designerUnlocked !== "undefined" && designerUnlocked) {
      if (typeof lockDesigner === "function") lockDesigner();
      showToast("Acesso restrito ativado.");
    } else {
      const modal = $("#passwordModal") || $("#pwdModal");
      if (modal) {
        modal.removeAttribute("hidden");
        modal.style.display = "flex";
        const input = $("#passwordInput") || $("#pwdInput");
        if (input) {
          input.value = "";
          input.focus();
        }
      } else {
        showHubLocked();
      }
    }
  });

  $("#btnClientView")?.addEventListener("click", () => {
    if (typeof localPreview !== "undefined") localPreview = !localPreview;
    if (typeof setClientMode === "function") setClientMode(localPreview);
    if (typeof renderSidebar === "function") renderSidebar();
    if (typeof renderStage === "function") renderStage();
  });

  $("#btnShareProject")?.addEventListener("click", openShareModal);
  $("#btnCloseShare")?.addEventListener("click", closeShareModal);
  $("#btnSaveClientPassword")?.addEventListener("click", saveClientPassword);
  $("#btnCopyLink")?.addEventListener("click", copyShareLink);

  $("#btnDeleteProject")?.addEventListener("click", async () => {
    const p = typeof currentProject === "function" ? currentProject() : currentProject;
    if (!p) return;
    if (confirm(`Tem certeza que deseja excluir permanentemente o projeto "${p.title}"?`)) {
      if (typeof deleteProjectFromCloud === "function") await deleteProjectFromCloud(p.id);
      projects = projects.filter((proj) => proj.id !== p.id);
      showDashboard();
    }
  });

// Busca por qualquer ID de busca existente no HTML
  const searchEl = $("#searchProjects") || $("#searchInput") || document.querySelector('input[placeholder*="Buscar"]');
  if (searchEl) {
    searchEl.addEventListener("input", (e) => {
      searchTerm = e.target.value.toLowerCase().trim();
      renderDashboard();
    });
  }

  // Filtros
  const filterButtons = document.querySelectorAll(".filter-btn, [data-filter]");
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      
      const filterValue = (btn.dataset.filter || btn.textContent || "").toLowerCase().trim();
      activeFilter = filterValue;
      renderDashboard();
    });
  });
}

/* ---------------- Inicialização da Aplicação ---------------- */
async function init() {
  if (typeof DESIGNER_KEY !== "undefined" && sessionStorage.getItem(DESIGNER_KEY) === "true") {
    designerUnlocked = true;
  }

  bindEvents();

	const cloudProjects = typeof loadProjects === "function"
  ? await loadProjects()
  : [];	
	
	if (cloudProjects && cloudProjects.length > 0) {
    projects = cloudProjects.map((p) => (typeof seedProject === "function" ? seedProject(p) : p));
  } else if (typeof initialProjects !== "undefined") {
    projects = initialProjects;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const projectIdParam = urlParams.get("project") || urlParams.get("p");

  if (projectIdParam) {
    const targetProject = projects.find(
      (p) => p.id === projectIdParam || (typeof slugify === "function" && slugify(p.title) === slugify(projectIdParam)) || p.slug === projectIdParam
    );

    if (targetProject) {
      if (!designerUnlocked && targetProject.clientPassword) {
        clientMode = true;
        document.body.classList.add("client-view");
        promptClientPassword(targetProject);
      } else {
        if (!designerUnlocked) {
          clientMode = true;
          document.body.classList.add("client-view");
        }
        openProject(targetProject.id);
      }
    } else {
      showDashboard();
    }
  } else {
    showDashboard();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

/* ---------------- Sistema Global de Teclas e Modais ---------------- */
document.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    const active = document.activeElement;
    if (active && (active.type === "password" || active.tagName === "INPUT")) {
      const parentModal = active.closest("#passwordModal, #pwdModal, #shareModal");
      if (parentModal) {
        e.preventDefault();
        const confirmBtn = parentModal.querySelector("#btnConfirmPassword, #btnConfirmPwd, #btnSaveClientPassword");
        if (confirmBtn) confirmBtn.click();
      }
    }
  }

  if (e.key === "Escape") {
    closeAllOpenModals();
  }
});

document.addEventListener("click", function (e) {
  if (
    e.target.classList.contains("modal-overlay") ||
    e.target.classList.contains("modal") ||
    e.target.classList.contains("checklist-modal-overlay") ||
    e.target.id === "shareModal"
  ) {
    closeAllOpenModals();
  }
});

function closeAllOpenModals() {
  // Ignora modais de autenticação obrigatórios ao fechar
  const selectors = [".modal", ".modal-overlay", ".checklist-modal-overlay", "#shareModal"];

  selectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => {
      if (el.id !== "passwordModal" && el.id !== "pwdModal") {
        el.style.display = "none";
        el.classList.remove("active", "open", "show");
      }
    });
  });
}

function enableCardDragging() {
  const container = $("#projectsGrid") || document.querySelector(".projects-grid");
  if (!container) return;

  const cards = container.querySelectorAll(".project-card, .card");

  cards.forEach((card) => {
    card.removeAttribute("draggable");
    card.onpointerdown = null;

    card.onpointerdown = (e) => {
      // Ignora botões, links e inputs
      if (e.target.closest("button") || e.target.closest("a") || e.target.closest("input")) return;

      const box = card.getBoundingClientRect();
      const shiftX = e.clientX - box.left;
      const shiftY = e.clientY - box.top;

      let isDragging = false;

      // Impede a seleção azul de texto nativa do navegador
      document.body.style.userSelect = "none";
      document.body.style.webkitUserSelect = "none";

      const placeholder = document.createElement("div");
      placeholder.className = "card-placeholder";
      placeholder.style.cssText = `
        width: ${box.width}px;
        height: ${box.height}px;
        border: 2px dashed #4a5568;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.05);
        box-sizing: border-box;
      `;

      function moveAt(pageX, pageY) {
        card.style.left = pageX - shiftX + "px";
        card.style.top = pageY - shiftY + "px";
      }

      function onPointerMove(moveEvent) {
        // Cancela qualquer seleção de texto acidental durante o movimento
        moveEvent.preventDefault();

        if (!isDragging) {
          const dist = Math.hypot(moveEvent.clientX - e.clientX, moveEvent.clientY - e.clientY);
          if (dist < 5) return;

          isDragging = true;
          container.insertBefore(placeholder, card);

          card.style.cssText = `
            position: fixed;
            z-index: 10000;
            width: ${box.width}px;
            height: ${box.height}px;
            pointer-events: none;
            opacity: 0.9;
            transform: scale(1.02);
            box-shadow: 0 16px 32px rgba(0,0,0,0.3);
            transition: transform 0.05s ease;
            user-select: none;
            -webkit-user-select: none;
          `;
        }

        moveAt(moveEvent.clientX, moveEvent.clientY);

        const elementBelow = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
        if (!elementBelow) return;

        const targetCard = elementBelow.closest(".project-card, .card");
        if (targetCard && targetCard !== card && targetCard.parentNode === container) {
          const targetBox = targetCard.getBoundingClientRect();
          const isAfter = moveEvent.clientX > targetBox.left + targetBox.width / 2;
          if (isAfter) {
            container.insertBefore(placeholder, targetCard.nextSibling);
          } else {
            container.insertBefore(placeholder, targetCard);
          }
        }
      }

      function onPointerUp() {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);

        // Restaura a capacidade de selecionar texto normalmente no site
        document.body.style.userSelect = "";
        document.body.style.webkitUserSelect = "";

        if (isDragging) {
          if (placeholder.parentNode) {
            container.insertBefore(card, placeholder);
            placeholder.remove();
          }

          card.removeAttribute("style");
          card.style.cursor = "pointer";

          const renderedCards = [...container.querySelectorAll(".project-card, .card")];
          const newOrder = [];
          renderedCards.forEach((c) => {
            const cardId = c.dataset.projectId || c.dataset.id || c.getAttribute("data-id");
            const found = projects.find((p) => p.id === cardId);
            if (found && !newOrder.includes(found)) newOrder.push(found);
          });

          if (newOrder.length === projects.length) {
            projects = newOrder;
            if (typeof saveProjects === "function") saveProjects();
          }
        }
      }

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    };
  });
}
	
})();
