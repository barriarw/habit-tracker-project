const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { getPool } = require('./config/database');

// Import routes
const habitRoutes = require('./routes/habits');
const categoryRoutes = require('./routes/categories');
const statsRoutes = require('./routes/stats');
const reminderRoutes = require('./routes/reminders');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve file HTML dari folder public
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/habits', habitRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query('SELECT 1 AS status');
        res.json({ 
            status: 'ok', 
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({ 
            status: 'error', 
            database: 'disconnected',
            message: err.message 
        });
    }
});

// Default route: serve dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'beranda_dashboard.html'));
});

// Page routes
app.get('/habits', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'daftar_kebiasaan_kategori.html'));
});
app.get('/add', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'tambah_kebiasaan_baru.html'));
});
app.get('/stats', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'statistik_progres.html'));
});
app.get('/settings', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pengaturan_whatsapp.html'));
});

// Start server
async function startServer() {
    try {
        // Test koneksi database
        await getPool();
        
        app.listen(PORT, () => {
            console.log('');
            console.log('================================================');
            console.log('  HABIT TRACKER API - Server berjalan!');
            console.log('================================================');
            console.log(`  Local:    http://localhost:${PORT}`);
            console.log(`  API:      http://localhost:${PORT}/api/health`);
            console.log('');
            console.log('  Halaman:');
            console.log(`  - Dashboard:  http://localhost:${PORT}/`);
            console.log(`  - Habits:     http://localhost:${PORT}/habits`);
            console.log(`  - Tambah:     http://localhost:${PORT}/add`);
            console.log(`  - Statistik:  http://localhost:${PORT}/stats`);
            console.log(`  - Settings:   http://localhost:${PORT}/settings`);
            console.log('================================================');
            console.log('');
        });
    } catch (err) {
        console.error('Gagal memulai server:', err.message);
        process.exit(1);
    }
}

startServer();
