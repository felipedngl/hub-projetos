import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método não permitido' });
  }

  try {
    const { fileName, fileType, fileBase64 } = req.body;

    if (!fileName || !fileBase64) {
      return res.status(400).json({ success: false, error: 'Dados do arquivo incompletos.' });
    }

    // Remove o prefixo Data URL (ex: "data:image/png;base64,") para obter apenas os bytes
    const base64Data = fileBase64.replace(/^data:.*;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');

    // Sanitiza o nome do arquivo (remove caracteres especiais, acentos e espaços)
    const cleanFileName = fileName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") 
      .replace(/[^a-zA-Z0-9.-]/g, "_"); 

    // Gera um caminho único limpo dentro da pasta "uploads"
    const filePath = `uploads/${Date.now()}_${cleanFileName}`;

    // Envia para o bucket menche-files no Supabase Storage
    const { data, error } = await supabase.storage
      .from('menche-files')
      .upload(filePath, buffer, {
        contentType: fileType || 'application/octet-stream',
        upsert: true
      });

    if (error) {
      console.error("Erro Supabase Storage:", error);
      return res.status(500).json({ success: false, error: `Falha no Supabase Storage: ${error.message}` });
    }

    // Obtém a URL pública do arquivo enviado
    const { data: publicUrlData } = supabase.storage
      .from('menche-files')
      .getPublicUrl(filePath);

    return res.status(200).json({
      success: true,
      url: publicUrlData.publicUrl
    });

  } catch (err) {
    console.error("Erro interno no upload:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
