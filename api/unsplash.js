export default async function handler(req, res) {
  try {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;

    if (!accessKey) {
      return res.status(500).json({
        error: "UNSPLASH_ACCESS_KEY não configurada."
      });
    }

    const { type = "search", query = "", page = 1 } = req.query || {};

    let url;

    if (type === "random") {
      const params = new URLSearchParams({
        client_id: accessKey,
        query: query || "architecture interior design",
        orientation: "landscape"
      });

      url = `https://api.unsplash.com/photos/random?${params.toString()}`;
    } else {
      const params = new URLSearchParams({
        client_id: accessKey,
        query: query || "architecture",
        page: String(page),
        per_page: "12",
        orientation: "landscape"
      });

      url = `https://api.unsplash.com/search/photos?${params.toString()}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.errors?.[0] || "Erro ao consultar o Unsplash."
      });
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error("[UNSPLASH]", error);

    return res.status(500).json({
      error: "Erro interno ao consultar o Unsplash."
    });
  }
}
