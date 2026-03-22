# MaatWork CRM - Sistema de Formularios

## Visión General

### Librerías

- **React Hook Form** - Manejo de formularios
- **Zod** - Validación de esquemas
- **@hookform/resolvers/zod** - Integración React Hook Form + Zod

### Componentes UI

Los componentes de formulario están en `src/components/ui/`:

| Componente | Archivo | Descripción |
|-----------|---------|-------------|
| `Input` | `input.tsx` | Campo de texto |
| `Select` | `select.tsx` | Lista desplegable |
| `Checkbox` | `checkbox.tsx` | Casilla de verificación |
| `Switch` | `switch.tsx` | Toggle |
| `Label` | `label.tsx` | Etiqueta de campo |
| `Textarea` | `textarea.tsx` | Campo de texto multilínea |

---

## INPUT

**Archivo:** `src/components/ui/input.tsx`

### Props

```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}
```

### Ejemplo de Uso

```tsx
import { Input } from "@/components/ui/input";
import { useForm } from 'react-hook-form';

// Con React Hook Form
<Input
  label="Email"
  type="email"
  placeholder="tu@email.com"
  {...register('email')}
  error={errors.email?.message}
/>

// Standalone
<Input
  label="Nombre"
  placeholder="Juan Pérez"
  value={name}
  onChange={(e) => setName(e.target.value)}
/>
```

---

## SELECT

**Archivo:** `src/components/ui/select.tsx`

### Props

```typescript
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}
```

### Ejemplo de Uso

```tsx
import { Select } from "@/components/ui/select";

<Select
  label="Estado"
  {...register('status')}
  error={errors.status?.message}
  options={[
    { value: 'active', label: 'Activo' },
    { value: 'inactive', label: 'Inactivo' },
  ]}
/>
```

---

## CHECKBOX

**Archivo:** `src/components/ui/checkbox.tsx`

### Props

```typescript
interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}
```

### Ejemplo de Uso

```tsx
import { Checkbox } from "@/components/ui/checkbox";

<Checkbox
  label="Acepto los términos"
  {...register('acceptTerms')}
/>
```

---

## SWITCH

**Archivo:** `src/components/ui/switch.tsx`

### Ejemplo de Uso

```tsx
import { Switch } from "@/components/ui/switch";

<Switch
  label="Notificaciones"
  checked={notifications}
  onCheckedChange={setNotifications}
/>
```

---

## TEXTAREA

**Archivo:** `src/components/ui/textarea.tsx`

### Ejemplo de Uso

```tsx
import { Textarea } from "@/components/ui/textarea";

<Textarea
  label="Descripción"
  placeholder="Escribe una descripción..."
  {...register('description')}
  error={errors.description?.message}
/>
```

---

## Form Validation

### Setup

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as React from 'react';

// Definir schema Zod
const contactSchema = z.object({
  name: z.string().min(2, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  company: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

// Usar en componente
function ContactForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    // Enviar data
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input
        label="Nombre"
        {...register('name')}
        error={errors.name?.message}
      />
      <Input
        label="Email"
        type="email"
        {...register('email')}
        error={errors.email?.message}
      />
      <Button type="submit" disabled={isSubmitting}>
        Guardar
      </Button>
    </form>
  );
}
```

---

## Esquemas Zod Comunes

```typescript
// Email
z.string().email('Email inválido')

// Requerido
z.string().min(1, 'Este campo es requerido')

// Mínimo longitud
z.string().min(3, 'Mínimo 3 caracteres')

// Número positivo
z.number().positive('Debe ser un número positivo')

// Enum
z.enum(['option1', 'option2', 'option3'])

// Optional
z.string().optional()

// Refinements
z.string().refine((val) => val.includes('@'), {
  message: 'Debe ser un email',
})
```

---

## Ejemplo: Formulario de Login

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/lib/auth-context';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Email o username es requerido'),
  password: z.string().min(1, 'Contraseña es requerida'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    await login(data.identifier, data.password);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Email o Username"
        placeholder="tu@email.com"
        {...register('identifier')}
        error={errors.identifier?.message}
      />

      <Input
        label="Contraseña"
        type="password"
        placeholder="••••••••"
        {...register('password')}
        error={errors.password?.message}
      />

      <Button type="submit" disabled={isSubmitting}>
        Iniciar Sesión
      </Button>
    </form>
  );
}
```

---

## Ejemplo: Formulario de Contacto

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

const contactSchema = z.object({
  name: z.string().min(2, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  company: z.string().optional(),
  segment: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

export function ContactForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Error al guardar');

      toast.success('Contacto guardado');
    } catch {
      toast.error('Error al guardar el contacto');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Nombre"
        placeholder="Juan Pérez"
        {...register('name')}
        error={errors.name?.message}
      />

      <Input
        label="Email"
        type="email"
        placeholder="juan@ejemplo.com"
        {...register('email')}
        error={errors.email?.message}
      />

      <Input
        label="Teléfono"
        type="tel"
        placeholder="+54 11 1234-5678"
        {...register('phone')}
      />

      <Input
        label="Empresa"
        placeholder="Empresa ABC"
        {...register('company')}
      />

      <Button type="submit" disabled={isSubmitting}>
        Guardar Contacto
      </Button>
    </form>
  );
}
```

---

## Integración con API

### Submit Handler Típico

```typescript
const onSubmit = async (data: ContactFormData) => {
  try {
    const response = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al guardar');
    }

    toast.success('Guardado correctamente');
    router.push('/contacts');
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Error');
  }
};
```
