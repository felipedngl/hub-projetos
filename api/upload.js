const { createClient } = require('@supabase/supabase-js');

// Configuração para permitir arquivos maiores no body do serverless
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

module.exports = async function handler(req, res) {
  // CORS Headers para liberar a requisição
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
        error: 'Variáveis de ambiente SUPABASE_URL ou SUPABASE_KEY não foram encontradas na Vercel.' 
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { fileName, fileType, fileBase64 } = req.body || {};

    if (!fileName || !fileBase64) {
      return res.status(400).json({ success: false, error: 'Dados do arquivo incompletos.' });
    }

    // Remove o prefixo do Data URL (ex: "data:image/png;base64,")
    const base64Data = fileBase64.replace(/^data:.*;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');

    // Limpa o nome do arquivo tirando acentos e caracteres especiais
    const cleanFileName = fileName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9.-]/g, "_");

    const filePath = `uploads/${Date.now()}_${cleanFileName}`;

    // Envia para o Supabase
    const { data, error } = await supabase.storage
      .from('menche-files')
      .upload(filePath, buffer, {
        contentType: fileType || 'application/octet-stream',
        upsert: true
      });

    if (error) {
      console.error("Erro Supabase Storage:", error);
      return res.status(500).json({ success: false, error: `Supabase Error: ${error.message}` });
    }

    // Pega a URL pública
    const { data: publicUrlData } = supabase.storage
      .from('menche-files')
      .getPublicUrl(filePath);

    return res.status(200).json({
      success: true,
      url: publicUrlData.publicUrl
    });

  } catch (err) {
    console.error("Erro interno no upload:", err);
    return res.status(500).json({ success: false, error: err.message || 'Erro interno no servidor' });
  }
};
