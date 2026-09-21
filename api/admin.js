module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ ok: false, error: 'method_not_allowed' });
    return;
  }

  const key = req.query.key || req.headers['x-admin-key'];
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  if (!ADMIN_PASSWORD || !key || key !== ADMIN_PASSWORD) {
    res.status(401).json({ ok: false, error: 'unauthorized' });
    return;
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    res.status(500).json({ ok: false, error: 'server_not_configured' });
    return;
  }

  try {
    const resp = await fetch(
      `${SUPABASE_URL}/rest/v1/skipfee_applications?select=*&order=created_at.desc`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );
    if (!resp.ok) {
      const detail = await resp.text();
      console.error('supabase_fetch_failed', resp.status, detail);
      res.status(502).json({ ok: false, error: 'fetch_failed' });
      return;
    }
    const rows = await resp.json();
    res.status(200).json({ ok: true, rows });
  } catch (err) {
    console.error('admin_handler_error', err);
    res.status(500).json({ ok: false, error: 'server_error' });
  }
};
