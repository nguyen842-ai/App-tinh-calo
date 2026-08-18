export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Chỉ chấp nhận phương thức POST' });
    }

    try {
        const { imageBase64 } = req.body;
        
        const RAW_KEYS = process.env.GEMINI_API_KEY;
        if (!RAW_KEYS) {
            return res.status(500).json({ error: 'Chưa cấu hình GEMINI_API_KEY trên máy chủ' });
        }

        const keyList = RAW_KEYS.split(',').map(key => key.trim());
        const API_KEY = keyList[Math.floor(Math.random() * keyList.length)];

        if (!imageBase64) {
            return res.status(400).json({ error: 'Không tìm thấy dữ liệu hình ảnh' });
        }

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${API_KEY}`;
        
        const payload = {
            contents: [{
                parts: [
                    { 
                        // ĐÂY LÀ ĐOẠN ĐƯỢC NÂNG CẤP
                        text: "Bạn là một chuyên gia dinh dưỡng. Hãy nhìn ảnh này và phân tích món ăn. TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON NÀY, không kèm văn bản khác: {\"name\": \"Tên món\", \"cal\": Số_calo, \"protein\": Số_gram_đạm, \"carbs\": Số_gram_tinh_bột, \"fat\": Số_gram_chất_béo}" 
                    },
                    { 
                        inline_data: { mime_type: "image/jpeg", data: imageBase64 } 
                    }
                ]
            }]
        };

        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.error) {
            console.error("Lỗi từ Gemini API:", data.error);
            return res.status(500).json({ error: 'API AI đang gặp sự cố' });
        }

        const rawText = data.candidates[0].content.parts[0].text;
        const cleanText = rawText.replace(/```json|```/gi, '').trim();
        const result = JSON.parse(cleanText);

        return res.status(200).json(result);

    } catch (error) {
        console.error("Lỗi máy chủ:", error);
        return res.status(500).json({ error: 'Quá trình phân tích hình ảnh thất bại' });
    }
}
