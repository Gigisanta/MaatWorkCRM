// ============================================================
// MaatWork CRM — Database Seed Script (PostgreSQL/Neon)
// ============================================================
// Run with: pnpm db:seed
// Creates demo org, admin user, contacts, pipeline, tasks, goals
// ============================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, "../../.env");
try {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim();
    }
  }
} catch {}

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function seed() {
  console.log("🌱 Seeding MaatWork CRM database...\n");

  // ── Organization ─────────────────────────────────────────
  const orgId = "org_maatwork_demo";
  await db
    .insert(schema.organizations)
    .values({
      id: orgId,
      name: "MaatWork Demo",
      slug: "maatwork-demo",
    })
    .onConflictDoNothing();
  console.log("✅ Organization: MaatWork Demo");

  // ── Users ────────────────────────────────────────────────
  const adminId = "user_admin_001";
  const asesor1Id = "user_asesor_001";
  const asesor2Id = "user_asesor_002";

  await db
    .insert(schema.users)
    .values([
      {
        id: adminId,
        name: "Carlos Admin",
        email: "admin@maatwork.com",
        role: "dueno",
        careerLevel: "lead",
      },
      {
        id: asesor1Id,
        name: "Ana García",
        email: "ana@maatwork.com",
        role: "asesor",
        careerLevel: "senior",
      },
      {
        id: asesor2Id,
        name: "Pedro Ruiz",
        email: "pedro@maatwork.com",
        role: "asesor",
        careerLevel: "junior",
      },
    ])
    .onConflictDoNothing();
  console.log("✅ Users: Carlos Admin, Ana García, Pedro Ruiz");

  // ── Members ──────────────────────────────────────────────
  await db
    .insert(schema.members)
    .values([
      { id: "mem_001", userId: adminId, organizationId: orgId, role: "owner" },
      { id: "mem_002", userId: asesor1Id, organizationId: orgId, role: "admin" },
      { id: "mem_003", userId: asesor2Id, organizationId: orgId, role: "member" },
    ])
    .onConflictDoNothing();

  // ── Pipeline Stages ──────────────────────────────────────
  const stages = [
    {
      id: "stage_01",
      name: "Prospecto",
      order: 0,
      color: "#6366f1",
      description: "Contacto nuevo sin contactar",
      wipLimit: null,
      slaHours: 48,
    },
    {
      id: "stage_02",
      name: "Contactado",
      order: 1,
      color: "#8b5cf6",
      description: "Primer contacto realizado",
      wipLimit: 10,
      slaHours: 72,
    },
    {
      id: "stage_03",
      name: "Primera reunion",
      order: 2,
      color: "#f59e0b",
      description: "Primera reunión programada",
      wipLimit: 8,
      slaHours: 168,
    },
    {
      id: "stage_04",
      name: "Segunda reunion",
      order: 3,
      color: "#3b82f6",
      description: "Segunda reunión o follow-up",
      wipLimit: 5,
      slaHours: 72,
    },
    {
      id: "stage_05",
      name: "Apertura",
      order: 4,
      color: "#10b981",
      description: "En proceso de apertura de cuenta",
      wipLimit: null,
      slaHours: null,
    },
    {
      id: "stage_06",
      name: "Cliente",
      order: 5,
      color: "#22c55e",
      description: "Cliente ganado",
      wipLimit: null,
      slaHours: null,
    },
    {
      id: "stage_07",
      name: "Caido",
      order: 6,
      color: "#ef4444",
      description: "Prospecto perdido",
      wipLimit: null,
      slaHours: null,
    },
    {
      id: "stage_08",
      name: "Cuenta vacia",
      order: 7,
      color: "#f97316",
      description: "Cuenta sin actividad",
      wipLimit: null,
      slaHours: null,
    },
  ];
  await db
    .insert(schema.pipelineStages)
    .values(stages.map((s) => ({ ...s, organizationId: orgId, isDefault: true, isActive: true })))
    .onConflictDoNothing();
  console.log("✅ Pipeline: 8 stages (Prospecto → Cliente) - ERP.MaatWork");

  // ── Contacts ─────────────────────────────────────────────
  const contactsData = [
    {
      id: "contact_001",
      name: "María López",
      email: "maria.lopez@email.com",
      phone: "+54 11 5555-0001",
      company: "López & Asociados",
      status: "active" as const,
      tags: ["VIP", "referido"],
      segment: "Premium",
      assignedTo: asesor1Id,
    },
    {
      id: "contact_002",
      name: "Juan Martínez",
      email: "juan.martinez@email.com",
      phone: "+54 11 5555-0002",
      company: "Inversiones JM",
      status: "prospect" as const,
      tags: ["nuevo"],
      segment: "Estándar",
      assignedTo: asesor1Id,
    },
    {
      id: "contact_003",
      name: "Lucía Fernández",
      email: "lucia.f@email.com",
      phone: "+54 11 5555-0003",
      status: "lead" as const,
      tags: ["evento-2026"],
      assignedTo: asesor2Id,
    },
    {
      id: "contact_004",
      name: "Roberto Sánchez",
      email: "roberto.s@email.com",
      phone: "+54 11 5555-0004",
      company: "Sánchez Corp",
      status: "active" as const,
      tags: ["empresarial"],
      segment: "Corporativo",
      assignedTo: asesor2Id,
    },
    {
      id: "contact_005",
      name: "Elena Torres",
      email: "elena.t@email.com",
      phone: "+54 11 5555-0005",
      status: "inactive" as const,
      tags: [],
      assignedTo: asesor1Id,
    },
  ];
  await db
    .insert(schema.contacts)
    .values(contactsData.map((c) => ({ ...c, organizationId: orgId })))
    .onConflictDoNothing();
  console.log("✅ Contacts: 5 (María López, Juan Martínez, etc.)");

  // ── Deals ────────────────────────────────────────────────
  await db
    .insert(schema.deals)
    .values([
      {
        id: "deal_001",
        organizationId: orgId,
        contactId: "contact_001",
        stageId: "stage_05",
        title: "Plan integral María López",
        value: 150000,
        probability: 100,
        assignedTo: asesor1Id,
      },
      {
        id: "deal_002",
        organizationId: orgId,
        contactId: "contact_002",
        stageId: "stage_04",
        title: "Asesoría Juan Martínez",
        value: 80000,
        probability: 60,
        assignedTo: asesor1Id,
      },
      {
        id: "deal_003",
        organizationId: orgId,
        contactId: "contact_003",
        stageId: "stage_01",
        title: "Consulta inicial Lucía",
        value: 50000,
        probability: 20,
        assignedTo: asesor2Id,
      },
      {
        id: "deal_004",
        organizationId: orgId,
        contactId: "contact_004",
        stageId: "stage_03",
        title: "Plan corporativo Sánchez",
        value: 300000,
        probability: 75,
        assignedTo: asesor2Id,
      },
    ])
    .onConflictDoNothing();
  console.log("✅ Deals: 4 across 7-stage pipeline");

  // ── Tasks ────────────────────────────────────────────────
  const today = new Date();
  const nextWeek = new Date(Date.now() + 7 * 86400000);
  const yesterday = new Date(Date.now() - 86400000);

  await db
    .insert(schema.tasks)
    .values([
      {
        id: "task_001",
        organizationId: orgId,
        title: "Llamar a María López – seguimiento mensual",
        description: "Revisar progreso del plan integral y actualizar objetivos",
        status: "pending",
        priority: "high",
        dueDate: today,
        assignedTo: asesor1Id,
        contactId: "contact_001",
        isRecurrent: true,
        recurrenceRule: "monthly",
      },
      {
        id: "task_002",
        organizationId: orgId,
        title: "Preparar propuesta para Juan Martínez",
        status: "in_progress",
        priority: "medium",
        dueDate: nextWeek,
        assignedTo: asesor1Id,
        contactId: "contact_002",
      },
      {
        id: "task_003",
        organizationId: orgId,
        title: "Enviar material informativo a Lucía",
        status: "pending",
        priority: "low",
        dueDate: yesterday,
        assignedTo: asesor2Id,
        contactId: "contact_003",
      },
      {
        id: "task_004",
        organizationId: orgId,
        title: "Reunión equipo semanal",
        description: "Revisar métricas y pipeline",
        status: "pending",
        priority: "medium",
        dueDate: nextWeek,
        assignedTo: adminId,
        isRecurrent: true,
        recurrenceRule: "weekly",
      },
    ])
    .onConflictDoNothing();
  console.log("✅ Tasks: 4 (including recurring)");

  // ── Teams ────────────────────────────────────────────────
  const teamId = "team_001";
  await db
    .insert(schema.teams)
    .values({
      id: teamId,
      organizationId: orgId,
      name: "Equipo Alfa",
      description: "Equipo principal de asesores",
      leaderId: asesor1Id,
    })
    .onConflictDoNothing();

  await db
    .insert(schema.teamMembers)
    .values([
      { id: "tm_001", teamId, userId: asesor1Id, role: "leader" },
      { id: "tm_002", teamId, userId: asesor2Id, role: "member" },
    ])
    .onConflictDoNothing();
  console.log("✅ Team: Equipo Alfa (Ana + Pedro)");

  // ── Team Goals ───────────────────────────────────────────
  await db
    .insert(schema.teamGoals)
    .values([
      {
        id: "goal_001",
        teamId,
        title: "$50k nuevos clientes",
        description: "Generar $50,000 en nuevos clientes durante marzo",
        targetValue: 50000,
        currentValue: 30000,
        unit: "currency",
        period: "2026-03",
        startDate: new Date("2026-03-01"),
        endDate: new Date("2026-03-31"),
        status: "active",
      },
      {
        id: "goal_002",
        teamId,
        title: "15 reuniones agendadas",
        description: "Agendar al menos 15 reuniones con prospectos",
        targetValue: 15,
        currentValue: 9,
        unit: "count",
        period: "2026-03",
        startDate: new Date("2026-03-01"),
        endDate: new Date("2026-03-31"),
        status: "active",
      },
    ])
    .onConflictDoNothing();
  console.log("✅ Goals: $50k clientes (60%), 15 reuniones (60%)");

  // ── Notes ────────────────────────────────────────────────
  await db
    .insert(schema.notes)
    .values([
      {
        id: "note_001",
        organizationId: orgId,
        entityType: "contact",
        entityId: "contact_001",
        content: "María mencionó interés en diversificar. Agendar reunión para marzo.",
        authorId: asesor1Id,
      },
      {
        id: "note_002",
        organizationId: orgId,
        entityType: "deal",
        entityId: "deal_002",
        content: "Juan pidió más información sobre comisiones. Enviar comparativo.",
        authorId: asesor1Id,
      },
    ])
    .onConflictDoNothing();
  console.log("✅ Notes: 2 sample notes");

  // ── Notifications ────────────────────────────────────────
  await db
    .insert(schema.notifications)
    .values([
      {
        id: "notif_001",
        userId: asesor1Id,
        organizationId: orgId,
        type: "task",
        title: "Tarea vencida",
        message: "La tarea 'Llamar a María López' vence hoy",
        actionUrl: "/tasks",
      },
      {
        id: "notif_002",
        userId: asesor1Id,
        organizationId: orgId,
        type: "goal",
        title: "Meta cerca del objetivo",
        message: "El equipo Alfa alcanzó el 60% de la meta de nuevos clientes",
        actionUrl: "/teams/team_001",
      },
    ])
    .onConflictDoNothing();
  console.log("✅ Notifications: 2 samples");

  // ── Training Materials ───────────────────────────────────
  await db
    .insert(schema.trainingMaterials)
    .values([
      {
        id: "train_001",
        organizationId: orgId,
        title: "Guía de Onboarding para Asesores",
        description: "Material inicial para nuevos asesores del equipo",
        category: "guide",
        url: "https://docs.maatwork.com/onboarding",
        createdBy: adminId,
      },
      {
        id: "train_002",
        organizationId: orgId,
        title: "Técnicas de Cierre de Venta",
        description: "Video curso sobre técnicas avanzadas de cierre",
        category: "video",
        url: "https://docs.maatwork.com/cierre",
        createdBy: adminId,
      },
    ])
    .onConflictDoNothing();
  console.log("✅ Training: 2 materials");

  // ── Audit Logs ───────────────────────────────────────────
  await db
    .insert(schema.auditLogs)
    .values([
      {
        id: "audit_001",
        organizationId: orgId,
        userId: adminId,
        action: "create",
        entityType: "organization",
        entityId: orgId,
        description: "Organización creada: MaatWork Demo",
      },
      {
        id: "audit_002",
        organizationId: orgId,
        userId: asesor1Id,
        action: "create",
        entityType: "contact",
        entityId: "contact_001",
        description: "Contacto creado: María López",
      },
    ])
    .onConflictDoNothing();
  console.log("✅ Audit Logs: 2 entries");

  console.log("\n🎉 Seed completed successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
