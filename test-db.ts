import pg from "pg";
const { Pool } = pg;

async function testConnection() {
    const connectionString = process.env.DATABASE_URL;
    console.log("Testing connection to:", connectionString);

    const pool = new Pool({
        connectionString,
        // ssl: { rejectUnauthorized: false } // We might need this for Railway
    });

    try {
        const client = await pool.connect();
        const res = await client.query('SELECT NOW()');
        console.log("Connection successful! Time:", res.rows[0].now);

        const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
        console.log("Existing tables:", tables.rows.map(r => r.table_name));

        client.release();
    } catch (err) {
        console.error("Connection failed:", err);
    } finally {
        await pool.end();
    }
}

testConnection();
