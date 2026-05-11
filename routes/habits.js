const express = require('express');
const router = express.Router();
const { sql, getPool } = require('../config/database');

// GET /api/habits/today/:userId - Ambil habit hari ini
router.get('/today/:userId', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('user_id', sql.Int, req.params.userId)
            .execute('sp_GetTodayHabits');
        
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/habits/:userId - Ambil semua habit user
router.get('/:userId', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('user_id', sql.Int, req.params.userId)
            .query(`
                SELECT h.*, c.nama_kategori, c.icon AS kategori_icon, c.warna,
                       s.current_streak, s.longest_streak, s.total_completed
                FROM Habits h
                INNER JOIN Categories c ON h.category_id = c.category_id
                LEFT JOIN Streaks s ON h.habit_id = s.habit_id AND s.user_id = @user_id
                WHERE h.user_id = @user_id AND h.is_active = 1
                ORDER BY c.nama_kategori, h.target_waktu
            `);
        
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/habits - Buat habit baru
router.post('/', async (req, res) => {
    try {
        const { 
            user_id, category_id, nama_habit, deskripsi,
            frekuensi, hari_aktif, target_waktu, durasi_menit,
            blok_waktu, prioritas, reminder_aktif, menit_sebelum 
        } = req.body;

        const pool = await getPool();
        const result = await pool.request()
            .input('user_id', sql.Int, user_id)
            .input('category_id', sql.Int, category_id)
            .input('nama_habit', sql.NVarChar(200), nama_habit)
            .input('deskripsi', sql.NVarChar(500), deskripsi || null)
            .input('frekuensi', sql.NVarChar(20), frekuensi || 'harian')
            .input('hari_aktif', sql.NVarChar(50), hari_aktif || '1,2,3,4,5,6,7')
            .input('target_waktu', sql.Time, target_waktu || null)
            .input('durasi_menit', sql.Int, durasi_menit || 30)
            .input('blok_waktu', sql.NVarChar(20), blok_waktu || null)
            .input('prioritas', sql.Int, prioritas || 2)
            .input('reminder_aktif', sql.Bit, reminder_aktif !== false ? 1 : 0)
            .input('menit_sebelum', sql.Int, menit_sebelum || 15)
            .execute('sp_CreateHabit');
        
        res.json({ success: true, data: result.recordset[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT /api/habits/:habitId/complete - Tandai habit selesai
router.put('/:habitId/complete', async (req, res) => {
    try {
        const { user_id, status, catatan, mood_rating } = req.body;

        const pool = await getPool();
        const result = await pool.request()
            .input('habit_id', sql.Int, req.params.habitId)
            .input('user_id', sql.Int, user_id)
            .input('status', sql.NVarChar(20), status || 'selesai')
            .input('catatan', sql.NVarChar(500), catatan || null)
            .input('mood_rating', sql.Int, mood_rating || null)
            .execute('sp_CompleteHabit');
        
        res.json({ success: true, data: result.recordset[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT /api/habits/:habitId - Update habit
router.put('/:habitId', async (req, res) => {
    try {
        const { nama_habit, deskripsi, frekuensi, hari_aktif,
                target_waktu, durasi_menit, blok_waktu, prioritas, is_active } = req.body;
        
        const pool = await getPool();
        const result = await pool.request()
            .input('habit_id', sql.Int, req.params.habitId)
            .input('nama_habit', sql.NVarChar(200), nama_habit)
            .input('deskripsi', sql.NVarChar(500), deskripsi)
            .input('frekuensi', sql.NVarChar(20), frekuensi)
            .input('hari_aktif', sql.NVarChar(50), hari_aktif)
            .input('target_waktu', sql.Time, target_waktu)
            .input('durasi_menit', sql.Int, durasi_menit)
            .input('blok_waktu', sql.NVarChar(20), blok_waktu)
            .input('prioritas', sql.Int, prioritas)
            .input('is_active', sql.Bit, is_active)
            .query(`
                UPDATE Habits SET 
                    nama_habit = ISNULL(@nama_habit, nama_habit),
                    deskripsi = ISNULL(@deskripsi, deskripsi),
                    frekuensi = ISNULL(@frekuensi, frekuensi),
                    hari_aktif = ISNULL(@hari_aktif, hari_aktif),
                    target_waktu = ISNULL(@target_waktu, target_waktu),
                    durasi_menit = ISNULL(@durasi_menit, durasi_menit),
                    blok_waktu = ISNULL(@blok_waktu, blok_waktu),
                    prioritas = ISNULL(@prioritas, prioritas),
                    is_active = ISNULL(@is_active, is_active),
                    updated_at = GETDATE()
                WHERE habit_id = @habit_id
            `);
        
        res.json({ success: true, message: 'Habit berhasil diupdate' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE /api/habits/:habitId - Hapus habit (soft delete)
router.delete('/:habitId', async (req, res) => {
    try {
        const pool = await getPool();
        await pool.request()
            .input('habit_id', sql.Int, req.params.habitId)
            .query('UPDATE Habits SET is_active = 0, updated_at = GETDATE() WHERE habit_id = @habit_id');
        
        res.json({ success: true, message: 'Habit berhasil dihapus' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/habits/suggestions/:categoryId - Ambil saran habit per kategori
router.get('/suggestions/:categoryId', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('category_id', sql.Int, req.params.categoryId)
            .query(`
                SELECT * FROM Suggestions 
                WHERE category_id = @category_id AND is_active = 1
                ORDER BY level_kesulitan, nama_saran
            `);
        
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
