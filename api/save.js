// api/save.js
// 会話をSupabaseに保存するエンドポイント

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { history, charId } = req.body;

  if (!history || !Array.isArray(history) || history.length === 0) {
    return res.status(400).json({ error: 'No history to save' });
  }

  // 会話をテキスト形式に整形
  const conversation = history.map(msg => {
    const role = msg.role === 'user' ? 'ユーザー' : 'AI';
    return `[${role}]\n${msg.content}`;
  }).join('\n\n');

  try {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/conversations`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          char_id: charId || 'unknown',
          conversation: conversation,
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Supabase error:', errText);
      return res.status(500).json({ error: 'Failed to save' });
    }

    return res.status(200).json({ ok: true });

  } catch (error) {
    console.error('Save error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
