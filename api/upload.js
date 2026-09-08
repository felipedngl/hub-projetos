import { createClient } from '@supabase/supabase-js';

// Desativa o limite padrao de body para permitir uploads maiores (ate 10MB)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  // CORS
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

    // Inicializa o cliente oficial do Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { fileName, fileType, fileBase64 } = req.body || {};

    if (!fileName || !fileBase64) {
      return res.status(400).json({ success: false, error: 'Dados do arquivo incompletos.' });
    }

    // Decodifica a string Base64 em dados binários (Buffer)
    const base64Data = fileBase64.replace(/^data:.*;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');

    // Sanitiza o nome do arquivo (remove acentos e caracteres especiais)
    const rawFileName = fileName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9.-]/g, "_");

    const cleanFileName = `${Date.now()}_${rawFileName}`;

    // Upload direto pelo SDK oficial (trata o caminho do bucket e encoding automaticamente)
    const { data, error } = await supabase.storage
      .from('menche-files')
      .upload(cleanFileName, buffer, {
        contentType: fileType || 'application/octet-stream',
        upsert: true
      });

    if (error) {
      console.error("Erro no Supabase Storage:", error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Erro no upload para o Supabase'
      });
    }

    // Pega a URL pública
    const { data: publicData } = supabase.storage
      .from('menche-files')
      .getPublicUrl(cleanFileName);

    return res.status(200).json({
      success: true,
      url: publicData.publicUrl
    });

  } catch (err) {
    console.error("Erro interno no upload:", err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Erro interno no servidor'
    });
  }
}
