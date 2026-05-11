const sql = require('mssql');
require('dotenv').config();

let pool = null;

async function getPool() {
    if (pool) return pool;

    const server = process.env.DB_SERVER || 'localhost';
    const database = process.env.DB_DATABASE || 'HabitTrackerDB';
    const port = parseInt(process.env.DB_PORT) || 1433;
    const useTrusted = process.env.DB_TRUSTED_CONNECTION === 'true';

    const drivers = [
        'ODBC Driver 18 for SQL Server',
        'ODBC Driver 17 for SQL Server',
        'SQL Server Native Client 11.0',
        'SQL Server'
    ];

    if (useTrusted) {
        for (const driver of drivers) {
            try {
                const connStr = `Driver={${driver}};Server=${server};Database=${database};Trusted_Connection=yes;TrustServerCertificate=yes;`;
                console.log(`Mencoba: ${driver}...`);
                pool = await sql.connect(connStr);
                console.log(`Database terhubung! (Windows Auth - ${driver})`);
                return pool;
            } catch (err) {
                console.log(`  Gagal: ${err.message.substring(0, 80)}`);
                pool = null;
            }
        }
        console.error('');
        console.error('Semua ODBC driver gagal. Aktifkan SQL Auth:');
        console.error('1. SSMS > Security > Logins > klik kanan sa > Properties');
        console.error('2. Set password (misal: Habit123!)');
        console.error('3. Tab Status > Login: Enabled > OK');
        console.error('4. Klik kanan server > Properties > Security > SQL Server and Windows Auth');
        console.error('5. Restart SQL Server, lalu edit .env:');
        console.error('   DB_TRUSTED_CONNECTION=false');
        console.error('   DB_USER=sa');
        console.error('   DB_PASSWORD=Habit123!');
        throw new Error('Tidak ada ODBC driver yang berhasil');
    } else {
        const dbConfig = {
            server: server,
            database: database,
            port: port,
            user: process.env.DB_USER || 'sa',
            password: process.env.DB_PASSWORD || '',
            options: {
                encrypt: false,
                trustServerCertificate: true,
                enableArithAbort: true
            }
        };
        try {
            pool = await sql.connect(dbConfig);
            console.log('Database terhubung! (SQL Auth)');
            return pool;
        } catch (err) {
            console.error('Gagal koneksi:', err.message);
            throw err;
        }
    }
}

async function closePool() {
    if (pool) { await pool.close(); pool = null; }
}

module.exports = { sql, getPool, closePool };
