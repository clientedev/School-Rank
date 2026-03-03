import { execSync } from "child_process";

console.log("Iniciando a criação/atualização das tabelas do banco de dados...");

try {
    // O drizzle-kit push irá ler a URL do banco da variável de ambiente DATABASE_URL
    // e aplicar o schema definido em @shared/schema para criar as tabelas
    execSync("npx drizzle-kit push", { stdio: "inherit" });
    console.log("✅ Tabelas criadas/atualizadas com sucesso!");
} catch (error) {
    console.error("❌ Erro ao criar as tabelas:", error);
    process.exit(1);
}
