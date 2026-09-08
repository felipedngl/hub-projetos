export default async function handler(req, res) {
  // Libera CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método não permitido' });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        success: false,
        error: 'Variáveis SUPABASE_URL ou SUPABASE_KEY não configuradas na Vercel.'
      });
    }

    const { fileName, fileType, fileBase64 } = req.body || {};

    if (!fileName || !fileBase64) {
      return res.status(400).json({ success: false, error: 'Dados do arquivo incompletos.' });
    }

    // Decodifica a string Base64 em dados binários (Buffer)
    const base64Data = fileBase64.replace(/^data:.*;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');

    // Sanitiza o nome do arquivo (remove acentos, símbolos e espaços)
    const cleanFileName = fileName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9.-]/g, "_");

    const filePath = `uploads/${Date.now()}_${cleanFileName}`;

    // Faz a requisição POST diretamente para a API REST do Supabase Storage
    const cleanUrl = supabaseUrl.replace(/\/$/, "");
    const uploadEndpoint = `${cleanUrl}/storage/v1/object/menche-files/${filePath}`;

    const supabaseResponse = await fetch(uploadEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': fileType || 'application/octet-stream',
        'x-upsert': 'true'
      },
      body: buffer
    });

    const responseData = await supabaseResponse.json();

    if (!supabaseResponse.ok) {
      console.error("Erro no Supabase REST:", responseData);
      return res.status(500).json({
        success: false,
        error: responseData.message || responseData.error || 'Erro ao enviar para o Supabase Storage'
      });
    }

    // Monta a URL pública do arquivo
    const publicUrl = `${cleanUrl}/storage/v1/object/public/menche-files/${filePath}`;

    return res.status(200).json({
      success: true,
      url: publicUrl
    });

  } catch (err) {
    console.error("Erro interno no upload:", err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Erro interno no servidor'
    });
  }
}
