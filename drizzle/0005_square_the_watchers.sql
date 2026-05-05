CREATE TABLE "audit_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"agent" text NOT NULL,
	"action" text NOT NULL,
	"tag" text NOT NULL,
	"state" text DEFAULT 'done' NOT NULL,
	"prompt_hash" text,
	"response_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consent_grant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"seeker_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "donation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"amount_cents" integer NOT NULL,
	"occasion" text DEFAULT 'nikah_blessing' NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_link" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inviter_id" uuid NOT NULL,
	"observer_id" uuid NOT NULL,
	"role" text DEFAULT 'read_only' NOT NULL,
	"accepted_at" timestamp with time zone,
	"stepped_back_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interest" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_id" uuid NOT NULL,
	"to_id" uuid NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"passed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sabr_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"classifier" text NOT NULL,
	"confidence" numeric(3, 2),
	"action" text NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"decision" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salaam_quota" (
	"user_id" uuid NOT NULL,
	"week_start" date NOT NULL,
	"sent_count" smallint DEFAULT 0 NOT NULL,
	CONSTRAINT "salaam_quota_user_id_week_start_pk" PRIMARY KEY("user_id","week_start")
);
--> statement-breakpoint
CREATE TABLE "wali_digest" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"observer_id" uuid NOT NULL,
	"written_at" timestamp with time zone DEFAULT now() NOT NULL,
	"body" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wali_note" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_link_id" uuid NOT NULL,
	"from_id" uuid NOT NULL,
	"to_id" uuid NOT NULL,
	"ciphertext" "bytea" NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "threads" ADD COLUMN "handoff_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "threads" ADD COLUMN "mediator" text DEFAULT 'adil' NOT NULL;--> statement-breakpoint
ALTER TABLE "threads" ADD COLUMN "sabr_status" text DEFAULT 'normal' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" text DEFAULT 'seeker' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "layer_public" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "layer_gated" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "layer_family" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "verification" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "preferences" jsonb;--> statement-breakpoint
ALTER TABLE "audit_event" ADD CONSTRAINT "audit_event_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_grant" ADD CONSTRAINT "consent_grant_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_grant" ADD CONSTRAINT "consent_grant_seeker_id_users_id_fk" FOREIGN KEY ("seeker_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donation" ADD CONSTRAINT "donation_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_link" ADD CONSTRAINT "family_link_inviter_id_users_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_link" ADD CONSTRAINT "family_link_observer_id_users_id_fk" FOREIGN KEY ("observer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interest" ADD CONSTRAINT "interest_from_id_users_id_fk" FOREIGN KEY ("from_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interest" ADD CONSTRAINT "interest_to_id_users_id_fk" FOREIGN KEY ("to_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sabr_event" ADD CONSTRAINT "sabr_event_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sabr_event" ADD CONSTRAINT "sabr_event_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salaam_quota" ADD CONSTRAINT "salaam_quota_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wali_digest" ADD CONSTRAINT "wali_digest_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wali_digest" ADD CONSTRAINT "wali_digest_observer_id_users_id_fk" FOREIGN KEY ("observer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wali_note" ADD CONSTRAINT "wali_note_family_link_id_family_link_id_fk" FOREIGN KEY ("family_link_id") REFERENCES "public"."family_link"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wali_note" ADD CONSTRAINT "wali_note_from_id_users_id_fk" FOREIGN KEY ("from_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wali_note" ADD CONSTRAINT "wali_note_to_id_users_id_fk" FOREIGN KEY ("to_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_event_user_created_idx" ON "audit_event" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_event_agent_tag_idx" ON "audit_event" USING btree ("agent","tag");--> statement-breakpoint
CREATE INDEX "consent_grant_thread_seeker_kind_idx" ON "consent_grant" USING btree ("thread_id","seeker_id","kind");--> statement-breakpoint
CREATE INDEX "donation_user_sent_idx" ON "donation" USING btree ("user_id","sent_at");--> statement-breakpoint
CREATE UNIQUE INDEX "family_link_inviter_observer_idx" ON "family_link" USING btree ("inviter_id","observer_id");--> statement-breakpoint
CREATE INDEX "family_link_observer_idx" ON "family_link" USING btree ("observer_id");--> statement-breakpoint
CREATE INDEX "interest_from_idx" ON "interest" USING btree ("from_id","sent_at");--> statement-breakpoint
CREATE INDEX "interest_to_idx" ON "interest" USING btree ("to_id","sent_at");--> statement-breakpoint
CREATE INDEX "sabr_event_thread_created_idx" ON "sabr_event" USING btree ("thread_id","created_at");--> statement-breakpoint
CREATE INDEX "sabr_event_classifier_idx" ON "sabr_event" USING btree ("classifier");--> statement-breakpoint
CREATE INDEX "wali_digest_observer_thread_idx" ON "wali_digest" USING btree ("observer_id","thread_id");--> statement-breakpoint
CREATE INDEX "wali_note_family_sent_idx" ON "wali_note" USING btree ("family_link_id","sent_at");