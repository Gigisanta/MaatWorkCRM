// Error message constants to avoid duplication across routes

export const ERROR_MESSAGES = {
  // Auth
  UNAUTHORIZED: 'Unauthorized',
  INVALID_CREDENTIALS: 'Credenciales inválidas',

  // Validation
  MISSING_FIELDS: 'Todos los campos son requeridos',
  INVALID_EMAIL: 'Email inválido',
  INVALID_ID: 'ID inválido',
  WEAK_PASSWORD: 'La contraseña debe tener al menos 6 caracteres',

  // Not found
  NOT_FOUND: ' no encontrado',
  USER_NOT_FOUND: 'Usuario no encontrado',
  CONTACT_NOT_FOUND: 'Contacto no encontrado',
  ORGANIZATION_NOT_FOUND: 'Organización no encontrada',
  TEAM_NOT_FOUND: 'Equipo no encontrado',

  // Forbidden
  FORBIDDEN: 'No tienes acceso a esta organización',
  INSUFFICIENT_PERMISSIONS: 'Permisos insuficientes',

  // Server errors
  INTERNAL_ERROR: 'Error interno del servidor',
  UNEXPECTED_ERROR: 'An unexpected error occurred',

  // Auth UI
  LOGIN_ERROR: 'Error al iniciar sesión',
  REGISTER_ERROR: 'Error al crear cuenta',

  // Tasks
  CREATE_TASK_ERROR: 'Error al crear tarea',
  UPDATE_TASK_ERROR: 'Error al actualizar tarea',
} as const;

// Helper to create "not found" message with entity name
export function notFound(entity: string): string {
  return `${entity}${ERROR_MESSAGES.NOT_FOUND}`;
}
