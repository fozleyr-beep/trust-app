CREATE TABLE "match_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"candidate_user_id" uuid,
	"label" text NOT NULL,
	"context" text NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'suggested' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salaam_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_suggestion_id" uuid,
	"requester_id" uuid NOT NULL,
	"recipient_id" uuid NOT NULL,
	"requester_status" text DEFAULT 'accepted' NOT NULL,
	"recipient_status" text DEFAULT 'pending' NOT NULL,
	"status" text DEFAULT 'requested' NOT NULL,
	"thread_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text DEFAULT 'seeker' NOT NULL,
	"readiness" text DEFAULT 'needs_intake' NOT NULL,
	"location" text,
	"intent" text,
	"family_context" text,
	"preferences" text,
	"privacy_consent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "thread_members" ADD COLUMN "role" text DEFAULT 'participant' NOT NULL;--> statement-breakpoint
ALTER TABLE "match_suggestions" ADD CONSTRAINT "match_suggestions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_suggestions" ADD CONSTRAINT "match_suggestions_candidate_user_id_users_id_fk" FOREIGN KEY ("candidate_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salaam_requests" ADD CONSTRAINT "salaam_requests_match_suggestion_id_match_suggestions_id_fk" FOREIGN KEY ("match_suggestion_id") REFERENCES "public"."match_suggestions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salaam_requests" ADD CONSTRAINT "salaam_requests_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salaam_requests" ADD CONSTRAINT "salaam_requests_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salaam_requests" ADD CONSTRAINT "salaam_requests_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_profiles" ADD CONSTRAINT "service_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "match_suggestions_user_status_idx" ON "match_suggestions" USING btree ("user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "match_suggestions_user_candidate_idx" ON "match_suggestions" USING btree ("user_id","candidate_user_id");--> statement-breakpoint
CREATE INDEX "salaam_requests_requester_status_idx" ON "salaam_requests" USING btree ("requester_id","status");--> statement-breakpoint
CREATE INDEX "salaam_requests_recipient_status_idx" ON "salaam_requests" USING btree ("recipient_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "salaam_requests_match_idx" ON "salaam_requests" USING btree ("match_suggestion_id");--> statement-breakpoint
CREATE UNIQUE INDEX "service_profiles_user_idx" ON "service_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "service_profiles_readiness_idx" ON "service_profiles" USING btree ("readiness");