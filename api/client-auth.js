import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import crypto from "crypto";

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 5;

const loginAttempts = new Map();

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];

  if (forwarded) {
    return String(forwarded).split(",")[0].trim();
  }

  return req.socket?.remoteAddress || "unknown";
}

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

      if (!projectDoc.exists) {
        const snapshot = await db
          .collection("projects")
          .get();

        const slug = String(projectId)
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-zA-Z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .toLowerCase();

        const match = snapshot.docs.find((doc) => {
          const project = doc.data() || {};

          const projectSlug = String(project.title || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
            .toLowerCase();

          return projectSlug === slug;
        });

        if (match) {
          projectDoc = match;
        }
      }
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

    const storedPassword = String(project.clientPassword || "");

let passwordIsValid = false;

if (storedPassword.startsWith("pbkdf2$")) {
  const [, iterationsValue, saltBase64, hashBase64] = storedPassword.split("$");
  const iterations = Number(iterationsValue);

  if (
    Number.isInteger(iterations) &&
    iterations > 0 &&
    saltBase64 &&
    hashBase64
  ) {
    const salt = Buffer.from(saltBase64, "base64");
    const storedHash = Buffer.from(hashBase64, "base64");

    const derivedKey = crypto.pbkdf2Sync(
      String(password),
      salt,
      iterations,
      storedHash.length,
      "sha256"
    );

    passwordIsValid =
      storedHash.length === derivedKey.length &&
      crypto.timingSafeEqual(storedHash, derivedKey);
  }
} else {
  passwordIsValid = String(password) === storedPassword;
}

if (!passwordIsValid) {
  return res.status(401).json({
    error: "Senha incorreta",
  });
}

if (!storedPassword.startsWith("pbkdf2$")) {
  const iterations = 310000;
  const salt = crypto.randomBytes(16);

  const derivedKey = crypto.pbkdf2Sync(
    String(password),
    salt,
    iterations,
    32,
    "sha256"
  );

  const newPasswordHash =
    `pbkdf2$${iterations}$${salt.toString("base64")}$${derivedKey.toString("base64")}`;

  await projectDoc.ref.update({
    clientPassword: newPasswordHash,
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
