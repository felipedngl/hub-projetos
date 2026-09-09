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
  const targetQuery = projectId || clientName;

  try {
    let projectDoc = null;

    // 1. Tenta buscar por ID direto
    if (projectId) {
      const doc = await db.collection('projects').doc(projectId).get();
      if (doc.exists) projectDoc = doc;
    }

    // 2. Se não achou por ID, busca pelo campo 'slug' (ex: "studio-42")
    if (!projectDoc && targetQuery) {
      const snapshotSlug = await db.collection('projects')
        .where('slug', '==', targetQuery.toLowerCase())
        .limit(1)
        .get();

      if (!snapshotSlug.empty) {
        projectDoc = snapshotSlug.docs[0];
      }
    }

    // 3. Se não achou por slug, busca pelo campo 'title'
    if (!projectDoc && targetQuery) {
      const snapshotTitle = await db.collection('projects')
        .where('title', '==', targetQuery)
        .limit(1)
        .get();

      if (!snapshotTitle.empty) {
        projectDoc = snapshotTitle.docs[0];
      }
    }

    // 4. Se ainda não achou, busca por 'clientName' (para links antigos)
    if (!projectDoc && targetQuery) {
      const snapshotClient = await db.collection('projects')
        .where('clientName', '==', targetQuery)
        .limit(1)
        .get();

      if (!snapshotClient.empty) {
        projectDoc = snapshotClient.docs[0];
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
