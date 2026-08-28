export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método não permitido"
    });
  }

  try {
    const { token, title, body } = req.body || {};

    if (!token) {
      return res.status(400).json({
        error: "Token FCM não informado"
      });
    }

    if (!title || !body) {
      return res.status(400).json({
        error: "Título e corpo da notificação são obrigatórios"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Endpoint funcionando",
      tokenRecebido: true
    });

  } catch (error) {
    console.error("Erro:", error);

    return res.status(500).json({
      error: "Erro interno"
    });
  }
}
