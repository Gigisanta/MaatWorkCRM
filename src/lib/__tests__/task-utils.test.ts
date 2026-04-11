import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { taskSchema, TaskFormDataInput, TaskFormData } from '@/lib/utils/task-utils';

describe('taskSchema', () => {
  it('parses a valid minimal task (title only)', () => {
    const result = taskSchema.safeParse({ title: 'Revisar propuestas' });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.title).toBe('Revisar propuestas');
    expect(result.data.priority).toBe('medium');
    expect(result.data.description).toBeUndefined();
    expect(result.data.dueDate).toBeUndefined();
    expect(result.data.assignedTo).toBeUndefined();
    expect(result.data.contactId).toBeUndefined();
    expect(result.data.isRecurrent).toBe(false);
    expect(result.data.recurrenceRule).toBeUndefined();
  });

  it('parses a fully populated task', () => {
    const input = {
      title: 'Llamar cliente',
      description: 'Seguimiento del contrato',
      priority: 'high' as const,
      dueDate: '2026-04-15',
      assignedTo: 'user-42',
      contactId: 'contact-99',
      isRecurrent: true,
      recurrenceRule: 'weekly' as const,
    };
    const result = taskSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toEqual(input);
  });

  it('accepts all valid priority values', () => {
    for (const priority of ['low', 'medium', 'high', 'urgent'] as const) {
      const result = taskSchema.safeParse({ title: 'Tarea', priority });
      expect(result.success).toBe(true);
    }
  });

  it('accepts all valid recurrenceRule values', () => {
    for (const rule of ['daily', 'weekly', 'monthly'] as const) {
      const result = taskSchema.safeParse({ title: 'Tarea', isRecurrent: true, recurrenceRule: rule });
      expect(result.success).toBe(true);
    }
  });

  it('rejects a missing title', () => {
    const result = taskSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects an empty string title', () => {
    const result = taskSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });

  it('accepts a title that is only whitespace (schema min(1) does not trim)', () => {
    // z.string().min(1) only checks length, not content
    const result = taskSchema.safeParse({ title: '   ' });
    expect(result.success).toBe(true);
  });

  it('rejects a title longer than 200 characters', () => {
    const result = taskSchema.safeParse({ title: 'A'.repeat(201) });
    expect(result.success).toBe(false);
  });

  it('accepts a title at the 200-character boundary', () => {
    const result = taskSchema.safeParse({ title: 'A'.repeat(200) });
    expect(result.success).toBe(true);
  });

  it('rejects a description longer than 1000 characters', () => {
    const result = taskSchema.safeParse({ title: 'Tarea', description: 'X'.repeat(1001) });
    expect(result.success).toBe(false);
  });

  it('accepts a description at the 1000-character boundary', () => {
    const result = taskSchema.safeParse({ title: 'Tarea', description: 'X'.repeat(1000) });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid priority value', () => {
    // @ts-expect-error — intentionally passing an invalid value to test runtime validation
    const result = taskSchema.safeParse({ title: 'Tarea', priority: 'critical' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid recurrenceRule value', () => {
    // @ts-expect-error — intentionally passing an invalid value to test runtime validation
    const result = taskSchema.safeParse({ title: 'Tarea', isRecurrent: true, recurrenceRule: 'yearly' });
    expect(result.success).toBe(false);
  });

  it('treats null dueDate as valid optional', () => {
    const result = taskSchema.safeParse({ title: 'Tarea', dueDate: null });
    expect(result.success).toBe(true);
  });

  it('treats null assignedTo as valid optional', () => {
    const result = taskSchema.safeParse({ title: 'Tarea', assignedTo: null });
    expect(result.success).toBe(true);
  });

  it('treats null contactId as valid optional', () => {
    const result = taskSchema.safeParse({ title: 'Tarea', contactId: null });
    expect(result.success).toBe(true);
  });

  it('treats null recurrenceRule as valid optional when isRecurrent is true', () => {
    const result = taskSchema.safeParse({ title: 'Tarea', isRecurrent: true, recurrenceRule: null });
    expect(result.success).toBe(true);
  });

  it('applies default priority to undefined priority', () => {
    const result = taskSchema.safeParse({ title: 'Tarea' });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.priority).toBe('medium');
  });

  it('applies default isRecurrent to undefined', () => {
    const result = taskSchema.safeParse({ title: 'Tarea' });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.isRecurrent).toBe(false);
  });
});

describe('type exports', () => {
  it('TaskFormDataInput accepts optional fields as optional', () => {
    const input: TaskFormDataInput = { title: 'Test' };
    expect(input.title).toBe('Test');
  });

  it('TaskFormData has optional fields as optional', () => {
    const data: TaskFormData = { title: 'Test' };
    expect(data.title).toBe('Test');
  });
});

describe('createTask', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, 'fetch').mockClear();
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('calls POST /api/tasks with correct headers and body', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'task-new', title: 'Tarea nueva' }),
    } as unknown as Response);

    const { createTask } = await import('@/lib/task-utils');
    await createTask({ title: 'Tarea nueva' } as TaskFormData);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Tarea nueva' }),
    });
  });

  it('resolves with the parsed Task on success', async () => {
    const mockTask = {
      id: 'task-1',
      title: 'Tarea',
      description: null,
      status: 'pending',
      priority: 'medium',
      dueDate: null,
      assignedTo: null,
      assignedUser: null,
      contactId: null,
      contact: null,
      isRecurrent: false,
      recurrenceRule: null,
      completedAt: null,
      createdAt: '2026-04-08T10:00:00Z',
    };

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTask),
    } as unknown as Response);

    const { createTask } = await import('@/lib/task-utils');
    const result = await createTask({ title: 'Tarea' } as TaskFormData);
    expect(result).toEqual(mockTask);
  });

  it('throws Error with server error message on non-OK response', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'El título es requerido' }),
    } as unknown as Response);

    const { createTask } = await import('@/lib/task-utils');
    await expect(createTask({ title: '' } as TaskFormData)).rejects.toThrow('El título es requerido');
  });

  it('throws generic "Error al crear tarea" when server returns no error field', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    } as unknown as Response);

    const { createTask } = await import('@/lib/task-utils');
    await expect(createTask({ title: 'Tarea' } as TaskFormData)).rejects.toThrow('Error al crear tarea');
  });

  it('throws when fetch rejects (network error)', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('Network failure'));

    const { createTask } = await import('@/lib/task-utils');
    await expect(createTask({ title: 'Tarea' } as TaskFormData)).rejects.toThrow('Network failure');
  });
});

describe('updateTask', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, 'fetch').mockClear();
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('calls PUT /api/tasks/:id with correct id, method, headers and body', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'task-1', title: 'Actualizada' }),
    } as unknown as Response);

    const { updateTask } = await import('@/lib/task-utils');
    await updateTask('task-1', { title: 'Actualizada' });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith('/api/tasks/task-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Actualizada' }),
    });
  });

  it('resolves with the updated Task on success', async () => {
    const mockTask = {
      id: 'task-1',
      title: 'Tarea actualizada',
      description: null,
      status: 'in_progress',
      priority: 'high',
      dueDate: null,
      assignedTo: null,
      assignedUser: null,
      contactId: null,
      contact: null,
      isRecurrent: false,
      recurrenceRule: null,
      completedAt: null,
      createdAt: '2026-04-08T10:00:00Z',
    };

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTask),
    } as unknown as Response);

    const { updateTask } = await import('@/lib/task-utils');
    const result = await updateTask('task-1', { status: 'in_progress' as const, priority: 'high' as const });
    expect(result).toEqual(mockTask);
  });

  it('throws Error with server error message on non-OK response', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: 'Tarea no encontrada' }),
    } as unknown as Response);

    const { updateTask } = await import('@/lib/task-utils');
    await expect(updateTask('non-existent', {})).rejects.toThrow('Tarea no encontrada');
  });

  it('throws generic "Error al actualizar tarea" when server returns no error field', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    } as unknown as Response);

    const { updateTask } = await import('@/lib/task-utils');
    await expect(updateTask('task-1', { title: 'X' })).rejects.toThrow('Error al actualizar tarea');
  });

  it('throws when fetch rejects (network error)', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('Network failure'));

    const { updateTask } = await import('@/lib/task-utils');
    await expect(updateTask('task-1', {})).rejects.toThrow('Network failure');
  });

  it('correctly serializes a partial update (only changed fields)', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'task-1' }),
    } as unknown as Response);

    const { updateTask } = await import('@/lib/task-utils');
    await updateTask('task-1', { priority: 'urgent' as const });

    const call = fetchSpy.mock.calls[0];
    const parsedBody = JSON.parse(call[1].body as string);
    expect(parsedBody).toEqual({ priority: 'urgent' });
    expect(parsedBody.title).toBeUndefined();
  });
});
