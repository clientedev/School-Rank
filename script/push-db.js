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
	"class_id" integer,
	CONSTRAINT "settings_key_unique" UNIQUE("key")
);

CREATE TABLE IF NOT EXISTS "student_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"points" real NOT NULL,
	"reason" text NOT NULL,
	"created_at" text DEFAULT CURRENT_TIMESTAMP NOT NULL
);

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
`;

async function pushDb() {
	if (!process.env.DATABASE_URL) {
		console.log("No DATABASE_URL set, skipping db push.");
		return;
	}

	const client = new Client({
		connectionString: process.env.DATABASE_URL,
		ssl: { rejectUnauthorized: false },
		connectionTimeoutMillis: 30000
	});

	try {
		await client.connect();
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
