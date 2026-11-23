const admin = require("firebase-admin");
const crypto = require("crypto");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
        : undefined
    })
  });
}

const db = admin.firestore();

function passwordsMatch(inputPassword, storedPassword) {
  if (typeof inputPassword !== "string" || !storedPassword) {
    return false;
  }

  if (!storedPassword.includes("$")) {
    const input = Buffer.from(inputPassword);
    const stored = Buffer.from(String(storedPassword));

    return (
      input.length === stored.length &&
      crypto.timingSafeEqual(input, stored)
    );
  }

  const parts = storedPassword.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") {
    return false;
  }

  const iterations = Number(parts[1]);
  const salt = parts[2];
  const expectedHash = Buffer.from(parts[3], "hex");

  if (!Number.isInteger(iterations) || iterations <= 0) {
    return false;
  }

  const inputHash = crypto.pbkdf2Sync(
    inputPassword,
    salt,
    iterations,
    expectedHash.length,
    "sha512"
  );

  return (
    inputHash.length === expectedHash.length &&
    crypto.timingSafeEqual(inputHash, expectedHash)
  );
}

async function findProject(query) {
  try {
    const document = await db.collection("projects").doc(query).get();
    if (document.exists) return document;
  } catch (error) {
    // O identificador pode ser um slug, e não um ID de documento.
  }

  const slugSnapshot = await db
    .collection("projects")
    .where("slug", "==", query.toLowerCase())
    .limit(1)
    .get();

  if (!slugSnapshot.empty) return slugSnapshot.docs[0];

  const titleSnapshot = await db
    .collection("projects")
    .where("title", "==", query)
    .limit(1)
    .get();

  if (!titleSnapshot.empty) return titleSnapshot.docs[0];

  const clientSnapshot = await db
    .collection("projects")
    .where("clientName", "==", query)
    .limit(1)
    .get();

  return clientSnapshot.empty ? null : clientSnapshot.docs[0];
}

async function findProjectByMagicToken(token) {
  const tokenDocument = await db
    .collection("magicLinks")
    .doc(token)
    .get();

  if (!tokenDocument.exists) return null;

  const tokenData = tokenDocument.data();
  const expiresAt =
    typeof tokenData.expiresAt === "number"
      ? tokenData.expiresAt
      : tokenData.expiresAt?.toMillis?.() || 0;

  if (tokenData.revoked || (expiresAt && Date.now() > expiresAt)) {
    return null;
  }

  const projectDocument = await db
    .collection("projects")
    .doc(tokenData.projectId)
    .get();

  return projectDocument.exists ? projectDocument : null;
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const {
      projectId,
      clientName,
      password,
      magicToken
    } = req.body || {};

    let projectDocument = null;
    let accessType = "password";

    if (magicToken) {
      accessType = "magic";
      projectDocument = await findProjectByMagicToken(
        String(magicToken).trim()
      );
    } else {
      const query = String(projectId || clientName || "").trim();

      if (!query || typeof password !== "string") {
        return res.status(400).json({
          error: "Projeto e senha são obrigatórios."
        });
      }

      projectDocument = await findProject(query);

      if (projectDocument) {
        const data = projectDocument.data();
        const storedPassword =
          data.clientPassword || data.client_password || data.password;

        if (!passwordsMatch(password, storedPassword)) {
          projectDocument = null;
        }
      }
    }

    if (!projectDocument) {
      return res.status(401).json({
        error: "Dados de acesso inválidos ou expirados."
      });
    }

    const projectData = projectDocument.data();
    const clientUid =
      projectData.clientUid || `client_${projectDocument.id}`;

    if (!projectData.clientUid) {
      await projectDocument.ref.set({ clientUid }, { merge: true });
    }

    const token = await admin.auth().createCustomToken(clientUid, {
      role: "client",
      projectId: projectDocument.id,
      accessType
    });

    return res.status(200).json({
      token,
      projectId: projectDocument.id,
      clientName:
        projectData.clientName ||
        projectData.client ||
        projectData.title ||
        "Cliente",
      accessType
    });
  } catch (error) {
    console.error("Erro na autenticação do cliente:", error);

    return res.status(500).json({
      error: "Não foi possível autenticar. Tente novamente."
    });
  }
};
