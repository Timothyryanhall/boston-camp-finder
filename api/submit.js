const { neon } = require('@neondatabase/serverless');
const { validate } = require('./validate');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const validation = validate(req.body);
  if (!validation.ok) {
    return res.status(400).json({ error: validation.error });
  }

  const { type, camp_name, camp_url, notes } = req.body;

  try {
    const sql = neon(process.env.DATABASE_URL);
    await sql`
      INSERT INTO submissions (type, camp_name, camp_url, notes)
      VALUES (
        ${type},
        ${camp_name?.trim() || null},
        ${camp_url?.trim() || null},
        ${notes?.trim() || null}
      )
    `;
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('DB write error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
