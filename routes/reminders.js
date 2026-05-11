const express = require('express');
const router = express.Router();
const { sql, getPool } = require('../config/database');

// GET /api/reminders/:userId - Ambil semua reminder user
router.get('/:userId', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('user_id', sql.Int, req.params.userId)
            .query(`
                SELECT r.*, h.nama_habit, c.nama_kategori
                FROM Reminders r
                INNER JOIN Habits h ON r.habit_id = h.habit_id
                INNER JOIN Categories c ON h.category_id = c.category_id
                WHERE r.user_id = @user_id
                ORDER BY r.waktu_reminder
            `);
        
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT /api/reminders/:reminderId - Update reminder
router.put('/:reminderId', async (req, res) => {
    try {
        const { waktu_reminder, channel, pesan_custom, is_active } = req.body;
        const pool = await getPool();
        
        await pool.request()
            .input('reminder_id', sql.Int, req.params.reminderId)
            .input('waktu_reminder', sql.Time, waktu_reminder)
            .input('channel', sql.NVarChar(20), channel)
            .input('pesan_custom', sql.NVarChar(500), pesan_custom)
            .input('is_active', sql.Bit, is_active)
            .query(`
                UPDATE Reminders SET 
                    waktu_reminder = ISNULL(@waktu_reminder, waktu_reminder),
                    channel = ISNULL(@channel, channel),
                    pesan_custom = ISNULL(@pesan_custom, pesan_custom),
                    is_active = ISNULL(@is_active, is_active)
                WHERE reminder_id = @reminder_id
            `);
        
        res.json({ success: true, message: 'Reminder berhasil diupdate' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/reminders/pending/now - Ambil reminder yang perlu dikirim sekarang
router.get('/pending/now', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().execute('sp_GetPendingReminders');
        
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
