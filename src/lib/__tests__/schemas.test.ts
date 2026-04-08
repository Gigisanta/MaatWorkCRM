import { describe, it, expect } from 'vitest';
import {
  contactCreateSchema,
  contactUpdateSchema,
  contactQuerySchema,
  dealCreateSchema,
  dealUpdateSchema,
  dealQuerySchema,
  taskStatusEnum,
  taskPriorityEnum,
  taskCreateSchema,
  taskUpdateSchema,
  taskQuerySchema,
  goalTypeEnum,
  goalStatusEnum,
  goalHealthEnum,
  goalPrivacyEnum,
  progressMethodEnum,
  userGoalCreateSchema,
  userGoalUpdateSchema,
  userGoalQuerySchema,
  metaVidaSchema,
  planInstrumentSchema,
  asignacionEstrategicaSchema,
  obligacionNegociableSchema,
  riesgoSchema,
  planningConfigSchema,
  planningIASchema,
  planningProyeccionSchema,
  financialPlanSchema,
  financialPlanUpdateSchema,
} from '../schemas';

// ============================================================
// Contact Schemas
// ============================================================

describe('contactCreateSchema', () => {
  it('parses valid contact data', () => {
    const result = contactCreateSchema.safeParse({
      organizationId: 'org_123',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+34 600 000 000',
      company: 'Acme Corp',
    });
    expect(result.success).toBe(true);
  });

  it('parses contact with only required fields', () => {
    const result = contactCreateSchema.safeParse({
      organizationId: 'org_123',
      name: 'John Doe',
    });
    expect(result.success).toBe(true);
  });

  it('fails when organizationId is empty', () => {
    const result = contactCreateSchema.safeParse({ name: 'John' });
    expect(result.success).toBe(false);
  });

  it('fails when name is empty', () => {
    const result = contactCreateSchema.safeParse({ organizationId: 'org_123', name: '' });
    expect(result.success).toBe(false);
  });

  it('fails when email format is invalid', () => {
    const result = contactCreateSchema.safeParse({
      organizationId: 'org_123',
      name: 'John Doe',
      email: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });

  it('accepts null email (optional)', () => {
    const result = contactCreateSchema.safeParse({
      organizationId: 'org_123',
      name: 'John Doe',
      email: null,
    });
    expect(result.success).toBe(true);
  });

  it('parses optional tagIds and tags arrays', () => {
    const result = contactCreateSchema.safeParse({
      organizationId: 'org_123',
      name: 'John Doe',
      tagIds: ['tag1', 'tag2'],
      tags: [{ name: 'VIP', color: '#ff0000', value: 1 }],
    });
    expect(result.success).toBe(true);
  });

  it('fails when tag name is empty string', () => {
    const result = contactCreateSchema.safeParse({
      organizationId: 'org_123',
      name: 'John',
      tags: [{ name: '' }],
    });
    expect(result.success).toBe(false);
  });
});

describe('contactUpdateSchema', () => {
  it('parses partial update with only name', () => {
    const result = contactUpdateSchema.safeParse({ name: 'Updated Name' });
    expect(result.success).toBe(true);
  });

  it('parses partial update with only email', () => {
    const result = contactUpdateSchema.safeParse({ email: 'new@example.com' });
    expect(result.success).toBe(true);
  });

  it('parses empty object (all fields optional)', () => {
    const result = contactUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('fails when name is empty string', () => {
    const result = contactUpdateSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('fails when email format is invalid', () => {
    const result = contactUpdateSchema.safeParse({ email: 'bad-email' });
    expect(result.success).toBe(false);
  });
});

describe('contactQuerySchema', () => {
  it('parses valid query with all optional filters', () => {
    const result = contactQuerySchema.safeParse({
      organizationId: 'org_123',
      stage: 'stage_1',
      segment: 'enterprise',
      assignedTo: 'user_1',
      search: 'john',
      page: 2,
      limit: 25,
    });
    expect(result.success).toBe(true);
  });

  it('applies default page and limit when not provided', () => {
    const result = contactQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(50);
    }
  });

  it('coerces string page and limit to numbers', () => {
    const result = contactQuerySchema.safeParse({ page: '3', limit: '10' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
      expect(result.data.limit).toBe(10);
    }
  });

  it('fails when page is zero', () => {
    const result = contactQuerySchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });

  it('fails when limit exceeds 100', () => {
    const result = contactQuerySchema.safeParse({ limit: 101 });
    expect(result.success).toBe(false);
  });

  it('fails when limit is negative', () => {
    const result = contactQuerySchema.safeParse({ limit: -5 });
    expect(result.success).toBe(false);
  });
});

// ============================================================
// Deal Schemas
// ============================================================

describe('dealCreateSchema', () => {
  it('parses valid deal data', () => {
    const result = dealCreateSchema.safeParse({
      organizationId: 'org_123',
      title: 'Big Sale',
      value: 10000,
      probability: 75,
      expectedCloseDate: '2026-12-31T00:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('parses deal with only required fields', () => {
    const result = dealCreateSchema.safeParse({
      organizationId: 'org_123',
      title: 'Small Deal',
    });
    expect(result.success).toBe(true);
  });

  it('applies default value and probability', () => {
    const result = dealCreateSchema.safeParse({
      organizationId: 'org_123',
      title: 'Deal',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.value).toBe(0);
      expect(result.data.probability).toBe(50);
    }
  });

  it('fails when organizationId is empty', () => {
    const result = dealCreateSchema.safeParse({ title: 'Deal' });
    expect(result.success).toBe(false);
  });

  it('fails when title is empty', () => {
    const result = dealCreateSchema.safeParse({
      organizationId: 'org_123',
      title: '',
    });
    expect(result.success).toBe(false);
  });

  it('fails when probability is negative', () => {
    const result = dealCreateSchema.safeParse({
      organizationId: 'org_123',
      title: 'Deal',
      probability: -10,
    });
    expect(result.success).toBe(false);
  });

  it('fails when probability exceeds 100', () => {
    const result = dealCreateSchema.safeParse({
      organizationId: 'org_123',
      title: 'Deal',
      probability: 101,
    });
    expect(result.success).toBe(false);
  });

  it('fails when probability is not an integer', () => {
    const result = dealCreateSchema.safeParse({
      organizationId: 'org_123',
      title: 'Deal',
      probability: 50.5,
    });
    expect(result.success).toBe(false);
  });

  it('fails when expectedCloseDate is not ISO datetime', () => {
    const result = dealCreateSchema.safeParse({
      organizationId: 'org_123',
      title: 'Deal',
      expectedCloseDate: '2026-12-31',
    });
    expect(result.success).toBe(false);
  });
});

describe('dealUpdateSchema', () => {
  it('parses partial update with only title', () => {
    const result = dealUpdateSchema.safeParse({ title: 'Updated Deal' });
    expect(result.success).toBe(true);
  });

  it('parses empty object', () => {
    const result = dealUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe('dealQuerySchema', () => {
  it('parses valid query with all filters', () => {
    const result = dealQuerySchema.safeParse({
      stageId: 'stage_1',
      contactId: 'contact_1',
      assignedTo: 'user_1',
      search: 'enterprise',
      page: 1,
      limit: 20,
      organizationId: 'org_123',
    });
    expect(result.success).toBe(true);
  });

  it('applies default page and limit', () => {
    const result = dealQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it('fails when limit exceeds 100', () => {
    const result = dealQuerySchema.safeParse({ limit: 200 });
    expect(result.success).toBe(false);
  });

  it('fails when page is zero', () => {
    const result = dealQuerySchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });
});

// ============================================================
// Task Schemas
// ============================================================

describe('taskStatusEnum', () => {
  it('parses valid status values', () => {
    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'] as const;
    for (const status of validStatuses) {
      const result = taskStatusEnum.safeParse(status);
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid status values', () => {
    const result = taskStatusEnum.safeParse('invalid');
    expect(result.success).toBe(false);
  });
});

describe('taskPriorityEnum', () => {
  it('parses valid priority values', () => {
    const validPriorities = ['low', 'medium', 'high', 'urgent'] as const;
    for (const priority of validPriorities) {
      const result = taskPriorityEnum.safeParse(priority);
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid priority values', () => {
    const result = taskPriorityEnum.safeParse('critical');
    expect(result.success).toBe(false);
  });
});

describe('taskCreateSchema', () => {
  it('parses valid task data', () => {
    const result = taskCreateSchema.safeParse({
      organizationId: 'org_123',
      title: 'Follow up call',
      description: 'Call the client next week',
      status: 'in_progress',
      priority: 'high',
      dueDate: '2026-12-31T00:00:00.000Z',
      isRecurrent: true,
      recurrenceRule: 'FREQ=WEEKLY',
    });
    expect(result.success).toBe(true);
  });

  it('parses task with only required fields', () => {
    const result = taskCreateSchema.safeParse({
      organizationId: 'org_123',
      title: 'Simple Task',
    });
    expect(result.success).toBe(true);
  });

  it('applies default status and priority', () => {
    const result = taskCreateSchema.safeParse({
      organizationId: 'org_123',
      title: 'Task',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('pending');
      expect(result.data.priority).toBe('medium');
      expect(result.data.isRecurrent).toBe(false);
    }
  });

  it('fails when organizationId is empty', () => {
    const result = taskCreateSchema.safeParse({ title: 'Task' });
    expect(result.success).toBe(false);
  });

  it('fails when title is empty', () => {
    const result = taskCreateSchema.safeParse({
      organizationId: 'org_123',
      title: '',
    });
    expect(result.success).toBe(false);
  });

  it('fails when title exceeds 255 characters', () => {
    const result = taskCreateSchema.safeParse({
      organizationId: 'org_123',
      title: 'a'.repeat(256),
    });
    expect(result.success).toBe(false);
  });

  it('fails when dueDate is not ISO datetime', () => {
    const result = taskCreateSchema.safeParse({
      organizationId: 'org_123',
      title: 'Task',
      dueDate: '2026-12-31',
    });
    expect(result.success).toBe(false);
  });
});

describe('taskUpdateSchema', () => {
  it('parses partial update with only status', () => {
    const result = taskUpdateSchema.safeParse({ status: 'completed' });
    expect(result.success).toBe(true);
  });

  it('parses empty object', () => {
    const result = taskUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe('taskQuerySchema', () => {
  it('parses valid query with all filters', () => {
    const result = taskQuerySchema.safeParse({
      status: 'pending',
      priority: 'high',
      assignedTo: 'user_1',
      contactId: 'contact_1',
      overdue: 'true',
      search: 'call',
      page: 1,
      limit: 20,
      organizationId: 'org_123',
    });
    expect(result.success).toBe(true);
  });

  it('applies default page and limit', () => {
    const result = taskQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it('fails when limit exceeds 100', () => {
    const result = taskQuerySchema.safeParse({ limit: 150 });
    expect(result.success).toBe(false);
  });

  it('fails when overdue value is not "true" or "false"', () => {
    const result = taskQuerySchema.safeParse({ overdue: 'maybe' });
    expect(result.success).toBe(false);
  });
});

// ============================================================
// Goal Schemas
// ============================================================

describe('goal enums', () => {
  it('goalTypeEnum accepts valid values', () => {
    const valid = ['new_aum', 'new_clients', 'meetings', 'revenue', 'custom'] as const;
    for (const v of valid) expect(goalTypeEnum.safeParse(v).success).toBe(true);
    expect(goalTypeEnum.safeParse('invalid').success).toBe(false);
  });

  it('goalStatusEnum accepts valid values', () => {
    const valid = ['draft', 'active', 'completed', 'missed', 'cancelled', 'archived'] as const;
    for (const v of valid) expect(goalStatusEnum.safeParse(v).success).toBe(true);
    expect(goalStatusEnum.safeParse('unknown').success).toBe(false);
  });

  it('goalHealthEnum accepts valid values', () => {
    const valid = ['on-track', 'at-risk', 'off-track', 'achieved'] as const;
    for (const v of valid) expect(goalHealthEnum.safeParse(v).success).toBe(true);
    expect(goalHealthEnum.safeParse('unknown').success).toBe(false);
  });

  it('goalPrivacyEnum accepts valid values', () => {
    const valid = ['private', 'team', 'company'] as const;
    for (const v of valid) expect(goalPrivacyEnum.safeParse(v).success).toBe(true);
    expect(goalPrivacyEnum.safeParse('public').success).toBe(false);
  });

  it('progressMethodEnum accepts valid values', () => {
    const valid = ['automatic', 'manual'] as const;
    for (const v of valid) expect(progressMethodEnum.safeParse(v).success).toBe(true);
    expect(progressMethodEnum.safeParse('automatic_manual').success).toBe(false);
  });
});

describe('userGoalCreateSchema', () => {
  it('parses valid goal data', () => {
    const result = userGoalCreateSchema.safeParse({
      title: 'Reach 1M AUM',
      type: 'new_aum',
      targetValue: 1_000_000,
      currentValue: 250_000,
      unit: 'EUR',
      period: '2026-04',
      status: 'active',
      health: 'on-track',
      privacy: 'team',
    });
    expect(result.success).toBe(true);
  });

  it('parses goal with only required fields', () => {
    const result = userGoalCreateSchema.safeParse({
      title: 'Quarterly Goal',
      type: 'revenue',
      targetValue: 50_000,
    });
    expect(result.success).toBe(true);
  });

  it('applies default currentValue, privacy, and progressMethod', () => {
    const result = userGoalCreateSchema.safeParse({
      title: 'Goal',
      type: 'meetings',
      targetValue: 20,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currentValue).toBe(0);
      expect(result.data.privacy).toBe('private');
      expect(result.data.progressMethod).toBe('manual');
      expect(result.data.status).toBe('active');
    }
  });

  it('fails when title is empty', () => {
    const result = userGoalCreateSchema.safeParse({ title: '', type: 'custom', targetValue: 10 });
    expect(result.success).toBe(false);
  });

  it('fails when title exceeds 255 characters', () => {
    const result = userGoalCreateSchema.safeParse({
      title: 'a'.repeat(256),
      type: 'custom',
      targetValue: 10,
    });
    expect(result.success).toBe(false);
  });

  it('fails when targetValue is negative', () => {
    const result = userGoalCreateSchema.safeParse({
      title: 'Goal',
      type: 'revenue',
      targetValue: -100,
    });
    expect(result.success).toBe(false);
  });

  it('fails when targetValue is zero', () => {
    const result = userGoalCreateSchema.safeParse({
      title: 'Goal',
      type: 'revenue',
      targetValue: 0,
    });
    expect(result.success).toBe(false);
  });

  it('fails when currentValue is negative', () => {
    const result = userGoalCreateSchema.safeParse({
      title: 'Goal',
      type: 'new_clients',
      targetValue: 10,
      currentValue: -5,
    });
    expect(result.success).toBe(false);
  });

  it('fails when month is out of range', () => {
    const result = userGoalCreateSchema.safeParse({
      title: 'Goal',
      type: 'meetings',
      targetValue: 10,
      month: 13,
    });
    expect(result.success).toBe(false);
  });

  it('fails when month is zero', () => {
    const result = userGoalCreateSchema.safeParse({
      title: 'Goal',
      type: 'meetings',
      targetValue: 10,
      month: 0,
    });
    expect(result.success).toBe(false);
  });

  it('fails when year is before 2020', () => {
    const result = userGoalCreateSchema.safeParse({
      title: 'Goal',
      type: 'revenue',
      targetValue: 10,
      year: 1999,
    });
    expect(result.success).toBe(false);
  });

  it('fails when startDate is not ISO datetime', () => {
    const result = userGoalCreateSchema.safeParse({
      title: 'Goal',
      type: 'revenue',
      targetValue: 10,
      startDate: '2026-01-01',
    });
    expect(result.success).toBe(false);
  });

  it('parses linkedDeals and linkedContacts arrays', () => {
    const result = userGoalCreateSchema.safeParse({
      title: 'Goal',
      type: 'new_aum',
      targetValue: 1000,
      linkedDeals: ['deal_1', 'deal_2'],
      linkedContacts: ['contact_1'],
    });
    expect(result.success).toBe(true);
  });
});

describe('userGoalUpdateSchema', () => {
  it('parses partial update with only currentValue', () => {
    const result = userGoalUpdateSchema.safeParse({ currentValue: 500 });
    expect(result.success).toBe(true);
  });

  it('parses empty object', () => {
    const result = userGoalUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe('userGoalQuerySchema', () => {
  it('parses valid query with all filters', () => {
    const result = userGoalQuerySchema.safeParse({
      status: 'active',
      type: 'revenue',
      period: '2026-04',
      teamGoalId: 'team_goal_1',
      health: 'on-track',
      page: 2,
      limit: 20,
    });
    expect(result.success).toBe(true);
  });

  it('applies default page and limit', () => {
    const result = userGoalQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it('fails when limit exceeds 100', () => {
    const result = userGoalQuerySchema.safeParse({ limit: 150 });
    expect(result.success).toBe(false);
  });

  it('fails when page is zero', () => {
    const result = userGoalQuerySchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });
});

// ============================================================
// Planning Schemas
// ============================================================

describe('metaVidaSchema', () => {
  it('parses valid meta vida', () => {
    const result = metaVidaSchema.safeParse({
      nombre: 'Casa propia',
      montoObjetivo: 100_000,
      fechaEstimada: '2030-06-15T00:00:00.000Z',
      prioridad: 'alta',
    });
    expect(result.success).toBe(true);
  });

  it('fails when nombre is empty', () => {
    const result = metaVidaSchema.safeParse({ nombre: '' });
    expect(result.success).toBe(false);
  });

  it('fails when montoObjetivo is negative', () => {
    const result = metaVidaSchema.safeParse({
      nombre: 'Meta',
      montoObjetivo: -5000,
    });
    expect(result.success).toBe(false);
  });

  it('fails when fechaEstimada is not ISO datetime', () => {
    const result = metaVidaSchema.safeParse({
      nombre: 'Meta',
      fechaEstimada: '2030-12-31',
    });
    expect(result.success).toBe(false);
  });
});

describe('planInstrumentSchema', () => {
  it('parses valid instrument', () => {
    const result = planInstrumentSchema.safeParse({
      nombre: 'VWCE',
      tipo: 'ETF',
      claseActivo: 'acciones',
      rendimientoEsperado: 7.5,
      participacion: 60,
    });
    expect(result.success).toBe(true);
  });

  it('fails when nombre is empty', () => {
    const result = planInstrumentSchema.safeParse({ nombre: '' });
    expect(result.success).toBe(false);
  });

  it('fails when participacion is negative', () => {
    const result = planInstrumentSchema.safeParse({
      nombre: 'Fondo',
      participacion: -10,
    });
    expect(result.success).toBe(false);
  });

  it('fails when participacion exceeds 100', () => {
    const result = planInstrumentSchema.safeParse({
      nombre: 'Fondo',
      participacion: 101,
    });
    expect(result.success).toBe(false);
  });
});

describe('asignacionEstrategicaSchema', () => {
  it('parses valid asignacion', () => {
    const result = asignacionEstrategicaSchema.safeParse({
      claseActivo: 'Renta Variable',
      porcentaje: 60,
      descripcion: 'Diversified global equities',
    });
    expect(result.success).toBe(true);
  });

  it('fails when claseActivo is empty', () => {
    const result = asignacionEstrategicaSchema.safeParse({ claseActivo: '', porcentaje: 40 });
    expect(result.success).toBe(false);
  });

  it('fails when porcentaje is negative', () => {
    const result = asignacionEstrategicaSchema.safeParse({
      claseActivo: 'Renta Variable',
      porcentaje: -5,
    });
    expect(result.success).toBe(false);
  });

  it('fails when porcentaje exceeds 100', () => {
    const result = asignacionEstrategicaSchema.safeParse({
      claseActivo: 'Renta Variable',
      porcentaje: 101,
    });
    expect(result.success).toBe(false);
  });
});

describe('obligacionNegociableSchema', () => {
  it('parses valid obligacion', () => {
    const result = obligacionNegociableSchema.safeParse({
      acreedor: 'Banco Santander',
      tipo: 'hipoteca',
      saldoPendiente: 150_000,
      tasaInteres: 2.5,
      cuotaMensual: 800,
      fechaVencimiento: '2035-01-01T00:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('fails when acreedor is empty', () => {
    const result = obligacionNegociableSchema.safeParse({ acreedor: '' });
    expect(result.success).toBe(false);
  });

  it('fails when fechaVencimiento is not ISO datetime', () => {
    const result = obligacionNegociableSchema.safeParse({
      acreedor: 'Bank',
      fechaVencimiento: '2035-01-01',
    });
    expect(result.success).toBe(false);
  });
});

describe('riesgoSchema', () => {
  it('parses valid riesgo', () => {
    const result = riesgoSchema.safeParse({
      nombre: 'Caida bolsa',
      tipo: 'mercado',
      probabilidad: 'media',
      impacto: 'alto',
      mitigacion: 'Diversificacion',
      severity: 'high',
    });
    expect(result.success).toBe(true);
  });

  it('fails when nombre is empty', () => {
    const result = riesgoSchema.safeParse({ nombre: '' });
    expect(result.success).toBe(false);
  });
});

describe('planningConfigSchema', () => {
  it('parses valid config', () => {
    const result = planningConfigSchema.safeParse({
      webUrl: 'https://example.com',
      asesorNombre: 'Carlos Garcia',
      asesorTelefono: '+34 600 000 000',
      colorPrincipal: '#8B5CF6',
      colorAcento: '#A78BFA',
      logoUrl: 'https://example.com/logo.png',
    });
    expect(result.success).toBe(true);
  });

  it('parses config with all optional fields null', () => {
    const result = planningConfigSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('fails when webUrl is not a valid URL', () => {
    const result = planningConfigSchema.safeParse({ webUrl: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('fails when logoUrl is not a valid URL', () => {
    // Zod url() accepts ftp, http, https, etc. Only fails on truly invalid URLs
    const result = planningConfigSchema.safeParse({ logoUrl: 'not-a-url' });
    expect(result.success).toBe(false);
  });
});

describe('planningIASchema', () => {
  it('parses valid IA config', () => {
    const result = planningIASchema.safeParse({
      terminoFinanciero: 'AUM',
      usarTerminoIA: true,
      consejoFinal: 'Mantenga su estrategia de diversificacion',
      usarConsejoIA: false,
    });
    expect(result.success).toBe(true);
  });

  it('applies default usarTerminoIA and usarConsejoIA', () => {
    const result = planningIASchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.usarTerminoIA).toBe(false);
      expect(result.data.usarConsejoIA).toBe(false);
    }
  });
});

describe('planningProyeccionSchema', () => {
  it('parses valid proyeccion', () => {
    const result = planningProyeccionSchema.safeParse({
      proyeccionRetiro: 'A los 65 anos con 1M EUR',
      gastosPrincipales: 'Hipoteca, educacion hijos',
      observaciones: 'Revisar anualmente',
    });
    expect(result.success).toBe(true);
  });

  it('parses empty object', () => {
    const result = planningProyeccionSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe('financialPlanSchema', () => {
  it('parses valid financial plan with all fields', () => {
    const result = financialPlanSchema.safeParse({
      edad: 35,
      profesion: 'Ingeniero',
      objetivo: 'Retiro anticipado',
      perfilRiesgo: 'Moderado',
      aporteMensual: 1000,
      aporteInicial: 10_000,
      horizonteMeses: 360,
      tipoAporte: 'mensual',
      ingresosMensuales: 5000,
      gastosMensuales: 3000,
      fondoEmergenciaMeses: 6,
      fondoEmergenciaActual: 15_000,
      patrimonioActivos: 200_000,
      patrimonioDeudas: 50_000,
      metasVida: [{ nombre: 'Casa propia', montoObjetivo: 300_000 }],
      instruments: [{ nombre: 'VWCE', tipo: 'ETF', participacion: 40 }],
      asignacionesEstrategicas: [{ claseActivo: 'Renta Variable', porcentaje: 70 }],
      obligacionesNegociables: [{ acreedor: 'Bank', tipo: 'hipoteca', saldoPendiente: 150_000 }],
      riesgos: [{ nombre: 'Caida markets', tipo: 'mercado', probabilidad: 'alta', impacto: 'alto' }],
      config: { asesorNombre: 'Carlos', colorPrincipal: '#8B5CF6' },
      ia: { terminoFinanciero: 'AUM', usarTerminoIA: true },
      proyeccion: { proyeccionRetiro: '1M a los 65' },
    });
    expect(result.success).toBe(true);
  });

  it('parses empty plan (all fields optional)', () => {
    const result = financialPlanSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('fails when edad is not a positive integer', () => {
    const result = financialPlanSchema.safeParse({ edad: 0.5 });
    expect(result.success).toBe(false);
  });

  it('fails when horizonteMeses is negative', () => {
    const result = financialPlanSchema.safeParse({ horizonteMeses: -12 });
    expect(result.success).toBe(false);
  });

  it('fails when tipoAporte has invalid value', () => {
    const result = financialPlanSchema.safeParse({ tipoAporte: 'biweekly' });
    expect(result.success).toBe(false);
  });

  it('fails when fondoEmergenciaMeses is negative', () => {
    const result = financialPlanSchema.safeParse({ fondoEmergenciaMeses: -1 });
    expect(result.success).toBe(false);
  });

  it('fails when patrimonioDeudas is negative', () => {
    const result = financialPlanSchema.safeParse({ patrimonioDeudas: -5000 });
    expect(result.success).toBe(false);
  });

  it('fails when perfilRiesgo has invalid value', () => {
    const result = financialPlanSchema.safeParse({ perfilRiesgo: 'Very Aggressive' });
    expect(result.success).toBe(false);
  });

  it('accepts valid perfilRiesgo values', () => {
    for (const perfil of ['Conservador', 'Moderado', 'Agresivo'] as const) {
      const result = financialPlanSchema.safeParse({ perfilRiesgo: perfil });
      expect(result.success).toBe(true);
    }
  });

  it('accepts all valid tipoAporte values', () => {
    for (const tipo of ['mensual', 'trimestral', 'anual', 'unico', 'semanal', 'quincenal'] as const) {
      const result = financialPlanSchema.safeParse({ tipoAporte: tipo });
      expect(result.success).toBe(true);
    }
  });

  it('parses valid nested arrays', () => {
    const result = financialPlanSchema.safeParse({
      metasVida: [
        { nombre: 'Casa', montoObjetivo: 300_000 },
        { nombre: 'Coche', montoObjetivo: 30_000 },
      ],
      instruments: [
        { nombre: 'ETF1', participacion: 50 },
        { nombre: 'ETF2', participacion: 50 },
      ],
    });
    expect(result.success).toBe(true);
  });
});

describe('financialPlanUpdateSchema', () => {
  it('parses partial update with only edad', () => {
    const result = financialPlanUpdateSchema.safeParse({ edad: 40 });
    expect(result.success).toBe(true);
  });

  it('parses empty object', () => {
    const result = financialPlanUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('fails when edad is not positive integer', () => {
    const result = financialPlanUpdateSchema.safeParse({ edad: 0 });
    expect(result.success).toBe(false);
  });
});
