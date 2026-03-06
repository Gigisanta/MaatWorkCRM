// ============================================================
// MaatWork CRM — Vitest: Zod Validation Tests
// ============================================================

import { describe, expect, it } from "vitest";
import {
  calendarEventSchema,
  contactSchema,
  dealSchema,
  teamGoalSchema as goalSchema,
  loginSchema,
  pipelineStageSchema,
  registerSchema,
  taskSchema,
  teamSchema,
} from "~/lib/validations";

describe("contactSchema", () => {
  it("accepts valid contact", () => {
    const result = contactSchema.safeParse({
      name: "María López",
      email: "maria@email.com",
      phone: "+54 11 5555-0001",
      status: "active",
      tags: ["VIP"],
      segment: "Premium",
    });
    expect(result.success).toBe(true);
  });

  it("requires name", () => {
    const result = contactSchema.safeParse({ email: "test@test.com" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = contactSchema.safeParse({ name: "Test", email: "not-email" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid status", () => {
    const result = contactSchema.safeParse({
      name: "Test",
      email: "test@test.com",
      status: "invalid",
    });
    expect(result.success).toBe(false);
  });
});

describe("dealSchema", () => {
  it("accepts valid deal", () => {
    const result = dealSchema.safeParse({
      title: "Plan integral",
      contactId: "contact_01",
      stageId: "stage_01",
      value: 150000,
      probability: 75,
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative value", () => {
    const result = dealSchema.safeParse({
      title: "Deal",
      contactId: "c1",
      stageId: "s1",
      value: -100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects probability > 100", () => {
    const result = dealSchema.safeParse({
      title: "Deal",
      contactId: "c1",
      stageId: "s1",
      value: 1000,
      probability: 150,
    });
    expect(result.success).toBe(false);
  });
});

describe("taskSchema", () => {
  it("accepts valid task", () => {
    const result = taskSchema.safeParse({
      title: "Call María for follow-up",
      status: "pending",
      priority: "high",
      dueDate: "2026-03-15",
    });
    expect(result.success).toBe(true);
  });

  it("requires title", () => {
    const result = taskSchema.safeParse({ status: "pending", priority: "low" });
    expect(result.success).toBe(false);
  });
});

describe("teamSchema", () => {
  it("accepts valid team", () => {
    const result = teamSchema.safeParse({ name: "Equipo Alfa" });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = teamSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });
});

describe("goalSchema", () => {
  it("accepts valid goal", () => {
    const result = goalSchema.safeParse({
      title: "$50k nuevos clientes",
      targetValue: 50000,
      currentValue: 30000,
      unit: "currency",
      period: "Marzo 2026",
      startDate: "2026-03-01",
      endDate: "2026-03-31",
    });
    expect(result.success).toBe(true);
  });
});

describe("loginSchema", () => {
  it("accepts valid login", () => {
    const result = loginSchema.safeParse({
      email: "admin@maatwork.com",
      password: "SecurePassword123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short password", () => {
    const result = loginSchema.safeParse({
      email: "admin@maatwork.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("accepts valid registration", () => {
    const result = registerSchema.safeParse({
      name: "Ana García",
      email: "ana@maatwork.com",
      password: "SecurePass123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing name", () => {
    const result = registerSchema.safeParse({
      email: "ana@maatwork.com",
      password: "SecurePass123",
    });
    expect(result.success).toBe(false);
  });
});

describe("calendarEventSchema", () => {
  it("accepts valid event", () => {
    const result = calendarEventSchema.safeParse({
      title: "Team meeting",
      startAt: "2026-03-10T10:00:00",
      endAt: "2026-03-10T11:00:00",
    });
    expect(result.success).toBe(true);
  });
});

describe("pipelineStageSchema", () => {
  it("accepts valid stage", () => {
    const result = pipelineStageSchema.safeParse({
      name: "Prospecto",
      order: 0,
      color: "#6366f1",
    });
    expect(result.success).toBe(true);
  });
});
