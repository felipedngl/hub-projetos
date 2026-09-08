import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function getFirebaseApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const privateKey =
    process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

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

  const setupSecret = req.headers["x-setup-secret"];

  if (
    !setupSecret ||
    setupSecret !== process.env.DESIGNER_CLAIM_SETUP_SECRET
  ) {
    return res.status(403).json({
      error: "Acesso negado",
    });
  }

  try {
    const auth = getAuth(getFirebaseApp());

    const user = await auth.getUserByEmail(
      "mencheinteriores@outlook.com"
    );

    await auth.setCustomUserClaims(user.uid, {
      ...(user.customClaims || {}),
      role: "designer",
    });

    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Erro ao configurar permissão do designer:",
      error
    );

    return res.status(500).json({
      success: false,
      error: "Erro ao configurar designer",
    });
  }
}
