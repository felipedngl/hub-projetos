const admin = require('firebase-admin');
const crypto = require('crypto');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        : undefined,
    }),
  });
}

const db = admin.firestore();

function verifyPassword(inputPassword, storedPassword) {
  if (!storedPassword) return false;

  // Compatibilidade com senha em texto puro
  if (!storedPassword.includes('$')) {
    return inputPassword === storedPassword;
  }

  // Compatibilidade com hash PBKDF2
  const parts = storedPassword.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;

  const iterations = parseInt(parts[1], 10);
  const salt = parts[2];
  const hash = parts[3];

  const inputHash = crypto.pbkdf2Sync(inputPassword, salt, iterations, 64, 'sha512').toString('hex');
  return inputHash === hash;
}

module.exports = async function handler(req, res) {
  // Define cabeçalhos CORS para evitar bloqueio no navegador
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { projectId, clientName, password } = req.body || {};
    const targetQuery = projectId || clientName;

    if (!targetQuery) {
      return res.status(400).json({ error: 'Identificador do projeto não fornecido' });
    }

    let projectDoc = null;

    // 1. Busca por ID direto do Firestore
    try {
      const doc = await db.collection('projects').doc(targetQuery).get();
      if (doc.exists) projectDoc = doc;
    } catch (e) {
      // Ignora erro se o targetQuery não for um ID válido
    }

    // 2. Busca pelo campo 'slug' (ex: "studio-42")
    if (!projectDoc) {
      const snapSlug = await db.collection('projects')
        .where('slug', '==', targetQuery.toLowerCase())
        .limit(1)
        .get();
      if (!snapSlug.empty) projectDoc = snapSlug.docs[0];
    }

    // 3. Busca pelo campo 'title' (ex: "Studio 42")
    if (!projectDoc) {
      const snapTitle = await db.collection('projects')
        .where('title', '==', targetQuery)
        .limit(1)
        .get();
      if (!snapTitle.empty) projectDoc = snapTitle.docs[0];
    }

    // 4. Busca pelo campo 'clientName'
    if (!projectDoc) {
      const snapClient = await db.collection('projects')
        .where('clientName', '==', targetQuery)
        .limit(1)
        .get();
      if (!snapClient.empty) projectDoc = snapClient.docs[0];
    }

    if (!projectDoc) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    const projectData = projectDoc.data();
    const savedPassword = projectData.clientPassword || projectData.password;

    // Valida a senha digitada
    const isValid = verifyPassword(password, savedPassword);
    if (!isValid) {
      return res.status(401).json({ error: 'Senha incorreta' });
    }

    // Gera o token de acesso
    const customToken = await admin.auth().createCustomToken(projectDoc.id, {
      role: 'client',
      projectId: projectDoc.id
    });

    return res.status(200).json({
      token: customToken,
      projectId: projectDoc.id,
      clientName: projectData.clientName || projectData.title
    });

  } catch (error) {
    console.error('Erro na autenticação:', error);
    return res.status(500).json({ error: 'Erro interno no servidor', details: error.message });
  }
};
