
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { put, get } from '@vercel/blob';

const KEY = 'ec-roadmap.json';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      // Try fetch existing JSON by key
      try {
        const { blob } = await get(KEY, { token: process.env.BLOB_READ_WRITE_TOKEN });
        const data = await fetch(blob.url).then(r => r.json()).catch(()=>({items:[]}));
        res.setHeader('content-type','application/json'); 
        return res.status(200).send(JSON.stringify(data || { items: [] }));
      } catch {
        // If not found, return empty list
        res.setHeader('content-type','application/json'); 
        return res.status(200).send(JSON.stringify({ items: [] }));
      }
    } else if (req.method === 'POST') {
      const body = req.body || { items: [] };
      const uploaded = await put(KEY, JSON.stringify(body), {
        contentType: 'application/json',
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN
      });
      res.setHeader('content-type','application/json'); 
      return res.status(200).send(JSON.stringify({ ok: true, url: uploaded.url }));
    } else {
      return res.status(405).send('Method Not Allowed');
    }
  } catch (e: any) {
    return res.status(500).send(e?.message || 'Server error');
  }
}
