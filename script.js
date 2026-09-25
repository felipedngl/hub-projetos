(() => {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* Senha mestre do designer (altere aqui) e chave de persistência do desbloqueio */
const STORAGE_KEY = "archDashV3";
const DESIGNER_KEY = "archDashV3_designer";
const DESIGNER_EMAIL = "mencheinteriores@outlook.com";
const CLIENT_ACCESS_TTL = 7 * 24 * 60 * 60 * 1000;
const firebaseAuth = window.auth || null;

async function signInWithFirebase(email, password) {
  if (!firebaseAuth) {
    throw new Error("Firebase Auth não está disponível.");
  }

  return firebaseAuth.signInWithEmailAndPassword(email, password);
}

async function signOutFromFirebase() {
  if (!firebaseAuth) return;
  await firebaseAuth.signOut();
}

firebaseAuth?.onAuthStateChanged((user) => {
  if (user) {
    console.log(
      "[AUTH] Usuário autenticado:",
      user.email || user.uid
    );
  } else {
    console.log("[AUTH] Nenhum usuário autenticado.");
  }
});
	
function getFirebaseUser() {
  return firebaseAuth?.currentUser || null;
}
	
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
    { id: "site_log", label: "Diário de Obra", hint: "Acompanhe relatórios semanais, fotos do canteiro e pendências do cliente.", special: "site_log" },
  ];

const MEMORIAL_TABLES = {
    revestimentos: {
      title: "Revestimentos & Acabamentos",
      cols: [
		{ key: "foto", label: "Foto" },
        { key: "item", label: "Item" },
        { key: "ambiente", label: "Ambiente" },
        { key: "fornecedor", label: "Fornecedor" },
        { key: "qty", label: "Quantidade" },
        { key: "preco", label: "Preço" },
        { key: "status", label: "Status" },
        { key: "obs", label: "Observações" },
        { key: "link", label: "Link do Produto" },
      ],
    },
    metais: {
      title: "Metais & Louças",
      cols: [
		{ key: "foto", label: "Foto" },
        { key: "item", label: "Item" },
        { key: "ambiente", label: "Ambiente" },
        { key: "fornecedor", label: "Fornecedor" },
        { key: "qty", label: "Quantidade" },
        { key: "preco", label: "Preço" },
        { key: "status", label: "Status" },
        { key: "obs", label: "Observações" },
        { key: "link", label: "Link do Produto" },
      ],
    },
    iluminacao: {
      title: "Iluminação",
      cols: [
		{ key: "foto", label: "Foto" },
        { key: "item", label: "Item" },
        { key: "ambiente", label: "Ambiente" },
        { key: "fornecedor", label: "Fornecedor" },
        { key: "qty", label: "Quantidade" },
        { key: "preco", label: "Preço" },
        { key: "status", label: "Status" },
        { key: "obs", label: "Observações" },
        { key: "link", label: "Link do Produto" },
      ],
    },
    eletro: {
      title: "Eletrodomésticos",
      cols: [
		{ key: "foto", label: "Foto" },
        { key: "item", label: "Item" },
        { key: "ambiente", label: "Ambiente" },
        { key: "fornecedor", label: "Fornecedor" },
        { key: "qty", label: "Quantidade" },
        { key: "preco", label: "Preço" },
        { key: "status", label: "Status" },
        { key: "obs", label: "Observações" },
        { key: "link", label: "Link do Produto" },
      ],
    },
    moveis: {
      title: "Mobiliário",
      cols: [
		{ key: "foto", label: "Foto" },
        { key: "item", label: "Item" },
        { key: "ambiente", label: "Ambiente" },
        { key: "fornecedor", label: "Fornecedor" },
        { key: "qty", label: "Quantidade" },
        { key: "preco", label: "Preço" },
        { key: "status", label: "Status" },
        { key: "obs", label: "Observações" },
        { key: "link", label: "Link do Produto" },
      ],
    },
    marcenaria: {
      title: "Marcenaria",
      cols: [
		{ key: "foto", label: "Foto" },
        { key: "item", label: "Item" },
        { key: "ambiente", label: "Ambiente" },
        { key: "fornecedor", label: "Fornecedor" },
        { key: "qty", label: "Quantidade" },
        { key: "preco", label: "Preço" },
        { key: "status", label: "Status" },
        { key: "obs", label: "Observações" },
        { key: "link", label: "Link do Produto" },
      ],
    },
    decoracao: {
      title: "Decoração",
      cols: [
		{ key: "foto", label: "Foto" },
        { key: "item", label: "Item" },
        { key: "ambiente", label: "Ambiente" },
        { key: "fornecedor", label: "Fornecedor" },
        { key: "qty", label: "Quantidade" },
        { key: "preco", label: "Preço" },
        { key: "status", label: "Status" },
        { key: "obs", label: "Observações" },
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

 const initialProjects = [];

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

let unsubscribeProjectListener = null;
let unsubscribeClientMessagesListener = null;
let projectListenerSnapshot = null;
let messageAudioContext = null;

function initMessageAudio() {
  if (messageAudioContext) return;

  try {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return;

    messageAudioContext = new AudioContextClass();

    if (messageAudioContext.state === "suspended") {
      messageAudioContext.resume().catch(() => {});
    }
  } catch (error) {
    console.debug("Não foi possível inicializar o áudio:", error);
  }
}

document.addEventListener(
  "pointerdown",
  () => {
    initMessageAudio();
  },
  { once: true }
);

function enableClientSound() {
  try {
    initMessageAudio();

    if (!messageAudioContext) return;

    messageAudioContext.resume().then(() => {
      console.log("[SOM] Áudio do cliente ativado:", messageAudioContext.state);

      // Teste imediato do áudio
      const now = messageAudioContext.currentTime;

      const osc = messageAudioContext.createOscillator();
      const gain = messageAudioContext.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

      osc.connect(gain);
      gain.connect(messageAudioContext.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    }).catch((error) => {
      console.error("[SOM] Não foi possível iniciar o áudio:", error);
    });

  } catch (error) {
    console.error("[SOM] Erro ao ativar áudio:", error);
  }
}
	
const pendingLocalProjectWrites = new Map();

function markLocalProjectWrite(projectId) {
  if (!projectId) return;

  const current = pendingLocalProjectWrites.get(projectId) || 0;
  pendingLocalProjectWrites.set(projectId, current + 1);
}

function finishLocalProjectWrite(projectId) {
  if (!projectId) return;

  const current = pendingLocalProjectWrites.get(projectId) || 0;

  if (current <= 1) {
    pendingLocalProjectWrites.delete(projectId);
  } else {
    pendingLocalProjectWrites.set(projectId, current - 1);
  }
}

function hasPendingLocalProjectWrite(projectId) {
  return !!projectId && pendingLocalProjectWrites.has(projectId);
}

function playMessageSound() {	
  console.log("[SOM] playMessageSound chamado", {
  clientMode,
  audioContext: !!messageAudioContext,
  audioState: messageAudioContext?.state
});
	
  try {
if (!messageAudioContext) {
  initMessageAudio();
}

const ctx = messageAudioContext;

if (!ctx) return;

    const start = () => {
      if (ctx.state !== "running") return;

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
  let isFirstSnapshot = true; // Flag para controlar o som na primeira leitura

  // Listener separado para mensagens do cliente
if (typeof unsubscribeClientMessagesListener === "function") {
  unsubscribeClientMessagesListener();
  unsubscribeClientMessagesListener = null;
}

let knownClientMessageIds = new Set();
let clientMessagesListenerInitialized = false;
	
unsubscribeClientMessagesListener = db
  .collection("projects")
  .doc(String(projectId))
  .collection("clientMessages")
  .onSnapshot(
    (snapshot) => {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;

if (!clientMessagesListenerInitialized) {
  snapshot.forEach((doc) => {
    knownClientMessageIds.add(doc.id);
  });

  clientMessagesListenerInitialized = true;
}
		
      const messagesByStage = {};

      snapshot.forEach((doc) => {
        const message = {
          id: doc.id,
          ...doc.data()
        };

	  console.log(
    "[CHAT] Snapshot recebido:",
    message.id,
    message.author,
    message.text
  );

const isNewMessage =
  !knownClientMessageIds.has(message.id);

if (isNewMessage) {
  knownClientMessageIds.add(message.id);

if (
  (message.author === "designer" && clientMode) ||
  (message.author === "client" && !clientMode)
) {
  console.log("[SOM] Nova mensagem detectada:", message.author, message.text);
  playMessageSound();
}
}

        const stageId = message.stageId;
        if (!stageId) return;

        if (!messagesByStage[stageId]) {
          messagesByStage[stageId] = [];
        }

        messagesByStage[stageId].push(message);
      });

Object.keys(project.stages || {}).forEach((stageId) => {
  if (!project.stages[stageId]) return;

  const existingMessages =
    Array.isArray(project.stages[stageId].clientMessages)
      ? project.stages[stageId].clientMessages
      : [];

  const designerMessages =
    existingMessages.filter(
      (msg) => msg.author === "designer"
    );

  const clientMessages =
    messagesByStage[stageId] || [];

  const mergedMessages = [
    ...designerMessages,
    ...clientMessages
  ];

  const uniqueMessages = Array.from(
    new Map(
      mergedMessages.map((msg) => [
        String(msg.id),
        msg
      ])
    ).values()
  );

  project.stages[stageId].clientMessages =
    uniqueMessages.sort(
      (a, b) =>
        Number(a.createdAt || 0) -
        Number(b.createdAt || 0)
    );
});

      if (currentProject()?.id === projectId) {
        renderStage(true);
      }

      renderSidebar();
    },
    (error) => {
      console.error(
        "[CHAT] Erro no listener de mensagens:",
        error
      );
    }
  );

  unsubscribeProjectListener = db.collection("projects").doc(projectId).onSnapshot(
    (doc) => {
      if (!doc.exists) return;

	if (doc.metadata && doc.metadata.hasPendingWrites) {
	  console.log(
	    "[SYNC] Snapshot com pendingWrites ignorado:",
	    projectId
	  );
	  return;
	}
		
const updatedProject = {
  id: doc.id,
  ...doc.data()
};

const localProject =
  projects.find((p) => p.id === projectId);

if (localProject) {
  Object.keys(updatedProject.stages || {}).forEach((stageId) => {
    const localMessages =
      Array.isArray(
        localProject.stages?.[stageId]?.clientMessages
      )
        ? localProject.stages[stageId].clientMessages
        : [];

    const clientMessages =
      localMessages.filter(
        (msg) => msg.author === "client"
      );

    if (!updatedProject.stages[stageId]) {
      updatedProject.stages[stageId] = {};
    }

    const designerMessages =
      Array.isArray(
        updatedProject.stages[stageId].clientMessages
      )
        ? updatedProject.stages[stageId].clientMessages
        : [];

    updatedProject.stages[stageId].clientMessages =
      Array.from(
        new Map(
          [
            ...designerMessages,
            ...clientMessages
          ].map((msg) => [
            String(msg.id),
            msg
          ])
        ).values()
      ).sort(
        (a, b) =>
          Number(a.createdAt || 0) -
          Number(b.createdAt || 0)
      );
  });
}

console.log(
  "[SYNC] Mensagens detalhadas:",
  Object.entries(updatedProject.stages || {}).map(([stageId, stage]) => ({
    stageId,
    mensagens: (stage.clientMessages || []).map(msg => ({
      id: msg.id,
      author: msg.author,
      text: msg.text,
      createdAt: msg.createdAt
    }))
  }))
);

// ------------------------------------------------------------
// Ignora snapshots locais pendentes enquanto uma gravação
// ainda está acontecendo.
// ------------------------------------------------------------
if (hasPendingLocalProjectWrite(projectId)) {
  console.log(
    "[SYNC] Snapshot ignorado durante gravação local:",
    projectId
  );

  projectListenerSnapshot = updatedProject;
  return;
}

const previous = projectListenerSnapshot;
projectListenerSnapshot = updatedProject;

if (clientMode && previous) {
  Object.entries(updatedProject.stages || {}).forEach(
    ([stageId, stage]) => {
      const oldMessages =
        Array.isArray(previous.stages?.[stageId]?.clientMessages)
          ? previous.stages[stageId].clientMessages
          : [];

      const oldIds = new Set(
        oldMessages.map((msg) => msg.id)
      );

      const newDesignerMessages =
        Array.isArray(stage.clientMessages)
          ? stage.clientMessages.filter(
              (msg) =>
                msg.author === "designer" &&
                !oldIds.has(msg.id)
            )
          : [];

      if (newDesignerMessages.length > 0) {
        console.log(
          "[SOM] Nova mensagem do designer detectada:",
          newDesignerMessages
        );

        playMessageSound();
      }
    }
  );
}
		
const index = projects.findIndex(
  (p) => p.id === projectId
);

if (index !== -1) {
  projects[index] = {
    ...projects[index],
    ...updatedProject
  };
} else {
  projects.push(updatedProject);
}

if (currentProject()?.id === projectId) {
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

// ==========================================================
// PROTEÇÃO — IMPEDIR BASE64 NO FIRESTORE
// ==========================================================

function containsBase64Data(value, path = "project") {
  if (typeof value === "string") {
    return /^data:[^;]+;base64,/i.test(value);
  }

  if (Array.isArray(value)) {
    return value.some((item, index) =>
      containsBase64Data(item, `${path}[${index}]`)
    );
  }

  if (value && typeof value === "object") {
    return Object.entries(value).some(([key, val]) =>
      containsBase64Data(val, `${path}.${key}`)
    );
  }


  return false;
}

async function saveProjects(customProjects = null) {
  let listToSave = customProjects;

  if (!listToSave) {
    const current = currentProject();

    if (current) {
      listToSave = [current];
    } else {
      listToSave = projects;
    }
  }

  if (!Array.isArray(listToSave)) {
    listToSave = [listToSave];
  }

  listToSave = listToSave.filter(
    (proj) => proj && proj.id
  );

  if (!listToSave.length) {
    return false;
  }

  if (clientMode) {
    return;
  }

  const projectIds = listToSave.map((proj) => String(proj.id));

  projectIds.forEach(markLocalProjectWrite);
	
  saveQueue = saveQueue.then(async () => {
    try {
for (const proj of listToSave) {

  if (containsBase64Data(proj)) {
    console.error(
      "[FIRESTORE] Salvamento bloqueado: Base64 detectado no projeto.",
      proj.id,
      proj
    );

    if (typeof showToast === "function") {
      showToast(
        "Salvamento bloqueado: um arquivo ainda está sendo armazenado como Base64. O arquivo precisa ser enviado ao armazenamento antes de salvar.",
        true
      );
    }

    throw new Error(
      `Base64 detectado no projeto ${proj.id}. Salvamento no Firestore bloqueado.`
    );
  }

  await db
    .collection("projects")
    .doc(String(proj.id))
    .set(proj, { merge: true });
}

      return true;

    } catch (error) {
      console.error("Erro ao salvar no Firebase:", error);

      if (typeof showToast === "function") {
        showToast("Erro ao salvar na nuvem.", true);
      }

      return false;

    } finally {
      projectIds.forEach(finishLocalProjectWrite);
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
  if (!container) return;

  let dz = null;

  // Se o próprio container for o dropzone
  if (
    typeof container.matches === "function" &&
    container.matches("[data-dropzone]")
  ) {
    dz = container;
  }

  // Caso contrário, procura dentro dele
  if (!dz && typeof container.querySelector === "function") {
    dz = container.querySelector("[data-dropzone]");
  }

  if (!dz) {
    console.warn("attachDropzone: nenhum [data-dropzone] encontrado.", container);
    return;
  }

  const input =
    typeof dz.querySelector === "function"
      ? dz.querySelector("[data-file-input]")
      : null;

  if (!input) {
    console.warn("attachDropzone: nenhum [data-file-input] encontrado.");
    return;
  }

  input.addEventListener("change", async () => {
    try {
      if (
        input.files &&
        input.files.length &&
        (await importFiles(Array.from(input.files), arr))
      ) {
        rerender();
      }
    } catch (error) {
      console.error("Erro no upload do dropzone:", error);
    } finally {
      input.value = "";
    }
  });

  dz.addEventListener("dragover", (e) => {
    e.preventDefault();
    dz.classList.add("dragover");
  });

  dz.addEventListener("dragleave", () => {
    dz.classList.remove("dragover");
  });

  dz.addEventListener("drop", async (e) => {
    e.preventDefault();
    dz.classList.remove("dragover");

    try {
      const files = e.dataTransfer?.files;

      if (
        files &&
        files.length &&
        (await importFiles(Array.from(files), arr))
      ) {
        rerender();
      }
    } catch (error) {
      console.error("Erro no drop de arquivos:", error);
    }
  });
}

function fileListHTML(files) {
  // 1. Garantia contra o erro: se files não for uma lista (ex: undefined), usa lista vazia []
  const safeFiles = Array.isArray(files) ? files : [];

  // 2. Se a lista estiver vazia, retorna a mensagem
  if (safeFiles.length === 0) {
    return '<div class="file-empty">Nenhum arquivo nesta etapa ainda.</div>';
  }

  // 3. Renderiza os arquivos usando a lista segura (safeFiles)
  return safeFiles
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
            href="${f.dataUrl || f.url}"
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
    <article
      class="card project-card"
      data-id="${p.id}"
      data-project-id="${p.id}"
      tabindex="0"
      style="animation-delay: ${Math.min(index * 60, 360)}ms"
    >

      <div class="card-cover">

        <span class="card-badge badge-type-${p.type}">
          ${p.type}
        </span>

        <img
          src="${p.image || PLACEHOLDER}"
          alt="Capa do projeto ${escapeHTML(p.title)}"
          loading="lazy"
          onerror="this.src='${PLACEHOLDER}'"
        />

      </div>

      <div class="card-body">

        <h3 class="card-title">
          ${escapeHTML(p.title)}
        </h3>

        <div class="card-meta">
          <span title="Cliente">
            ${ICONS.client} ${escapeHTML(p.client)}
          </span>

          <span title="Metragem">
            ${ICONS.area} ${formatArea(p.area)} m²
          </span>
        </div>

        <div class="card-footer">

          ${
            unreadMessages > 0
              ? `
                <div class="card-message-row">
                  <span class="card-message-notification">
                    <span class="notification-dot"></span>
                    ${
                      unreadMessages === 1
                        ? "Nova mensagem"
                        : `${unreadMessages} novas mensagens`
                    }
                  </span>
                </div>
              `
              : ""
          }

          <div class="card-action-row">
            <span class="status-tag ${statusClass}">
              ${statusLabel}
            </span>

            <span class="btn-detail">
              Ver Detalhes
            </span>
          </div>

        </div>

      </div>

    </article>
  `;
}
	

function renderDashboard() {
  // Trava de segurança: se 'projects' não for uma lista (array), transforma em lista vazia
  if (!Array.isArray(projects)) projects = [];

  // Proteção: Se a lista de projetos estiver vazia mas já carregamos antes, 
  // não sobrescrevemos a tela para evitar que os cards sumam na atualização.
  if (projects.length === 0 && window._hasLoadedProjectsOnce) {
    return;
  }
  if (projects.length > 0) {
    window._hasLoadedProjectsOnce = true;
    projects = getOrderedProjects(projects);
  }

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
    // Só esvazia se realmente não houver projetos carregados no sistema
    if (projects.length > 0) {
      grid.innerHTML = "";
      emptyState.hidden = false;
    }
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
  initSortableGrid();

  if (typeof applyViewMode === "function" && typeof currentViewMode !== "undefined") {
    applyViewMode(currentViewMode);
  }
}
	
/* ---------------- Render: visão interna ---------------- */
function stageHasContent(project, stage) {
  if (stage.special === "schedule") {
    return Array.isArray(project.schedule) && project.schedule.length > 0;
  }

  // Checa se é o Diário de Obra e se tem relatórios cadastrados (acende a bolinha verde)
  if (stage.special === "site_log" || stage.id === "site_log") {
    const logs = project.stages?.site_log?.siteLogs;
    return Array.isArray(logs) && logs.length > 0;
  }

  if (stage.special === "contracts") {
    return (project.contracts || []).length > 0;
  }

  if (stage.special === "memorial") {
    const m = project.memorial || {};
    const hasRows = Object.values(m).some((rows) => Array.isArray(rows) && rows.length > 0);
    return hasRows || (project.memorialFiles || []).length > 0;
  }

const s = project.stages?.[stage.id];

const hasText = (s?.text?.trim() || "").length > 0;
const hasFiles = Array.isArray(s?.files) && s.files.length > 0;
const hasMessages = Array.isArray(s?.clientMessages) && s.clientMessages.length > 0;

console.log("DIAGNÓSTICO ETAPA:", project.title, stage.id, {
  hasText,
  hasFiles,
  hasMessages,
  text: s?.text,
  files: s?.files,
  messages: s?.clientMessages,
  messageIds: s?.clientMessages?.map((m) => m.id),
  messageAuthors: s?.clientMessages?.map((m) => m.author)
});

return !!(hasText || hasFiles || hasMessages);
}


function renderSidebar() {
  const p = currentProject();
  if (!p) return;

  const fullAccess = designerUnlocked && !clientMode && !localPreview;

  const projCover = $("#projCover");
if (projCover) {
  projCover.src = p.image || PLACEHOLDER;

  const coverPosition = Number(p.coverPosition ?? 50);

  projCover.style.objectPosition =
    `center ${Number.isFinite(coverPosition) ? coverPosition : 50}%`;

  projCover.onerror = () => {
    projCover.src = PLACEHOLDER;
  };
}

  const projTitle = $("#projTitle");
  if (projTitle) projTitle.textContent = p.title || "Projeto";

  const projMeta = $("#projMeta");
  if (projMeta) projMeta.textContent = `${p.client || ""} · ${formatArea(p.area)} m² · ${p.type || ""}`;

  const statusTag = $("#projStatusTag");
  const statusSel = $("#projStatus");

  if (statusTag && statusSel) {
    if (fullAccess) {
      statusTag.hidden = true;
      statusSel.hidden = false;
      statusSel.value = p.status || "briefing";
      statusSel.onchange = async () => {
        p.status = statusSel.value;
        if (typeof saveProjects === "function" && (await saveProjects())) {
          if (typeof showToast === "function") showToast("Status atualizado.");
        }
      };
    } else {
      statusSel.hidden = true;
      statusTag.textContent = STATUS_LABELS[p.status] || p.status;
      statusTag.className = "status-tag " + (STATUS_CLASS[p.status] || "");
      statusTag.hidden = false;
    }
  }

  const btnShare = $("#btnShareProject");
  const btnDelete = $("#btnDeleteProject");
  if (btnShare) btnShare.hidden = !fullAccess;
  if (btnDelete) btnDelete.hidden = !fullAccess;

  const navStages = STAGES || [];
  const stageNav = $("#stageNav");

  if (stageNav) {
    stageNav.innerHTML =
      '<div class="stage-nav-title">Etapas do projeto</div>' +
      navStages
        .map((stage, index) => {
          const done = typeof stageHasContent === "function" ? stageHasContent(p, stage) : false;
          const stageData = p.stages?.[stage.id];

          // Checa não lidos em mensagens
          const unreadMsg = clientMode
            ? typeof hasUnreadDesignerMessage === "function" && hasUnreadDesignerMessage(stageData)
            : typeof hasUnreadClientMessage === "function" && hasUnreadClientMessage(stageData);

          // Checa não lidos em arquivos
			const unreadFiles =
			  Array.isArray(stageData?.files) &&
			  stageData.files.some((f) => {
			    return clientMode
			      ? f.unreadByClient === true
			      : f.unreadByDesigner === true;
			  });
							
const checklist = Array.isArray(stageData?.checklist)
  ? stageData.checklist
  : [];

const hasCheckedItems =
  checklist.some((item) => item.done === true);

const checklistUnseen =
  clientMode &&
  stageData?.checklistUpdated === true;

const approved =
  stageData?.approved === true &&
  !!stageData?.approvedAt;

const dotClass = unreadMsg
  ? "message"
  : unreadFiles
    ? "file"
    : approved
      ? "approved"
      : checklistUnseen
        ? "checklist"
        : hasCheckedItems
          ? "done"
          : done
            ? "done"
            : "";
			
          return `
		  <button class="stage-link ${stage.id === currentStage ? "active" : ""} ${
			unreadMsg ? "has-unread-message" : ""
		  }" data-stage="${stage.id}">
		
			<span class="nav-label">
			  <span class="stage-number">${index + 1}</span>
			  ${stage.id === "briefing" ? "Briefing" : stage.label}
			</span>
		
			<span
			  class="nav-dot ${dotClass}"
			  title="Etapa"
			></span>
		
		  </button>`;
        })
        .join("");

    $$("#stageNav .stage-link").forEach((btn) => {
      btn.addEventListener("click", () => {
        currentStage = btn.dataset.stage;

        $$("#stageNav .stage-link").forEach((item) => {
          item.classList.toggle("active", item === btn);
        });

        if (typeof renderStage === "function") renderStage();

        // Marca como lidos sem chamar renderSidebar de novo (evita o congelamento)
        const currentP = currentProject();
        const stage = currentP?.stages?.[currentStage];

        if (stage) {
          let changed = false;

          if (Array.isArray(stage.clientMessages)) {
            stage.clientMessages.forEach((msg) => {
              if (clientMode) {
                if (msg.author === "designer" && msg.readByClient !== true) {
                  msg.readByClient = true;
                  changed = true;
                }
				} else {
				  if (msg.author === "client" && msg.readByDesigner !== true) {
				    msg.readByDesigner = true;
				    changed = true;
				
				    db.collection("projects")
				      .doc(String(p.id))
				      .collection("clientMessages")
				      .doc(String(msg.id))
				      .update({
				        readByDesigner: true
				      })
				      .catch((error) => {
				        console.error(
				          "[CHAT] Erro ao marcar mensagem como lida pelo designer:",
				          error
				        );
				      });
				  }
				}
            });
          }

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

				if (clientMode && changed && Array.isArray(stage.files)) {
			  db.collection("projects")
			    .doc(String(p.id))
			    .update({
			      [`stages.${currentStage}.files`]: stage.files
			    })
			    .catch((error) => {
			      console.error(
			        "[CLIENT] Erro ao marcar arquivos como lidos:",
			        error
			      );
			    });
			}

			if (changed || stage.checklistUpdated === true) {
			  if (stage.checklistUpdated === true) {
			    stage.checklistUpdated = false;
			  }
			
			  // Atualiza imediatamente o estado visual da etapa
			  btn.classList.remove("has-unread-message");
			
			  const dot = btn.querySelector(".nav-dot");
			
			  if (dot) {
			    dot.classList.remove("message", "file");
			  }
			
			  const badge = btn.querySelector(".unread-badge");
			  if (badge) badge.remove();
			
			  // Só o designer precisa salvar a leitura no projeto.
			  if (!clientMode && typeof saveProjects === "function") {
			    saveProjects();
			  }
			}
        }
      });
    });
  }
}

	
function openProject(id) {
  currentProjectId = id;

  if (clientMode) {
  const user = getFirebaseUser();

  if (!user) {
    console.error("[AUTH] Cliente sem usuário autenticado.");
    showDashboard();
    return;
  }

  const project = projects.find((p) => p.id === id);

  if (!project || project.clientUid !== user.uid) {
    console.error("[AUTH] Cliente tentou acessar projeto não autorizado:", id);
    showDashboard();
    return;
  }
}
	
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

if (clientMode && typeof setupClientNotificationPrompt === "function") {
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

  // Limpa a trava visual da tela de cliente para reexibir os cards e a busca
  document.body.classList.remove("client-view");

  if (typeof unsubscribeProjectListener === "function") {
    unsubscribeProjectListener();
    unsubscribeProjectListener = null;
  }
  projectListenerSnapshot = null;
  currentProjectId = null;

  document.querySelectorAll(".hub-locked").forEach((el) => el.remove());

  const viewProject = $("#view-project");
  const viewDashboard = $("#view-dashboard");

  if (viewProject) viewProject.hidden = true;
  if (viewDashboard) {
    viewDashboard.hidden = false;
    viewDashboard.style.display = "block";
  }

  const btnBack = $("#btnBack");
  if (btnBack) btnBack.hidden = true;

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
	if (stage.special === "site_log" || stage.id === "site_log") {
      const container = $("#stageContainer");
      if (container) {
        container.innerHTML = renderSiteLogHTML(project, true);
        if (typeof attachSiteLogEvents === "function") attachSiteLogEvents(project);
      }
      return;
    }
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

  <div class="stage-checklist-compact">
    <button
      type="button"
      class="stage-checklist-open-btn"
      id="btnOpenStageChecklist"
    >
      <span>
        ✓ Entregas da etapa
      </span>

      <strong>
        ${(s.checklist || []).filter(item => item.done).length}/${(s.checklist || []).length}
      </strong>

      <span class="stage-checklist-chevron">▾</span>
    </button>
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

			<div class="stage-deadline-block">
			  <label for="stageDeadline">Entrega prevista</label>
			
			  <div class="stage-deadline-row">
			    <input
			      type="date"
			      id="stageDeadline"
			      value="${s.deadline || ""}"
			    />
			
			    <div id="stageDeadlineStatus" class="stage-deadline-status"></div>
			  </div>
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

	  
function updateStageDeadlineStatus() {
  const statusEl = $("#stageDeadlineStatus");
  const deadlineInput = $("#stageDeadline");

  if (!statusEl || !deadlineInput) return;

  const deadline = deadlineInput.value;

  if (!deadline) {
    statusEl.innerHTML = "";
    statusEl.className = "stage-deadline-status";
    return;
  }

  const [year, month, day] = deadline.split("-").map(Number);

  const today = new Date();
  const todayUTC = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const deadlineUTC = Date.UTC(
    year,
    month - 1,
    day
  );

  const diffDays = Math.round(
    (deadlineUTC - todayUTC) / 86400000
  );

  statusEl.className = "stage-deadline-status";

  if (diffDays < 0) {
    const daysLate = Math.abs(diffDays);

    statusEl.classList.add("deadline-overdue");
    statusEl.textContent =
      `Passou da data da entrega em ${daysLate} ${daysLate === 1 ? "dia" : "dias"}.`;

  } else if (diffDays === 0) {

    statusEl.classList.add("deadline-today");
    statusEl.textContent = "DIA DE ENTREGA!";

  } else if (diffDays <= 3) {

    statusEl.classList.add("deadline-urgent");
    statusEl.textContent =
      diffDays === 1
        ? "Falta 1 dia para a entrega."
        : `Faltam ${diffDays} dias para a entrega.`;

  } else if (diffDays <= 7) {

    statusEl.classList.add("deadline-near");
    statusEl.textContent =
      `Faltam ${diffDays} dias para a entrega.`;

  } else if (diffDays <= 15) {

    statusEl.classList.add("deadline-warning");
    statusEl.textContent =
      `Faltam ${diffDays} dias para a entrega.`;

  } else {

    statusEl.classList.add("deadline-ok");
    statusEl.textContent =
      `Dentro do prazo · faltam ${diffDays} dias.`;
  }
}

updateStageDeadlineStatus();

stageDeadline?.addEventListener(
  "change",
  updateStageDeadlineStatus
);

if (btnSaveStageProgress) {
  btnSaveStageProgress.addEventListener("click", async () => {
    s.status = stageStatus.value;

    if (s.status !== "concluida") {
      s.approved = false;
      s.approvedAt = "";
    }

    s.deadline = stageDeadline.value;
    s.progress = getStageProgress(s);

    if (await saveProjects([project])) {
      showToast("Status da etapa atualizado.");
      renderStage();
    }
  });
}

const btnOpenStageChecklist = $("#btnOpenStageChecklist");

if (btnOpenStageChecklist) {
  btnOpenStageChecklist.addEventListener("click", () => {
    const checklist = Array.isArray(s.checklist)
      ? s.checklist
      : [];

    const modal = document.createElement("div");

    modal.className = "checklist-modal-overlay";

    modal.innerHTML = `
      <div class="checklist-modal">

        <div class="checklist-modal-header">
          <div>
            <span class="checklist-modal-label">
              Entregas da etapa
            </span>

            <h3>
              ${checklist.filter(item => item.done).length}/${checklist.length}
              concluídas
            </h3>
          </div>

          <button
            type="button"
            class="checklist-modal-close"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <div class="checklist-modal-body">

          ${
            checklist.length
              ? checklist.map((item, index) => `
                  <label class="stage-checklist-item">
                    <input
                      type="checkbox"
                      data-modal-checklist-index="${index}"
                      ${item.done ? "checked" : ""}
                    />

                    <span>${item.label}</span>
                  </label>
                `).join("")
              : `
                  <p class="stage-checklist-empty">
                    Nenhuma entrega adicionada ainda.
                  </p>
                `
          }

        </div>

        <div class="checklist-modal-footer">

          <button
            type="button"
            class="btn-secondary"
            id="btnAddChecklistItemModal"
          >
            + Adicionar entrega
          </button>

          <button
            type="button"
            class="btn-primary"
            id="btnCloseChecklistModal"
          >
            Concluir
          </button>

        </div>

      </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => {
      modal.remove();
    };

    modal
      .querySelector(".checklist-modal-close")
      ?.addEventListener("click", closeModal);

    modal
      .querySelector("#btnCloseChecklistModal")
      ?.addEventListener("click", closeModal);

    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        closeModal();
      }
    });

    modal
      .querySelectorAll("[data-modal-checklist-index]")
      .forEach((input) => {

        input.addEventListener("change", async () => {

          const index = Number(
            input.dataset.modalChecklistIndex
          );

          if (!s.checklist || !s.checklist[index]) {
            return;
          }

          s.checklist[index].done = input.checked;

          s.approved = false;
          s.approvedAt = "";

          s.checklistUpdated = true;

          const progress = getStageProgress(s);

          if (progress === 0) {
            s.status = "nao-iniciado";
          } else if (progress === 100) {
            s.status = "aguardando-aprovacao";
          } else {
            s.status = "em-producao";
          }

          s.progress = progress;

          await saveProjects([project]);

          const completed = s.checklist.filter(
            item => item.done
          ).length;

          const counter = modal.querySelector(
            ".checklist-modal-header h3"
          );

          if (counter) {
            counter.textContent =
              `${completed}/${s.checklist.length} concluídas`;
          }

          const counterButton =
            btnOpenStageChecklist.querySelector("strong");

          if (counterButton) {
            counterButton.textContent =
              `${completed}/${s.checklist.length}`;
          }

          renderStage();
        });
      });

    const btnAddChecklistItemModal =
      modal.querySelector("#btnAddChecklistItemModal");

    if (btnAddChecklistItemModal) {

      btnAddChecklistItemModal.addEventListener(
        "click",
        async () => {

          const label = prompt("Nome da entrega:");

          if (!label || !label.trim()) {
            return;
          }

          s.checklist = Array.isArray(s.checklist)
            ? s.checklist
            : [];

          s.checklist.push({
            label: label.trim(),
            done: false
          });

          if (await saveProjects([project])) {
            showToast("Entrega adicionada.");

            closeModal();

            renderStage();

            setTimeout(() => {
              $("#btnOpenStageChecklist")?.click();
            }, 50);
          }
        }
      );
    }
  });
}

$$("#stageFiles .file-remove").forEach((btn) => {
  btn.addEventListener("click", () => {
    const id = btn.closest(".file-item").dataset.fileId;

    s.files = s.files.filter(
      (f) => f.id !== id
    );

    saveProjects()
      .then(() => {
        renderStage();
      })
      .catch((err) =>
        console.error(
          "Erro ao salvar estágio:",
          err
        )
      );
  });
});

const designerInput = $("#designerMessageInput");
const designerButton = $("#btnSendDesignerMessage");

// EDIÇÃO DE MENSAGENS
$$("#stageConversation .btn-message-edit").forEach((button) => {
  button.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const messageId = button.dataset.messageId;

    const message = s.clientMes
	  

/* ---------------- Render: etapa (cliente, leitura) ---------------- */
function renderStageClient(project, stage) {
  if (!project) return;

  const stagesData = project.stages || {};
  const stageKey = (stage && stage.id) ? stage.id : "projeto_executivo";
	
  // Declaração ÚNICA da variável 's'
  const s = stagesData[stageKey] || { checklist: [], files: [], clientMessages: [], status: "nao_iniciado" };

// --- MARCAR MENSAGENS DO DESIGNER COMO LIDAS ---

let clientMessagesChanged = false;
	
if (Array.isArray(s.clientMessages)) {
  s.clientMessages.forEach((msg) => {
if (msg.author === "designer" && msg.readByClient !== true) {
  msg.readByClient = true;
  clientMessagesChanged = true;
	}
  });

if (clientMessagesChanged) {
  db.collection("projects")
    .doc(String(project.id))
    .update({
      [`stages.${stageKey}.clientMessages`]: s.clientMessages
    })
    .catch((error) => {
      console.error(
        "[CLIENT] Erro ao salvar mensagens como lidas:",
        error
      );
    });
}
	
  if (typeof renderSidebar === "function") {
    renderSidebar();
  }
}

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

  if (stage.special === "site_log" || stage.id === "site_log") {
    container.innerHTML = header + renderSiteLogHTML(project, false);
    attachSiteLogEvents(project);
    return;
  }

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

  // O cliente só vê como aprovado SE o status for "concluida" E a flag de aprovação estiver ativa.
  const isApproved = s.status === "concluida" && s.approved;

  // Declaração ÚNICA da variável approvalBadge
  const approvalBadge = isApproved
    ? `<div style="display:inline-flex; align-items:center; gap:6px; color:#48bb78; font-weight:700; font-size:0.9rem; margin-top:4px;">
         <span>✓ Etapa Aprovada pelo Cliente</span>
         ${s.approvedAt ? `<small style="color:#a0aec0; font-weight:normal;">(${s.approvedAt})</small>` : ""}
       </div>`
	: s.status === "aguardando-aprovacao"
	  ? `<button type="button" id="btnApproveStageClient" class="btn-primary" style="margin-top:8px; padding:6px 14px; font-size:0.85rem; background:#e56a44; border:none; border-radius:6px; cursor:pointer; color:#fff; font-weight:600;">
	       Aprovar Etapa
	     </button>`
	  : "";

  const stageStatusHTML = `
    <div class="panel stage-status-card ${(typeof STATUS_CLASS !== "undefined" && STATUS_CLASS[s.status]) || "status-nao-iniciado"}">
      <div class="stage-status-top">
        <div>
          <span class="stage-status-label">Status da etapa</span>
          <strong>${stageStatus}</strong>
          <div>${approvalBadge}</div>
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
    btnViewChecklist.addEventListener("click", async () => {

if (clientMode && project?.id && stageKey) {
  try {
    await db
      .collection("projects")
      .doc(String(project.id))
      .update({
        [`stages.${stageKey}.checklistUpdated`]: false
      });

    s.checklistUpdated = false;

    if (typeof renderSidebar === "function") {
      renderSidebar();
    }
  } catch (error) {
    console.error(
      "[CHECKLIST] Erro ao marcar entregas como vistas:",
      error
    );
  }
}

if (clientMode && project?.id && stageKey) {
  try {
    await db
      .collection("projects")
      .doc(String(project.id))
      .update({
        [`stages.${stageKey}.checklistUpdated`]: false
      });

    s.checklistUpdated = false;

    if (typeof renderSidebar === "function") {
      renderSidebar();
    }
  } catch (error) {
    console.error(
      "[CHECKLIST] Erro ao marcar entregas como vistas:",
      error
    );
  }
}
		
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

    const messageId =
      String(button.dataset.messageId || "").trim();

    if (!messageId) return;

    const index =
      Array.isArray(s.clientMessages)
        ? s.clientMessages.findIndex(
            (m) => String(m.id) === messageId
          )
        : -1;

    if (index < 0) return;

    const message =
      s.clientMessages[index];

    if (
      !message ||
      message.author !== "client"
    ) {
      return;
    }

    if (!confirm("Apagar esta mensagem?")) {
      return;
    }

try {

  const currentUser = getFirebaseUser();

  console.log("[CHAT DELETE] Diagnóstico:", {
    projectId: project.id,
    messageId: messageId,
    messageAuthor: message.author,
    currentUserUid: currentUser?.uid || null,
    projectClientUid: project.clientUid || null,
    currentUserEmail: currentUser?.email || null
  });

  const messageRef =
    db
      .collection("projects")
      .doc(String(project.id))
      .collection("clientMessages")
      .doc(messageId);

  const messageSnapshot = await messageRef.get();

  console.log(
    "[CHAT DELETE] Documento no Firestore:",
    messageSnapshot.exists
      ? messageSnapshot.data()
      : "DOCUMENTO NÃO EXISTE"
  );

  await messageRef.delete();

      /*
       * Remove somente a mensagem que acabou
       * de ser excluída da memória local.
       */
      s.clientMessages =
        s.clientMessages.filter(
          (m) => String(m.id) !== messageId
        );

      renderStageClient(project, stage);

      if (typeof showToast === "function") {
        showToast("Mensagem apagada.");
      }

    } catch (error) {

      console.error(
        "[CHAT] Erro ao apagar mensagem:",
        error
      );

      if (typeof showToast === "function") {
        showToast(
          "Não foi possível apagar a mensagem.",
          true
        );
      }
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

const messageId =
  typeof uid === "function" ? uid() : String(Date.now());

const clientMessage = {
  id: messageId,
  author: "client",
  text,
  createdAt: Date.now(),
  readByDesigner: false,
  stageId: stageKey,
  projectId: project.id
};

sendButton.disabled = true;
sendButton.textContent = "Enviando...";

try {
  await db
    .collection("projects")
    .doc(String(project.id))
    .collection("clientMessages")
    .doc(messageId)
    .set(clientMessage);

  if (input) input.value = "";

  renderStageClient(project, stage);

  if (typeof showToast === "function") {
    showToast("Observação enviada.");
  }
} catch (error) {
  console.error("[CHAT] Erro ao salvar mensagem do cliente:", error);

  sendButton.disabled = false;
  sendButton.textContent = "Enviar observação";

  if (typeof showToast === "function") {
    showToast("Erro ao enviar observação.", true);
  }
}
    });
  }

// Evento do botão de aprovação da etapa pelo cliente
const btnApproveStage = $("#btnApproveStageClient");

if (btnApproveStage) {
  btnApproveStage.addEventListener("click", async () => {
    if (!confirm("Deseja confirmar a aprovação formal desta etapa do projeto?")) {
      return;
    }

    const now = new Date();

    const formattedDate =
      now.toLocaleDateString("pt-BR") +
      " às " +
      now.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit"
      });

    btnApproveStage.disabled = true;
    btnApproveStage.textContent = "Aprovando...";

    try {
      s.approved = true;
      s.approvedAt = formattedDate;
      s.status = "concluida";
      s.progress = 100;

      await db
        .collection("projects")
        .doc(String(project.id))
        .update({
          [`stages.${stageKey}.approved`]: true,
          [`stages.${stageKey}.approvedAt`]: formattedDate,
          [`stages.${stageKey}.status`]: "concluida",
          [`stages.${stageKey}.progress`]: 100
        });

      if (typeof showToast === "function") {
        showToast("Etapa aprovada com sucesso!");
      }

      renderStageClient(project, stage);

    } catch (error) {
      console.error("[CLIENT] Erro ao aprovar etapa:", error);

      btnApproveStage.disabled = false;
      btnApproveStage.textContent = "Aprovar Etapa";

      if (typeof showToast === "function") {
        showToast("Não foi possível aprovar a etapa.", true);
      }
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
      .map((key, index) => {

        const table = MEMORIAL_TABLES[key];

        const rows =
          project.memorial
            ? project.memorial[key] || []
            : [];

        const qtyTotal = rows.reduce((total, r) => {
          return total +
            (parseFloat(
              String(r.qty || "").replace(",", ".")
            ) || 0);
        }, 0);

        const priceTotal = rows.reduce((total, r) => {

          const qty =
            parseFloat(
              String(r.qty || "").replace(",", ".")
            ) || 0;

          const price =
            typeof parsePrice === "function"
              ? parsePrice(r.preco)
              : 0;

          return total + qty * price;

        }, 0);

        const head = `
          <tr>
            ${table.cols
              .map(
                (c) =>
                  `<th>${escapeHTML(c.label)}</th>`
              )
              .join("")}
          </tr>
        `;

        let body;

        if (!rows.length) {

          body = `
            <tr class="row-empty">
              <td colspan="${table.cols.length}">
                Nenhum item cadastrado.
              </td>
            </tr>
          `;

        } else {

          body = rows
            .map((r) => {

              const cells =
                table.cols.map((col) => {

                  if (col.key === "link") {

                    const urlFormatted =
                      typeof normalizeUrl === "function"
                        ? normalizeUrl(r[col.key])
                        : r[col.key];

                    return r[col.key]
                      ? `
                        <td>
                          <a
                            class="memorial-link"
                            href="${escapeHTML(urlFormatted)}"
                            target="_blank"
                            rel="noopener"
                          >
                            ${escapeHTML(r[col.key])}
                          </a>
                        </td>
                      `
                      : "<td>—</td>";
                  }

                  if (col.key === "preco") {

                    const valor =
                      typeof parsePrice === "function"
                        ? parsePrice(r[col.key])
                        : 0;

                    return `
                      <td>
                        ${
                          valor > 0
                            ? (
                                typeof formatCurrency === "function"
                                  ? formatCurrency(valor)
                                  : valor
                              )
                            : ""
                        }
                      </td>
                    `;
                  }

				if (
				  col.key === "foto" ||
				  col.key === "imagem"
				) {
				
				  const imageUrl =
					r[col.key];
				
				  return imageUrl
					? `
					  <td class="memorial-client-photo-cell">
						<img
						  src="${escapeHTML(imageUrl)}"
						  alt="Foto do item"
						  class="memorial-client-item-photo"
						  loading="lazy"
						>
					  </td>
					`
					: "<td>—</td>";
				}

					return `
                    <td>
                      ${escapeHTML(r[col.key] || "")}
                    </td>
                  `;

                });

              return `
                <tr>
                  ${cells.join("")}
                </tr>
              `;

            })
            .join("");
        }

        return `
          <div class="memorial-client-section">

            <button
              type="button"
              class="memorial-client-section-toggle"
              aria-expanded="false"
              data-memorial-client-section="${escapeHTML(key)}"
            >

              <span class="memorial-client-section-number">
                ${String(index + 1).padStart(2, "0")}
              </span>

              <span class="memorial-client-section-info">

                <strong>
                  ${escapeHTML(table.title)}
                </strong>

                <span>
                  ${rows.length} item${rows.length === 1 ? "" : "s"}
                  ${
                    priceTotal > 0
                      ? ` · ${
                          typeof formatCurrency === "function"
                            ? formatCurrency(priceTotal)
                            : priceTotal
                        }`
                      : ""
                  }
                </span>

              </span>

              <span class="memorial-client-section-arrow">
                ›
              </span>

            </button>

            <div
              class="memorial-client-section-content"
              data-memorial-client-content="${escapeHTML(key)}"
              hidden
            >

              <div class="table-wrap">

                <table class="memorial-table">

                  <thead>
                    ${head}
                  </thead>

                  <tbody>
                    ${body}
                  </tbody>

                </table>

              </div>

              ${
                qtyTotal > 0 || priceTotal > 0
                  ? `
                    <div class="memorial-summary">

                      <strong>
                        ${escapeHTML(table.title)}:
                      </strong>

                      ${rows.length} item(ns)

                      ${
                        qtyTotal > 0
                          ? " · Qtd. total " +
                            (
                              typeof formatArea === "function"
                                ? formatArea(qtyTotal)
                                : qtyTotal
                            )
                          : ""
                      }

                      ${
                        priceTotal > 0
                          ? " · " +
                            (
                              typeof formatCurrency === "function"
                                ? formatCurrency(priceTotal)
                                : priceTotal
                            )
                          : ""
                      }

                    </div>
                  `
                  : ""
              }

            </div>

          </div>
        `;

      })
      .join("") +

    memorialGrandTotalHTML(project) +

    (
      project.memorialFiles &&
      project.memorialFiles.length
        ? `
          <div class="panel">
            <h3>
              ${ICONS.upload}
              Arquivos do memorial
            </h3>

            ${clientFilesHTML(project.memorialFiles)}
          </div>
        `
        : ""
    )
  );
}

// ==========================================================
// ABRIR / FECHAR CATEGORIAS DO MEMORIAL DO CLIENTE
// ==========================================================

document.addEventListener("click", (event) => {

  const button =
    event.target.closest(
      ".memorial-client-section-toggle"
    );

  if (!button) return;

  const key =
    button.dataset.memorialClientSection;

  const content =
    document.querySelector(
      `[data-memorial-client-content="${key}"]`
    );

  if (!content) return;

  const isOpen =
    button.getAttribute("aria-expanded") === "true";

  button.setAttribute(
    "aria-expanded",
    String(!isOpen)
  );

  content.hidden = isOpen;
});	

// ==========================================================
// CONTRATOS — UPLOAD PARA O SUPABASE STORAGE
// ==========================================================

async function uploadContractToStorage(file) {
  if (!file) {
    throw new Error("Nenhum arquivo foi fornecido.");
  }

  const MAX_CONTRACT_SIZE = 10 * 1024 * 1024; // 10 MB

  if (file.size > MAX_CONTRACT_SIZE) {
    throw new Error(
      "O contrato é muito grande. O tamanho máximo permitido é 10 MB."
    );
  }

  const cleanBaseUrl = SUPABASE_URL.replace(/\/$/, "");
  const bucketName = "menche-files";

  const originalName = file.name || "contrato";

  const cleanName = originalName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.-]/g, "_");

  const uniqueName =
    `contrato_${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${cleanName}`;

  const uploadUrl =
    `${cleanBaseUrl}/storage/v1/object/${bucketName}/${encodeURIComponent(uniqueName)}`;

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "apikey": SUPABASE_KEY,
      "Content-Type": file.type || "application/octet-stream",
      "x-upsert": "true"
    },
    body: file
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    throw new Error(
      errorData.message ||
      errorData.error ||
      `Erro HTTP ${response.status}`
    );
  }

  return `${cleanBaseUrl}/storage/v1/object/public/${bucketName}/${encodeURIComponent(uniqueName)}`;
}


// ==========================================================
// CONTRATOS & DOCUMENTOS
// ==========================================================

function renderContracts(project) {
  const stage = STAGES.find((s) => s.id === "contratos");
  const container = $("#stageContainer");

  if (!container || !stage) return;

  container.innerHTML = `
    <div class="stage-header">
      <h2>${stage.label}</h2>
      <p class="stage-hint">${stage.hint}</p>
    </div>

    <div class="panel">
      <h3>${ICONS.contratos} Documentos e links</h3>

      <div class="contract-list" id="contractList">
        ${
          project.contracts && project.contracts.length
            ? contractListHTML(project.contracts)
            : '<div class="file-empty">Nenhum contrato registrado.</div>'
        }
      </div>

      <div class="contract-form">
        <div class="field-row">
          <div class="field">
            <label for="cName">Nome do documento</label>
            <input
              type="text"
              id="cName"
              placeholder="Ex.: Contrato de prestação de serviços"
            />
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
          <input
            type="url"
            id="cLink"
            placeholder="https://drive.google.com/..."
          />
        </div>

        <div class="field" id="cFileField" hidden>
          <label for="cFile">Arquivo</label>
          <input
            type="file"
            id="cFile"
            accept=".pdf,image/*,.doc,.docx"
          />
        </div>

        <div class="contract-download-permission">
          <label>
            <input type="checkbox" id="cAllowDownload" />
            Permitir que o cliente faça download deste documento
          </label>
        </div>

        <div>
          <button
            type="button"
            class="btn-small"
            id="btnAddContract"
          >
            + Adicionar documento
          </button>
        </div>
      </div>
    </div>
  `;

  const kindSel = $("#cKind");
  const linkField = $("#cLinkField");
  const fileField = $("#cFileField");

  const toggle = () => {
    const isLink = kindSel.value === "link";

    linkField.hidden = !isLink;
    fileField.hidden = isLink;
  };

  kindSel.addEventListener("change", toggle);
  toggle();

  $("#btnAddContract").addEventListener("click", async () => {
    const name = $("#cName").value.trim();
    const isLink = kindSel.value === "link";
    const link = isLink ? $("#cLink").value.trim() : "";
    const fileInput = $("#cFile");

    if (!name) {
      if (typeof showToast === "function") {
        showToast("Informe o nome do documento.", true);
      }
      return;
    }

    if (isLink && !link) {
      if (typeof showToast === "function") {
        showToast("Informe o link.", true);
      }
      return;
    }

    if (!isLink && (!fileInput.files || !fileInput.files.length)) {
      if (typeof showToast === "function") {
        showToast("Selecione um arquivo.", true);
      }
      return;
    }

    const allowClientDownload = $("#cAllowDownload").checked;

    let item = null;

    try {
      // ======================================================
      // CONTRATO DO TIPO LINK
      // ======================================================

      if (isLink) {
        item = {
          id: typeof uid === "function"
            ? uid()
            : String(Date.now()),

          name,

          kind: "link",

          value:
            typeof normalizeUrl === "function"
              ? normalizeUrl(link)
              : link,

          allowClientDownload
        };
      }

      // ======================================================
      // CONTRATO DO TIPO ARQUIVO
      // ======================================================

      else {
        const file = fileInput.files[0];

        if (!file) {
          if (typeof showToast === "function") {
            showToast("Selecione um arquivo.", true);
          }
          return;
        }

        if (file.size > 10 * 1024 * 1024) {
          if (typeof showToast === "function") {
            showToast(
              "O contrato é muito grande. O tamanho máximo permitido é 10 MB.",
              true
            );
          }
          return;
        }

        if (typeof showToast === "function") {
          showToast(`Enviando ${file.name}...`, false);
        }

        // IMPORTANTE:
        // O arquivo NÃO passa por FileReader,
        // readAsDataURL() ou Base64.
        //
        // Ele vai diretamente para o Supabase Storage.
        const publicUrl = await uploadContractToStorage(file);

        item = {
          id: typeof uid === "function"
            ? uid()
            : String(Date.now()),

          name,

          kind: "file",

          // SOMENTE A URL FICA NO FIRESTORE.
          value: publicUrl,

          fileName: file.name,

          fileType:
            file.type || "application/octet-stream",

          fileSize: file.size,

          allowClientDownload
        };

        if (typeof showToast === "function") {
          showToast("Contrato enviado com sucesso!", false);
        }
      }

      // ======================================================
      // SALVAR METADADOS DO CONTRATO NO PROJETO
      // ======================================================

      if (!Array.isArray(project.contracts)) {
        project.contracts = [];
      }

      project.contracts.push(item);

      if (
        typeof saveProjects === "function" &&
        (await saveProjects())
      ) {
        $("#cName").value = "";

        if ($("#cLink")) {
          $("#cLink").value = "";
        }

        if ($("#cFile")) {
          $("#cFile").value = "";
        }

        if ($("#cAllowDownload")) {
          $("#cAllowDownload").checked = false;
        }

        renderContracts(project);

        if (typeof showToast === "function") {
          showToast("Documento adicionado.");
        }
      }

    } catch (err) {
      console.error(
        "Erro ao adicionar documento:",
        err
      );

      if (typeof showToast === "function") {
        showToast(
          err?.message ||
          "Erro ao processar o arquivo.",
          true
        );
      }
    }
  });

  // ==========================================================
  // PERMISSÃO DE DOWNLOAD
  // ==========================================================

  $$("#contractList .contract-download-checkbox").forEach(
    (checkbox) => {
      checkbox.addEventListener("change", async () => {
        const id = checkbox.dataset.contractId;

        const contract =
          project.contracts.find((c) => c.id === id);

        if (!contract) return;

        contract.allowClientDownload =
          checkbox.checked;

        if (
          typeof saveProjects === "function" &&
          (await saveProjects())
        ) {
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
  }

}

  // ==========================================================
  // REMOVER CONTRATO
  // ==========================================================

  $$("#contractList .file-remove").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const contractItem =
        btn.closest(".contract-item");

      const id =
        contractItem
          ? contractItem.dataset.id
          : null;

      if (!id) return;

      project.contracts =
        project.contracts.filter(
          (c) => c.id !== id
        );

      if (
        typeof saveProjects === "function" &&
        (await saveProjects())
      ) {
        renderContracts(project);

        if (typeof showToast === "function") {
          showToast("Documento removido.");
        }
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

// ============================================================
// MEMORIAL DESCRITIVO — NOVO NÚCLEO
// ============================================================

function memorialNumber(value) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  let text = String(value).trim();

  // Remove espaços e símbolos.
  text = text.replace(/[^\d,.-]/g, "");

  // Formato brasileiro:
  // 1.250,50 -> 1250.50
  if (text.includes(",")) {
    text = text
      .replace(/\./g, "")
      .replace(",", ".");
  }

  const number = parseFloat(text);

  return Number.isFinite(number) ? number : 0;
}


function memorialPrice(value) {
  return memorialNumber(value);
}


function memorialQuantity(value) {
  return memorialNumber(value);
}


function memorialFormatPrice(value) {
  const number = memorialPrice(value);

  return number.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}


function memorialRowTotal(row) {
  if (!row) return 0;

  const quantity = memorialQuantity(row.qty);
  const price = memorialPrice(row.preco);

  return quantity * price;
}


function memorialCategoryTotals(rows) {
  const safeRows = Array.isArray(rows) ? rows : [];

  const quantity = safeRows.reduce(
    (total, row) =>
      total + memorialQuantity(row.qty),
    0
  );

  const price = safeRows.reduce(
    (total, row) =>
      total + memorialRowTotal(row),
    0
  );

  return {
    quantity,
    price
  };
}


function memorialGrandTotal(project) {
  if (!project || !project.memorial) {
    return 0;
  }

  return Object.keys(MEMORIAL_TABLES).reduce(
    (total, key) => {
      const rows = Array.isArray(project.memorial[key])
        ? project.memorial[key]
        : [];

      return (
        total +
        rows.reduce(
          (subtotal, row) =>
            subtotal + memorialRowTotal(row),
          0
        )
      );
    },
    0
  );
}


function memorialEnsureStructure(project) {
  if (!project.memorial || typeof project.memorial !== "object") {
    project.memorial = {};
  }

  Object.keys(MEMORIAL_TABLES).forEach((key) => {
    if (!Array.isArray(project.memorial[key])) {
      project.memorial[key] = [];
    }

    project.memorial[key] = project.memorial[key].map((row) => {
      const normalizedRow = {};

      MEMORIAL_TABLES[key].cols.forEach((col) => {
        normalizedRow[col.key] =
          row && row[col.key] != null
            ? row[col.key]
            : "";
      });

      return normalizedRow;
    });
  });

  if (!Array.isArray(project.memorialFiles)) {
    project.memorialFiles = [];
  }

  return project;
}


function memorialCreateEmptyRow(key) {
  const row = {};

  MEMORIAL_TABLES[key].cols.forEach((col) => {
    row[col.key] = "";
  });

  return row;
}


function memorialMarkDirty(project) {
  if (!project || !project.id) return;

  project.__memorialDirty = true;
}


async function memorialSave(project) {
  if (!project || !project.id) {
    return false;
  }

  project.__memorialDirty = true;

  const result = await saveProjects([project]);

  if (result) {
    project.__memorialDirty = false;
  }

  return result;
}


function memorialUpdateAllTotals(project) {
  Object.keys(MEMORIAL_TABLES).forEach((key) => {
    updateCategorySummary(key, project);
  });

  const total = memorialGrandTotal(project);

  document
    .querySelectorAll(".memorial-grand-total")
    .forEach((element) => {
      element.textContent = memorialFormatPrice(total);
    });
}


function updateCategorySummary(key, project) {
  if (!project || !project.memorial) return;

  const section = document.querySelector(
    `.memorial-section[data-category="${key}"]`
  );

  if (!section) return;

  const table = MEMORIAL_TABLES[key];

  if (!table) return;

  const rows = Array.isArray(project.memorial[key])
    ? project.memorial[key]
    : [];

  const totals = memorialCategoryTotals(rows);

  const summary = section.querySelector(
    ".memorial-summary"
  );

  if (!summary) return;

  let text =
    `<strong>${escapeHTML(table.title)}:</strong> ` +
    `${rows.length} item(ns)`;

  if (totals.quantity > 0) {
    text +=
      ` · Qtd. total: ` +
      `${totals.quantity}`;
  }

  if (totals.price > 0) {
    text +=
      ` · Total da Categoria: ` +
      `${memorialFormatPrice(totals.price)}`;
  }

  summary.innerHTML = text;
}


function memorialSectionHTML(project, key) {
  const table = MEMORIAL_TABLES[key];

  if (!table) {
    return "";
  }

  const rows = Array.isArray(project.memorial[key])
    ? project.memorial[key]
    : [];

  const totals = memorialCategoryTotals(rows);

  const rowsHTML = rows.length
    ? rows.map((row, rowIndex) => {
        const cells = table.cols.map((col) => {
          const value =
            row[col.key] != null
              ? row[col.key]
              : "";

          // 1. STATUS
          if (col.key === "status") {
            return `
              <td>
                <select
                  class="memorial-input"
                  data-key="${escapeHTML(key)}"
                  data-row="${rowIndex}"
                  data-field="${escapeHTML(col.key)}"
                >
                  <option value="">Selecionar</option>
                  <option value="A definir" ${value === "A definir" ? "selected" : ""}>A definir</option>
                  <option value="Comprado" ${value === "Comprado" ? "selected" : ""}>Comprado</option>
                  <option value="Entregue" ${value === "Entregue" ? "selected" : ""}>Entregue</option>
                </select>
              </td>
            `;
          }

          // 2. LINK
          if (col.key === "link") {
            return `
              <td>
                <input
                  type="url"
                  class="memorial-input"
                  data-key="${escapeHTML(key)}"
                  data-row="${rowIndex}"
                  data-field="${escapeHTML(col.key)}"
                  value="${escapeHTML(value)}"
                  placeholder="https://..."
                >
              </td>
            `;
          }

          // 3. QUANTIDADE
          if (col.key === "qty") {
            return `
              <td>
                <input
                  type="text"
                  inputmode="decimal"
                  class="memorial-input"
                  data-key="${escapeHTML(key)}"
                  data-row="${rowIndex}"
                  data-field="${escapeHTML(col.key)}"
                  value="${escapeHTML(value)}"
                  placeholder="0"
                >
              </td>
            `;
          }

          // 4. PREÇO
          if (col.key === "preco") {
            return `
              <td>
                <input
                  type="text"
                  inputmode="decimal"
                  class="memorial-input memorial-price-input"
                  data-key="${escapeHTML(key)}"
                  data-row="${rowIndex}"
                  data-field="${escapeHTML(col.key)}"
                  value="${escapeHTML(value)}"
                  placeholder="R$ 0,00"
                >
              </td>
            `;
          }

          // 5. AMBIENTE (Com Autocompletar Alfabético)
          if (col.key === "ambiente") {
            return `
              <td>
                <input
                  type="text"
                  class="memorial-input"
                  data-key="${escapeHTML(key)}"
                  data-row="${rowIndex}"
                  data-field="${escapeHTML(col.key)}"
                  value="${escapeHTML(value)}"
                  list="sugestoes-ambientes-${escapeHTML(key)}"
                  placeholder="Ex: Sala de Estar"
                >
                <datalist id="sugestoes-ambientes-${escapeHTML(key)}">
                  <option value="Adega">
                  <option value="Área de Serviço">
                  <option value="Banheiro 1">
                  <option value="Banheiro 2">
                  <option value="Banheiro de Serviço">
                  <option value="Banheiro Master">
                  <option value="Banheiro Social">
                  <option value="Berçário">
                  <option value="Brinquedoteca">
                  <option value="Closet">
                  <option value="Cozinha">
                  <option value="Cozinha Gourmet">
                  <option value="Depósito">
                  <option value="Despensa">
                  <option value="Escritório">
                  <option value="Garagem">
                  <option value="Hall de entrada">
                  <option value="Home Theater">
                  <option value="Lavabo">
                  <option value="Lavanderia">
                  <option value="Quarto 1">
                  <option value="Quarto 2">
                  <option value="Quarto 3">
                  <option value="Quarto de Hóspedes">
                  <option value="Sala de Estar">
                  <option value="Sala de Jantar">
                  <option value="Sala de Música">
                  <option value="Sala de TV">
                  <option value="Suíte 1">
                  <option value="Suíte 2">
                  <option value="Suíte 3">
                  <option value="Suíte Master">
                  <option value="Terraço Gourmet">
                  <option value="Varanda">
                </datalist>
              </td>
            `;
          }

// 6. FOTO / IMAGEM (Suporta Ctrl+V para colar imagem direto do site)
if (col.key === "foto" || col.key === "imagem") {
            return `
              <td>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <!-- Área visual da foto -->
                  <div 
                    class="memorial-image-upload-wrapper" 
                    data-key="${escapeHTML(key)}" 
                    data-row="${rowIndex}" 
                    style="width: 50px; height: 50px; border: 2px dashed rgba(255,255,255,0.3); border-radius: 6px; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.3); overflow: hidden;"
                  >
                    ${
                      value
                        ? `<img src="${value}" alt="Item" style="width: 100%; height: 100%; object-fit: cover;" />`
                        : `<span style="font-size: 8px; text-align: center; color: #aaa; line-height: 1.1;">Cole Ctrl+V</span>`
                    }
                  </div>

                  <!-- Botão de pasta com o gatilho direto no onclick para nunca falhar -->
                  <button 
                    type="button" 
                    onclick="this.nextElementSibling.click()"
                    title="Enviar imagem do computador"
                    style="background: #222; border: 1px solid rgba(255,255,255,0.3); color: #fff; border-radius: 4px; padding: 6px 8px; cursor: pointer; font-size: 12px;"
                  >
                    📁
                  </button>
                  <input type="file" class="memorial-file-input-pc" accept="image/*" style="display:none;" onchange="handleDirectFilePC(this, '${escapeHTML(key)}', ${rowIndex})" />
                </div>
              </td>
            `;
          }

          // 7. OBSERVAÇÃO (Abre Janela / Modal ao clicar)
          if (col.key === "obs" || col.key === "observacao") {
            const hasText = value && value.trim().length > 0;
            return `
              <td>
                <button
                  type="button"
                  class="btn-open-obs-modal ${hasText ? 'has-obs' : ''}"
                  data-key="${escapeHTML(key)}"
                  data-row="${rowIndex}"
                  title="Clique para ver ou editar a observação"
                >
                  ${hasText ? 'Ver / Editar Obs.' : '+ Adicionar Obs.'}
                </button>
              </td>
            `;
          }

          return `
            <td>
              <input
                type="text"
                class="memorial-input"
                data-key="${escapeHTML(key)}"
                data-row="${rowIndex}"
                data-field="${escapeHTML(col.key)}"
                value="${escapeHTML(value)}"
              >
            </td>
          `;
        }).join("");

        return `
          <tr data-row-index="${rowIndex}">
            ${cells}

            <td class="memorial-actions">
              <button
                type="button"
                class="btn-delete-row"
                data-key="${escapeHTML(key)}"
                data-row="${rowIndex}"
                title="Excluir item"
              >
                ×
              </button>
            </td>
          </tr>
        `;
      }).join("")
    : `
      <tr class="memorial-empty-row">
        <td colspan="${table.cols.length + 1}">
          Nenhum item cadastrado.
        </td>
      </tr>
    `;

	const headers = table.cols
	  .map((col) => `
	    <th
	      class="memorial-resizable-th"
	      data-column-key="${escapeHTML(col.key)}"
	    >
	      <span class="memorial-th-label">
	        ${escapeHTML(col.label)}
	      </span>
	      <span
	        class="memorial-column-resizer"
	        aria-hidden="true"
	      ></span>
	    </th>
	  `)
	  .join("");

  return `
    <section
      class="memorial-section"
      data-category="${escapeHTML(key)}"
    >

      <div class="memorial-section-header">

        <div>
          <h3>
            ${escapeHTML(table.title)}
          </h3>

          <div class="memorial-summary">
            <strong>${escapeHTML(table.title)}:</strong>
            ${rows.length} item(ns)
            ${
              totals.quantity > 0
                ? ` · Qtd. total: ${totals.quantity}`
                : ""
            }
            ${
              totals.price > 0
                ? ` · Total da Categoria: ${memorialFormatPrice(totals.price)}`
                : ""
            }
          </div>
        </div>

        <button
          type="button"
          class="btn-add-row"
          data-key="${escapeHTML(key)}"
        >
          + Adicionar item
        </button>

      </div>

      <div class="memorial-table-wrapper">

        <table class="memorial-table">

          <thead>
            <tr>
              ${headers}
			<th
			  class="memorial-resizable-th memorial-actions-th"
			  data-column-key="acoes"
			>
		<span class="memorial-th-label">Ações</span>
			  <span
			    class="memorial-column-resizer"
			    aria-hidden="true"
			  ></span>
			</th>
            </tr>
          </thead>

          <tbody>
            ${rowsHTML}
          </tbody>

        </table>

      </div>

    </section>
  `;
}

// ==========================================================
// REDIMENSIONAR E GUARDAR COLUNAS DO MEMORIAL
// ==========================================================

let memorialResizeState = null;

function memorialColumnStorageKey() {
  const project = currentProject();
  return project?.id
    ? `memorialColumnWidths_${project.id}`
    : "memorialColumnWidths";
}

function loadMemorialColumnWidths(table) {
  if (!table) return;

  try {
    const saved =
      JSON.parse(
        localStorage.getItem(
          memorialColumnStorageKey()
        ) || "{}"
      );

    table
      .querySelectorAll(".memorial-resizable-th")
      .forEach((th) => {

        const key =
          th.dataset.columnKey;

        if (
          key &&
          saved[key] &&
          Number(saved[key]) >= 80
        ) {
          const width =
            Number(saved[key]);

          th.style.width = `${width}px`;
          th.style.minWidth = `${width}px`;
        }
      });

  } catch (error) {
    console.warn(
      "[MEMORIAL] Não foi possível carregar tamanhos das colunas:",
      error
    );
  }
}

function saveMemorialColumnWidth(th) {
  const key =
    th?.dataset.columnKey;

  if (!key) return;

  try {
    const saved =
      JSON.parse(
        localStorage.getItem(
          memorialColumnStorageKey()
        ) || "{}"
      );

    saved[key] =
      th.offsetWidth;

    localStorage.setItem(
      memorialColumnStorageKey(),
      JSON.stringify(saved)
    );

  } catch (error) {
    console.warn(
      "[MEMORIAL] Não foi possível salvar tamanho da coluna:",
      error
    );
  }
}

document.addEventListener("mousedown", (event) => {

  const resizer =
    event.target.closest(
      ".memorial-column-resizer"
    );

  if (!resizer) return;

  const th =
    resizer.closest(
      ".memorial-resizable-th"
    );

  const table =
    resizer.closest(
      ".memorial-table"
    );

  if (!th || !table) return;

  event.preventDefault();

  memorialResizeState = {
    th,
    table,
    startX: event.clientX,
    startWidth: th.offsetWidth
  };

  document.body.style.cursor =
    "col-resize";

  document.body.style.userSelect =
    "none";
});

document.addEventListener("mousemove", (event) => {

  if (!memorialResizeState) return;

  const {
    th,
    startX,
    startWidth
  } = memorialResizeState;

  const diff =
    event.clientX - startX;

  const newWidth =
    Math.max(
      80,
      startWidth + diff
    );

  th.style.width =
    `${newWidth}px`;

  th.style.minWidth =
    `${newWidth}px`;
});

document.addEventListener("mouseup", () => {

  if (!memorialResizeState) return;

  const {
    th
  } = memorialResizeState;

  saveMemorialColumnWidth(th);

  memorialResizeState = null;

  document.body.style.cursor = "";
  document.body.style.userSelect = "";
});
	
document.addEventListener("click", async (event) => {

  const btn = event.target.closest(".btn-open-obs-modal");

  if (!btn) {
    return;
  }

  const key = btn.dataset.key;
  const rowIndex = Number(btn.dataset.row);

  const project = currentProject();

  if (!project?.memorial?.[key]?.[rowIndex]) {
    return;
  }

  const row = project.memorial[key][rowIndex];

  const modal = document.createElement("div");

  modal.className = "obs-modal-overlay";

  modal.innerHTML = `
    <div class="obs-modal">

      <div class="obs-modal-header">

        <div>
          <span class="obs-modal-label">
            Observação
          </span>

          <h3>
            ${escapeHTML(row.item || "Item")}
          </h3>
        </div>

        <button
          type="button"
          class="obs-modal-close"
          aria-label="Fechar"
        >
          ×
        </button>

      </div>

      <div class="obs-modal-body">

        <textarea
          class="obs-modal-textarea"
          placeholder="Digite uma observação..."
        >${escapeHTML(row.obs || "")}</textarea>

      </div>

      <div class="obs-modal-footer">

        <button
          type="button"
          class="btn-secondary obs-modal-cancel"
        >
          Cancelar
        </button>

        <button
          type="button"
          class="btn-primary obs-modal-save"
        >
          Salvar observação
        </button>

      </div>

    </div>
  `;

  document.body.appendChild(modal);

  const textarea = modal.querySelector(".obs-modal-textarea");

  textarea?.focus();

const handleEscape = (event) => {
  if (event.key === "Escape") {
    closeModal();
  }
};

const closeModal = () => {
  modal.remove();
  document.removeEventListener("keydown", handleEscape);
};

document.addEventListener("keydown", handleEscape);

  modal
    .querySelector(".obs-modal-close")
    ?.addEventListener("click", closeModal);

  modal
    .querySelector(".obs-modal-cancel")
    ?.addEventListener("click", closeModal);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  modal
    .querySelector(".obs-modal-save")
    ?.addEventListener("click", async () => {

      row.obs = textarea.value.trim();

      await saveProjects([project]);

      closeModal();

      renderMemorial(project);

      showToast("Observação salva.");
    });
});
	
function memorialGrandTotalHTML(project) {
  const total = memorialGrandTotal(project);

  return `
    <div class="memorial-total-box">

      <span>
        Total geral do Memorial
      </span>

      <strong class="memorial-grand-total">
        ${memorialFormatPrice(total)}
      </strong>

    </div>
  `;
}


function memorialApplyFilter(category) {
  const sections = document.querySelectorAll(
    ".memorial-section"
  );

  sections.forEach((section) => {
    const sectionCategory =
      section.getAttribute("data-category");

    section.style.display =
      category === "all" ||
      sectionCategory === category
        ? ""
        : "none";
  });

  document
    .querySelectorAll(".filter-btn")
    .forEach((button) => {
      const active =
        button.dataset.filter === category;

      button.classList.toggle(
        "selected",
        active
      );
    });
}


function renderMemorial(project) {
  if (!project) return;

  memorialEnsureStructure(project);

  const container = $("#stageContainer");

  if (!container) return;

  const categoriesHTML = Object.keys(MEMORIAL_TABLES)
    .map((key) => memorialSectionHTML(project, key))
    .join("");

  // ==========================================================
  // FILTROS DINÂMICOS
  // ==========================================================

  const environments = new Set();
  const suppliers = new Set();

  Object.keys(MEMORIAL_TABLES).forEach((key) => {
    const rows = Array.isArray(project.memorial[key])
      ? project.memorial[key]
      : [];

    rows.forEach((row) => {
      const ambiente = String(row.ambiente || "").trim();
      const fornecedor = String(row.fornecedor || "").trim();

      if (ambiente) environments.add(ambiente);
      if (fornecedor) suppliers.add(fornecedor);
    });
  });

  const sortedEnvironments = [...environments].sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );

  const sortedSuppliers = [...suppliers].sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );

  const categoryFilters = Object.keys(MEMORIAL_TABLES)
    .map((key) => `
      <button
        type="button"
        class="memorial-filter-btn"
        data-filter-group="category"
        data-filter-value="${escapeHTML(key)}"
      >
        ${escapeHTML(MEMORIAL_TABLES[key].title)}
      </button>
    `)
    .join("");

  const environmentFilters = sortedEnvironments.length
    ? sortedEnvironments
        .map(
          (value) => `
            <button
              type="button"
              class="memorial-filter-btn"
              data-filter-group="environment"
              data-filter-value="${escapeHTML(value)}"
            >
              ${escapeHTML(value)}
            </button>
          `
        )
        .join("")
    : `
        <span class="memorial-filter-empty">
          Os ambientes aparecerão aqui conforme forem cadastrados.
        </span>
      `;

  const supplierFilters = sortedSuppliers.length
    ? sortedSuppliers
        .map(
          (value) => `
            <button
              type="button"
              class="memorial-filter-btn"
              data-filter-group="supplier"
              data-filter-value="${escapeHTML(value)}"
            >
              ${escapeHTML(value)}
            </button>
          `
        )
        .join("")
    : `
        <span class="memorial-filter-empty">
          Os fornecedores/lojas aparecerão aqui conforme forem cadastrados.
        </span>
      `;

  const total = memorialGrandTotal(project);

  // ==========================================================
  // HTML PRINCIPAL
  // ==========================================================

  container.innerHTML = `
    <div class="memorial-container">

      <div class="memorial-header">

		<div class="memorial-header-text">
		  <h2>Memorial Descritivo</h2>
		
		  <p>
		    Cadastre os itens, quantidades, preços,
		    fornecedores e observações do projeto.
		  </p>
		</div>
		
		<button
		  type="button"
		  id="btnExpandMemorial"
		  class="memorial-expand-btn"
		  title="Expandir Memorial"
		>
		  ⛶ Expandir
		</button>

        <div class="memorial-total-card">
          <span>Total</span>

          <strong class="memorial-grand-total">
            ${memorialFormatPrice(total)}
          </strong>
        </div>

      </div>


      <!-- ====================================================
           FILTROS
      ===================================================== -->

<div class="memorial-filter-container">

  <button
    type="button"
    id="btnToggleMemorialFilters"
    class="memorial-filter-toggle"
  >
    <span>Filtros</span>
    <span class="memorial-filter-toggle-icon">⌄</span>
  </button>

  <div
    class="memorial-filter-panel"
    id="memorialFilterPanel"
  >

    <div class="memorial-filter-header">

      <div>
        <h3>Filtros</h3>

        <p>
          Combine filtros para encontrar rapidamente
          os itens desejados.
        </p>
      </div>

      <button
        type="button"
        id="btnClearMemorialFilters"
        class="memorial-clear-filters"
      >
        Limpar seleção
      </button>

    </div>

    <div class="memorial-filter-group">

      <div class="memorial-filter-label">
        Categorias
      </div>

      <div class="memorial-filter-options">

        <button
          type="button"
          class="memorial-filter-btn memorial-filter-all selected"
          data-filter-group="category"
          data-filter-value="all"
        >
          Todos
        </button>

        ${categoryFilters}

      </div>

    </div>

    <div class="memorial-filter-group">

      <div class="memorial-filter-label">
        Ambientes
      </div>

      <div class="memorial-filter-options">

        ${environmentFilters}

      </div>

    </div>

    <div class="memorial-filter-group">

      <div class="memorial-filter-label">
        Fornecedores / Lojas
      </div>

      <div class="memorial-filter-options">

        ${supplierFilters}

      </div>

    </div>

  </div>

</div>


      <!-- ====================================================
           CATEGORIAS
      ===================================================== -->

      <div class="memorial-sections">
        ${categoriesHTML}
      </div>


      <!-- ====================================================
           TOTAL FINAL
      ===================================================== -->

      <div class="memorial-bottom-total">

        <span>Total</span>

        <strong class="memorial-grand-total">
          ${memorialFormatPrice(total)}
        </strong>

      </div>


      <!-- ====================================================
           ARQUIVOS
      ===================================================== -->

      <div class="memorial-files-panel">

        <div class="memorial-files-header">
          <div>
            <h3>Arquivos do Memorial</h3>

            <p>
              Plantas, especificações, catálogos e documentos
              relacionados ao Memorial.
            </p>
          </div>
        </div>

        <div
          id="memorialFiles"
          class="memorial-files-list"
        >
          ${
            project.memorialFiles.length
              ? fileListHTML(project.memorialFiles)
              : `<div class="empty-state">Nenhum arquivo anexado.</div>`
          }
        </div>

<div
  id="memorialDropzone"
  class="dropzone"
  data-dropzone
>
  <input
    id="memorialFileInput"
    type="file"
    multiple
    hidden
    data-file-input
  >

  <div class="memorial-dropzone-content">
    <strong>Adicionar arquivos</strong>

    <span>
      Arraste os arquivos para cá ou clique para selecionar.
    </span>
  </div>
</div>

      </div>

    </div>
  `;

// ==========================================================
// EXPANDIR MEMORIAL
// ==========================================================

const btnExpandMemorial =
  document.getElementById("btnExpandMemorial");

const memorialContainer =
  document.querySelector(".memorial-container");

if (btnExpandMemorial && memorialContainer) {

  const setMemorialExpanded = (expanded) => {

    memorialContainer.classList.toggle(
      "memorial-expanded",
      expanded
    );

    btnExpandMemorial.textContent =
      expanded
        ? "⛶ Recolher"
        : "⛶ Expandir";
  };

  btnExpandMemorial.addEventListener(
    "click",
    () => {
      const expanded =
        memorialContainer.classList.contains(
          "memorial-expanded"
        );

      setMemorialExpanded(!expanded);
    }
  );

  document.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key === "Escape" &&
        memorialContainer.classList.contains(
          "memorial-expanded"
        )
      ) {
        setMemorialExpanded(false);
      }

    }
  );
}

// Carrega os tamanhos personalizados das colunas
document
  .querySelectorAll(".memorial-table")
  .forEach((table) => {
    loadMemorialColumnWidths(table);
  });
	
  // ==========================================================
  // ESTADO DOS FILTROS
  // ==========================================================

  const memorialFilters = {
    category: new Set(),
    environment: new Set(),
    supplier: new Set()
  };

// ==========================================================
// ABRIR / FECHAR FILTROS DO MEMORIAL
// ==========================================================

const btnToggleMemorialFilters =
  document.getElementById("btnToggleMemorialFilters");

const memorialFilterPanel =
  document.getElementById("memorialFilterPanel");

if (
  btnToggleMemorialFilters &&
  memorialFilterPanel
) {

  btnToggleMemorialFilters.addEventListener(
    "click",
    () => {

      const isOpen =
        memorialFilterPanel.classList.contains(
          "is-open"
        );

      memorialFilterPanel.classList.toggle(
        "is-open",
        !isOpen
      );

      btnToggleMemorialFilters.classList.toggle(
        "is-open",
        !isOpen
      );

    }
  );

}

  function applyMemorialFilters() {

    const sections =
      document.querySelectorAll(".memorial-section");

    sections.forEach((section) => {

      const category =
        section.dataset.category || "";

      const categoryRows =
        project.memorial &&
        Array.isArray(project.memorial[category])
          ? project.memorial[category]
          : [];

      // --------------------------------------------------------
      // Categoria
      // --------------------------------------------------------

      const categoryMatch =
        memorialFilters.category.size === 0 ||
        memorialFilters.category.has(category);

      // --------------------------------------------------------
      // Ambiente / fornecedor
      // --------------------------------------------------------

      let rowMatch = false;

      if (categoryRows.length === 0) {
        rowMatch = true;
      } else {

        rowMatch = categoryRows.some((row) => {

          const ambiente =
            String(row.ambiente || "").trim();

          const fornecedor =
            String(row.fornecedor || "").trim();

          const environmentMatch =
            memorialFilters.environment.size === 0 ||
            memorialFilters.environment.has(ambiente);

          const supplierMatch =
            memorialFilters.supplier.size === 0 ||
            memorialFilters.supplier.has(fornecedor);

          return (
            environmentMatch &&
            supplierMatch
          );
        });
      }

      section.style.display =
        categoryMatch && rowMatch
          ? ""
          : "none";
    });
  }


  // ==========================================================
  // BOTÕES DE FILTRO
  // ==========================================================

  $$(".memorial-filter-btn").forEach((button) => {

    button.addEventListener("click", () => {

      const group =
        button.dataset.filterGroup;

      const value =
        button.dataset.filterValue;

      if (!group) return;


      // --------------------------------------------------------
      // TODOS
      // --------------------------------------------------------

      if (value === "all") {

        memorialFilters[group].clear();

        document
          .querySelectorAll(
            `.memorial-filter-btn[data-filter-group="${group}"]`
          )
          .forEach((btn) => {
            btn.classList.remove("selected");
          });

        button.classList.add("selected");

        applyMemorialFilters();

        return;
      }


      // --------------------------------------------------------
      // BOTÃO NORMAL
      // --------------------------------------------------------

      const allButton =
        document.querySelector(
          `.memorial-filter-all[data-filter-group="${group}"]`
        );

      if (memorialFilters[group].has(value)) {

        memorialFilters[group].delete(value);

        button.classList.remove("selected");

      } else {

        memorialFilters[group].add(value);

        button.classList.add("selected");
      }


      // Se houver qualquer filtro ativo,
      // "Todos" deixa de estar selecionado.

      if (memorialFilters[group].size > 0) {

        if (allButton) {
          allButton.classList.remove("selected");
        }

      } else {

        if (allButton) {
          allButton.classList.add("selected");
        }
      }

      applyMemorialFilters();
    });
  });


  // ==========================================================
  // LIMPAR TODOS OS FILTROS
  // ==========================================================

  const clearFilters =
    document.getElementById(
      "btnClearMemorialFilters"
    );

  if (clearFilters) {

    clearFilters.addEventListener(
      "click",
      () => {

        Object.keys(memorialFilters)
          .forEach((group) => {
            memorialFilters[group].clear();
          });

        $$(".memorial-filter-btn")
          .forEach((button) => {
            button.classList.remove("selected");
          });

        $$(".memorial-filter-all")
          .forEach((button) => {
            button.classList.add("selected");
          });

        applyMemorialFilters();
      }
    );
  }


  // ==========================================================
  // ADICIONAR LINHA
  // ==========================================================

  $$(".btn-add-row").forEach((button) => {

    button.addEventListener(
      "click",
      async () => {

        const key =
          button.dataset.key;

        if (!MEMORIAL_TABLES[key]) {
          return;
        }

        memorialEnsureStructure(project);

        project.memorial[key].push(
          memorialCreateEmptyRow(key)
        );

        memorialMarkDirty(project);

        await memorialSave(project);

        renderMemorial(project);
      }
    );
  });


// ==========================================================
  // EXCLUIR LINHA
  // ==========================================================

  $$(".btn-delete-row").forEach((button) => {

    button.addEventListener(
      "click",
      async () => {
        // Pergunta se o usuário realmente deseja apagar a linha
        if (!window.confirm("Tem certeza de que deseja apagar esta linha?")) {
          return;
        }

        const key = button.dataset.key;
        const rowIndex = Number(button.dataset.row);

        if (
          !project.memorial ||
          !Array.isArray(project.memorial[key])
        ) {
          return;
        }

        if (
          !Number.isInteger(rowIndex) ||
          rowIndex < 0 ||
          rowIndex >= project.memorial[key].length
        ) {
          return;
        }

        project.memorial[key].splice(
          rowIndex,
          1
        );

        memorialMarkDirty(project);

        await memorialSave(project);

        renderMemorial(project);
      }
    );
  });

  // ==========================================================
  // CAMPOS
  // ==========================================================

  $$(".memorial-input").forEach((input) => {

    input.addEventListener(
      "input",
      () => {

        const key =
          input.dataset.key;

        const rowIndex =
          Number(input.dataset.row);

        const field =
          input.dataset.field;

        if (
          !project.memorial ||
          !Array.isArray(project.memorial[key]) ||
          !project.memorial[key][rowIndex]
        ) {
          return;
        }

        project.memorial[key][rowIndex][field] =
          input.value;

        memorialMarkDirty(project);

        updateCategorySummary(
          key,
          project
        );

        const total =
          memorialGrandTotal(project);

        document
          .querySelectorAll(
            ".memorial-grand-total"
          )
          .forEach((element) => {
            element.textContent =
              memorialFormatPrice(total);
          });
      }
    );


    input.addEventListener(
      "change",
      async () => {

        const key =
          input.dataset.key;

        const rowIndex =
          Number(input.dataset.row);

        const field =
          input.dataset.field;

        if (
          !project.memorial ||
          !Array.isArray(project.memorial[key]) ||
          !project.memorial[key][rowIndex]
        ) {
          return;
        }

        project.memorial[key][rowIndex][field] =
          input.value;

        memorialMarkDirty(project);

        await memorialSave(project);
      }
    );


    input.addEventListener(
      "blur",
      async () => {

        const key =
          input.dataset.key;

        const rowIndex =
          Number(input.dataset.row);

        const field =
          input.dataset.field;

        if (
          !project.memorial ||
          !Array.isArray(project.memorial[key]) ||
          !project.memorial[key][rowIndex]
        ) {
          return;
        }

        let value =
          input.value;

        // ------------------------------------------------------
        // PREÇO
        // ------------------------------------------------------

        if (field === "preco") {

          const numericValue =
            memorialPrice(value);

          if (numericValue > 0) {

            value =
              memorialFormatPrice(
                numericValue
              );

            input.value = value;
          }
        }

        project.memorial[key][rowIndex][field] =
          value;

        memorialMarkDirty(project);

        updateCategorySummary(
          key,
          project
        );

        const total =
          memorialGrandTotal(project);

        document
          .querySelectorAll(
            ".memorial-grand-total"
          )
          .forEach((element) => {
            element.textContent =
              memorialFormatPrice(total);
          });

        await memorialSave(project);
      }
    );
  });

// ==========================================================
// ARQUIVOS
// ==========================================================

const memorialDropzone = $("#memorialDropzone");

if (memorialDropzone) {
  attachDropzone(
    memorialDropzone,
    project.memorialFiles,
    () => renderMemorial(project)
  );
}

  // ==========================================================
  // EXCLUIR ARQUIVO
  // ==========================================================

  $$("#memorialFiles .file-remove")
    .forEach((button) => {

      button.addEventListener(
        "click",
        async () => {

          const item =
            button.closest(".file-item");

          if (!item) return;

          const id =
            item.dataset.fileId;

          project.memorialFiles =
            project.memorialFiles.filter(
              (file) => file.id !== id
            );

          memorialMarkDirty(project);

          await memorialSave(project);

          renderMemorial(project);
        }
      );
    });
}

/* ---------------- Cronograma de Obra ---------------- */
function renderSchedule(project) {
  const stage = STAGES.find((s) => s.id === "cronograma");
  const container = $("#stageContainer");
  if (!container || !stage) return;

  project.schedule = project.schedule || [];

  const rows = project.schedule.map((item, index) => {

  let displayStatus =
    item.status ||
    "A Fazer";

  const today =
    new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );

  const startDate =
    item.start
      ? new Date(`${item.start}T00:00:00`)
      : null;

  const endDate =
    item.end
      ? new Date(`${item.end}T00:00:00`)
      : null;

  if (displayStatus !== "Concluído") {

    if (
      endDate &&
      !Number.isNaN(endDate.getTime()) &&
      today > endDate
    ) {

      displayStatus =
        "Em Atraso!";

    } else if (
      startDate &&
      !Number.isNaN(startDate.getTime()) &&
      today >= startDate
    ) {

      displayStatus =
        "Em Andamento";

    } else {

      displayStatus =
        "A Fazer";

    }
  }

  return `
    <tr>
      <td>
  <div
    style="
      display:flex;
      align-items:center;
      gap:8px;
      min-width:0;
    "
  >

    <input
      type="text"
      class="sched-input"
      data-idx="${index}"
      data-field="task"
      value="${escapeHTML(item.task || "")}"
      style="flex:1; min-width:0;"
    />

    ${
      displayStatus === "Concluído"
        ? `
          <span
            style="
              flex:none;
              color:#5F8F70;
              font-size:11px;
              font-weight:600;
              white-space:nowrap;
            "
          >
            ✓ Feito
          </span>
        `
        : `
          <button
            type="button"
            class="btn-conclude-sched"
            data-idx="${index}"
            title="Marcar como concluído"
            style="
              flex:none;
              height:30px;
              padding:0 9px;
              border:1px solid rgba(95,143,112,.35);
              border-radius:6px;
              background:rgba(95,143,112,.10);
              color:#7FAF8D;
              font-size:11px;
              font-weight:600;
              cursor:pointer;
              white-space:nowrap;
            "
          >
            ✓ Concluir
          </button>
        `
    }

  </div>
</td>
      <td><input type="date" class="sched-input" data-idx="${index}" data-field="start" value="${item.start || ""}" /></td>
      <td><input type="date" class="sched-input" data-idx="${index}" data-field="end" value="${item.end || ""}" /></td>
      <td>
        <select class="sched-input" data-idx="${index}" data-field="status">
			<option value="A Fazer" ${displayStatus === "A Fazer" ? "selected" : ""}>A Fazer</option>
			<option value="Em Andamento" ${displayStatus === "Em Andamento" ? "selected" : ""}>Em Andamento</option>
			<option value="Em Atraso!" ${displayStatus === "Em Atraso!" ? "selected" : ""}>Em Atraso!</option>
			<option value="Concluído" ${displayStatus === "Concluído" ? "selected" : ""}>Concluído</option>
        </select>
      </td>
      <td><button type="button" class="file-remove btn-del-sched" data-idx="${index}">✕</button></td>
	</tr>
	`;
	}).join("");

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

	$$(".btn-conclude-sched").forEach((btn) => {

  btn.addEventListener("click", () => {

    const idx =
      Number(btn.dataset.idx);

    if (!project.schedule[idx]) {
      return;
    }

    project.schedule[idx].status =
      "Concluído";

    saveProjects()
      .then(() => {
        renderSchedule(project);
      })
      .catch((err) => {
        console.error(err);
      });

  });

});

$$(".sched-input").forEach((input) => {

  input.addEventListener("change", () => {

    const idx =
      Number(input.dataset.idx);

    const field =
      input.dataset.field;

    if (!project.schedule[idx]) {
      return;
    }

    project.schedule[idx][field] =
      input.value;

    /*
     * Se o serviço estava concluído
     * e a data foi alterada,
     * ele volta a poder ser concluído.
     */

    if (
      (
        field === "start" ||
        field === "end"
      ) &&
      project.schedule[idx].status === "Concluído"
    ) {

      project.schedule[idx].status =
        "A Fazer";
    }

    saveProjects()
      .then(() => {

        renderSchedule(project);

      })
      .catch((err) => {

        console.error(err);

      });

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

window.changeScheduleMonth = changeScheduleMonth;

	
function renderScheduleClientHTML(project) {
  const schedule =
    project && Array.isArray(project.schedule)
      ? project.schedule
      : [];

  const year = currentScheduleDate.getFullYear();
  const month = currentScheduleDate.getMonth();

  const daysInMonth =
    new Date(year, month + 1, 0).getDate();

  const today = new Date();

  const isCurrentMonth =
    today.getFullYear() === year &&
    today.getMonth() === month;

  const todayDay =
    isCurrentMonth
      ? today.getDate()
      : null;

  const monthName =
    currentScheduleDate.toLocaleDateString(
      "pt-BR",
      {
        month: "long",
        year: "numeric"
      }
    );

  const monthLabel =
    monthName.charAt(0).toUpperCase() +
    monthName.slice(1);

  const labelWidth = 250;
  const dayWidth = 32;
  const timelineWidth =
    daysInMonth * dayWidth;

  /*
   * DIAS
   */

  let daysHTML = "";

  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {
    const date =
      new Date(year, month, day);

    const weekDay =
      date.getDay();

    const weekend =
      weekDay === 0 ||
      weekDay === 6;

    const todayMark =
      todayDay === day;

    daysHTML += `
      <div
        style="
          width:${dayWidth}px;
          min-width:${dayWidth}px;
          height:44px;
          display:flex;
          align-items:center;
          justify-content:center;
          position:relative;
          color:${
            todayMark
              ? "#E8A15A"
              : weekend
                ? "#555"
                : "#777"
          };
          font-size:10px;
          font-weight:${
            todayMark
              ? "700"
              : "500"
          };
        "
      >

        ${
          todayMark
            ? `
              <span
                style="
                  position:absolute;
                  width:20px;
                  height:20px;
                  border-radius:50%;
                  border:1px solid rgba(232,161,90,.45);
                  background:rgba(232,161,90,.08);
                "
              ></span>
            `
            : ""
        }

        <span
          style="
            position:relative;
            z-index:1;
          "
        >
          ${day}
        </span>

      </div>
    `;
  }

  /*
   * ATIVIDADES
   */

  let rowsHTML = "";

  if (!schedule.length) {

    rowsHTML = `
      <div
        style="
          padding:70px 30px;
          text-align:center;
          color:#666;
          font-size:12px;
        "
      >
        Nenhuma atividade cadastrada no cronograma.
      </div>
    `;

  } else {

    rowsHTML = schedule
      .map((item) => {

        const title =
          item.task ||
          item.title ||
          item.activity ||
          item.name ||
          "Sem título";

        const rawStart =
          item.start ||
          item.inicio ||
          item.startDate;

        const rawEnd =
          item.end ||
          item.termino ||
          item.endDate;

			let status =
			  item.status ||
			  "A Fazer";
			
			const today =
			  new Date();
			
			today.setHours(
			  0,
			  0,
			  0,
			  0
			);

        const startDate =
          rawStart
            ? new Date(
                `${rawStart}T00:00:00`
              )
            : null;

        const endDate =
          rawEnd
            ? new Date(
                `${rawEnd}T00:00:00`
              )
            : null;

		if (status !== "Concluído") {

  if (
    endDate &&
    !Number.isNaN(endDate.getTime()) &&
    today > endDate
  ) {

    status = "Em Atraso!";

  } else if (
    startDate &&
    !Number.isNaN(startDate.getTime()) &&
    today >= startDate
  ) {

    status = "Em Andamento";

  } else {

    status = "A Fazer";

  }
}

        let barHTML = "";

        if (
          startDate &&
          endDate &&
          !Number.isNaN(
            startDate.getTime()
          ) &&
          !Number.isNaN(
            endDate.getTime()
          )
        ) {

          const monthStart =
            new Date(
              year,
              month,
              1
            );

          const monthEnd =
            new Date(
              year,
              month,
              daysInMonth
            );

          if (
            endDate >= monthStart &&
            startDate <= monthEnd
          ) {

            let startDay =
              startDate.getFullYear() === year &&
              startDate.getMonth() === month
                ? startDate.getDate()
                : 1;

            let endDay =
              endDate.getFullYear() === year &&
              endDate.getMonth() === month
                ? endDate.getDate()
                : daysInMonth;

            startDay =
              Math.max(
                1,
                Math.min(
                  daysInMonth,
                  startDay
                )
              );

            endDay =
              Math.max(
                1,
                Math.min(
                  daysInMonth,
                  endDay
                )
              );

            const left =
              (startDay - 1) *
              dayWidth;

            const width =
              (endDay - startDay + 1) *
              dayWidth;

            const startText =
              startDate.toLocaleDateString(
                "pt-BR",
                {
                  day:"2-digit",
                  month:"2-digit"
                }
              );

            const endText =
              endDate.toLocaleDateString(
                "pt-BR",
                {
                  day:"2-digit",
                  month:"2-digit"
                }
              );

			let barColor =
			  "#D99052"; // Em Andamento
			
			let barOpacity =
			  "1";
			
			if (
			  status === "A Fazer"
			) {
			
			  barColor =
			    "#4F7CAC"; // Azul
			
			}
			
			if (
			  status === "Concluído"
			) {
			
			  barColor =
			    "#5F8F70"; // Verde
			
			}
			
			if (
			  status === "Em Atraso!"
			) {
			
			  barColor =
			    "#C94A4A"; // Vermelho
			
			}

            barHTML = `
              <div
                title="${escapeHTML(
                  title
                )}: ${startText} a ${endText}"
                style="
                  position:absolute;
                  left:${left}px;
                  width:${width}px;
                  top:50%;
                  transform:translateY(-50%);
                  height:24px;
                  border-radius:6px;
                  background:${barColor};
                  opacity:${barOpacity};
                  box-shadow:0 3px 10px rgba(0,0,0,.16);
                  display:flex;
                  align-items:center;
                  padding:0 9px;
                  box-sizing:border-box;
                  overflow:hidden;
                  z-index:3;
                "
              >

                <span
                  style="
                    color:#17130f;
                    font-size:9px;
                    font-weight:700;
                    white-space:nowrap;
                    overflow:hidden;
                    text-overflow:ellipsis;
                  "
                >
                  ${startText} – ${endText}
                </span>

              </div>
            `;
          }
        }

        /*
         * GRADE LEVE
         */

        let gridHTML = "";

        for (
          let day = 1;
          day <= daysInMonth;
          day++
        ) {

          const date =
            new Date(
              year,
              month,
              day
            );

          const weekend =
            date.getDay() === 0 ||
            date.getDay() === 6;

          const todayMark =
            todayDay === day;

          gridHTML += `
            <div
              style="
                width:${dayWidth}px;
                min-width:${dayWidth}px;
                height:100%;
                background:${
                  todayMark
                    ? "rgba(232,161,90,.035)"
                    : weekend
                      ? "rgba(255,255,255,.012)"
                      : "transparent"
                };
              "
            ></div>
          `;
        }

        return `
          <div
            style="
              display:flex;
              min-height:64px;
              position:relative;
            "
          >

            <!-- NOME -->

            <div
              style="
                width:${labelWidth}px;
                min-width:${labelWidth}px;
                display:flex;
                flex-direction:column;
                justify-content:center;
                padding:0 18px 0 4px;
                box-sizing:border-box;
              "
            >

              <div
                style="
                  color:#E7E3DE;
                  font-size:12px;
                  font-weight:550;
                  line-height:1.3;
                  white-space:nowrap;
                  overflow:hidden;
                  text-overflow:ellipsis;
                "
              >
                ${escapeHTML(title)}
              </div>

              <div
                style="
                  margin-top:4px;
                  color:#666;
                  font-size:9px;
                  text-transform:uppercase;
                  letter-spacing:.05em;
                "
              >
                ${escapeHTML(status)}
              </div>

            </div>

            <!-- TIMELINE -->

            <div
              style="
                width:${timelineWidth}px;
                min-width:${timelineWidth}px;
                height:64px;
                position:relative;
              "
            >

              <div
                style="
                  position:absolute;
                  inset:0;
                  display:flex;
                  z-index:0;
                "
              >
                ${gridHTML}
              </div>

              ${barHTML}

            </div>

          </div>
        `;
      })
      .join("");
  }

  return `
    <div
      id="scheduleGanttBox"
      class="panel"
      style="
        margin-top:28px;
        padding:0;
        overflow:hidden;
        border:1px solid rgba(255,255,255,.06);
        border-radius:14px;
        background:#171717;
      "
    >

      <!-- HEADER -->

      <div
        style="
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding:22px 24px;
          border-bottom:1px solid rgba(255,255,255,.06);
        "
      >

        <div>

          <div
            style="
              color:#E7E3DE;
              font-size:14px;
              font-weight:600;
            "
          >
            Visão do Cronograma
          </div>

          <div
            style="
              margin-top:5px;
              color:#666;
              font-size:11px;
            "
          >
            Acompanhamento das etapas da obra
          </div>

        </div>

        <div
          style="
            display:flex;
            align-items:center;
            gap:8px;
          "
        >

          <button
            type="button"
            onclick="changeScheduleMonth(-1)"
            aria-label="Mês anterior"
            style="
              width:32px;
              height:32px;
              border:1px solid rgba(255,255,255,.07);
              border-radius:7px;
              background:#1d1d1d;
              color:#888;
              font-size:18px;
              cursor:pointer;
            "
          >
            ‹
          </button>

          <div
            style="
              min-width:150px;
              text-align:center;
              color:#E7E3DE;
              font-size:11px;
              font-weight:600;
              text-transform:capitalize;
            "
          >
            ${monthLabel}
          </div>

          <button
            type="button"
            onclick="changeScheduleMonth(1)"
            aria-label="Próximo mês"
            style="
              width:32px;
              height:32px;
              border:1px solid rgba(255,255,255,.07);
              border-radius:7px;
              background:#1d1d1d;
              color:#888;
              font-size:18px;
              cursor:pointer;
            "
          >
            ›
          </button>

        </div>

      </div>

      <!-- TIMELINE -->

      <div
        style="
          overflow-x:auto;
          overflow-y:hidden;
        "
      >

        <div
          style="
            width:max-content;
            min-width:100%;
          "
        >

          <!-- DAYS -->

          <div
            style="
              display:flex;
              height:44px;
              border-bottom:1px solid rgba(255,255,255,.05);
            "
          >

            <div
              style="
                width:${labelWidth}px;
                min-width:${labelWidth}px;
                display:flex;
                align-items:center;
                padding-left:4px;
                box-sizing:border-box;
                color:#555;
                font-size:9px;
                font-weight:700;
                letter-spacing:.08em;
              "
            >
              SERVIÇOS
            </div>

            <div
              style="
                display:flex;
                width:${timelineWidth}px;
                min-width:${timelineWidth}px;
              "
            >
              ${daysHTML}
            </div>

          </div>

          <!-- ROWS -->

          <div>
            ${rowsHTML}
          </div>

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

function showSoundPermission() {
  const existing = document.querySelector(".sound-permission-popup");
  if (existing) existing.remove();

  const popup = document.createElement("div");

  popup.className = "sound-permission-popup";

  popup.innerHTML = `
    <div style="font-weight:600;margin-bottom:6px;">
      Ativar sons?
    </div>
    <div style="font-size:13px;margin-bottom:10px;">
      Ative os sons para receber avisos de novas mensagens.
    </div>
    <button
      type="button"
      id="btnEnableClientSound"
      style="
        border:0;
        border-radius:6px;
        padding:8px 14px;
        cursor:pointer;
        font-weight:600;
      "
    >
      Ativar sons
    </button>
  `;

  popup.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 280px;
    background: #fff;
    color: #222;
    padding: 16px;
    border-radius: 10px;
    box-shadow: 0 6px 20px rgba(0,0,0,.25);
    z-index: 20000;
  `;

  document.body.appendChild(popup);

  const button = document.getElementById("btnEnableClientSound");

  button?.addEventListener("click", () => {
    enableClientSound();

    if (messageAudioContext) {
      popup.remove();
      showToast("Sons ativados.");
    }
  });
}
	
function showHubLocked() {
  document.body.classList.add("hub-is-locked");
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

	await firebase.auth().signInWithEmailAndPassword(
	  DESIGNER_EMAIL,
	  pwd
	);
	
	// Recarrega todos os projetos agora que a designer
	// está autenticada e autorizada pelo Firestore.
	const cloudProjects =
	  typeof loadProjects === "function"
		? await loadProjects()
		: [];
	
	if (cloudProjects && cloudProjects.length > 0) {
	  projects = cloudProjects.map((p) =>
		typeof seedProject === "function"
		  ? seedProject(p)
		  : p
	  );
	}
	
	if (typeof unlockDesigner === "function") {
	  unlockDesigner();
	}
	
	modal.style.display = "none";
	lockedEl.remove();
	document.body.classList.remove("hub-is-locked");
	
	showDashboard();
	showToast("Acesso liberado com sucesso!");
  } catch (error) {
    console.error("[AUTH] Erro no acesso da designer:", error);
    showToast("Senha incorreta.", true);
  }
};

      btnConfirm?.addEventListener("click", verifyPassword);
    }
  }
}

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

async function promptClientPassword(project) {
  document.body.classList.add("client-view");

  const modal = $("#passwordModal") || $("#pwdModal");

  if (!modal) {
    document.body.classList.remove("client-view");
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

  const handleAuth = async () => {
    const entered = pwdInput ? pwdInput.value.trim() : "";

    if (!entered) {
      showToast("Digite a senha para continuar.", true);
      return;
    }

    try {
      if (!project.clientUid) {
        showToast("Este projeto ainda não está configurado para acesso do cliente.", true);
        return;
      }

      await signInWithFirebase(project.clientEmail, entered);
	  
	  sessionStorage.setItem(
  		`client_authenticated_${project.id}`,
  		"true"
	  );

	  showSoundPermission();

      modal.setAttribute("hidden", "");
      modal.style.display = "none";
      document.body.classList.remove("client-view");

      openProject(project.id);

      showToast("Acesso liberado!");
    } catch (error) {
      console.error("[AUTH] Erro no acesso do cliente:", error);
      showToast("Senha incorreta ou acesso não autorizado.", true);
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
	  const btnThemeToggle = $("#btnThemeToggle");

  if (btnThemeToggle) {
    btnThemeToggle.addEventListener("click", () => {
      const isLight = document.body.classList.toggle("theme-light");

      const icon = $("#themeIcon");
      const label = $("#themeLabel");

      if (isLight) {
        if (icon) icon.textContent = "🌙";
        if (label) label.textContent = "Modo escuro";
      } else {
        if (icon) icon.textContent = "☀️";
        if (label) label.textContent = "Modo claro";
      }
    });
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

async function loadProjects() {
  try {
    if (typeof db === "undefined" || !db) {
      console.warn("Firestore 'db' não está definido.");
      return null;
    }

    const snapshot = await db
      .collection("projects")
      .get();

    const projectsList = [];

    snapshot.forEach((doc) => {
      projectsList.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    console.log(
      "[FIRESTORE] Projetos carregados:",
      projectsList.length
    );

    return projectsList;

  } catch (error) {
    console.error(
      "[FIRESTORE] Erro ao carregar projetos:",
      error
    );

    return null;
  }
}
	
/* ---------------- Inicialização da Aplicação ---------------- */
async function init() {
  if (
    typeof DESIGNER_KEY !== "undefined" &&
    sessionStorage.getItem(DESIGNER_KEY) === "true"
  ) {
    designerUnlocked = true;
  }

  bindEvents();
  initViewModeSwitcher();
  initSearchToggle();

  const urlParams = new URLSearchParams(window.location.search);
  const projectParam =
    urlParams.get("project") || urlParams.get("p");

  // ============================================================
  // ACESSO POR LINK DE CLIENTE
  // ============================================================

  if (projectParam && !designerUnlocked) {
    clientMode = true;
    document.body.classList.add("client-view");

    try {
      const accessSnapshot = await db
        .collection("clientAccess")
        .where("slug", "==", projectParam)
        .limit(1)
        .get();

      if (accessSnapshot.empty) {
        showToast("Projeto não encontrado.", true);
        showDashboard();
        return;
      }

      const accessDoc = accessSnapshot.docs[0];
      const accessData = accessDoc.data();

      const projectId = accessDoc.id;
      const clientUid = accessData.clientUid;

      // Busca somente o projeto correspondente
	const targetProject = {
	  id: projectId,
	  title: accessData.slug || projectId,
	  clientUid: accessData.clientUid || null,
	  clientEmail: accessData.clientEmail || null
	};
	
projects = [targetProject];

const clientSessionKey =
  `client_authenticated_${targetProject.id}`;

if (sessionStorage.getItem(clientSessionKey) === "true") {
  openProject(targetProject.id);
  return;
}

promptClientPassword(targetProject);
return;
		
    } catch (error) {
      console.error(
        "[INIT] Erro ao localizar projeto do cliente:",
        error
      );

      showToast("Erro ao carregar o projeto.", true);
      showDashboard();
      return;
    }
  }

  // ============================================================
  // ACESSO DA DESIGNER
  // ============================================================

  const cloudProjects =
    typeof loadProjects === "function"
      ? await loadProjects()
      : [];
	
  if (cloudProjects && cloudProjects.length > 0) {
    projects = cloudProjects.map((p) =>
      typeof seedProject === "function"
        ? seedProject(p)
        : p
    ); 
	  
  } else if (typeof initialProjects !== "undefined") {
    projects = initialProjects;
  }

  // ============================================================
  // ABERTURA DE PROJETO
  // ============================================================

  if (projectParam) {
    const targetProject = projects.find(
      (p) =>
        p.id === projectParam ||
        (
          typeof slugify === "function" &&
          slugify(p.title) === slugify(projectParam)
        ) ||
        p.slug === projectParam
    );

    if (targetProject) {
      openProject(targetProject.id);
    } else {
      showDashboard();
    }
  } else {
    document.body.classList.remove("hub-is-locked");
    document.body.classList.remove("client-view");
    showDashboard();
  }
}

// ============================================================
// INICIALIZAÇÃO
// ============================================================

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
	
/* ---------------- Lógica da Lupa de Busca ---------------- */
function initSearchToggle() {
  const btnToggle = document.getElementById("btnToggleSearch");
  const wrapper = document.getElementById("searchBoxWrapper");
  const searchInput = document.getElementById("searchInput");

  if (btnToggle && wrapper) {
    btnToggle.onclick = function (e) {
      e.stopPropagation();
      const isHidden = wrapper.style.display === "none" || wrapper.style.display === "";
      wrapper.style.display = isHidden ? "block" : "none";
      if (isHidden && searchInput) {
        searchInput.focus();
      }
    };

    document.addEventListener("click", function (e) {
      if (!wrapper.contains(e.target) && e.target !== btnToggle) {
        wrapper.style.display = "none";
      }
    });
  }
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
      if (e.target.closest("button") || e.target.closest("a") || e.target.closest("input")) return;

      const box = card.getBoundingClientRect();
      const shiftX = e.clientX - box.left;
      const shiftY = e.clientY - box.top;

      let isDragging = false;
      const startX = e.clientX;
      const startY = e.clientY;

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
        const deltaX = Math.abs(moveEvent.clientX - startX);
        const deltaY = Math.abs(moveEvent.clientY - startY);

        if (!isDragging && deltaY > deltaX && deltaY > 8) {
          onPointerUp();
          return;
        }

        if (!isDragging) {
          const dist = Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY);
          if (dist < 10) return;

          isDragging = true;
          document.body.classList.add("dragging-active");
          document.body.style.userSelect = "none";
          document.body.style.webkitUserSelect = "none";

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

        moveEvent.preventDefault();
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

        document.body.classList.remove("dragging-active");
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

      window.addEventListener("pointermove", onPointerMove, { passive: false });
      window.addEventListener("pointerup", onPointerUp);
    };
  });
}

async function createClientAuthAccount(project, password) {
  if (!project || !project.id || !password) {
    throw new Error("Projeto ou senha não informados.");
  }

  const clientEmail =
    project.clientEmail ||
    `client_${project.id}@hub-menche.com`;

  const apiKey =
    typeof firebaseConfig !== "undefined"
      ? firebaseConfig.apiKey
      : null;

  if (!apiKey) {
    throw new Error("Firebase API Key não encontrada.");
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: clientEmail,
        password: password,
        returnSecureToken: true
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message || "Não foi possível criar o acesso do cliente."
    );
  }

  return {
    clientUid: data.localId,
    clientEmail: clientEmail
  };
}

/* ---------------- Modal de Compartilhamento (Cliques Diretos + Animação) ---------------- */
function openShareModal() {
  // 1. Identifica o projeto ativo
  let p = null;
  if (typeof currentProject === "function") {
    try { p = currentProject(); } catch(err) {}
  }
  if (!p && typeof currentProject === "object") p = currentProject;
  if (!p && window.selectedProject) p = window.selectedProject;
  if (!p && typeof projects !== "undefined" && Array.isArray(projects)) {
    const activeCard = document.querySelector(".project-card.active, .card.active");
    const activeId = activeCard ? (activeCard.dataset.projectId || activeCard.dataset.id) : null;
    p = projects.find(item => item.id === activeId) || projects[0];
  }

  if (!p) {
    alert("Selecione um projeto primeiro.");
    return;
  }

  closeShareModal();

  const projectSlug = p.slug || (typeof slugify === "function" ? slugify(p.title) : p.id) || p.id;
  const shareUrl = `${window.location.origin}${window.location.pathname}?p=${encodeURIComponent(projectSlug)}`;
  const clientPwd = p.clientPassword || p.client_password || "";

  // 2. Fundo Escuro do Modal
  const wrapper = document.createElement("div");
  wrapper.id = "customShareWrapper";
  wrapper.style.cssText = "position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;pointer-events:auto !important;";

  // 3. Card do Modal
  const card = document.createElement("div");
  card.style.cssText = "background:#181d28;border:1px solid rgba(255,255,255,0.2);border-radius:16px;box-shadow:0 25px 50px rgba(0,0,0,0.9);width:100%;max-width:520px;padding:24px;box-sizing:border-box;color:#fff;font-family:inherit;position:relative;z-index:2147483647;pointer-events:auto !important;";

  card.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:12px;">
      <h2 style="margin:0;font-size:1.25rem;font-weight:600;color:#ffffff;">Compartilhar projeto</h2>
      <button type="button" id="closeShareBtnX" style="background:transparent;border:none;color:#a0aec0;cursor:pointer;font-size:1.2rem;padding:4px;line-height:1;pointer-events:auto !important;">✕</button>
    </div>

    <div style="display:flex;flex-direction:column;gap:16px;">
      <p style="margin:0;font-weight:600;font-size:1rem;color:#e2e8f0;">Projeto: ${p.title || "Sem título"}</p>
      
      <!-- CAMPO SENHA -->
      <div style="display:flex;flex-direction:column;gap:6px;">
        <label style="font-size:0.75rem;font-weight:700;color:#a0aec0;">SENHA DO CLIENTE</label>
        <div style="display:flex;gap:8px;">
          <input type="text" id="inputClientPwdReal" value="${clientPwd}" placeholder="Digite a senha" style="flex:1;background:#0f131c;border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:10px;color:#fff;font-size:0.9rem;pointer-events:auto !important;">
          <button type="button" id="btnSavePwdReal" style="background:#e56a44;border:none;border-radius:8px;color:#fff;padding:0 16px;font-weight:600;cursor:pointer;pointer-events:auto !important;transition:all 0.2s ease;">Salvar Senha</button>
        </div>
      </div>

      <!-- CAMPO LINK -->
      <div style="display:flex;flex-direction:column;gap:6px;">
        <label style="font-size:0.75rem;font-weight:700;color:#a0aec0;">LINK DO CLIENTE</label>
        <div style="display:flex;gap:8px;">
          <input type="text" id="inputShareLinkReal" value="${shareUrl}" readonly style="flex:1;background:#0f131c;border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:10px;color:#fff;font-size:0.9rem;pointer-events:auto !important;">
          <button type="button" id="btnCopyLinkReal" style="background:#2d3748;border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#fff;padding:0 16px;font-weight:600;cursor:pointer;pointer-events:auto !important;transition:all 0.2s ease;">Copiar Link</button>
        </div>
      </div>
    </div>
  `;

  wrapper.appendChild(card);
  document.body.appendChild(wrapper);

  // Impedir que o clique no card feche o modal
  card.onclick = function(e) { e.stopPropagation(); };
  wrapper.onclick = function(e) { if (e.target === wrapper) closeShareModal(); };

  // Botão X para fechar
  const closeBtn = card.querySelector("#closeShareBtnX");
  if (closeBtn) closeBtn.onclick = closeShareModal;

  // 4. ATRIBUIÇÃO DIRETA DOS BOTOES (Desbloqueados)
  const pwdInput = card.querySelector("#inputClientPwdReal");
  const pwdBtn = card.querySelector("#btnSavePwdReal");
  const linkInput = card.querySelector("#inputShareLinkReal");
  const copyBtn = card.querySelector("#btnCopyLinkReal");

  // AÇÃO DO BOTÃO SALVAR SENHA
  pwdBtn.onclick = async function(e) {
    e.preventDefault();
    e.stopPropagation();

    const novaSenha = pwdInput ? pwdInput.value : "";

    // Atualiza o objeto do projeto
    p.clientPassword = novaSenha;
    p.client_password = novaSenha;

	if (!p.clientUid || !p.clientEmail) {
  try {
    const authAccount = await createClientAuthAccount(p, novaSenha);

    p.clientUid = authAccount.clientUid;
    p.clientEmail = authAccount.clientEmail;

    console.log("[CLIENT AUTH] Conta criada:", {
      clientUid: p.clientUid,
      clientEmail: p.clientEmail
    });

  } catch (error) {
    console.error("[CLIENT AUTH] Erro ao criar conta:", error);
    showToast(
      "Não foi possível criar o acesso do cliente: " +
      (error.message || "erro desconhecido"),
      true
    );
    return;
  }
}

	const projectSlug =
  typeof slugify === "function"
    ? slugify(p.title)
    : p.id;

db.collection("clientAccess")
  .doc(p.id)
  .set({
    slug: projectSlug,
    projectId: p.id,
    clientUid: p.clientUid || null,
    clientEmail: p.clientEmail || null
  }, { merge: true })
  .catch((error) => {
    console.error("[CLIENT ACCESS] Erro ao salvar:", error);
  });

    if (typeof projects !== "undefined" && Array.isArray(projects)) {
      const item = projects.find(proj => proj.id === p.id);
      if (item) {
        item.clientPassword = novaSenha;
        item.client_password = novaSenha;
      }
      try { localStorage.setItem("projects", JSON.stringify(projects)); } catch(err) {}
    }

    if (typeof saveProjects === "function") saveProjects();
    if (typeof saveState === "function") saveState();

    if (typeof supabaseClient !== "undefined" && p.id) {
      supabaseClient
        .from("projects")
        .update({ client_password: novaSenha, clientPassword: novaSenha })
        .eq("id", p.id)
        .then(() => {})
        .catch(err => console.error("Erro Supabase:", err));
    }

    // ANIMAÇÃO DE ÉXITO (LARANJA -> VERDE "SALVO!")
    pwdBtn.textContent = "Salvo!";
    pwdBtn.style.background = "#2e7d32";

    setTimeout(() => {
      pwdBtn.textContent = "Salvar Senha";
      pwdBtn.style.background = "#e56a44";
    }, 2000);
  };

  // AÇÃO DO BOTÃO COPIAR LINK
  copyBtn.onclick = function(e) {
    e.preventDefault();
    e.stopPropagation();

    const urlParaCopiar = linkInput ? linkInput.value : shareUrl;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(urlParaCopiar).then(() => {
        mostrarCopiadoSucesso(copyBtn);
      }).catch(() => {
        copiarNativo(urlParaCopiar, copyBtn);
      });
    } else {
      copiarNativo(urlParaCopiar, copyBtn);
    }
  };

  function mostrarCopiadoSucesso(btn) {
    btn.textContent = "Copiado!";
    btn.style.background = "#2b6cb0";
    setTimeout(() => {
      btn.textContent = "Copiar Link";
      btn.style.background = "#2d3748";
    }, 2000);
  }

  function copiarNativo(texto, btn) {
    const area = document.createElement("textarea");
    area.value = texto;
    area.style.position = "fixed";
    area.style.left = "-9999px";
    document.body.appendChild(area);
    area.focus();
    area.select();
    try {
      document.execCommand("copy");
      mostrarCopiadoSucesso(btn);
    } catch (err) {
      btn.textContent = "Erro!";
    }
    document.body.removeChild(area);
  }
}

function closeShareModal() {
  const wrapper = document.getElementById("customShareWrapper");
  if (wrapper) wrapper.remove();
}

window.openShareModal = openShareModal;
window.closeShareModal = closeShareModal;


/* ---------------- DIÁRIO DE OBRA (SITE LOG) ---------------- */

function renderSiteLogHTML(project, isDesigner = false) {
  const stageData = project.stages?.site_log || {};
  const logs = Array.isArray(stageData.siteLogs) ? stageData.siteLogs : [];

  let html = `
    <div class="site-log-container">
      <div class="panel">
        <h3 style="margin: 0 0 8px 0; display: flex; align-items: center; gap: 8px;">🏗️ Diário & Relatórios de Obra</h3>
        <p class="conversation-hint" style="margin: 0; color: #a0aec0; font-size: 0.9rem;">Acompanhe as atualizações semanais, evoluções do canteiro e pendências.</p>
      </div>`;

  // Formulário de criação/edição para o Designer
  if (isDesigner) {
    html += `
      <div class="panel site-log-form-panel" style="margin-top: 16px;">
        <h4 id="siteLogFormTitle" style="margin-bottom: 12px; color: #e56a44;">+ Novo Relatório Semanal</h4>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <input type="hidden" id="editingLogId" value="" />
          <input type="text" id="logWeekTitle" class="stage-textarea" style="height: 40px;" placeholder="Título (ex: Semana 1 - Levantamento atual)" />
          
          <label style="color: #a0aec0; font-size: 0.85rem;"><strong>Evoluções da Semana:</strong></label>
          <textarea id="logAdvancements" class="stage-textarea" placeholder="O que avançou na obra nesta semana..."></textarea>
          
          <label style="color: #a0aec0; font-size: 0.85rem;"><strong>O que precisa do Cliente (Ações/Aprovações):</strong></label>
          <textarea id="logClientAction" class="stage-textarea" placeholder="Definições, compras ou visitas pendentes do cliente..."></textarea>
          
          <label style="color: #a0aec0; font-size: 0.85rem;"><strong>Próximos Passos (Fornecedores/Equipe):</strong></label>
          <textarea id="logNextSteps" class="stage-textarea" placeholder="Próximas etapas para a semana que vem..."></textarea>
          
          <label style="color: #a0aec0; font-size: 0.85rem;"><strong>Fotos da Semana (URLs separadas por vírgula):</strong></label>
          <input type="text" id="logPhotos" class="stage-textarea" style="height: 40px;" placeholder="https://link-foto1.com, https://link-foto2.com" />

          <div style="display: flex; gap: 10px; margin-top: 10px;">
            <button type="button" id="btnSaveSiteLog" class="btn-primary" style="flex: 1;">
              Publicar Relatório
            </button>
            <button type="button" id="btnCancelEditLog" class="btn-secondary" style="display: none;">
              Cancelar Edição
            </button>
          </div>
        </div>
      </div>`;
  }

  html += `<div class="site-log-feed" style="margin-top: 16px;">`;

  if (logs.length === 0) {
    html += `
      <div class="panel" style="text-align: center; color: #a0aec0; padding: 30px;">
        Nenhum relatório de obra publicado ainda.
      </div>`;
  } else {
    logs.slice().reverse().forEach((log) => {
      const photosList = Array.isArray(log.photos) ? log.photos : [];
      const safeTitle = typeof escapeHTML === "function" ? escapeHTML(log.weekTitle || "Relatório de Obra") : (log.weekTitle || "Relatório de Obra");
      const safeAdvancements = typeof escapeHTML === "function" ? escapeHTML(log.advancements || "") : (log.advancements || "");
      const safeClientAction = typeof escapeHTML === "function" ? escapeHTML(log.clientAction || "") : (log.clientAction || "");
      const safeNextSteps = typeof escapeHTML === "function" ? escapeHTML(log.nextSteps || "") : (log.nextSteps || "");

      html += `
        <div class="panel site-log-card" style="border-left: 3px solid #e56a44; margin-bottom: 16px; padding: 20px;">
          
		<!-- Cabeçalho do Card (Título + Data + Editar + Excluir) -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px;">
            <h4 style="margin: 0; font-size: 1.05rem; color: #cbd5e0; font-weight: 600;">${safeTitle}</h4>
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 0.85rem; color: #a0aec0;">📅 ${log.date || ""}</span>
              ${isDesigner ? `
                <div style="display: flex; gap: 8px;">
                  <button type="button" class="btn-edit-sitelog" data-log-id="${log.id}" style="background: none; border: none; color: #e56a44; cursor: pointer; font-size: 0.85rem; font-weight: 600; padding: 0;">
                    ✏️ Editar
                  </button>
                  <button type="button" class="btn-delete-sitelog" data-log-id="${log.id}" style="background: none; border: none; color: #e53e3e; cursor: pointer; font-size: 0.85rem; font-weight: 600; padding: 0;">
                    🗑️ Excluir
                  </button>
                </div>
              ` : ""}
            </div> <!-- 👈 ADICIONE ESTA DIV DE FECHAMENTO AQUI -->
          </div> <!-- Fechamento da div do cabeçalho -->

          <!-- Evoluções da Semana -->
          ${safeAdvancements ? `
		  <div style="margin-bottom: 14px;">
              <strong style="color: #718096; font-size: 0.78rem; letter-spacing: 0.5px; text-transform: uppercase; display: block; margin-bottom: 4px;">🔨 EVOLUÇÕES DA SEMANA:</strong>
              <p style="margin: 0; white-space: pre-line; color: #e2e8f0; font-size: 0.95rem; line-height: 1.5;">${safeAdvancements}</p>
            </div>` : ""}

          <!-- Pendente do Cliente -->
          ${safeClientAction ? `
            <div style="margin-bottom: 14px; background: rgba(254, 243, 199, 0.95); border-radius: 6px; padding: 12px 14px;">
              <strong style="color: #b45309; font-size: 0.78rem; letter-spacing: 0.5px; text-transform: uppercase; display: block; margin-bottom: 4px;">⚠️ PENDENTE DO CLIENTE:</strong>
              <p style="margin: 0; white-space: pre-line; color: #78350f; font-size: 0.95rem; font-weight: 500; line-height: 1.5;">${safeClientAction}</p>
            </div>` : ""}

          <!-- Próximos Passos -->
          ${safeNextSteps ? `
            <div style="margin-bottom: 14px;">
              <strong style="color: #718096; font-size: 0.78rem; letter-spacing: 0.5px; text-transform: uppercase; display: block; margin-bottom: 4px;">📋 PRÓXIMOS PASSOS:</strong>
              <p style="margin: 0; white-space: pre-line; color: #e2e8f0; font-size: 0.95rem; line-height: 1.5;">${safeNextSteps}</p>
            </div>` : ""}

<!-- Registros Fotográficos -->
          ${log.photos && log.photos.length > 0 ? `
            <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.08);">
              <span style="font-size: 0.85rem; font-weight: 600; color: #a0aec0; display: block; margin-bottom: 8px;">
                📸 Registros Fotográficos (${log.photos.length})
              </span>
              <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                ${log.photos.map((photoUrl, idx) => {
                  const isUrl = photoUrl.startsWith("http://") || photoUrl.startsWith("https://") || photoUrl.startsWith("data:");
                  const linkId = `photo-link-${log.id}-${idx}`;
				  if (isUrl) {
				  const isDirectImage =
				    /\.(jpg|jpeg|png|gif|webp|avif)(\?.*)?$/i.test(photoUrl);
				
				  if (isDirectImage) {
				    return `
				      <a
				        href="${photoUrl}"
				        target="_blank"
				        rel="noopener noreferrer"
				        id="${linkId}"
				        style="text-decoration: none; display: inline-block;"
				      >
				        <img
				          src="${photoUrl}"
				          alt="Foto ${idx + 1}"
				          style="
				            width: 120px;
				            height: 90px;
				            object-fit: cover;
				            border-radius: 8px;
				            border: 1px solid rgba(255,255,255,0.15);
				            display: block;
				          "
				          onerror="handleImageError(this, '${linkId}', ${idx + 1})"
				        />
				      </a>
				    `;
				  }
				
				  return `
				    <a
				      href="${photoUrl}"
				      target="_blank"
				      rel="noopener noreferrer"
				      style="
				        width: 120px;
				        height: 90px;
				        display: inline-flex;
				        flex-direction: column;
				        align-items: center;
				        justify-content: center;
				        gap: 6px;
				        background: #3B4B52;
				        color: #F1EAE3;
				        border: 1px solid rgba(241, 234, 227, 0.2);
				        border-radius: 8px;
				        text-decoration: none;
				        font-size: 0.8rem;
				        text-align: center;
				      "
				    >
				      <span style="font-size: 28px;">🖼️</span>
				      <strong>Foto ${idx + 1}</strong>
				      <span style="font-size: 0.7rem; opacity: 0.75;">
				        Abrir foto ↗
				      </span>
				    </a>
				  `;
				} else {
                    return `
                      <span style="display: inline-flex; align-items: center; gap: 6px; background: rgba(229, 106, 68, 0.12); color: #e56a44; border: 1px solid rgba(229, 106, 68, 0.3); padding: 6px 12px; border-radius: 6px; font-size: 0.85rem;">
                        📷 ${photoUrl}
                      </span>
                    `;
                  }
                }).join("")}
              </div>
            </div>
          ` : ""}

        </div>`;
    });
  }

  html += `</div></div>`;
  return html;
}

function attachSiteLogEvents(project) {
  const isDesigner = designerUnlocked && !clientMode && !localPreview;
  if (!isDesigner) return;

  const stageData = project.stages?.site_log || {};
  if (!Array.isArray(stageData.siteLogs)) {
    stageData.siteLogs = [];
  }

  // 1. Salvar ou Publicar Relatório
  const btnSave = $("#btnSaveSiteLog");
  if (btnSave) {
    btnSave.addEventListener("click", async () => {
      const editingId = $("#editingLogId")?.value;
      const weekTitle = $("#logWeekTitle")?.value.trim();
      const advancements = $("#logAdvancements")?.value.trim();
      const clientAction = $("#logClientAction")?.value.trim();
      const nextSteps = $("#logNextSteps")?.value.trim();
      const photosRaw = $("#logPhotos")?.value.trim();

      if (!weekTitle) {
        showToast("Informe o título da semana.", true);
        return;
      }

      const photos = photosRaw ? photosRaw.split(",").map((p) => p.trim()).filter(Boolean) : [];

      if (editingId) {
        // Modo Edição
        const log = stageData.siteLogs.find((l) => l.id === editingId);
        if (log) {
          log.weekTitle = weekTitle;
          log.advancements = advancements;
          log.clientAction = clientAction;
          log.nextSteps = nextSteps;
          log.photos = photos;
        }
      } else {
        // Novo Relatório
        const newLog = {
          id: uid(),
          date: new Date().toLocaleDateString("pt-BR"),
          weekTitle,
          advancements,
          clientAction,
          nextSteps,
          photos
        };
        stageData.siteLogs.push(newLog);
      }

      if (!project.stages) project.stages = {};
      project.stages.site_log = stageData;

      if (await saveProjects([project])) {
        showToast(editingId ? "Relatório atualizado!" : "Relatório publicado!");
        renderStage();
      }
    });
  }

  // 2. Ação do Botão Editar
  $$(".btn-edit-sitelog").forEach((btn) => {
    btn.addEventListener("click", () => {
      const logId = btn.dataset.logId;
      const log = stageData.siteLogs.find((l) => l.id === logId);
      if (!log) return;

      $("#editingLogId").value = log.id;
      $("#logWeekTitle").value = log.weekTitle || "";
      $("#logAdvancements").value = log.advancements || "";
      $("#logClientAction").value = log.clientAction || "";
      $("#logNextSteps").value = log.nextSteps || "";
      $("#logPhotos").value = log.photos ? log.photos.join(", ") : "";

      $("#siteLogFormTitle").textContent = "✏️ Editar Relatório Semanal";
      $("#btnSaveSiteLog").textContent = "Salvar Alterações";
      if ($("#btnCancelEditLog")) $("#btnCancelEditLog").style.display = "inline-block";

      // Rola a tela até o formulário
      $("#siteLogFormTitle").scrollIntoView({ behavior: "smooth" });
    });
  });

  // 3. Cancelar Edição
  const btnCancel = $("#btnCancelEditLog");
  if (btnCancel) {
    btnCancel.addEventListener("click", () => {
      $("#editingLogId").value = "";
      $("#logWeekTitle").value = "";
      $("#logAdvancements").value = "";
      $("#logClientAction").value = "";
      $("#logNextSteps").value = "";
      $("#logPhotos").value = "";

      $("#siteLogFormTitle").textContent = "+ Novo Relatório Semanal";
      $("#btnSaveSiteLog").textContent = "Publicar Relatório";
      btnCancel.style.display = "none";
    });
  }

  // 4. Ação do Botão Excluir
  $$(".btn-delete-sitelog").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const logId = btn.dataset.logId;
      if (!confirm("Tem certeza que deseja apagar este relatório de obra?")) return;

      stageData.siteLogs = stageData.siteLogs.filter((l) => l.id !== logId);
      project.stages.site_log = stageData;

      if (await saveProjects([project])) {
        showToast("Relatório removido.");
        renderStage();
      }
    });
  });
}

// Função auxiliar para tratar erros de carregamento de imagens de obra
function handleImageError(imgElement, linkId, photoIndex) {
  const link = document.getElementById(linkId);

  if (!link) return;

  // Mantém o espaço da foto e mostra um placeholder visual
  imgElement.style.display = "none";

  link.innerHTML = `
    <div
      style="
        width: 120px;
        height: 90px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 6px;
        background: #3B4B52;
        color: #F1EAE3;
        border: 1px solid rgba(241, 234, 227, 0.2);
        border-radius: 8px;
        font-size: 0.8rem;
        text-align: center;
      "
    >
      <span style="font-size: 28px;">🖼️</span>
      <span>Foto ${photoIndex}</span>
      <span style="font-size: 0.7rem; opacity: 0.7;">
        Não foi possível carregar
      </span>
    </div>
  `;
}

// 1. Função que ativa a mágica do arrasto fluido e salva a ordem
function initSortableGrid() {
  const gridEl = document.getElementById("projectsGrid");
  if (!gridEl) return;

  if (gridEl.sortableInstance) {
    gridEl.sortableInstance.destroy();
  }

  gridEl.sortableInstance = Sortable.create(gridEl, {
    animation: 200,
    ghostClass: "sortable-ghost",
    onEnd: async function () {
      const cardElements = gridEl.querySelectorAll(".project-card, [data-project-id], .grid > *");
      const newOrderIds = Array.from(cardElements).map(card => card.dataset.projectId || card.id);

      // Salva no navegador para persistir ao atualizar
      localStorage.setItem("menche_projects_order", JSON.stringify(newOrderIds));

      // Salva no Firebase (se houver conexão ativa)
      try {
        if (typeof db !== "undefined" && db) {
          await db.collection("settings").doc("projectsOrder").set({ order: newOrderIds });
        }
      } catch (error) {
        console.error("Erro ao salvar ordem no banco:", error);
      }
    }
  });
}

// 2. Função que lê a ordem salva para os cards não voltarem pro lugar
function getOrderedProjects(projectsList) {
  if (!Array.isArray(projectsList) || projectsList.length === 0) return [];
  
  const savedOrder = JSON.parse(localStorage.getItem("menche_projects_order"));
  if (!savedOrder || !Array.isArray(savedOrder)) return projectsList;

  // Organiza baseado na ordem salva, mas garante que nenhum projeto fique de fora
  const ordered = [];
  const remaining = [...projectsList];

  // Adiciona primeiro os que estão na ordem salva
  savedOrder.forEach(id => {
    const foundIndex = remaining.findIndex(p => String(p.id) === String(id));
    if (foundIndex !== -1) {
      ordered.push(remaining[foundIndex]);
      remaining.splice(foundIndex, 1); // Remove dos restantes
    }
  });

  // Se houver algum projeto novo que não estava na lista salva, adiciona no final
  return [...ordered, ...remaining];
}

let currentViewMode = localStorage.getItem("menche_view_mode") || "grid";

function initViewModeSwitcher() {
  const gridEl = $("#projectsGrid");
  const buttons = document.querySelectorAll(".view-btn");

  if (!gridEl) return;

  // Aplica o modo salvo anteriormente no navegador
  applyViewMode(currentViewMode);

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.view;
      if (!mode) return;

      currentViewMode = mode;
      localStorage.setItem("menche_view_mode", mode);

      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      applyViewMode(mode);
    });
  });
}

function applyViewMode(mode) {
  const gridEl = $("#projectsGrid");
  if (!gridEl) return;

  gridEl.classList.remove("view-list", "view-carousel");

  if (mode === "list") {
    gridEl.classList.add("view-list");
  } else if (mode === "carousel") {
    gridEl.classList.add("view-carousel");
  }

  document.querySelectorAll(".view-btn").forEach(b => {
    if (b.dataset.view === mode) {
      b.classList.add("active");
    } else {
      b.classList.remove("active");
    }
  });
}

// ==========================================================
// MEMORIAL — IMAGENS DOS ITENS
// Clique • Arquivo do PC • Ctrl+V • URL • Drag & Drop
// ==========================================================

let activeImageWrapper = null;


// ----------------------------------------------------------
// 1. IDENTIFICA A CAIXA DE IMAGEM ATIVA
// ----------------------------------------------------------

document.addEventListener("click", (e) => {
  const wrapper = e.target.closest(".memorial-image-upload-wrapper");

  if (wrapper) {
    activeImageWrapper = wrapper;
  }
});


// ----------------------------------------------------------
// 2. BOTÃO 📁 — ABRIR EXPLORADOR DO COMPUTADOR
// ----------------------------------------------------------

document.addEventListener("click", (e) => {
  const btnPc = e.target.closest(".btn-upload-pc");

  if (!btnPc) return;

  const td = btnPc.closest("td");

  if (!td) return;

  const fileInput = td.querySelector(".memorial-file-input-pc");

  if (!fileInput) return;

  e.preventDefault();

  activeImageWrapper =
    td.querySelector(".memorial-image-upload-wrapper") ||
    activeImageWrapper;

  fileInput.click();
});


// ----------------------------------------------------------
// 3. ARQUIVO ESCOLHIDO NO COMPUTADOR
// ----------------------------------------------------------

document.addEventListener("change", async (e) => {
  const input = e.target;

  if (!input.classList.contains("memorial-file-input-pc")) {
    return;
  }

  const td = input.closest("td");

  if (!td) return;

  const wrapper = td.querySelector(".memorial-image-upload-wrapper");

  if (!wrapper) return;

  if (!input.files || !input.files.length) {
    return;
  }

  activeImageWrapper = wrapper;

  const file = input.files[0];

  if (!file.type || !file.type.startsWith("image/")) {
    if (typeof showToast === "function") {
      showToast("Selecione um arquivo de imagem.", true);
    }
    return;
  }

  await processAndSaveImageFile(wrapper, file);

  // Permite escolher novamente o mesmo arquivo depois
  input.value = "";
});


// ----------------------------------------------------------
// 4. CTRL + V
// ----------------------------------------------------------

document.addEventListener("paste", async (e) => {
  const wrapper =
    e.target.closest(".memorial-image-upload-wrapper") ||
    activeImageWrapper;

  if (!wrapper) return;

  const clipboard = e.clipboardData || window.clipboardData;

  if (!clipboard) return;


  // ----------------------------------------------
  // PRIMEIRO: tenta imagem real no clipboard
  // ----------------------------------------------

  const items = clipboard.items;

  if (items) {
    for (let i = 0; i < items.length; i++) {

      const item = items[i];

      if (
        item.kind === "file" &&
        item.type &&
        item.type.startsWith("image/")
      ) {

        const file = item.getAsFile();

        if (file) {
          e.preventDefault();

          activeImageWrapper = wrapper;

          await processAndSaveImageFile(wrapper, file);

          return;
        }
      }
    }
  }


  // ----------------------------------------------
  // SEGUNDO: tenta texto / endereço da imagem
  // ----------------------------------------------

  let text = "";

  try {
    text = clipboard.getData("text/plain");
  } catch (error) {
    text = "";
  }

  text = String(text || "").trim();

  if (!text) return;


  const isImageURL =
    /^https?:\/\/.+/i.test(text) ||
    /^data:image\//i.test(text);

  if (!isImageURL) return;

  e.preventDefault();

  activeImageWrapper = wrapper;

  await processAndSaveImageURL(wrapper, text);
});


// ----------------------------------------------------------
// 5. ARRASTAR E SOLTAR IMAGEM
// ----------------------------------------------------------

document.addEventListener("dragover", (e) => {
  const wrapper = e.target.closest(
    ".memorial-image-upload-wrapper"
  );

  if (!wrapper) return;

  e.preventDefault();

  activeImageWrapper = wrapper;
});


document.addEventListener("drop", async (e) => {
  const wrapper = e.target.closest(
    ".memorial-image-upload-wrapper"
  );

  if (!wrapper) return;

  e.preventDefault();

  activeImageWrapper = wrapper;

  const files = e.dataTransfer?.files;

  if (!files || !files.length) return;

  const file = files[0];

  if (!file.type || !file.type.startsWith("image/")) {
    if (typeof showToast === "function") {
      showToast("Solte apenas arquivos de imagem.", true);
    }
    return;
  }

  await processAndSaveImageFile(wrapper, file);
});


// ==========================================================
// PROCESSAMENTO DO ARQUIVO
// ==========================================================

async function processAndSaveImageFile(wrapper, file) {
  if (!wrapper || !file) return false;

  try {
    if (!file.type || !file.type.startsWith("image/")) {
      if (typeof showToast === "function") {
        showToast("O arquivo selecionado não é uma imagem.", true);
      }
      return false;
    }

    if (typeof showToast === "function") {
      showToast(`Enviando ${file.name || "imagem"}...`, false);
    }

    // 1. Envia a imagem para o Supabase Storage
    const imageUrl = await uploadMemorialImageToStorage(file);

    // 2. Salva somente a URL no projeto
    const saved = await saveImageToProject(wrapper, imageUrl);

    if (saved) {
      if (typeof showToast === "function") {
        showToast("Imagem adicionada com sucesso!", false);
      }
    }

    return saved;

  } catch (error) {
    console.error("Erro no upload da imagem do Memorial:", error);

    if (typeof showToast === "function") {
      showToast("Não foi possível carregar a imagem.", true);
    }

    return false;
  }
}


// ==========================================================
// PROCESSAMENTO DE URL
// ==========================================================

async function processAndSaveImageURL(wrapper, url) {
  if (!wrapper || !url) return false;

  const cleanUrl = String(url).trim();

  if (
    !/^https?:\/\//i.test(cleanUrl) &&
    !/^data:image\//i.test(cleanUrl)
  ) {
    return false;
  }

  // URL externa:
  // armazenamos a referência sem transformar em Base64.
  return saveImageToProject(wrapper, cleanUrl);
}

// ==========================================================
// SALVAR IMAGEM NO PROJETO ATUAL
// ==========================================================

async function saveImageToProject(wrapper, imageUrl) {
  if (!wrapper || !imageUrl) return false;

  const project = currentProject();

  if (!project) {
    console.error(
      "Nenhum projeto atual encontrado para salvar a imagem."
    );

    if (typeof showToast === "function") {
      showToast("Nenhum projeto está selecionado.", true);
    }

    return false;
  }

  const key = wrapper.dataset.key;
  const rowIndex = Number(wrapper.dataset.row);

  if (!key || !Number.isInteger(rowIndex) || rowIndex < 0) {
    console.error("Dados da imagem inválidos:", {
      key,
      rowIndex,
      wrapper
    });

    return false;
  }

  if (
    !project.memorial ||
    !Array.isArray(project.memorial[key])
  ) {
    console.error(
      "Categoria do Memorial não encontrada:",
      key
    );

    return false;
  }

  const row = project.memorial[key][rowIndex];

  if (!row) {
    console.error("Linha do Memorial não encontrada:", {
      key,
      rowIndex
    });

    return false;
  }

  // IMPORTANTE:
  // Agora guardamos somente a URL, nunca mais o Base64.
  row.foto = imageUrl;

  memorialMarkDirty(project);

  const saved = await memorialSave(project);

  if (!saved) {
    if (typeof showToast === "function") {
      showToast("Não foi possível salvar a imagem.", true);
    }

    return false;
  }

  renderMemorial(project);

  return true;
}

// ==========================================================
// MEMORIAL — UPLOAD DE IMAGENS PARA O SUPABASE STORAGE
// ==========================================================

async function uploadMemorialImageToStorage(file) {
  if (!file) {
    throw new Error("Nenhum arquivo foi fornecido.");
  }

  if (!file.type || !file.type.startsWith("image/")) {
    throw new Error("O arquivo selecionado não é uma imagem.");
  }

  const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error(
      "A imagem é muito grande. O tamanho máximo permitido é 10 MB."
    );
  }

  const cleanBaseUrl = SUPABASE_URL.replace(/\/$/, "");
  const bucketName = "menche-files";

  // Nome seguro e único
  const originalName = file.name || "imagem.jpg";

  const cleanName = originalName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.-]/g, "_");

  const uniqueName =
    `memorial_${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${cleanName}`;

  const uploadUrl =
    `${cleanBaseUrl}/storage/v1/object/${bucketName}/${encodeURIComponent(uniqueName)}`;

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "apikey": SUPABASE_KEY,
      "Content-Type": file.type,
      "x-upsert": "true"
    },
    body: file
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    throw new Error(
      errorData.message ||
      errorData.error ||
      `Erro HTTP ${response.status}`
    );
  }

  return `${cleanBaseUrl}/storage/v1/object/public/${bucketName}/${encodeURIComponent(uniqueName)}`;
}


const btnChangeCover = document.getElementById("btnChangeCover");
const coverChoiceModal = document.getElementById("coverChoiceModal");
const btnCloseCoverChoice = document.getElementById("btnCloseCoverChoice");
const btnCoverFromComputer = document.getElementById("btnCoverFromComputer");
const btnCoverFromUnsplash = document.getElementById("btnCoverFromUnsplash");
const btnCoverRandom = document.getElementById("btnCoverRandom");
const coverComputerInput = document.getElementById("coverComputerInput");

const btnAdjustCover = document.getElementById("btnAdjustCover");

const coverAdjustModal = document.getElementById("coverAdjustModal");
const btnCloseCoverAdjust = document.getElementById("btnCloseCoverAdjust");
const btnMoveCoverUp = document.getElementById("btnMoveCoverUp");
const btnMoveCoverDown = document.getElementById("btnMoveCoverDown");
const btnCancelCoverAdjust = document.getElementById("btnCancelCoverAdjust");
const btnSaveCoverAdjust = document.getElementById("btnSaveCoverAdjust");

const unsplashModal = document.getElementById("unsplashModal");
const btnCloseUnsplash = document.getElementById("btnCloseUnsplash");
const unsplashSearchInput = document.getElementById("unsplashSearchInput");
const btnUnsplashSearch = document.getElementById("btnUnsplashSearch");
const unsplashResults = document.getElementById("unsplashResults");


let temporaryCoverPosition = 50;
let originalCoverPosition = 50;
let coverAdjusting = false;

let coverDragStartY = 0;
let coverDragStartPosition = 50;


function applyCoverPosition(position) {
  const cover = document.getElementById("projCover");

  if (!cover) return;

  cover.style.objectPosition = `center ${position}%`;
}


function startCoverAdjustment() {
  const project = currentProject();
  const cover = document.getElementById("projCover");

  if (!project || !cover) return;

  originalCoverPosition = Number(
    project.coverPosition ?? 50
  );

  if (!Number.isFinite(originalCoverPosition)) {
    originalCoverPosition = 50;
  }

  temporaryCoverPosition = originalCoverPosition;

  coverAdjusting = true;

  cover.classList.add("cover-adjusting");

  btnAdjustCover.textContent = "✓ Salvar posição";
}


async function saveCoverAdjustment() {
  const project = currentProject();

  if (!project) return;

  try {
    project.coverPosition = temporaryCoverPosition;

    await saveProjects([project]);

    originalCoverPosition = temporaryCoverPosition;

    coverAdjusting = false;

    const cover = document.getElementById("projCover");

    if (cover) {
      cover.classList.remove("cover-adjusting");
    }

    btnAdjustCover.textContent = "↕ Ajustar capa";

    if (typeof showToast === "function") {
      showToast("Posição da capa salva.");
    }

  } catch (error) {
    console.error(
      "[CAPA] Erro ao salvar posição:",
      error
    );

    if (typeof showToast === "function") {
      showToast(
        "Não foi possível salvar a posição.",
        true
      );
    }
  }
}


btnAdjustCover?.addEventListener("click", async () => {

  if (coverAdjusting) {
    await saveCoverAdjustment();
    return;
  }

  startCoverAdjustment();

});


const projCoverElement =
  document.getElementById("projCover");


projCoverElement?.addEventListener(
  "pointerdown",
  (event) => {

    if (!coverAdjusting) return;

    coverDragStartY = event.clientY;

    coverDragStartPosition =
      temporaryCoverPosition;

    projCoverElement.setPointerCapture(
      event.pointerId
    );

    event.preventDefault();
  }
);


projCoverElement?.addEventListener(
  "pointermove",
  (event) => {

    if (!coverAdjusting) return;

    if (
      !projCoverElement.hasPointerCapture(
        event.pointerId
      )
    ) {
      return;
    }

    const deltaY =
      event.clientY - coverDragStartY;

    const movement =
      deltaY / 3;

    temporaryCoverPosition =
      Math.max(
        0,
        Math.min(
          100,
          coverDragStartPosition - movement
        )
      );

    applyCoverPosition(
      temporaryCoverPosition
    );
  }
);


projCoverElement?.addEventListener(
  "pointerup",
  (event) => {

    if (!coverAdjusting) return;

    if (
      projCoverElement.hasPointerCapture(
        event.pointerId
      )
    ) {
      projCoverElement.releasePointerCapture(
        event.pointerId
      );
    }
  }
);


projCoverElement?.addEventListener(
  "pointercancel",
  (event) => {

    if (!coverAdjusting) return;

    if (
      projCoverElement.hasPointerCapture(
        event.pointerId
      )
    ) {
      projCoverElement.releasePointerCapture(
        event.pointerId
      );
    }
  }
);
	
function openCoverChoiceModal() {
  if (!coverChoiceModal) return;
  coverChoiceModal.hidden = false;
}

function closeCoverChoiceModal() {
  if (!coverChoiceModal) return;
  coverChoiceModal.hidden = true;
}

btnChangeCover?.addEventListener("click", openCoverChoiceModal);

btnCloseCoverChoice?.addEventListener("click", closeCoverChoiceModal);

coverChoiceModal?.addEventListener("click", (event) => {
  if (event.target === coverChoiceModal) {
    closeCoverChoiceModal();
  }
});

btnCoverFromComputer?.addEventListener("click", () => {
  if (clientMode) return;
  coverComputerInput?.click();
});

coverComputerInput?.addEventListener("change", async () => {
  const file = coverComputerInput.files?.[0];
  if (!file) return;

  const project = currentProject();
  if (!project) return;

  try {
    showToast("Enviando capa...", false);

    const imageUrl = await uploadMemorialImageToStorage(file);

    project.image = imageUrl;

    await saveProjects([project]);

    closeCoverChoiceModal();

    if (typeof renderSidebar === "function") {
      renderSidebar();
    }

    if (typeof showToast === "function") {
      showToast("Capa atualizada.");
    }

  } catch (error) {
    console.error("[CAPA] Erro no upload:", error);

    if (typeof showToast === "function") {
      showToast(
        error?.message || "Não foi possível enviar a capa.",
        true
      );
    }

  } finally {
    coverComputerInput.value = "";
  }
});

function openUnsplashModal() {
  if (!unsplashModal) return;

  closeCoverChoiceModal();

  unsplashModal.hidden = false;

  setTimeout(() => {
    unsplashSearchInput?.focus();
  }, 50);
}

function closeUnsplashModal() {
  if (!unsplashModal) return;

  unsplashModal.hidden = true;
}

btnCoverFromUnsplash?.addEventListener("click", openUnsplashModal);

btnCloseUnsplash?.addEventListener("click", closeUnsplashModal);

unsplashModal?.addEventListener("click", (event) => {
  if (event.target === unsplashModal) {
    closeUnsplashModal();
  }
});

async function searchUnsplash() {
  const query = unsplashSearchInput?.value.trim();

  if (!query) {
    showToast("Digite o que deseja pesquisar.", true);
    return;
  }

  if (!unsplashResults) return;

  unsplashResults.innerHTML = "<p>Pesquisando...</p>";

  try {
    const response = await fetch(
      `/api/unsplash?type=search&query=${encodeURIComponent(query)}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error || "Erro ao pesquisar no Unsplash."
      );
    }

    const results = Array.isArray(data.results)
      ? data.results
      : [];

    if (!results.length) {
      unsplashResults.innerHTML =
        "<p>Nenhuma imagem encontrada.</p>";
      return;
    }

    unsplashResults.innerHTML = results.map((photo) => `
      <button
        type="button"
        class="unsplash-result"
        data-photo-url="${photo.urls.regular}"
        data-photo-link="${photo.links.html}"
      >
        <img
          src="${photo.urls.regular}"
          alt="${photo.alt_description || "Imagem do Unsplash"}"
          loading="lazy"
        >
      </button>
    `).join("");

    unsplashResults
      .querySelectorAll(".unsplash-result")
      .forEach((button) => {

        button.addEventListener("click", async () => {

          const project = currentProject();

          if (!project) return;

          const photoUrl = button.dataset.photoUrl;
          const photoLink = button.dataset.photoLink;

          if (!photoUrl) return;

          try {
            project.image = photoUrl;
            project.coverSource = "unsplash";
            project.coverUnsplashUrl = photoLink || "";

            await saveProjects([project]);

            closeUnsplashModal();

            if (typeof renderSidebar === "function") {
              renderSidebar();
            }

            if (typeof showToast === "function") {
              showToast("Capa atualizada.");
            }

          } catch (error) {
            console.error(
              "[UNSPLASH] Erro ao salvar capa:",
              error
            );

            showToast(
              "Não foi possível salvar a capa.",
              true
            );
          }
        });
      });

  } catch (error) {
    console.error(
      "[UNSPLASH] Erro na pesquisa:",
      error
    );

    unsplashResults.innerHTML =
      "<p>Não foi possível realizar a pesquisa.</p>";

    showToast(
      "Erro ao pesquisar no Unsplash.",
      true
    );
  }
}

btnUnsplashSearch?.addEventListener(
  "click",
  searchUnsplash
);

unsplashSearchInput?.addEventListener(
  "keydown",
  (event) => {
    if (event.key === "Enter") {
      searchUnsplash();
    }
  }
);
	
btnCoverRandom?.addEventListener("click", async () => {
  const project = currentProject();
  if (!project) return;

  try {
    showToast("Escolhendo uma capa...", false);

    const response = await fetch(
      `/api/unsplash?type=random&query=architecture interior design`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error || "Não foi possível buscar uma imagem."
      );
    }

    const photoUrl = data?.urls?.regular;
    const photoLink = data?.links?.html;

    if (!photoUrl) {
      throw new Error("O Unsplash não retornou uma imagem.");
    }

    project.image = photoUrl;
    project.coverSource = "unsplash";
    project.coverUnsplashUrl = photoLink || "";

    await saveProjects([project]);

    closeCoverChoiceModal();

    if (typeof renderSidebar === "function") {
      renderSidebar();
    }

    if (typeof showToast === "function") {
      showToast("Capa atualizada.");
    }

  } catch (error) {
    console.error("[UNSPLASH] Erro na capa aleatória:", error);

    if (typeof showToast === "function") {
      showToast(
        "Não foi possível escolher uma capa aleatória.",
        true
      );
    }
  }
});
	
// ==========================================================
// CONTROLE DA TELA DE INTRODUÇÃO (LOGO PULSANTO)
// ==========================================================

	if (document.getElementById("introSplash")) {
  setTimeout(() => {
    const splash = document.getElementById("introSplash");
    if (splash) {
      splash.style.opacity = "0";
      setTimeout(() => {
        splash.style.display = "none";
      }, 500);
    }
  }, 1200);
}
	
})();
