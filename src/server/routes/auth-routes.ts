/**
 * Authentication API routes
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

// Request schemas
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const RegisterSchema = z.object({
  username: z.string().min(3).max(32),
  email: z.string().email(),
  password: z.string().min(6),
});

const UpdateUserSchema = z.object({
  username: z.string().min(3).max(32).optional(),
  email: z.string().email().optional(),
}).refine(data => data.username || data.email, {
  message: 'At least one field must be provided'
});

// In-memory user storage (TODO: Replace with database)
interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'developer' | 'admin';
  createdAt: string;
}

const users: Map<string, User> = new Map();
const sessions: Map<string, string> = new Map(); // sessionId -> userId

// Initialize with admin user
const adminPasswordHash = Buffer.from('admin123').toString('base64'); // Simple hash for demo
users.set('admin', {
  id: 'admin',
  username: 'admin',
  email: 'admin@example.com',
  passwordHash: adminPasswordHash,
  role: 'admin',
  createdAt: new Date().toISOString(),
});

// Helper functions
function hashPassword(password: string): string {
  return Buffer.from(password).toString('base64'); // Simple hash for demo
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function findUserByEmail(email: string): User | undefined {
  return Array.from(users.values()).find(u => u.email === email);
}

function findUserById(id: string): User | undefined {
  return users.get(id);
}

export async function registerAuthRoutes(
  fastify: FastifyInstance,
  options: { prefix?: string } = {}
): Promise<void> {
  const prefix = options.prefix || '/api/v1';

  // POST /auth/login - Login
  fastify.post<{ Body: z.infer<typeof LoginSchema> }>(
    `${prefix}/auth/login`,
    async (request, reply) => {
      try {
        const { email, password } = LoginSchema.parse(request.body);

        const user = findUserByEmail(email);
        if (!user || !verifyPassword(password, user.passwordHash)) {
          return reply.code(401).send({
            error: 'Invalid email or password',
          });
        }

        const token = generateToken();
        sessions.set(token, user.id);

        return {
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
          },
        };
      } catch (error) {
        fastify.log.error('Login error:', error);
        return reply.code(400).send({ error: 'Invalid request' });
      }
    }
  );

  // POST /auth/register - Register
  fastify.post<{ Body: z.infer<typeof RegisterSchema> }>(
    `${prefix}/auth/register`,
    async (request, reply) => {
      try {
        const data = RegisterSchema.parse(request.body);

        // Check if email already exists
        if (findUserByEmail(data.email)) {
          return reply.code(409).send({
            error: 'Email already registered',
          });
        }

        // Check if username already exists
        if (Array.from(users.values()).find(u => u.username === data.username)) {
          return reply.code(409).send({
            error: 'Username already taken',
          });
        }

        const userId = data.username;
        const user: User = {
          id: userId,
          username: data.username,
          email: data.email,
          passwordHash: hashPassword(data.password),
          role: 'user',
          createdAt: new Date().toISOString(),
        };

        users.set(userId, user);

        const token = generateToken();
        sessions.set(token, userId);

        return {
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
          },
        };
      } catch (error) {
        fastify.log.error('Register error:', error);
        return reply.code(400).send({ error: 'Invalid request' });
      }
    }
  );

  // POST /auth/logout - Logout
  fastify.post(
    `${prefix}/auth/logout`,
    async (request, reply) => {
      try {
        const token = request.headers.authorization?.replace('Bearer ', '');

        if (token) {
          sessions.delete(token);
        }

        return { message: 'Logged out successfully' };
      } catch (error) {
        fastify.log.error('Logout error:', error);
        return reply.code(400).send({ error: 'Invalid request' });
      }
    }
  );

  // GET /auth/whoami - Get current user
  fastify.get(
    `${prefix}/auth/whoami`,
    async (request, reply) => {
      try {
        const token = request.headers.authorization?.replace('Bearer ', '');

        if (!token) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        const userId = sessions.get(token);
        if (!userId) {
          return reply.code(401).send({ error: 'Invalid token' });
        }

        const user = findUserById(userId);
        if (!user) {
          return reply.code(404).send({ error: 'User not found' });
        }

        return {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        };
      } catch (error) {
        fastify.log.error('Whoami error:', error);
        return reply.code(400).send({ error: 'Invalid request' });
      }
    }
  );

  // PUT /auth/user - Update user
  fastify.put<{ Body: z.infer<typeof UpdateUserSchema> }>(
    `${prefix}/auth/user`,
    async (request, reply) => {
      try {
        const token = request.headers.authorization?.replace('Bearer ', '');

        if (!token) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        const userId = sessions.get(token);
        if (!userId) {
          return reply.code(401).send({ error: 'Invalid token' });
        }

        const user = findUserById(userId);
        if (!user) {
          return reply.code(404).send({ error: 'User not found' });
        }

        const data = UpdateUserSchema.parse(request.body);

        // Update user
        if (data.username) {
          user.username = data.username;
        }
        if (data.email) {
          user.email = data.email;
        }

        users.set(userId, user);

        return {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        };
      } catch (error) {
        fastify.log.error('Update user error:', error);
        return reply.code(400).send({ error: 'Invalid request' });
      }
    }
  );
}