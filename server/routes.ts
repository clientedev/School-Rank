import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import MemoryStoreFactory from "memorystore";

const MemoryStore = MemoryStoreFactory(session);

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.use(session({
    cookie: { maxAge: 86400000, secure: process.env.NODE_ENV === "production", httpOnly: true, sameSite: "lax" },
    store: new MemoryStore({
      checkPeriod: 86400000
    }),
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET || "ranking-secret-key-dev-only"
  }));

  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Erro ao sair" });
      }
      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  });

  app.get("/api/me", async (req, res) => {
    const teacherId = (req.session as any).teacherId;
    if (!teacherId) return res.status(401).json({ message: "Não autorizado" });

    if (teacherId === -1) {
      return res.json({ id: -1, name: "Admin", role: "admin" });
    }

    const t = await storage.getTeacher(teacherId);
    if (!t) return res.status(401).json({ message: "Professor não encontrado" });
    res.json(t);
  });

  app.post("/api/login", async (req, res) => {

    const { email, password, rememberMe } = req.body;

    // Admin login check
    if (email === "admin" && password === "admin123") {
      (req.session as any).teacherId = -1; // Special ID for admin
      if (rememberMe) {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 dias
      }
      return res.json({ success: true, teacherId: -1, isAdmin: true });
    }

    const t = await storage.getTeacherByEmail(email);
    if (!t || t.password !== password) {
      return res.status(401).json({ message: "Email ou senha inválida" });
    }

    (req.session as any).teacherId = t.id;
    if (rememberMe) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 dias
    }

    res.json({ success: true, teacherId: t.id });
  });

  app.post("/api/register", async (req, res) => {
    // Admin check for teacher registration
    const sessionTeacherId = (req.session as any).teacherId;
    if (sessionTeacherId !== -1) {
      return res.status(403).json({ message: "Apenas o administrador pode cadastrar professores" });
    }

    const { name, email, password } = req.body;
    const existing = await storage.getTeacherByEmail(email);
    if (existing) return res.status(400).json({ message: "Email já cadastrado" });
    const created = await storage.createTeacher({ name, email, password, role: "teacher" });
    res.json(created);
  });

  app.get("/api/teachers", async (req, res) => {
    const sessionTeacherId = (req.session as any).teacherId;
    if (sessionTeacherId !== -1) {
      return res.status(403).json({ message: "Não autorizado" });
    }
    const teachers = await storage.getTeachers();
    res.json(teachers.filter(t => t.id !== -1)); // Don't return admin itself
  });

  app.delete("/api/teachers/:id", async (req, res) => {
    const sessionTeacherId = (req.session as any).teacherId;
    if (sessionTeacherId !== -1) {
      return res.status(403).json({ message: "Não autorizado" });
    }
    await storage.deleteTeacher(Number(req.params.id));
    res.json({ success: true });
  });

  app.delete("/api/classes/:id", async (req, res) => {
    const sessionTeacherId = (req.session as any).teacherId;
    if (sessionTeacherId !== -1) {
      // Teachers can only delete their own classes
      const c = await storage.getClass(Number(req.params.id));
      if (!c || c.teacherId !== sessionTeacherId) {
        return res.status(403).json({ message: "Não autorizado" });
      }
    }
    await storage.deleteClass(Number(req.params.id));
    res.json({ success: true });
  });

  app.get("/api/admin/stats", async (req, res) => {
    if ((req.session as any).teacherId !== -1) {
      return res.status(403).json({ message: "Não autorizado" });
    }
    const stats = await storage.getSystemStats();
    res.json(stats);
  });

  app.post("/api/admin/reset-xp", async (req, res) => {
    const sessionTeacherId = (req.session as any).teacherId;
    if (sessionTeacherId !== -1) {
      return res.status(403).json({ message: "Não autorizado" });
    }
    await storage.resetAllXP();
    res.json({ success: true, message: "Todos os XP foram zerados e histórico limpo." });
  });

  app.get("/api/classes", async (req, res) => {
    const teacherId = (req.session as any).teacherId;
    if (teacherId === undefined) return res.status(401).json({ message: "Não autorizado" });

    // Admin sees all classes, teachers see only theirs
    const classes = await storage.getClasses(teacherId === -1 ? undefined : teacherId);
    res.json(classes);
  });

  app.post("/api/classes/:id/select", async (req, res) => {
    const teacherId = (req.session as any).teacherId;
    if (teacherId === undefined) return res.status(401).json({ message: "Não autorizado" });

    const classId = Number(req.params.id);
    (req.session as any).classId = classId;
    res.json({ success: true, classId });
  });


  app.post("/api/classes", async (req, res) => {
    const teacherId = (req.session as any).teacherId;
    if (!teacherId) return res.status(401).json({ message: "Não autorizado" });
    const { name, password } = req.body;
    const created = await storage.createClass({ name, password, teacherId });
    (req.session as any).classId = created.id;
    res.json(created);
  });




  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.teacherId) return res.status(401).json({ message: "Não autorizado" });
    next();
  };

  app.get(api.dashboard.path, async (req, res) => {
    try {
      const classId = (req.session as any).classId || Number(req.query.classId);
      if (!classId) return res.status(400).json({ message: "Turma não especificada" });

      const allGrades = await storage.getAllGradesWithDetails(classId);
      const activities = await storage.getActivities(classId);
      const students = await storage.getStudents(classId);
      const c = await storage.getClass(classId);
      const className = c?.name || "Ranking da Turma";

      const studentMap = new Map<number, any>();

      students.forEach(s => {
        studentMap.set(s.id, {
          studentId: s.id,
          studentName: s.name,
          extraPoints: s.extraPoints || 0,
          sumGrades: 0,
          activitiesCount: 0,
          grades: []
        });
      });

      allGrades.forEach(g => {
        const s = studentMap.get(g.studentId);
        if (s) {
          s.sumGrades += g.value;
          s.activitiesCount += 1;
          s.grades.push({
            activityId: g.activityId,
            activityName: g.activityName,
            value: g.value,
            gradeId: g.gradeId
          });
        }
      });

      let classTotalPoints = 0;
      let classActivitiesCount = 0;

      const rankings = Array.from(studentMap.values()).map(s => {
        const rawAverage = s.activitiesCount > 0 ? s.sumGrades / s.activitiesCount : 0;
        const average = Math.min(rawAverage, 100);
        const totalPoints = s.sumGrades + s.extraPoints;

        classTotalPoints += totalPoints;
        classActivitiesCount += s.activitiesCount;

        return {
          studentId: s.studentId,
          studentName: s.studentName,
          extraPoints: s.extraPoints,
          totalPoints,
          activitiesCount: s.activitiesCount,
          grades: s.grades,
          average
        };
      });

      rankings.sort((a, b) => b.totalPoints - a.totalPoints);

      let highestAverage = 0;
      let lowestAverage = 0;

      const finalizedRankings = rankings.map((r, index) => {
        if (index === 0) highestAverage = r.average;
        if (index === rankings.length - 1) lowestAverage = r.average;

        return {
          ...r,
          position: index + 1
        };
      });

      let classAverage = 0;
      if (classActivitiesCount > 0) {
        classAverage = classTotalPoints / classActivitiesCount;
      }

      res.json({
        className,
        classId,
        rankings: finalizedRankings,
        stats: {
          classAverage,
          highestAverage,
          lowestAverage
        },
        activities
      });
    } catch (err) {
      console.error("Dashboard error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.settings.updateClassName.path, requireAuth, async (req, res) => {
    try {
      const { className } = api.settings.updateClassName.input.parse(req.body);
      const classId = (req.session as any).classId || Number(req.body.classId);
      if (!classId) return res.status(400).json({ message: "Turma não especificada" });
      await storage.updateClass(classId, { name: className });
      res.json({ success: true });
    } catch (err) {
      console.error("Failed to update class name:", err);
      res.status(500).json({ message: "Failed to update class name" });
    }
  });

  app.post(api.activities.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.activities.create.input.parse(req.body);
      const activity = await storage.createActivity(input);
      res.status(201).json(activity);
    } catch (err) {
      console.error("Failed to create activity:", err);
      res.status(500).json({ message: "Failed to create activity" });
    }
  });

  app.post(api.grades.batchUpload.path, requireAuth, async (req, res) => {
    try {
      const classId = (req.session as any).classId;
      const { data } = api.grades.batchUpload.input.parse(req.body);

      for (const row of data) {
        let student = await storage.getStudentByName(row.studentName, classId);
        if (!student) {
          student = await storage.createStudent({ name: row.studentName, classId, extraPoints: 0 });
        }

        if (row.activityName && row.value !== null) {
          const numericValue = parseFloat(String(row.value).replace(',', '.'));
          if (isNaN(numericValue)) continue;

          let activity = await storage.getActivityByName(row.activityName, classId);
          if (!activity) {
            activity = await storage.createActivity({ name: row.activityName, classId });
          }

          const existingGrade = await storage.getGrade(student.id, activity.id);
          if (existingGrade) {
            await storage.updateGrade(existingGrade.id, numericValue);
          } else {
            await storage.createGrade({
              studentId: student.id,
              activityId: activity.id,
              value: numericValue
            });
          }
        }
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.grades.update.path, requireAuth, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { value, reason, studentId, activityId } = req.body;

      if (id > 0) {
        const updated = await storage.updateGrade(id, value, reason);
        return res.json(updated);
      }

      // Handle creation of new grade when id is 0
      if (!studentId || !activityId) {
        return res.status(400).json({ message: "Student ID and Activity ID are required for new grades" });
      }

      const existingGrade = await storage.getGrade(studentId, activityId);
      if (existingGrade) {
        const updated = await storage.updateGrade(existingGrade.id, value, reason);
        return res.json(updated);
      }

      const created = await storage.createGrade({
        studentId,
        activityId,
        value,
        reason
      });
      res.status(201).json(created);
    } catch (err) {
      console.error("Failed to update grade:", err);
      res.status(500).json({ message: "Failed to update grade" });
    }
  });

  app.post("/api/students/:id/points", requireAuth, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { points, reason } = req.body;
      const updated = await storage.updateStudentExtraPoints(id, points, reason);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Failed to update points" });
    }
  });

  app.get("/api/students/:id/logs", async (req, res) => {
    try {
      const logs = await storage.getStudentLogs(Number(req.params.id));
      res.json(logs);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch student logs" });
    }
  });

  // ==========================================
  // MÓDULO DE FREQUÊNCIA
  // ==========================================

  app.get("/api/attendance", requireAuth, async (req, res) => {
    try {
      const classId = (req.session as any).classId || Number(req.query.classId);
      const date = String(req.query.date);
      if (!classId || !date) return res.status(400).json({ message: "Faltam parâmetros" });

      const records = await storage.getAttendance(classId, date);
      res.json(records);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Erro ao buscar frequência" });
    }
  });

  app.post("/api/attendance", requireAuth, async (req, res) => {
    try {
      const classId = (req.session as any).classId || Number(req.body.classId);
      const { studentId, date, status } = req.body;
      if (!classId || !studentId || !date || !status) return res.status(400).json({ message: "Faltam parâmetros" });

      const record = await storage.upsertAttendance({ studentId, classId, date, status });
      res.json(record);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Erro ao salvar frequência" });
    }
  });

  app.get("/api/attendance/report", requireAuth, async (req, res) => {
    try {
      const classId = (req.session as any).classId || Number(req.query.classId);
      if (!classId) return res.status(400).json({ message: "Turma não informada" });

      const records = await storage.getAttendanceReport(classId);
      res.json(records);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Erro ao buscar relatório" });
    }
  });

  app.get("/api/attendance/student/:id", async (req, res) => {
    try {
      const studentId = Number(req.params.id);
      const records = await storage.getStudentAttendance(studentId);
      res.json(records);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Erro ao buscar faltas do aluno" });
    }
  });

  app.get("/api/schedule", requireAuth, async (req, res) => {
    try {
      const classId = (req.session as any).classId || Number(req.query.classId);
      if (!classId) return res.status(400).json({ message: "Turma não informada" });

      const schedule = await storage.getSchedule(classId);
      res.json(schedule || { weekdays: "" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Erro buscar dias de aula" });
    }
  });

  app.post("/api/schedule", requireAuth, async (req, res) => {
    try {
      const classId = (req.session as any).classId || Number(req.body.classId);
      const { weekdays } = req.body;
      if (!classId || weekdays === undefined) return res.status(400).json({ message: "Faltam parâmetros" });

      await storage.saveSchedule(classId, weekdays);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Erro ao salvar dias de aula" });
    }
  });

  // ==========================================

  return httpServer;
}
