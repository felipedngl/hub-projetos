import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getFirebaseApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método não permitido",
    });
  }

  try {
    const {
      projectId,
      clientName,
      password
    } = req.body || {};

    if ((!projectId && !clientName) || !password) {
      return res.status(400).json({
        error: "Projeto/cliente e senha são obrigatórios",
      });
    }

    getFirebaseApp();

    const db = getFirestore();

    let projectDoc = null;

    if (projectId) {
      projectDoc = await db
        .collection("projects")
        .doc(String(projectId))
        .get();
    } else {
      const snapshot = await db
        .collection("projects")
        .where("client", "==", String(clientName))
        .limit(1)
        .get();

      if (!snapshot.empty) {
        projectDoc = snapshot.docs[0];
      }
    }

    if (!projectDoc || !projectDoc.exists) {
      return res.status(404).json({
        error: "Projeto não encontrado",
      });
    }

    const project = projectDoc.data();

    if (!project.clientPassword) {
      return res.status(400).json({
        error: "Este projeto não possui senha de acesso",
      });
    }

    if (String(password) !== String(project.clientPassword)) {
      return res.status(401).json({
        error: "Senha incorreta",
      });
    }

    const resolvedProjectId = String(projectDoc.id);
    const uid = `client_${resolvedProjectId}`;

    const customToken = await getAuth().createCustomToken(uid, {
      role: "client",
      projectId: resolvedProjectId,
    });

    return res.status(200).json({
      success: true,
      token: customToken,
      projectId: resolvedProjectId,
    });

  } catch (error) {
    console.error("Erro na autenticação do cliente:", error);

    return res.status(500).json({
      success: false,
      error: error.message || "Erro ao autenticar cliente",
    });
  }
}
