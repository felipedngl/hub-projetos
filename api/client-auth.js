import admin from 'firebase-admin';
import crypto from 'crypto';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

function verifyPassword(inputPassword, storedPassword) {
  if (!storedPassword) return false;

  // Se a senha estiver em texto puro no Firestore (compatibilidade)
  if (!storedPassword.includes('$')) {
    return inputPassword === storedPassword;
  }

  // Se estiver no formato PBKDF2: pbkdf2$iterations$salt$hash
  const parts = storedPassword.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;

  const iterations = parseInt(parts[1], 10);
  const salt = parts[2];
  const hash = parts[3];

  const inputHash = crypto.pbkdf2Sync(inputPassword, salt, iterations, 64, 'sha512').toString('hex');
  return inputHash === hash;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { projectId, clientName, password } = req.body;

  try {
    let projectDoc = null;

    // 1. Tenta buscar por ID direto
    if (projectId) {
      const doc = await db.collection('projects').doc(projectId).get();
      if (doc.exists) projectDoc = doc;
    }

    // 2. Se não achou por ID, busca por clientName
    if (!projectDoc && (clientName || projectId)) {
      const queryTarget = clientName || projectId;
      const snapshot = await db.collection('projects')
        .where('clientName', '==', queryTarget)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        projectDoc = snapshot.docs[0];
      }
    }

    if (!projectDoc) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    const projectData = projectDoc.data();

    // Valida a senha
    const isValid = verifyPassword(password, projectData.clientPassword || projectData.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Senha incorreta' });
    }

    // Gera o token customizado do Firebase Auth
    const customToken = await admin.auth().createCustomToken(projectDoc.id, {
      role: 'client',
      projectId: projectDoc.id
    });

    return res.status(200).json({
      token: customToken,
      projectId: projectDoc.id,
      clientName: projectData.clientName
    });

  } catch (error) {
    console.error('Erro na autenticação:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
}
