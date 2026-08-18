export default async function handler(req, res) {
    // --- CẤU HÌNH CORS ---
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'Chỉ chấp nhận POST' });

    try {
        const { workoutName } = req.body;
        const RAW_KEYS = process.env.GEMINI_API_KEY;
        if (!RAW_KEYS) return res.status(500).json({ error: 'Thiếu API Key' });

        const keyList = RAW_KEYS.split(',').map(key => key.trim());
        const API_KEY = keyList[Math.floor(Math.random() * keyList.length)];

        if (!workoutName) return res.status(400).json({ error: 'Thiếu tên bài tập' });

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${API_KEY}`;
        
        // Prompt dành riêng cho bài tập
        const payload = {
            contents: [{
                parts: [{ 
                    text: `Bạn là HLV thể hình. Hãy ước tính lượng calo tiêu hao cho một người trưởng thành với hoạt động sau: "${workoutName}". TRẢ VỀ ĐÚNG JSON SAU, không kèm văn bản khác: {"cal": Số_calo_ước_tính}` 
                }]
            }]
        };

        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (data.error) return res.status(500).json({ error: 'AI Error' });

        const rawText = data.candidates[0].content.parts[0].text;
        const cleanText = rawText.replace(/```json|```/gi, '').trim();
        const result = JSON.parse(cleanText);

        return res.status(200).json(result);

    } catch (error) {
        return res.status(500).json({ error: 'Lỗi server' });
    }
}
