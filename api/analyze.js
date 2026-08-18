export default async function handler(req, res) {
    // 1. Chỉ chấp nhận phương thức POST từ Frontend gửi lên
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Chỉ chấp nhận phương thức POST' });
    }

    try {
        const { imageBase64 } = req.body;
        
        V

        // 3. Cấu hình yêu cầu gửi lên Google Gemini 1.5 Flash
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
        
        const payload = {
            contents: [{
                parts: [
                    { 
                        text: "Bạn là một chuyên gia dinh dưỡng. Hãy nhìn hình ảnh này và cho biết đây là món ăn gì. Bạn PHẢI trả về kết quả theo đúng định dạng JSON sau, tuyệt đối không kèm theo bất kỳ đoạn văn bản hay ký tự nào khác: {\"name\": \"Tên món ăn (tiếng Việt)\", \"cal\": Số_calo_ước_tính_để_trống_chỉ_ghi_số}" 
                    },
                    { 
                        inline_data: { 
                            mime_type: "image/jpeg", 
                            data: imageBase64 
                        } 
                    }
                ]
            }]
        };

        // 4. Gọi API
        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        // Xử lý nếu Gemini báo lỗi (hết quota, sai key...)
        if (data.error) {
            console.error("Lỗi từ Gemini API:", data.error);
            return res.status(500).json({ error: 'API AI đang gặp sự cố' });
        }

        // 5. Trích xuất kết quả từ AI
        const rawText = data.candidates[0].content.parts[0].text;
        
        // AI thường hay bọc JSON trong markdown (ví dụ: ```json ... ```), ta cần dọn dẹp nó
        const cleanText = rawText.replace(/```json|```/gi, '').trim();
        
        // Chuyển chuỗi thành Object JSON
        const result = JSON.parse(cleanText);

        // 6. Trả kết quả về cho trình duyệt (index.html)
        return res.status(200).json(result);

    } catch (error) {
        console.error("Lỗi máy chủ:", error);
        return res.status(500).json({ error: 'Quá trình phân tích hình ảnh thất bại' });
    }
}

