
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { put, list } from '@vercel/blob';

const KEY = 'ec-roadmap.json';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    res.status(500).json({
      error:
        'Missing BLOB_READ_WRITE_TOKEN. In Vercel → Storage (Blob) → Create token (RW) → add as env var, then redeploy.'
    });
    return;
  }

  try {
    if (req.method === 'GET') {
      const { blobs } = await list({ prefix: KEY, token });
      if (!blobs || blobs.length === 0) {
        res.setHeader('content-type', 'application/json');
        return res.status(200).send(JSON.stringify({ items: [] }));
      }
      const url = blobs[0].url;
      const data = await fetch(url)
        .then(r => (r.ok ? r.json() : { items: [] }))
        .catch(() => ({ items: [] }));

      res.setHeader('content-type', 'application/json');
      return res.status(200).send(JSON.stringify(data ?? { items: [] }));
    }

    if (req.method === 'POST') {
      const body = req.body || { items: [] };
      await put(KEY, JSON.stringify(body), {
        access: 'public',
        contentType: 'application/json',
        token,
        addRandomSuffix: false
      });
      res.setHeader('content-type', 'application/json');
      return res.status(200).send(JSON.stringify({ ok: true }));
    }

    return res.status(405).send('Method Not Allowed');
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
}
