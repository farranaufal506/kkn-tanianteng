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
    const userMessage = req.body.message;       // Pertanyaan dari frontend
    const sensorData = req.body.sensorData;     // Data sensor dari frontend

    // Menggabungkan instruksi untuk AI
    const prompt = `Analisis data IoT pertanian berikut: ${JSON.stringify(sensorData)}. Pertanyaan: ${userMessage}`;

    try {
        // Menghubungi API Groq dari dalam server (Backend)
        // Karena Node.js kamu versi 24, kita bisa langsung pakai fetch bawaan
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}` // Kunci rahasia diambil dari .env
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "user", content: prompt }]
            })
        });

        const json = await response.json();
        
        // Mengirimkan jawaban AI kembali ke Frontend
        res.json({ reply: json.choices[0].message.content });
        
    } catch (error) {
        console.error("Error dari AI:", error);
        res.status(500).json({ error: "Gagal memproses data AI" });
    }
});

// Menjalankan Server
app.listen(port, () => {
    console.log(`Server berjalan mantap di http://localhost:${port}`);
});