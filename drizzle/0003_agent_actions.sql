CREATE TABLE "agent_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"key" text NOT NULL,
	"agent" text NOT NULL,
	"status" text DEFAULT 'ready' NOT NULL,
	"action" text NOT NULL,
	"subject" text,
	"detail" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_actions" ADD CONSTRAINT "agent_actions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "agent_actions_user_key_idx" ON "agent_actions" USING btree ("user_id","key");--> statement-breakpoint
CREATE INDEX "agent_actions_user_created_idx" ON "agent_actions" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "agent_actions_agent_status_idx" ON "agent_actions" USING btree ("agent","status");