require('dotenv').config(); // Membuka brankas .env
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Izinkan Frontend untuk berkomunikasi dengan Backend
app.use(cors());

app.use(express.json());

// Rute Uji Coba (Cek apakah server hidup)
app.get('/', (req, res) => {
    res.send('Server Backend Pertanian berjalan dengan aman!');
});

// Rute Baru: Jalur Khusus untuk AI Groq
app.post('/api/chat', async (req, res) => {
    const userMessage = req.body.message;
    const sensorData = req.body.sensorData;

    if (!userMessage) {
        return res.status(400).json({ error: "Pesan tidak boleh kosong" });
    }

    const prompt = `Analisis data IoT pertanian berikut: ${JSON.stringify(sensorData)}. Pertanyaan: ${userMessage}`;

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "user", content: prompt }]
            })
        });

        const json = await response.json();
        
        // --- TAMBAHAN: Validasi Response AI ---
        if (json.error) {
            console.error("Error dari Groq API:", json.error);
            return res.status(502).json({ error: "AI sedang bermasalah, coba lagi nanti." });
        }

        res.json({ reply: json.choices[0].message.content });
        // --------------------------------------
        
    } catch (error) {
        console.error("Error dari server:", error);
        res.status(500).json({ error: "Gagal menghubungi server AI" });
    }
});

// Menjalankan Server
app.listen(port, () => {
    console.log(`Server berjalan mantap di http://localhost:${port}`);
});