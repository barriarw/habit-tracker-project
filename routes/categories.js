const express = require('express');
const router = express.Router();
const { sql, getPool } = require('../config/database');

// GET /api/categories - Ambil semua kategori
router.get('/', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .query('SELECT * FROM Categories ORDER BY urutan, nama_kategori');
        
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/categories/:userId/user - Kategori milik user
router.get('/:userId/user', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('user_id', sql.Int, req.params.userId)
            .query(`
                SELECT c.*, uc.is_visible, uc.urutan_custom
                FROM Categories c
                INNER JOIN UserCategories uc ON c.category_id = uc.category_id
                WHERE uc.user_id = @user_id AND uc.is_visible = 1
                ORDER BY uc.urutan_custom, c.nama_kategori
            `);
        
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/categories - Buat kategori custom
router.post('/', async (req, res) => {
    try {
        const { nama_kategori, deskripsi, icon, warna, user_id } = req.body;
        const pool = await getPool();
        
        const catResult = await pool.request()
            .input('nama_kategori', sql.NVarChar(100), nama_kategori)
            .input('deskripsi', sql.NVarChar(500), deskripsi || null)
            .input('icon', sql.NVarChar(50), icon || 'star')
            .input('warna', sql.NVarChar(7), warna || '#7F77DD')
            .query(`
                INSERT INTO Categories (nama_kategori, deskripsi, icon, warna, is_default)
                OUTPUT INSERTED.category_id
                VALUES (@nama_kategori, @deskripsi, @icon, @warna, 0)
            `);
        
        const newCatId = catResult.recordset[0].category_id;
        
        if (user_id) {
            await pool.request()
                .input('user_id', sql.Int, user_id)
                .input('category_id', sql.Int, newCatId)
                .query('INSERT INTO UserCategories (user_id, category_id) VALUES (@user_id, @category_id)');
        }
        
        res.json({ success: true, data: { category_id: newCatId } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
