# Habit Tracker - Panduan Setup & Menjalankan Aplikasi

## Prasyarat

Pastikan sudah terinstall di laptop kamu:

1. **Node.js** (v18+) — download di https://nodejs.org
   Cek: buka CMD/PowerShell, ketik `node --version`

2. **SQL Server** + **SSMS** — sudah ada ✅

3. **VS Code** — sudah ada ✅

---

## Langkah 1: Siapkan SQL Server untuk menerima koneksi

Ini langkah PENTING yang sering terlewat.

### Enable TCP/IP di SQL Server

1. Buka **SQL Server Configuration Manager**
   - Cari di Start Menu: "SQL Server Configuration Manager"
   - Atau buka dari: `C:\Windows\SysWOW64\SQLServerManager*.msc`

2. Klik **SQL Server Network Configuration** > **Protocols for [instance kamu]**

3. Klik kanan **TCP/IP** > **Enable**

4. Klik kanan **TCP/IP** > **Properties** > tab **IP Addresses**
   - Scroll ke bawah, cari **IPAll**
   - Set **TCP Port** = `1433`
   - Kosongkan **TCP Dynamic Ports**

5. Restart SQL Server:
   - Di panel kiri, klik **SQL Server Services**
   - Klik kanan **SQL Server (...)** > **Restart**

### Pastikan Login SQL Server Aktif

Jika menggunakan SQL Authentication (bukan Windows Auth):

1. Buka SSMS, connect ke server
2. Klik kanan server > **Properties** > **Security**
3. Pilih **SQL Server and Windows Authentication mode**
4. Klik OK, restart SQL Server

---

## Langkah 2: Setup Project

1. **Copy folder `habit-tracker-project`** ke lokasi yang kamu mau
   Contoh: `D:\Projects\habit-tracker-project`

2. **Copy file HTML dari Google Stitch** ke folder `public/`:
   ```
   habit-tracker-project/
   └── public/
       ├── beranda_dashboard.html        ← dari folder beranda_dashboard/code.html
       ├── daftar_kebiasaan_kategori.html ← dari folder daftar_kebiasaan_kategori/code.html
       ├── tambah_kebiasaan_baru.html     ← dari folder tambah_kebiasaan_baru/code.html
       ├── statistik_progres.html         ← dari folder statistik_progres/code.html
       └── pengaturan_whatsapp.html       ← dari folder pengaturan_whatsapp/code.html
   ```

3. **Buat file `.env`** di root project:
   - Copy `.env.example` → rename jadi `.env`
   - Edit sesuai konfigurasi SQL Server kamu:
   ```
   PORT=3000
   DB_SERVER=localhost
   DB_DATABASE=HabitTrackerDB
   DB_USER=sa
   DB_PASSWORD=password_kamu
   DB_PORT=1433
   DB_TRUSTED_CONNECTION=false
   ```
   
   Jika kamu pakai **Windows Authentication**, set:
   ```
   DB_TRUSTED_CONNECTION=true
   ```

4. **Buka Terminal di VS Code** (Ctrl + `) dan jalankan:
   ```bash
   cd D:\Projects\habit-tracker-project
   npm install
   ```

---

## Langkah 3: Jalankan Aplikasi

```bash
npm run dev
```

Jika berhasil, akan muncul:
```
================================================
  HABIT TRACKER API - Server berjalan!
================================================
  Local:    http://localhost:3000
  API:      http://localhost:3000/api/health
  
  Halaman:
  - Dashboard:  http://localhost:3000/
  - Habits:     http://localhost:3000/habits
  - Tambah:     http://localhost:3000/add
  - Statistik:  http://localhost:3000/stats
  - Settings:   http://localhost:3000/settings
================================================
```

Buka browser: **http://localhost:3000**

---

## Langkah 4: Test API

Buka browser atau Postman, coba endpoint-endpoint ini:

### Health Check
```
GET http://localhost:3000/api/health
```

### Ambil Habit Hari Ini (user_id = 1)
```
GET http://localhost:3000/api/habits/today/1
```

### Ambil Semua Kategori
```
GET http://localhost:3000/api/categories
```

### Buat Habit Baru
```
POST http://localhost:3000/api/habits
Content-Type: application/json

{
  "user_id": 1,
  "category_id": 1,
  "nama_habit": "Minum air putih",
  "target_waktu": "06:00",
  "durasi_menit": 5,
  "frekuensi": "harian"
}
```

### Tandai Habit Selesai
```
PUT http://localhost:3000/api/habits/1/complete
Content-Type: application/json

{
  "user_id": 1,
  "status": "selesai",
  "mood_rating": 4
}
```

### Statistik Mingguan
```
GET http://localhost:3000/api/stats/weekly/1
```

---

## Langkah 5: Menghubungkan Frontend ke API

File HTML dari Google Stitch saat ini masih statis (data hardcoded).
Untuk menghubungkannya ke API, tambahkan JavaScript fetch di setiap halaman.

Contoh: di beranda_dashboard.html, tambahkan sebelum </body>:

```html
<script>
const USER_ID = 1; // ID user yang login
const API_BASE = 'http://localhost:3000/api';

// Load data dashboard
async function loadDashboard() {
    try {
        // Ambil data dashboard
        const dashRes = await fetch(`${API_BASE}/stats/dashboard/${USER_ID}`);
        const dashData = await dashRes.json();
        
        // Ambil habit hari ini
        const habitsRes = await fetch(`${API_BASE}/habits/today/${USER_ID}`);
        const habitsData = await habitsRes.json();
        
        if (dashData.success && dashData.data) {
            // Update progress ring
            updateProgressRing(dashData.data.completion_rate);
        }
        
        if (habitsData.success) {
            // Render habit cards
            renderHabitCards(habitsData.data);
        }
    } catch (err) {
        console.error('Gagal load dashboard:', err);
    }
}

function updateProgressRing(percentage) {
    const circle = document.querySelector('.progress-ring__circle');
    const circumference = 2 * Math.PI * 40; // r=40
    const offset = circumference - (percentage / 100) * circumference;
    circle.setAttribute('stroke-dashoffset', offset);
    
    // Update text
    const label = document.querySelector('.progress-ring__circle')
        .closest('div').querySelector('span');
    if (label) label.textContent = Math.round(percentage) + '%';
}

function renderHabitCards(habits) {
    // Implementasi render dinamis habit cards
    console.log('Habits hari ini:', habits);
}

// Jalankan saat halaman dimuat
document.addEventListener('DOMContentLoaded', loadDashboard);
</script>
```

---

## Struktur Folder Lengkap

```
habit-tracker-project/
├── .env                    ← Konfigurasi (JANGAN commit ke git)
├── .env.example            ← Template konfigurasi
├── package.json            ← Dependencies
├── server.js               ← Entry point
├── config/
│   └── database.js         ← Koneksi SQL Server
├── routes/
│   ├── habits.js           ← CRUD habits + complete + suggestions
│   ├── categories.js       ← CRUD kategori
│   ├── stats.js            ← Dashboard + weekly + heatmap + achievements
│   ├── reminders.js        ← CRUD reminders
│   └── users.js            ← Register + login + profil
├── middleware/              ← (untuk auth dll nanti)
└── public/                 ← File HTML dari Google Stitch
    ├── beranda_dashboard.html
    ├── daftar_kebiasaan_kategori.html
    ├── tambah_kebiasaan_baru.html
    ├── statistik_progres.html
    └── pengaturan_whatsapp.html
```

---

## Troubleshooting

### Error: "Failed to connect to localhost:1433"
- TCP/IP belum di-enable → ikuti Langkah 1
- SQL Server service belum berjalan → buka Services, start SQL Server
- Port salah → cek di SQL Server Configuration Manager

### Error: "Login failed for user 'sa'"
- Password salah di file .env
- SQL Authentication mode belum diaktifkan
- Coba pakai Windows Auth: set `DB_TRUSTED_CONNECTION=true`

### Error: "Cannot find module 'express'"
- Belum install dependencies → jalankan `npm install`

### Halaman HTML tidak tampil
- Pastikan file HTML sudah di-copy ke folder `public/`
- Pastikan nama file sesuai (tanpa spasi, huruf kecil)
