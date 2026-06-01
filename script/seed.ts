import { db } from "../server/db";
import { students, activities, grades } from "../shared/schema";

async function seed() {
  console.log("Seeding database...");

  // Create Students
  const [s1] = await db.insert(students).values({ name: "João Silva" }).returning();
  const [s2] = await db.insert(students).values({ name: "Maria Souza" }).returning();
  const [s3] = await db.insert(students).values({ name: "Pedro Santos" }).returning();

  // Create Activities
  const [a1] = await db.insert(activities).values({ name: "Aula 01" }).returning();
  const [a2] = await db.insert(activities).values({ name: "Aula 02" }).returning();
  const [a3] = await db.insert(activities).values({ name: "Trabalho Final" }).returning();

  // Create Grades
  await db.insert(grades).values([
    { studentId: s1.id, activityId: a1.id, value: 8.5 },
    { studentId: s1.id, activityId: a2.id, value: 7.0 },
    { studentId: s1.id, activityId: a3.id, value: 9.0 },
    { studentId: s2.id, activityId: a1.id, value: 9.0 },
    { studentId: s2.id, activityId: a2.id, value: 9.5 },
    { studentId: s2.id, activityId: a3.id, value: 10.0 },
    { studentId: s3.id, activityId: a1.id, value: 6.5 },
    { studentId: s3.id, activityId: a2.id, value: 8.0 },
    { studentId: s3.id, activityId: a3.id, value: 7.5 },
  ]);

  console.log("Database seeded!");
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
