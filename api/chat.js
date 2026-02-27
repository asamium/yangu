// api/chat.js
// Vercel Serverless Function - Gemini API と通信する

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { history, charId } = req.body;

  if (!history || !Array.isArray(history)) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  // ========================================
  // ▼ 共通プロンプト（全キャラ共通の基本設定）
  // ========================================
  const basePrompt = `あなたはヤングケアラー（家族の世話をしている子どもや若者）のための相談サイト用チャットAIです。
利用者は主に小学生・中学生・高校生です。
情報を参考にし、安心できる対応を行ってください。`;

  // ========================================
  // ▼ キャラクター別プロンプト（ここを書き換えてください）
  // ========================================
  const charPrompts = {
    A: `口調は明るく元気で、フレンドリーです。子どもが親しみやすいように話してください。例：「そっかそっか！それはつらかったね！！いっしょに考えよう！！」`,
    B: `口調はやさしく穏やかです。押しつけがましくなく、相手のペースに寄り添って話してください。例：「そうだったんだね。気軽に話してくれてありがとう。」`,
    C: `口調はていねいで落ち着いています。敬語を使い、誠実に対応してください。例：「おつらい状況だったのですね。どうぞ、なんでも話してみてください。」`,
  };
  // ========================================

  const charPrompt = charPrompts[charId] || charPrompts['B'];
  const systemPrompt = `${basePrompt}\n\n${charPrompt}`;

  try {
    const geminiMessages = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: geminiMessages,
          generationConfig: {
            maxOutputTokens: 1024,
            temperature: 0.7,
          }
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API error:', errText);
      return res.status(500).json({ error: 'Gemini API error' });
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      return res.status(500).json({ error: 'No response from Gemini' });
    }

    return res.status(200).json({ reply });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
