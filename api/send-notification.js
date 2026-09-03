import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { getAuth } from "firebase-admin/auth";

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

  const authorization = req.headers.authorization || "";

  if (!authorization.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Não autenticado",
    });
  }

  try {
    const idToken = authorization.slice(7);
    const decodedToken = await getAuth(getFirebaseApp()).verifyIdToken(idToken);

    if (decodedToken.role !== "designer") {
      return res.status(403).json({
        error: "Acesso negado",
      });
    }
  } catch (error) {
    console.error("Erro ao validar autenticação:", error);

    return res.status(401).json({
      error: "Token inválido ou expirado",
    });
  }
  
  try {
    const { projectId, title, body } = req.body || {};

    if (!projectId) {
      return res.status(400).json({
        error: "projectId não informado",
      });
    }

    if (!title || !body) {
      return res.status(400).json({
        error: "Título e corpo da notificação são obrigatórios",
      });
    }

    getFirebaseApp();

    const db = getFirestore();

    const snapshot = await db
      .collection("fcmTokens")
      .where("projectId", "==", projectId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        error: "Nenhum token encontrado para este projeto",
      });
    }

    const tokenData = snapshot.docs[0].data();
    const token = tokenData.token;

    if (!token) {
      return res.status(404).json({
        error: "O projeto não possui um token FCM válido",
      });
    }

    const message = {
      token,
      notification: {
        title,
        body,
      },
      data: {
        projectId: String(projectId),
      },
      webpush: {
        fcmOptions: {
          link: `https://hub-projetos-ten.vercel.app/?projeto=${encodeURIComponent(projectId)}`,
        },
      },
    };

    const response = await getMessaging().send(message);

    console.log("Notificação enviada:", response);

    return res.status(200).json({
      success: true,
      messageId: response,
    });
  } catch (error) {
    console.error("Erro ao enviar notificação:", error);

    return res.status(500).json({
      success: false,
      error: error.message || "Erro ao enviar notificação",
    });
  }
}
