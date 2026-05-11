const express = require('express');
const router = express.Router();
const { sql, getPool } = require('../config/database');

// POST /api/users/register - Register user baru
router.post('/register', async (req, res) => {
    try {
        const { nama, email, no_wa, password } = req.body;
        const pool = await getPool();
        
        // Untuk development, password disimpan plain
        // Di production, gunakan bcrypt
        const result = await pool.request()
            .input('nama', sql.NVarChar(100), nama)
            .input('email', sql.NVarChar(150), email)
            .input('no_wa', sql.NVarChar(20), no_wa)
            .input('password_hash', sql.NVarChar(256), password)
            .execute('sp_RegisterUser');
        
        res.json({ success: true, data: result.recordset[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/users/login - Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const pool = await getPool();
        
        const result = await pool.request()
            .input('email', sql.NVarChar(150), email)
            .input('password', sql.NVarChar(256), password)
            .query(`
                SELECT user_id, nama, email, no_wa, foto_profil 
                FROM Users 
                WHERE email = @email AND password_hash = @password AND is_active = 1
            `);
        
        if (result.recordset.length === 0) {
            return res.status(401).json({ success: false, message: 'Email atau password salah' });
        }
        
        res.json({ success: true, data: result.recordset[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/users/:userId - Ambil profil user
router.get('/:userId', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('user_id', sql.Int, req.params.userId)
            .query('SELECT user_id, nama, email, no_wa, foto_profil, zona_waktu FROM Users WHERE user_id = @user_id');
        
        res.json({ success: true, data: result.recordset[0] || null });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT /api/users/:userId - Update profil
router.put('/:userId', async (req, res) => {
    try {
        const { nama, no_wa, zona_waktu } = req.body;
        const pool = await getPool();
        
        await pool.request()
            .input('user_id', sql.Int, req.params.userId)
            .input('nama', sql.NVarChar(100), nama)
            .input('no_wa', sql.NVarChar(20), no_wa)
            .input('zona_waktu', sql.NVarChar(50), zona_waktu)
            .query(`
                UPDATE Users SET 
                    nama = ISNULL(@nama, nama),
                    no_wa = ISNULL(@no_wa, no_wa),
                    zona_waktu = ISNULL(@zona_waktu, zona_waktu),
                    updated_at = GETDATE()
                WHERE user_id = @user_id
            `);
        
        res.json({ success: true, message: 'Profil berhasil diupdate' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
