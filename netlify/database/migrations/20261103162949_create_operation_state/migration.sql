CREATE TABLE "operation_state" (
	"id" text PRIMARY KEY,
	"equipment_list" jsonb NOT NULL,
	"logs" jsonb NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL
);
