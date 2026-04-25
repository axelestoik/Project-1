
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const organizations = sqliteTable('organizations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});
