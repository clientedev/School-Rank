import pg from "pg";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";

const { Client } = pg;

console.log("Iniciando a criação/atualização das tabelas do banco de dados...");

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function pushDb() {
    if (!process.env.DATABASE_URL) {
        console.log("No DATABASE_URL set, skipping db push.");
        return;
    }

    const maxRetries = 15;
    const retryDelay = 3000; // 3 seconds
    let client: any;
    let connected = false;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        console.log(`🔌 Tentando conectar ao banco de dados (Tentativa ${attempt}/${maxRetries})...`);
        client = new Client({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 5000 // 5 seconds timeout per connection attempt
        });

        try {
            await client.connect();
            connected = true;
            console.log("✅ Conectado ao banco de dados com sucesso!");
            break;
        } catch (error: any) {
            console.warn(`⚠️ Falha na tentativa ${attempt}/${maxRetries}:`, error.message || error);
            try {
                await client.end();
            } catch (_) {}
            if (attempt < maxRetries) {
                console.log(`Aguardando ${retryDelay / 1000} segundos antes de tentar novamente...`);
                await sleep(retryDelay);
            } else {
                console.error("❌ Limite de tentativas atingido. Não foi possível conectar ao banco de dados.");
                process.exit(1);
            }
        }
    }

    try {
        // Check if tables already exist
        const checkTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN ('teachers', 'users')
    `);

        if (checkTables.rowCount === 0) {
            console.log("⚙️  Tabelas não encontradas. Aplicando schema inicial...");

            const migrationsDir = join(process.cwd(), "migrations");
            if (!existsSync(migrationsDir)) {
                throw new Error(`Pasta de migrations não encontrada em: ${migrationsDir}`);
            }

            const files = readdirSync(migrationsDir).filter(f => f.endsWith(".sql"));
            if (files.length === 0) {
                throw new Error("Nenhum arquivo .sql encontrado na pasta migrations.");
            }

            for (const file of files) {
                console.log(`Executando arquivo: ${file}`);
                const sql = readFileSync(join(migrationsDir, file), "utf-8");
                const statements = sql.split("--> statement-breakpoint");

                for (const stmt of statements) {
                    if (stmt.trim()) {
                        await client.query(stmt);
                    }
                }
            }
            console.log("✅ Schema executado e todas as tabelas foram criadas com sucesso!");
        } else {
            console.log("✅ As tabelas principais já existem. Nenhuma ação necessária.");
        }
    } catch (error) {
        console.error("❌ Erro fatal ao tentar criar as tabelas:", error);
        process.exit(1);
    } finally {
        await client.end();
        console.log("Conexão com o banco fechada.");
        process.exit(0); // Exit process successfully so start script continues
    }
}

pushDb();
