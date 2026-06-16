import pg from "pg";

const { Client } = pg;

const schemaSQL = `
CREATE TABLE IF NOT EXISTS "teachers" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "email" text NOT NULL,
        "password" text NOT NULL,
        "role" text DEFAULT 'teacher' NOT NULL,
        CONSTRAINT "teachers_email_unique" UNIQUE("email")
);

CREATE TABLE IF NOT EXISTS "classes" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "password" text NOT NULL,
        "teacher_id" integer
);

CREATE TABLE IF NOT EXISTS "students" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "extra_points" real DEFAULT 0 NOT NULL,
        "class_id" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "activities" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "class_id" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "grades" (
        "id" serial PRIMARY KEY NOT NULL,
        "student_id" integer NOT NULL,
        "activity_id" integer NOT NULL,
        "value" real NOT NULL,
        "reason" text,
        CONSTRAINT "grades_student_id_activity_id_unique" UNIQUE("student_id","activity_id")
);

CREATE TABLE IF NOT EXISTS "settings" (
        "id" serial PRIMARY KEY NOT NULL,
        "key" text NOT NULL,
        "value" text NOT NULL,
        "class_id" integer
);

CREATE TABLE IF NOT EXISTS "student_logs" (
        "id" serial PRIMARY KEY NOT NULL,
        "student_id" integer NOT NULL,
        "points" real NOT NULL,
        "reason" text NOT NULL,
        "created_at" text DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS "attendance" (
        "id" serial PRIMARY KEY NOT NULL,
        "student_id" integer NOT NULL,
        "class_id" integer NOT NULL,
        "date" text NOT NULL,
        "status" text NOT NULL,
        "points_applied" real DEFAULT 0 NOT NULL,
        CONSTRAINT "attendance_student_id_date_unique" UNIQUE("student_id","date")
);

CREATE TABLE IF NOT EXISTS "class_schedule" (
        "id" serial PRIMARY KEY NOT NULL,
        "class_id" integer NOT NULL,
        "weekdays" text DEFAULT '' NOT NULL,
        CONSTRAINT "class_schedule_class_id_unique" UNIQUE("class_id")
);

ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "boletim_released" boolean DEFAULT false NOT NULL;

DO $$ BEGIN
 ALTER TABLE "activities" ADD CONSTRAINT "activities_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "classes" ADD CONSTRAINT "classes_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "grades" ADD CONSTRAINT "grades_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "grades" ADD CONSTRAINT "grades_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "settings" ADD CONSTRAINT "settings_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "student_logs" ADD CONSTRAINT "student_logs_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "students" ADD CONSTRAINT "students_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "attendance" ADD CONSTRAINT "attendance_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "attendance" ADD CONSTRAINT "attendance_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "class_schedule" ADD CONSTRAINT "class_schedule_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function pushDb() {
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) {
                console.log("No DATABASE_URL set, skipping db push.");
                return;
        }

        const maxRetries = 15;
        const retryDelay = 3000;
        let client;
        let connected = false;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
                console.log(`🔌 Tentando conectar ao banco de dados (Tentativa ${attempt}/${maxRetries})...`);
                client = new Client({
                        connectionString,
                        ssl: { rejectUnauthorized: false },
                        connectionTimeoutMillis: 5000
                });

                try {
                        await client.connect();
                        connected = true;
                        console.log("✅ Conectado ao banco de dados com sucesso!");
                        break;
                } catch (error) {
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
                console.log("🚀 FORCING DATABASE TABLE CREATION...");
                await client.query(schemaSQL);
                console.log("✅ TODAS AS TABELAS FORAM CRIADAS E ATUALIZADAS COM SUCESSO!");
        } catch (error) {
                console.error("❌ Erro fatal ao tentar criar as tabelas:", error);
                process.exit(1);
        } finally {
                await client.end();
                process.exit(0);
        }
}

pushDb();
