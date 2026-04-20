import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  workspaceName: z
    .string()
    .min(1, 'Workspace name is required')
    .max(100, 'Workspace name is too long'),
})

export const workspaceUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
    .optional(),
})

export const brandPresetSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  channelName: z.string().max(100).optional(),
  primaryColor: z.string().regex(/^#[A-Fa-f0-9]{6}$/, 'Must be a valid hex color'),
  secondaryColor: z.string().regex(/^#[A-Fa-f0-9]{6}$/, 'Must be a valid hex color'),
  logoUrl: z.string().url().optional(),
  defaultLanguage: z.enum(['en', 'es', 'pt', 'ru']),
  defaultVoice: z.string().optional(),
  isDefault: z.boolean().default(false),
})
