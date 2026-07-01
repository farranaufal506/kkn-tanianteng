// --- KONFIGURASI SUPABASE (Hanya untuk baca data, aman di frontend) ---
const supabaseClient = supabase.createClient("https://wbgnpyitaplcxruonpel.supabase.co", "sb_publishable_EOBfXP0Vdd2YVKNRWscXTQ_pX9zOQpg");

// --- NAVIGASI ---
function switchView(view) {
    document.getElementById('view-dashboard').classList.toggle('hidden', view !== 'dashboard');
    document.getElementById('view-ai').classList.toggle('hidden', view !== 'ai');
    document.getElementById('nav-dashboard').classList.toggle('bg-blue-900/30', view === 'dashboard');
    document.getElementById('nav-ai').classList.toggle('bg-blue-900/30', view === 'ai');
}

// --- MENGAMBIL DATA SENSOR DARI SUPABASE ---
// --- 1. AMBIL DATA AWAL SAAT WEB DIBUKA ---
// --- 1. AMBIL DATA AWAL SAAT WEB DIBUKA ---
async function loadInitialData() {
    const { data, error } = await supabaseClient
        .from('sensor_data')
        .select('*'); // Mengambil semua data tanpa sorting di server
    
    if (error) {
        console.error("Error Supabase Detail:", error);
        return;
    }

    console.log("Data dari Supabase:", data);
    
    if (data && data.length > 0) {
        // Mengambil baris paling terakhir yang ada di dalam array data
        const dataTerbaru = data[data.length - 1]; 
        updateDashboardUI(dataTerbaru);
    }
}

// --- 2. FUNGSI UNTUK MENGUBAH ANGKA DI LAYAR ---
function updateDashboardUI(item) {
    document.getElementById('valSuhu').innerText = item.suhu ?? '--';
    document.getElementById('valKelembapan').innerText = item.kelembapan_udara ?? '--';
    document.getElementById('valTanah').innerText = item.rata_rata_tanah ?? '--';
    document.getElementById('valTds').innerText = item.tds ?? '--';
    document.getElementById('valJarak').innerText = item.jarak_air ?? '--';
    document.getElementById('valPh').innerText = item.ph ?? '--';

    
    // Efek kedip kecil tanda data baru masuk
    document.getElementById('valSuhu').classList.add('text-green-400');
    setTimeout(() => document.getElementById('valSuhu').classList.remove('text-green-400'), 1000);
}

// --- 3. PASANG TELINGA (REAL-TIME LISTENER) ---
// Kode ini mendengarkan jika ada data baru masuk ke tabel 'sensor_data'
supabaseClient
    .channel('perubahan_data_sensor')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sensor_data' }, (payload) => {
        console.log('Ada data baru masuk dari sensor!', payload.new);
        updateDashboardUI(payload.new); // Langsung ubah angka di layar tanpa refresh!
    })
    .subscribe();

// Jalankan saat web pertama kali dibuka
loadInitialData();

// --- MENGIRIM PESAN KE BACKEND (Node.js) ---
async function sendMessage() {
    const input = document.getElementById('chatInput');
    const chatArea = document.getElementById('chatArea');
    const userMsg = input.value.trim();
    
    if (!userMsg) return;

    // Tampilkan pesan pengguna di layar
    chatArea.innerHTML += `<div class="text-right text-sm text-blue-300 mt-2"><b>Anda:</b> ${userMsg}</div>`;
    input.value = '';
    chatArea.scrollTop = chatArea.scrollHeight; 

    try {
        // 1. Ambil data sensor terbaru untuk dikirim ke AI
        const { data } = await supabaseClient.from('sensor_data').select('*').limit(1);

        // 2. Kirim pertanyaan dan data sensor ke Backend (Dapur) yang kita buat tadi
        // GUNAKAN INI AGAR AI BISA DIHUBUNGI SECARA ONLINE
      // PASTIKAN ADA /api/chat DI BELAKANGNYA
       // Tambahkan proxy milik cors-anywhere tepat sebelum link Vercel kamu
    const res = await fetch("https://cors-anywhere.herokuapp.com/https://kkn-tanianteng.vercel.app/api/chat", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        message: userMsg,
        sensorData: data 
    })
});

        if (!res.ok) throw new Error(`Status: ${res.status}`);

        // 3. Tampilkan balasan AI
        const json = await res.json();
        chatArea.innerHTML += `<div class="bg-slate-800 p-4 rounded-lg text-sm mt-2 text-left"><b>AI:</b> <br> ${marked.parse(json.reply)}</div>`;
        
    } catch (e) {
        chatArea.innerHTML += `<div class="text-red-400 text-xs mt-2">Error: Gagal terhubung ke server Backend. Pastikan node server.js masih menyala.</div>`;
    }
    chatArea.scrollTop = chatArea.scrollHeight;
}

// Fitur tekan Enter untuk mengirim pesan
document.getElementById('chatInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});