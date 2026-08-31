(() => {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const STORAGE_KEY = "archDashV3";

  /* Senha mestre do designer (altere aqui) e chave de persistência do desbloqueio */
  const MASTER_PASSWORD = "8452";
  const DESIGNER_KEY = "archDashV3_designer";
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
    { id: "briefing", label: "Briefing", hint: "Coletar informações, necessidades e objetivos do cliente." },
    { id: "levantamento", label: "Levantamento", hint: "Medidas, condições do local e levantamento técnico." },
    { id: "estudo", label: "Estudo Preliminar", hint: "Primeiras propostas conceituais e distribuição de ambientes." },
    { id: "anteprojeto", label: "Anteprojeto", hint: "Desenvolvimento das soluções, plantas, cortes e materiais." },
    { id: "executivo", label: "Projeto Executivo", hint: "Detalhamento técnico para execução, compatibilização e orçamento." },
    { id: "pos", label: "Pós-projeto", hint: "Acompanhamento de obra, decoração, as-built e entrega." },
    { id: "contratos", label: "Contratos", hint: "Registre e visualize contratos, aditivos, documentos e links.", special: "contracts" },
    { id: "memorial", label: "Memorial Descritivo", hint: "Planilhas de móveis soltos, marcenaria e fornecedores com preços e links de produtos.", special: "memorial" },
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
    "em andamento": "Em Andamento",
    concluido: "Concluído",
  };

  const STATUS_CLASS = {
    "em andamento": "status-em-andamento",
    concluido: "status-concluido",
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
  let designerUnlocked = sessionStorage.getItem(DESIGNER_KEY) === "true";

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
      btn.textContent = btn.dataset.unlockedLabel || "Bloquear acesso do Designer";
    } else {
      btn.classList.remove("active");
      btn.textContent = btn.dataset.lockedLabel || "Acesso Restrito do Designer";
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
  function emptyStage() {
    return { text: "", files: [] };
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

async function loadProjects() {
    try {
      const snapshot = await db.collection("projects").get();
      if (snapshot.empty) {
        return Array.isArray(initialProjects) ? initialProjects : [];
      }
      const projectsList = [];
      snapshot.forEach((doc) => {
        projectsList.push({ id: doc.id, ...doc.data() });
      });
      return projectsList;
    } catch (error) {
      console.error("Erro ao carregar do Firebase:", error);
      return Array.isArray(initialProjects) ? initialProjects : [];
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
        projects[index] = updatedProject;
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

  async function importFiles(files, arr) {
    const MAX_SIZE = 4 * 1024 * 1024;
    let added = 0;
    for (const file of files) {
      if (file.size > MAX_SIZE) {
        showToast(`"${file.name}" excede 4MB e não foi adicionado.`, true);
        continue;
      }
      const dataUrl = await readFileAsDataUrl(file);
      arr.push({ id: uid(), name: file.name, type: file.type, size: file.size, dataUrl });
      added++;
    }
    return added > 0 && saveProjects();
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
        const isImg = f.type && f.type.startsWith("image/");
        const thumb = isImg
          ? `<img src="${f.dataUrl}" alt="${escapeHTML(f.name)}" />`
          : ICONS.fileDoc;

        // Por segurança, arquivos antigos que ainda não possuem
        // a propriedade allowClientDownload começam bloqueados.
        const canDownload = f.allowClientDownload === true;

        return `
          <div class="file-item" data-file-id="${f.id}">
            <div class="file-thumb">${thumb}</div>

            <div class="file-meta">
              <span class="file-name">${escapeHTML(f.name)}</span>
              <span class="file-size">${f.type || "Arquivo"} · ${formatBytes(f.size)}</span>

              <label class="file-client-download">
                <input
                  type="checkbox"
                  class="file-download-toggle"
                  data-file-id="${f.id}"
                  ${canDownload ? "checked" : ""}
                />
                Permitir download pelo cliente
              </label>
            </div>

            <a
              class="file-open"
              href="${f.dataUrl}"
              target="_blank"
              rel="noopener"
            >Abrir</a>

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
  <article class="card" data-id="${p.id}" tabindex="0" style="animation-delay: ${Math.min(index * 60, 360)}ms">
    <div class="card-cover">
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

    const term = searchTerm.trim().toLowerCase();
    const filtered = projects.filter((p) => {
      const matchFilter =
        activeFilter === "todos" ||
        p.type === activeFilter ||
        p.status === activeFilter;
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
    stats.innerHTML = filtered.length === projects.length
      ? `<strong>${projects.length}</strong> projetos · <strong>${formatArea(totalM2)} m²</strong> totais · <strong>${activeCount}</strong> em andamento`
      : `<strong>${filtered.length}</strong> de <strong>${projects.length}</strong> projetos · <strong>${formatArea(filteredM2)} m²</strong>`;
  }

  /* ---------------- Render: visão interna ---------------- */
  function stageHasContent(project, stage) {
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

  const unread = clientMode
    ? hasUnreadDesignerMessage(p.stages?.[stage.id])
    : hasUnreadClientMessage(p.stages?.[stage.id]);

  return `
    <button class="stage-link ${
      stage.id === currentStage ? "active" : ""
    } ${unread ? "has-unread-message" : ""}" data-stage="${stage.id}">
      ${ICONS[stage.id]}
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

    // Marca como lidas somente as mensagens
    // da etapa que acabou de ser aberta.
    const p = currentProject();
    const stage = p?.stages?.[currentStage];

    if (stage && Array.isArray(stage.clientMessages)) {
      let changed = false;

      stage.clientMessages.forEach((message) => {
        if (clientMode) {
          // Cliente abriu a etapa:
          // marca mensagens do designer como lidas.
          if (
            message.author === "designer" &&
            message.readByClient !== true
          ) {
            message.readByClient = true;
            changed = true;
          }
        } else {
          // Designer abriu a etapa:
          // marca mensagens do cliente como lidas.
          if (
            message.author === "client" &&
            message.readByDesigner !== true
          ) {
            message.readByDesigner = true;
            changed = true;
          }
        }
      });

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

  /* ---------------- Render: etapa (proprietário) ---------------- */
  function renderStage(autoRefresh = false) {
    const project = currentProject();
    const stage = STAGES.find((s) => s.id === currentStage);
    if (!project || !stage) return;

    if (readOnlyView()) return renderStageClient(project, stage);

    if (stage.special === "contracts") return renderContracts(project);
    if (stage.special === "memorial") return renderMemorial(project);

    const s = project.stages[stage.id];
	const container = $("#stageContainer");

// Mensagens recebidas do cliente só são marcadas como lidas
// quando o designer realmente abre a etapa. Atualizações automáticas
// do listener não devem apagar o aviso.

    container.innerHTML = `
      <div class="stage-header">
        <h2>${stage.label}</h2>
        <p class="stage-hint">${stage.hint}</p>
      </div>

      <div class="panel">
        <h3>${ICONS.upload} Arquivos da etapa</h3>
        <label>Upload de PDFs, imagens de renders, plantas e documentos</label>
        ${makeDropzoneHTML("image/*,application/pdf,.dwg,.dxf")}
        <div class="file-list" id="stageFiles">${fileListHTML(s.files)}</div>
      </div>

      <div class="panel client-conversation-panel">
        <h3>💬 Conversa com o cliente</h3>

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

    const dz = $("[data-dropzone]", container);
    attachDropzone(dz, s.files, () => renderStage());

    $$("#stageFiles .file-remove").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.closest(".file-item").dataset.fileId;
        s.files = s.files.filter((f) => f.id !== id);
        if (saveProjects()) renderStage();
      });
    });

	const designerInput = $("#designerMessageInput");
    const designerButton = $("#btnSendDesignerMessage");

	$$("#stageConversation .btn-message-edit").forEach((button) => {
  button.addEventListener("click", async () => {
    const messageId = button.dataset.messageId;
    const message = s.clientMessages?.find((m) => m.id === messageId);

    if (!message || message.author !== "designer") return;

    const newText = prompt("Edite sua mensagem:", message.text);

    if (newText === null) return;

    const text = newText.trim();

    if (!text) {
      showToast("A mensagem não pode ficar vazia.", true);
      return;
    }

    message.text = text;
    message.editedAt = Date.now();

    if (await saveProjects()) {
      renderStage();
      showToast("Mensagem editada.");
    }
  });
});

$$("#stageConversation .btn-message-delete").forEach((button) => {
  button.addEventListener("click", async () => {
    const messageId = button.dataset.messageId;
    const index = s.clientMessages?.findIndex(
      (m) => m.id === messageId
    );

    if (index === -1) return;

    const message = s.clientMessages[index];

    if (!message || message.author !== "designer") return;

    if (!confirm("Apagar esta mensagem?")) return;

    s.clientMessages.splice(index, 1);

    if (await saveProjects()) {
      renderStage();
      showToast("Mensagem apagada.");
    }
  });
});
	  
    designerButton.addEventListener("click", async () => {
      const text = designerInput.value.trim();

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
  const container = $("#stageContainer");

  const header = `
    <div class="stage-header">
      <h2>${stage.label}</h2>
      <p class="stage-hint">${stage.hint}</p>
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

  const s = project.stages[stage.id];

  container.innerHTML = header + `
    <div class="panel">
      <h3>${ICONS[stage.id]} Arquivos da etapa</h3>
      <label>Renders, plantas e documentos desta etapa</label>
      ${clientFilesHTML(s.files || [])}
    </div>

    <div class="panel client-conversation-panel">
      <h3>💬 Observações e conversa</h3>
      <p class="conversation-hint">
        Envie uma observação, dúvida ou solicitação sobre esta etapa.
      </p>

      <div id="stageConversation">
        ${stageConversationHTML(s.clientMessages || [])}
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

  const input = $("#clientMessageInput");
  const sendButton = $("#btnSendClientMessage");
  // Liga os botões de arquivo do cliente
  $$("#stageContainer .client-file-download").forEach((button) => {
    button.addEventListener("click", () => {
      const fileId = button.dataset.fileId;
      const file = (s.files || []).find((f) => f.id === fileId);

      if (!file || !file.dataUrl) {
        showToast("Arquivo não encontrado.", true);
        return;
      }

      openClientFile(file.dataUrl, file.name, true);
    });
  });

  $$("#stageContainer .client-file-view").forEach((button) => {
    button.addEventListener("click", () => {
      const fileId = button.dataset.fileId;
      const file = (s.files || []).find((f) => f.id === fileId);

      if (!file || !file.dataUrl) {
        showToast("Arquivo não encontrado.", true);
        return;
      }

      openClientFile(file.dataUrl, file.name, false);
    });
  });

$$("#stageConversation .btn-message-edit").forEach((button) => {
  button.addEventListener("click", async () => {
    const messageId = button.dataset.messageId;
    const message = s.clientMessages?.find((m) => m.id === messageId);

    if (!message || message.author !== "client") return;

    const newText = prompt("Edite sua mensagem:", message.text);

    if (newText === null) return;

    const text = newText.trim();

    if (!text) {
      showToast("A mensagem não pode ficar vazia.", true);
      return;
    }

    message.text = text;
    message.editedAt = Date.now();

    if (await saveProjects()) {
      renderStageClient(project, stage);
      showToast("Mensagem editada.");
    }
  });
});

$$("#stageConversation .btn-message-delete").forEach((button) => {
  button.addEventListener("click", async () => {
    const messageId = button.dataset.messageId;
    const index = s.clientMessages?.findIndex(
      (m) => m.id === messageId
    );

    if (index === -1) return;

    const message = s.clientMessages[index];

    if (!message || message.author !== "client") return;

    if (!confirm("Apagar esta mensagem?")) return;

    s.clientMessages.splice(index, 1);

    if (await saveProjects()) {
      renderStageClient(project, stage);
      showToast("Mensagem apagada.");
    }
  });
});
	
  sendButton.addEventListener("click", async () => {
    const text = input.value.trim();

    if (!text) {
      showToast("Escreva uma observação antes de enviar.", true);
      return;
    }

    if (!Array.isArray(s.clientMessages)) {
      s.clientMessages = [];
    }

    s.clientMessages.push({
  id: uid(),
  author: "client",
  text,
  createdAt: Date.now(),
  readByDesigner: false,
});

    sendButton.disabled = true;
    sendButton.textContent = "Enviando...";

    const saved = await saveProjects();

    if (saved) {
      input.value = "";
      renderStageClient(project, stage);
      showToast("Observação enviada.");
    } else {
      s.clientMessages.pop();
      sendButton.disabled = false;
      sendButton.textContent = "Enviar observação";
    }
  });
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
            <strong>${isClient ? "Cliente" : "Menchë Interiores"}</strong>
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

  return files
    .map((f) => {
      const isImg = f.type && f.type.startsWith("image/");
      const thumb = isImg
        ? `<img src="${f.dataUrl}" alt="${escapeHTML(f.name)}" />`
        : ICONS.fileDoc;

const canDownload = f.allowClientDownload === true;

const action = `
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
            <span class="file-size">${f.type || "Arquivo"} · ${formatBytes(f.size)}</span>
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
    showToast("Não foi possível abrir este arquivo.", true);
  }
}

  function memorialClientHTML(project) {
    return (
      Object.keys(MEMORIAL_TABLES)
        .map((key) => {
          const table = MEMORIAL_TABLES[key];
          const rows = project.memorial[key];
			const qtyTotal = rows.reduce((total, r) => {
  return total + (parseFloat(String(r.qty || "").replace(",", ".")) || 0);
}, 0);

const priceTotal = rows.reduce((total, r) => {
  const qty = parseFloat(String(r.qty || "").replace(",", ".")) || 0;
  const price = parsePrice(r.preco);
  return total + qty * price;
}, 0);
          const head = `<tr><th>${table.cols.map((c) => escapeHTML(c.label)).join("</th><th>")}</th></tr>`;
          let body;
          if (!rows.length) {
            body = `<tr class="row-empty"><td colspan="${table.cols.length}">Nenhum item cadastrado.</td></tr>`;
          } else {
            body = rows
              .map((r) => {
                const cells = table.cols.map((col) => {
                  if (col.key === "link") {
                    return r[col.key]
                      ? `<td><a class="memorial-link" href="${escapeHTML(normalizeUrl(r[col.key]))}" target="_blank" rel="noopener">${escapeHTML(r[col.key])}</a></td>`
                      : "<td>—</td>";
                  }
                  if (col.key === "preco") {
                    const valor = parsePrice(r[col.key]);
                    return `<td>${valor > 0 ? formatCurrency(valor) : ""}</td>`;
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
      ${qtyTotal > 0 ? " · Qtd. total " + formatArea(qtyTotal) : ""}
      ${priceTotal > 0 ? " · " + formatCurrency(priceTotal) : ""}
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
          ${project.contracts.length ? contractListHTML(project.contracts) : '<div class="file-empty">Nenhum contrato registrado.</div>'}
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
        showToast("Informe o nome do documento.", true);
        return;
      }
      if (isLink && !link) {
        showToast("Informe o link.", true);
        return;
      }
      if (!isLink && !fileInput.files.length) {
        showToast("Selecione um arquivo.", true);
        return;
      }

      const allowClientDownload = $("#cAllowDownload").checked;
	
      let item;
      if (isLink) {
        item = {
          id: uid(),
          name,
          kind: "link",
          value: normalizeUrl(link),
          allowClientDownload,
        };
      } else {
        const file = fileInput.files[0];
        if (file.size > 4 * 1024 * 1024) {
          showToast("O arquivo excede 4MB.", true);
          return;
        }
        const dataUrl = await readFileAsDataUrl(file);
        item = {
          id: uid(),
          name,
          kind: "file",
          value: dataUrl,
          fileName: file.name,
          fileType: file.type,
          allowClientDownload,
        };
      }

      project.contracts.push(item);
      if (saveProjects()) {
        $("#cName").value = "";
        $("#cLink").value = "";
        fileInput.value = "";
        renderContracts(project);
        showToast("Documento adicionado.");
      }
    });

    $$("#contractList .contract-download-toggle").forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        const id = checkbox.dataset.contractId;
        const contract = project.contracts.find((c) => c.id === id);

        if (!contract) return;

        contract.allowClientDownload = checkbox.checked;

        if (saveProjects()) {
          showToast(
            checkbox.checked
              ? "Download liberado para o cliente."
              : "Download bloqueado para o cliente."
          );
        }
      });
    });
	$$("#contractList .contract-download-checkbox").forEach((checkbox) => {
 	checkbox.addEventListener("change", () => {
     const id = checkbox.dataset.contractId;
     const contract = project.contracts.find((c) => c.id === id);

     if (!contract) return;

     contract.allowClientDownload = checkbox.checked;

     if (saveProjects()) {
       showToast(
         checkbox.checked
          ? "Download liberado para o cliente."
          : "Download bloqueado para o cliente."
      );
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

      // Links externos não são arquivos armazenados no Hub.
      // Portanto, o cliente pode abrir o link normalmente.
      if (c.kind === "link") {
        return `
          <div class="contract-item">
            <span class="contract-kind ${kindClass}">${kindLabel}</span>

            <div class="contract-meta">
              <strong>${escapeHTML(c.name)}</strong>
              <span>${escapeHTML(c.value)}</span>
            </div>

            <a
              class="file-open"
              href="${escapeHTML(c.value)}"
              target="_blank"
              rel="noopener"
            >Abrir</a>
          </div>`;
      }

      // Arquivos: visualizar sempre.
      // Download somente se você tiver liberado.
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
    showToast("Não foi possível visualizar este arquivo.", true);
  }
}

function attachClientContractViewers(project) {
  $$(".contract-view-file").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.contractId;
      const contract = (project.contracts || []).find((c) => c.id === id);

      if (!contract || !contract.value) {
        showToast("Arquivo não encontrado.", true);
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
            href="${escapeHTML(c.value)}"
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
        <label>Upload de PDFs, imagens de renders, plantas e documentos</label>
        ${makeDropzoneHTML("image/*,application/pdf,.dwg,.dxf")}
        <div class="file-list" id="memorialFiles">${fileListHTML(project.memorialFiles)}</div>
      </div>
      ${Object.keys(MEMORIAL_TABLES)
        .map((key) => memorialSectionHTML(project, key))
        .join("")}
      ${memorialGrandTotalHTML(project)}`;

    attachDropzone(container, project.memorialFiles, () => renderMemorial(project));

    $$("#memorialFiles .file-remove").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.closest(".file-item").dataset.fileId;
        project.memorialFiles = project.memorialFiles.filter((f) => f.id !== id);
        if (saveProjects()) renderMemorial(project);
      });
    });

    Object.keys(MEMORIAL_TABLES).forEach((key) => {
      const table = MEMORIAL_TABLES[key];
      const rows = project.memorial[key];

      $("#btnAddRow-" + key).addEventListener("click", () => {
const row = {};

table.cols.forEach((col) => {
  row[col.key] = "";
});

// Gera automaticamente o próximo número do item
const numerosExistentes = rows
  .map((r) => parseInt(String(r.item || "").replace(/\D/g, ""), 10))
  .filter((n) => !isNaN(n));

const proximoNumero =
  numerosExistentes.length > 0
    ? Math.max(...numerosExistentes) + 1
    : 1;

row.item = String(proximoNumero).padStart(3, "0");

rows.push(row);
        saveProjects();
        renderMemorial(project);
      });

      $$(`#memTable-${key} input[data-row]`).forEach((input) => {
        input.addEventListener("input", () => {
          const { row, col } = input.dataset;
          rows[Number(row)][col] = input.value;
          saveProjects();
        });
      });

      $$(`#memTable-${key} .row-del`).forEach((btn) => {
        btn.addEventListener("click", () => {
          const { row } = btn.dataset;
          rows.splice(Number(row), 1);
          saveProjects();
          renderMemorial(project);
        });
      });

      $$(`#memTable-${key} .link-open`).forEach((btn) => {
        btn.addEventListener("click", () => {
          const { row } = btn.dataset;
          const value = rows[Number(row)].link || "";
          if (!value.trim()) {
            showToast("Informe o link do produto primeiro.", true);
            return;
          }
          window.open(normalizeUrl(value), "_blank", "noopener");
        });
      });
    });
  }

  function memorialSectionHTML(project, key) {
    const table = MEMORIAL_TABLES[key];
    const rows = project.memorial[key];

    const qtyTotal = rows
      .map((r) => parseFloat(String(r.qty || "").replace(",", ".")))
      .filter((n) => !isNaN(n))
      .reduce((a, b) => a + b, 0);

    const priceTotal = rows.reduce((total, r) => {
      const qty =
        parseFloat(String(r.qty || "").replace(",", ".")) || 0;
      const price = parsePrice(r.preco);
      return total + qty * price;
    }, 0);

    const head = `<tr><th>${table.cols
      .map((c) => escapeHTML(c.label))
      .join("</th><th>")}</th><th></th></tr>`;

    let body;

    if (!rows.length) {
      body = `<tr class="row-empty"><td colspan="${table.cols.length + 1}">Nenhum item cadastrado — clique em "+ Adicionar".</td></tr>`;
    } else {
      body = rows
        .map((r, i) => {
          const cells = table.cols
            .map((col) => {
              if (col.key === "link") {
                return `
                  <td class="cell-link">
                    <div class="link-cell">
                      <input
                        type="text"
                        data-row="${i}"
                        data-col="link"
                        value="${escapeHTML(r[col.key] || "")}"
                        placeholder="https://produto.com.br"
                      />
                      <a
                        class="link-open"
                        data-row="${i}"
                        title="Abrir link do produto"
                      >${ICONS.openLink}</a>
                    </div>
                  </td>`;
              }

              if (col.key === "preco") {
                return `
                  <td>
<div class="price-input">
  <span class="price-prefix">R$</span>
  <input
    type="number"
    step="0.01"
    data-row="${i}"
    data-col="preco"
    value="${escapeHTML(r[col.key] || "")}"
  />
</div>
                  </td>`;
              }

              return `<td><input type="text" data-row="${i}" data-col="${col.key}" value="${escapeHTML(r[col.key] || "")}" /></td>`;
            })
            .join("");

          return `<tr>${cells}<td><button class="row-del" data-row="${i}" title="Remover linha">✕</button></td></tr>`;
        })
        .join("");
    }

    return `
      <div class="memorial-section">
        <div class="memorial-head">
          <h3>${ICONS.table} ${table.title}</h3>
          <button type="button" class="btn-small" id="btnAddRow-${key}">+ Adicionar</button>
        </div>

        <div class="table-wrap">
          <table class="memorial-table" id="memTable-${key}">
            <thead>${head}</thead>
            <tbody>${body}</tbody>
          </table>
        </div>

        ${
          qtyTotal > 0 || priceTotal > 0
            ? `<div class="memorial-summary">
                <strong>${table.title}:</strong>
                ${rows.length} item(ns)
                ${
                  qtyTotal > 0
                    ? " · Qtd. total " + formatArea(qtyTotal)
                    : ""
                }
                ${
                  priceTotal > 0
                    ? " · " + formatCurrency(priceTotal)
                    : ""
                }
              </div>`
            : ""
        }
      </div>`;
  }

  function memorialGrandTotalHTML(project) {
const grandTotal = Object.keys(MEMORIAL_TABLES).reduce(
  (sum, key) =>
    sum +
    (project.memorial[key] || []).reduce((s, r) => {
      const qty = parseFloat(String(r.qty || "").replace(",", ".")) || 0;
      const price = parsePrice(r.preco);
      return s + qty * price;
    }, 0),
  0
);
    const itemCount = Object.keys(MEMORIAL_TABLES).reduce(
      (sum, key) => sum + (project.memorial[key] || []).length,
      0
    );
    if (grandTotal <= 0 && itemCount === 0) return "";
    return `
      <div class="memorial-section memorial-total">
        <div class="memorial-head">
          <h3>${ICONS.table} Resumo geral do memorial</h3>
        </div>
        <div class="memorial-summary">
          <strong>${itemCount}</strong> itens no total ·
          ${grandTotal > 0 ? `valor estimado <strong>${formatCurrency(grandTotal)}</strong>` : "sem valores informados"}
        </div>
      </div>`;
  }

  /* ---------------- Modal novo projeto ---------------- */
  const modalOverlay = $("#modalOverlay");
  const projectForm = $("#projectForm");

  function openModal() {
    projectForm.reset();
    clearUpload();
    $$("#projectForm .field.invalid").forEach((f) => f.classList.remove("invalid"));
    modalOverlay.hidden = false;
    modalOverlay.style.display = "flex";
    document.body.style.overflow = "hidden";
    setTimeout(() => $("#fieldName").focus(), 60);
  }

function closeModal() {
  modalOverlay.hidden = true;
  modalOverlay.style.display = "none";
  document.body.style.overflow = "";
}

/* ---------------- Botão Novo Projeto ---------------- */
$("#btnNewProject").addEventListener("click", () => {
  if (!designerUnlocked || currentProjectId != null || clientMode) return;
  openModal();
});

  function handleCoverFile(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Selecione uma imagem válida.", true);
      return;
    }
    readFileAsDataUrl(file).then((dataUrl) => {
      $("#previewImage").src = dataUrl;
      $("#dropzonePreview").hidden = false;
      $("#dropzoneInner").hidden = true;
      uploadedImage = dataUrl;
    });
  }

  $("#fieldImage").addEventListener("change", (e) => handleCoverFile(e.target.files[0]));

  const dropzone = $("#dropzone");
  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("dragover");
  });
  dropzone.addEventListener("dragleave", () => dropzone.classList.remove("dragover"));
  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragover");
    handleCoverFile(e.dataTransfer.files[0]);
  });

  function clearUpload() {
    uploadedImage = null;
    $("#fieldImage").value = "";
    $("#previewImage").src = "";
    $("#dropzonePreview").hidden = true;
    $("#dropzoneInner").hidden = false;
  }

  $("#btnRemoveImage").addEventListener("click", clearUpload);

  function setInvalid(field, invalid) {
    field.closest(".field").classList.toggle("invalid", invalid);
  }

  projectForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = $("#fieldName").value.trim();
    const client = $("#fieldClient").value.trim();
    const area = parseFloat($("#fieldArea").value);
    const type = $("#fieldType").value;
    const status = $("#fieldStatus").value;
    const clientPassword = $("#fieldClientPassword").value.trim();

    setInvalid($("#fieldName"), !name);
    setInvalid($("#fieldClient"), !client);
    setInvalid($("#fieldArea"), !(area > 0));
    if (!name || !client || !(area > 0)) {
      showToast("Preencha os campos obrigatórios.", true);
      return;
    }

    const newProject = seedProject({
      id: uid(),
      title: name,
      client,
      area,
      type,
      status,
      clientPassword,
      image: uploadedImage || PLACEHOLDER,
    });

    projects.unshift(newProject);
    if (saveProjects()) {
      closeModal();
      renderDashboard();
      showToast("Projeto criado com sucesso!");
    }
  });

  /* ---------------- Navegação (proprietário) ---------------- */
  $("#btnBack").addEventListener("click", showDashboard);

  $("#filterBar").addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    activeFilter = chip.dataset.filter;
    $$("#filterBar .chip").forEach((c) => c.classList.toggle("active", c === chip));
    renderDashboard();
  });

  $("#searchInput").addEventListener("input", (e) => {
    searchTerm = e.target.value;
    renderDashboard();
  });

  $("#projectsGrid").addEventListener("click", (e) => {
    const card = e.target.closest(".card");
    if (card) openProject(card.dataset.id);
  });

  $("#projectsGrid").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.classList.contains("card")) {
      openProject(e.target.dataset.id);
    }
  });

  $("#btnDeleteProject").addEventListener("click", () => {
    const p = currentProject();
    if (!p) return;
    if (confirm(`Excluir o projeto "${p.title}" e todos os seus dados?`)) {
      projects = projects.filter((x) => x.id !== p.id);
      saveProjects();
      showDashboard();
      showToast("Projeto excluído.");
    }
  });

  /* ---------------- Botão Visualizar como Cliente ---------------- */
  $("#btnClientView").addEventListener("click", () => {
    if (!currentProject()) return;
    if (clientMode && localPreview) {
      localPreview = false;
      setClientMode(false);
      renderSidebar();
      renderStage();
      showToast("Você está no modo de edição novamente.");
    } else if (!clientMode && designerUnlocked) {
      if (currentStage === "contratos") currentStage = "briefing";
      localPreview = true;
      setClientMode(true);
      renderSidebar();
      renderStage();
      showToast("Modo cliente ativado — apenas visualização.");
    }
  });

  /* ---------------- Acesso Restrito do Designer ---------------- */
  $("#btnDesignerAccess").addEventListener("click", () => {
    if (designerUnlocked) {
      if (confirm("Bloquear o acesso do designer? As restrições voltam a valer.")) {
        lockDesigner();
        renderDashboard();
        renderSidebar();
        renderStage();
        showToast("Acesso do designer bloqueado.");
      }
      return;
    }
    openPasswordModal({
      title: "Acesso Restrito",
      hint: "Digite a senha para ver todos os projetos sem restrições.",
      onSuccess: (value) => {
        if (value === MASTER_PASSWORD) {
          unlockDesigner();
          closePasswordModal();
          showToast("Acesso do designer liberado.");
        } else {
          showToast("Senha incorreta.", true);
        }
      },
    });
  });

  /* ---------------- Modal de senha ---------------- */
  const passwordModal = $("#passwordModal");
  let passwordOnSuccess = null;
  let clientPasswordPending = false;

function openPasswordModal(opts) {
  passwordOnSuccess = opts.onSuccess || null;
  clientPasswordPending = opts.clientAccess === true;

  $("#passwordModalTitle").textContent = opts.title || "Acesso";
  $("#passwordModalHint").textContent = opts.hint || "";
  $("#passwordInput").value = "";

  passwordModal.hidden = false;
  passwordModal.style.display = "flex";
  document.body.style.overflow = "hidden";

  setTimeout(() => $("#passwordInput").focus(), 60);
}

function closePasswordModal(authenticated = false) {
  const wasClientPassword = clientPasswordPending;

  passwordOnSuccess = null;
  clientPasswordPending = false;

  passwordModal.hidden = true;
  passwordModal.style.display = "none";
  document.body.style.overflow = "";

  if (wasClientPassword && !authenticated) {
    window.location.replace(window.location.pathname);
  }
}

  $("#btnConfirmPassword").addEventListener("click", () => {
    const cb = passwordOnSuccess;
    if (cb) cb($("#passwordInput").value.trim());
  });

  $("#passwordInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const cb = passwordOnSuccess;
      if (cb) cb($("#passwordInput").value.trim());
    }
  });

  $("#btnClosePassword").addEventListener("click", closePasswordModal);
  $("#btnCancelPassword").addEventListener("click", closePasswordModal);
  passwordModal.addEventListener("click", (e) => {
    if (e.target === passwordModal) closePasswordModal();
  });

  /* ---------------- Compartilhar ---------------- */
  const shareModal = $("#shareModal");

  function shareLinkFor(project) {
    return location.origin + location.pathname + `?projeto=${encodeURIComponent(project.id)}`;
  }

  function openShareModal() {
    const p = currentProject();
    if (!p) return;
    $("#shareProjectName").textContent = `${p.title} — ${p.client}`;
    $("#shareLinkInput").value = shareLinkFor(p);
    $("#sharePasswordNote").textContent = p.clientPassword
      ? `Este projeto está protegido: o cliente precisará digitar a senha "${p.clientPassword}" para visualizar.`
      : "Sem senha definida: o link abre direto na visualização do cliente.";
    shareModal.hidden = false;
    shareModal.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  function closeShareModal() {
    shareModal.hidden = true;
    shareModal.style.display = "none";
    document.body.style.overflow = "";
  }

  $("#btnShareProject").addEventListener("click", openShareModal);
  $("#btnCloseShare").addEventListener("click", closeShareModal);
  shareModal.addEventListener("click", (e) => {
    if (e.target === shareModal) closeShareModal();
  });

  $("#btnCopyLink").addEventListener("click", async () => {
    const input = $("#shareLinkInput");
    const url = input.value;
    input.select();
    input.setSelectionRange(0, url.length);
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link copiado!");
    } catch (err) {
      try {
        document.execCommand("copy");
        showToast("Link copiado!");
      } catch (e2) {
        showToast("Copie o link manualmente.", true);
      }
    }
  });

  $("#btnDownloadClientFile").addEventListener("click", () => {
    const p = currentProject();
    if (p) generateClientFile(p);
  });

  async function generateClientFile(project) {
    showToast("Gerando arquivo...");
    try {
      const [htmlResp, cssResp, jsResp] = await Promise.all([
        fetch("index.html"),
        fetch("styles.css"),
        fetch("script.js"),
      ]);
      if (!htmlResp.ok || !cssResp.ok || !jsResp.ok) throw new Error("fetch");
      let html = await htmlResp.text();
      const css = await cssResp.text();
      const js = await jsResp.text();

      html = html.replace(/<link[^>]*stylesheet[^>]*>/gi, "");
      html = html.replace(/<title>[^<]*<\/title>/, () =>
        "<title>" + escapeHTML(project.title) + " — HUB de Projetos</title>"
      );

      const inlineStyle = "<style>" + css.replace(/<\/style/gi, "<\\/style") + "</style>";
      html = html.replace(/<\/head>/, () => inlineStyle + "</head>");

      const dataScript =
        "<script>window.__CLIENT_PROJECT__ = " +
        JSON.stringify(serializeForClient(project)) +
        ";</scr" + "ipt>";
      const inlineJs = js.replace(/<\/script/gi, "<\\/script");
      html = html.replace(/<script src="script\.js"><\/script>/gi, () =>
        dataScript + "<script>" + inlineJs + "</scr" + "ipt>"
      );

      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = slugify(project.title) + " - " + slugify(project.client) + ".html";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      showToast("Arquivo do cliente gerado!");
    } catch (err) {
      showToast("Erro ao gerar o arquivo.", true);
    }
  }

  function serializeForClient(project) {
    return {
      id: project.id,
      title: project.title,
      client: project.client,
      area: project.area,
      type: project.type,
      status: project.status,
      image: project.image,
      clientPassword: project.clientPassword || "",
      stages: project.stages,
      contracts: project.contracts,
      memorial: project.memorial,
      memorialFiles: project.memorialFiles,
    };
  }

  /* ---------------- Escape fecha qualquer modal ---------------- */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!passwordModal.hidden) closePasswordModal();
      else if (!modalOverlay.hidden) closeModal();
      else if (!shareModal.hidden) closeShareModal();
    }
  });

  /* ---------------- Toast ---------------- */
  let toastTimer = null;
  function showToast(message, isError = false) {
    let toast = $(".toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.toggle("error", isError);
    requestAnimationFrame(() => toast.classList.add("show"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
  }

  function showClientError() {
    $$(".view").forEach((v) => (v.hidden = true));
    const err = document.createElement("div");
    err.className = "client-error";
    err.innerHTML = `
      <h2>Projeto não disponível</h2>
      <p>Este link só funciona no navegador do proprietário do HUB. Peça ao designer para enviar o arquivo de compartilhamento (.html) deste projeto.</p>`;
    document.querySelector(".container").appendChild(err);
  }
/* ---------------- Init ---------------- */
  function proceedClientAccess() {
    setClientMode(true);
    openProject(projects[0].id);
  }

  function showHubLocked() {
    $$(".view").forEach((v) => (v.hidden = true));
    document.querySelectorAll(".hub-locked").forEach((el) => el.remove());
    const locked = document.createElement("div");
    locked.className = "client-error hub-locked";
    locked.innerHTML = `
      <h2>HUB de Projetos — Menchë Interiores</h2>
      <p>Este HUB é protegido por senha. Digite a senha do designer para abrir.</p>
      <button type="button" class="btn-primary" id="btnHubUnlock">Abrir o HUB</button>`;
    document.querySelector(".container").appendChild(locked);

    document.getElementById("btnHubUnlock").addEventListener("click", () => {
      openPasswordModal({
        title: "Acesso ao HUB",
        hint: "Digite a senha mestre do designer para abrir o HUB de Projetos.",
		clientAccess: true,
        onSuccess: (value) => {
          if (value === MASTER_PASSWORD) {
            sessionStorage.setItem(DESIGNER_KEY, "true");
            closePasswordModal();
            location.reload();
          } else {
            showToast("Senha incorreta.", true);
          }
        },
      });
    });
  }

async function init() {
    const params = new URLSearchParams(window.location.search);

    // Carrega a lista do Firebase
    const loadedProjects = await loadProjects();
    
    // Garante que 'projects' seja estritamente um Array de projetos
    if (Array.isArray(loadedProjects)) {
      projects = loadedProjects;
    } else {
      projects = Array.isArray(initialProjects) ? initialProjects : [];
    }

    // ============================================================
    // 1. ACESSO DO CLIENTE POR NOME (?cliente=Nome)
    // ============================================================
    const clienteParam = params.get("cliente");

    if (clienteParam) {
	  $$(".view").forEach((v) => (v.hidden = true));
	
      const normalize = (value) =>
        String(value || "")
          .trim()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();

      const clienteBusca = normalize(clienteParam);
      const clientData = projects.find((p) => normalize(p.client) === clienteBusca);

      if (!clientData) {
        showClientError();
        return;
      }

      projects = [clientData];

      const proceedClientReadOnly = () => {
        setClientMode(true);
        openProject(clientData.id);

        const btnBack = $("#btnBack");
        const btnDelete = $("#btnDeleteProject");
        const btnShare = $("#btnShareProject");
        const btnClient = $("#btnClientView");
        const btnDesigner = $("#btnDesignerAccess");

        if (btnBack) btnBack.hidden = true;
        if (btnDelete) btnDelete.hidden = true;
        if (btnShare) btnShare.hidden = true;
        if (btnClient) btnClient.hidden = true;
        if (btnDesigner) btnDesigner.hidden = true;
      };

      if (
  clientData.clientPassword &&
  !designerUnlocked &&
  !hasValidClientAccess(clientData.id)
) {
        openPasswordModal({
          title: "Acesso ao Projeto",
          hint: `O projeto "${clientData.title}" está protegido. Insira a senha de acesso:`,
		  clientAccess: true,
		  cleanBackground: true,
          onSuccess: (value) => {
            if (value === clientData.clientPassword) {
 			 rememberClientAccess(clientData.id);
 			 closePasswordModal(true);
 			 proceedClientReadOnly();
			} else if (value === MASTER_PASSWORD) {
              closePasswordModal(true);
              proceedClientReadOnly();
              showToast("Projeto aberto em modo somente leitura.");
            } else {
              showToast("Senha incorreta.", true);
            }
          },
        });
      } else {
        proceedClientReadOnly();
      }
      return;
    }

    // ============================================================
    // 2. COMPATIBILIDADE COM ?projeto=ID
    // ============================================================
    const projetoParam = params.get("projeto");

    if (projetoParam) {
	  $$(".view").forEach((v) => (v.hidden = true));
      const clientData = projects.find((p) => p.id === projetoParam);

      if (!clientData) {
        showClientError();
        return;
      }

      projects = [clientData];

      const proceedClientReadOnly = () => {
        setClientMode(true);
        openProject(clientData.id);

        const btnBack = $("#btnBack");
        const btnDelete = $("#btnDeleteProject");
        const btnShare = $("#btnShareProject");
        const btnClient = $("#btnClientView");
        const btnDesigner = $("#btnDesignerAccess");

        if (btnBack) btnBack.hidden = true;
        if (btnDelete) btnDelete.hidden = true;
        if (btnShare) btnShare.hidden = true;
        if (btnClient) btnClient.hidden = true;
        if (btnDesigner) btnDesigner.hidden = true;
      };

		if (
  		clientData.clientPassword &&
  		!designerUnlocked &&
  		!hasValidClientAccess(clientData.id)
		) {
        openPasswordModal({
          title: "Acesso do Cliente",
          hint: `O projeto "${clientData.title}" está protegido. Insira a senha de acesso:`,
		  cleanBackground: true,
          onSuccess: (value) => {
            if (
		  value === clientData.clientPassword ||
		  value === MASTER_PASSWORD
		) {
		  if (value === clientData.clientPassword) {
    		rememberClientAccess(clientData.id);
  		}

  		closePasswordModal(true);
  		proceedClientReadOnly();

              if (value === MASTER_PASSWORD) {
                showToast("Projeto aberto em modo somente leitura.");
              }
            } else {
              showToast("Senha incorreta.", true);
            }
          },
        });
      } else {
        proceedClientReadOnly();
      }
      return;
    }

    // ============================================================
    // 3. ACESSO NORMAL AO PAINEL DO DESIGNER
    // ============================================================
    if (designerUnlocked) {
      applyAccessUI();
      renderDashboard();
      updateClientButton();
      return;
    }

    // Sem ?cliente= ou ?projeto=: HUB bloqueado
    showHubLocked();
  }

function setupClientNotificationPrompt() {
  const notificationModal = document.getElementById("notificationModal");
  const btnEnable = document.getElementById("btnEnableNotifications");
  const btnLater = document.getElementById("btnNotificationLater");
  const btnClose = document.getElementById("btnCloseNotification");

  if (!notificationModal || !btnEnable || !btnLater) return;

  // Se o navegador já recebeu uma decisão, não mostra o popup.
if (Notification.permission === "granted") {
  const project = currentProject();

  if (project) {
    registerClientNotifications(project.id);
  }
}
  if (Notification.permission !== "default") return;

  notificationModal.hidden = false;
  notificationModal.style.display = "flex";
  document.body.style.overflow = "hidden";

  const closeNotificationModal = () => {
    notificationModal.hidden = true;
    notificationModal.style.display = "none";
    document.body.style.overflow = "";
  };

  btnLater.onclick = closeNotificationModal;

  if (btnClose) {
    btnClose.onclick = closeNotificationModal;
  }

  notificationModal.onclick = (e) => {
    if (e.target === notificationModal) {
      closeNotificationModal();
    }
  };

  btnEnable.onclick = async () => {
    try {
      const permission = await Notification.requestPermission();

      if (permission === "granted") {
		  const project = currentProject();

		  if (project) {
		    await registerClientNotifications(project.id);
		  }
		  
        closeNotificationModal();
        showToast("Notificações ativadas.");
      } else {
        closeNotificationModal();
      }
    } catch (error) {
      console.error(
        "Erro ao solicitar permissão para notificações:",
        error
      );
      closeNotificationModal();
    }
  };
}

  // Inicializa o app ao carregar a página
  document.addEventListener("DOMContentLoaded", init);
})();
