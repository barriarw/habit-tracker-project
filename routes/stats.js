const express = require('express');
const router = express.Router();
const { sql, getPool } = require('../config/database');

// GET /api/stats/weekly/:userId - Statistik mingguan
router.get('/weekly/:userId', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('user_id', sql.Int, req.params.userId)
            .execute('sp_GetWeeklyStats');
        
        res.json({ 
            success: true, 
            data: {
                daily: result.recordsets[0],
                byCategory: result.recordsets[1],
                topStreaks: result.recordsets[2]
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/stats/dashboard/:userId - Data dashboard hari ini
router.get('/dashboard/:userId', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('user_id', sql.Int, req.params.userId)
            .query('SELECT * FROM vw_DashboardToday WHERE user_id = @user_id');
        
        res.json({ success: true, data: result.recordset[0] || null });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/stats/heatmap/:userId - Kalender heatmap
router.get('/heatmap/:userId', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('user_id', sql.Int, req.params.userId)
            .query('SELECT * FROM vw_CalendarHeatmap WHERE user_id = @user_id ORDER BY tanggal DESC');
        
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/stats/achievements/:userId - Achievement user
router.get('/achievements/:userId', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('user_id', sql.Int, req.params.userId)
            .query(`
                SELECT a.*, ua.tanggal_dapat,
                    CASE WHEN ua.id IS NOT NULL THEN 1 ELSE 0 END AS is_unlocked
                FROM Achievements a
                LEFT JOIN UserAchievements ua ON a.achievement_id = ua.achievement_id 
                    AND ua.user_id = @user_id
                ORDER BY is_unlocked DESC, a.poin
            `);
        
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/stats/gaps/:userId - Deteksi gap waktu kosong
router.get('/gaps/:userId', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('user_id', sql.Int, req.params.userId)
            .execute('sp_DetectTimeGaps');
        
        res.json({ 
            success: true, 
            data: {
                emptyBlocks: result.recordsets[0],
                suggestions: result.recordsets[1]
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
