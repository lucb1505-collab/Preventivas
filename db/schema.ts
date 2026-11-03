import { pgTable, text, integer, jsonb } from 'drizzle-orm/pg-core';
export const operationState = pgTable('operation_state', {
  id: text().primaryKey(),
  equipmentList: jsonb('equipment_list').notNull(),
  logs: jsonb().notNull(),
  revision: integer().notNull().default(0),
});
