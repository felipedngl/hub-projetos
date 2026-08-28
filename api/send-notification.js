import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

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
    const { token, title, body } = req.body || {};

    if (!token) {
      return res.status(400).json({
        error: "Token FCM não informado",
      });
    }

    if (!title || !body) {
      return res.status(400).json({
        error: "Título e corpo da notificação são obrigatórios",
      });
    }

    getFirebaseApp();

    const message = {
      token,
      notification: {
        title,
        body,
      },
    };

    const response = await getMessaging().send(message);

    console.log("Notificação FCM enviada:", response);

    return res.status(200).json({
      success: true,
      messageId: response,
    });
  } catch (error) {
    console.error("Erro ao enviar notificação FCM:", error);

    return res.status(500).json({
      success: false,
      error: error.message || "Erro ao enviar notificação",
    });
  }
}
