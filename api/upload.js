export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { fileName, fileType, fileBase64 } = req.body;

    if (!fileName || !fileBase64) {
      return res.status(400).json({ error: 'Dados do arquivo incompletos.' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Variáveis do Supabase não configuradas na Vercel.' });
    }

    // Limpa o prefixo Data URL se enviado
    const cleanBase64 = fileBase64.replace(/^data:(.*);base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    // Gera um nome único para o arquivo evitar sobrescrever existentes
    const uniqueFileName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // Faz o envio direto para o bucket público 'menche-files' do Supabase
    const uploadUrl = `${supabaseUrl}/storage/v1/object/menche-files/${uniqueFileName}`;

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': fileType || 'application/octet-stream',
        'x-upsert': 'true'
      },
      body: buffer
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Falha no Supabase Storage: ${errorText}`);
    }

    // URL pública para acesso direto ao arquivo
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/menche-files/${uniqueFileName}`;

    return res.status(200).json({
      success: true,
      url: publicUrl,
      fileName: uniqueFileName
    });

  } catch (error) {
    console.error("Erro no upload para o Supabase:", error);
    return res.status(500).json({ error: error.message || 'Erro interno no servidor de upload' });
  }
}
