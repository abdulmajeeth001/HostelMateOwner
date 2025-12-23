CREATE TABLE "electricity_billing_cycles" (
	"id" serial PRIMARY KEY NOT NULL,
	"pg_id" integer NOT NULL,
	"owner_id" integer NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"billing_month" text NOT NULL,
	"invoice_number" text,
	"total_amount" numeric(10, 2) DEFAULT '0',
	"status" text DEFAULT 'draft',
	"confirmed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "electricity_room_bills" (
	"id" serial PRIMARY KEY NOT NULL,
	"cycle_id" integer NOT NULL,
	"room_id" integer NOT NULL,
	"pg_id" integer NOT NULL,
	"meter_number" text,
	"previous_reading" numeric(10, 2),
	"current_reading" numeric(10, 2) NOT NULL,
	"units_consumed" numeric(10, 2) NOT NULL,
	"room_amount" numeric(10, 2) NOT NULL,
	"rate_per_unit" numeric(10, 4),
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "electricity_tenant_charges" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_bill_id" integer NOT NULL,
	"cycle_id" integer NOT NULL,
	"tenant_id" integer NOT NULL,
	"owner_id" integer NOT NULL,
	"pg_id" integer NOT NULL,
	"share_amount" numeric(10, 2) NOT NULL,
	"due_date" timestamp,
	"payment_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "onboarding_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_user_id" integer NOT NULL,
	"visit_request_id" integer,
	"pg_id" integer NOT NULL,
	"room_id" integer NOT NULL,
	"owner_id" integer NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"monthly_rent" numeric(10, 2) NOT NULL,
	"tenant_image" text,
	"aadhar_card" text,
	"emergency_contact_name" text,
	"emergency_contact_phone" text,
	"emergency_contact_relationship" text,
	"status" text DEFAULT 'pending',
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now(),
	"approved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "pg_ratings" (
	"id" serial PRIMARY KEY NOT NULL,
	"pg_id" integer NOT NULL,
	"tenant_user_id" integer NOT NULL,
	"rating" integer NOT NULL,
	"review" text,
	"cleanliness" integer,
	"safety" integer,
	"facilities" integer,
	"value_for_money" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pg_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"pg_id" integer NOT NULL,
	"plan_id" integer NOT NULL,
	"owner_id" integer NOT NULL,
	"billing_cycle" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" text DEFAULT 'pending',
	"payment_method" text,
	"transaction_id" text,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"paid_at" timestamp,
	"invoice_url" text,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subscription_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"monthly_price" numeric(10, 2) NOT NULL,
	"yearly_price" numeric(10, 2),
	"max_rooms" integer,
	"max_tenants" integer,
	"features" text[] DEFAULT '{}',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tenant_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_user_id" integer NOT NULL,
	"pg_id" integer,
	"room_id" integer,
	"room_number" text,
	"move_in_date" timestamp NOT NULL,
	"move_out_date" timestamp NOT NULL,
	"owner_feedback" text,
	"rating" integer,
	"behavior_tags" text[] DEFAULT '{}',
	"recorded_by_owner_id" integer NOT NULL,
	"verification_status" text DEFAULT 'verified',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "visit_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_user_id" integer NOT NULL,
	"pg_id" integer NOT NULL,
	"room_id" integer,
	"owner_id" integer NOT NULL,
	"requested_date" timestamp NOT NULL,
	"requested_time" text NOT NULL,
	"status" text DEFAULT 'pending',
	"rescheduled_date" timestamp,
	"rescheduled_time" text,
	"rescheduled_by" text,
	"confirmed_date" timestamp,
	"confirmed_time" text,
	"notes" text,
	"owner_notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "payment_month" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "generated_at" timestamp;--> statement-breakpoint
ALTER TABLE "pg_master" ADD COLUMN "status" text DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "pg_master" ADD COLUMN "approved_by" integer;--> statement-breakpoint
ALTER TABLE "pg_master" ADD COLUMN "approved_at" timestamp;--> statement-breakpoint
ALTER TABLE "pg_master" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "pg_master" ADD COLUMN "is_active" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "pg_master" ADD COLUMN "subscription_status" text DEFAULT 'trial';--> statement-breakpoint
ALTER TABLE "pg_master" ADD COLUMN "subscription_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "pg_master" ADD COLUMN "last_payment_generated_at" timestamp;--> statement-breakpoint
ALTER TABLE "pg_master" ADD COLUMN "last_payment_generated_month" text;--> statement-breakpoint
ALTER TABLE "pg_master" ADD COLUMN "pg_type" text DEFAULT 'common';--> statement-breakpoint
ALTER TABLE "pg_master" ADD COLUMN "has_food" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "pg_master" ADD COLUMN "has_parking" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "pg_master" ADD COLUMN "has_ac" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "pg_master" ADD COLUMN "has_cctv" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "pg_master" ADD COLUMN "has_wifi" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "pg_master" ADD COLUMN "has_laundry" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "pg_master" ADD COLUMN "has_gym" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "pg_master" ADD COLUMN "average_rating" numeric(3, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "pg_master" ADD COLUMN "total_ratings" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "meter_number" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "room_id" integer;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "onboarding_status" text DEFAULT 'not_onboarded';--> statement-breakpoint
ALTER TABLE "electricity_billing_cycles" ADD CONSTRAINT "electricity_billing_cycles_pg_id_pg_master_id_fk" FOREIGN KEY ("pg_id") REFERENCES "public"."pg_master"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "electricity_billing_cycles" ADD CONSTRAINT "electricity_billing_cycles_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "electricity_room_bills" ADD CONSTRAINT "electricity_room_bills_cycle_id_electricity_billing_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."electricity_billing_cycles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "electricity_room_bills" ADD CONSTRAINT "electricity_room_bills_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "electricity_room_bills" ADD CONSTRAINT "electricity_room_bills_pg_id_pg_master_id_fk" FOREIGN KEY ("pg_id") REFERENCES "public"."pg_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "electricity_tenant_charges" ADD CONSTRAINT "electricity_tenant_charges_room_bill_id_electricity_room_bills_id_fk" FOREIGN KEY ("room_bill_id") REFERENCES "public"."electricity_room_bills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "electricity_tenant_charges" ADD CONSTRAINT "electricity_tenant_charges_cycle_id_electricity_billing_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."electricity_billing_cycles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "electricity_tenant_charges" ADD CONSTRAINT "electricity_tenant_charges_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "electricity_tenant_charges" ADD CONSTRAINT "electricity_tenant_charges_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "electricity_tenant_charges" ADD CONSTRAINT "electricity_tenant_charges_pg_id_pg_master_id_fk" FOREIGN KEY ("pg_id") REFERENCES "public"."pg_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "electricity_tenant_charges" ADD CONSTRAINT "electricity_tenant_charges_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_requests" ADD CONSTRAINT "onboarding_requests_tenant_user_id_users_id_fk" FOREIGN KEY ("tenant_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_requests" ADD CONSTRAINT "onboarding_requests_visit_request_id_visit_requests_id_fk" FOREIGN KEY ("visit_request_id") REFERENCES "public"."visit_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_requests" ADD CONSTRAINT "onboarding_requests_pg_id_pg_master_id_fk" FOREIGN KEY ("pg_id") REFERENCES "public"."pg_master"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_requests" ADD CONSTRAINT "onboarding_requests_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_requests" ADD CONSTRAINT "onboarding_requests_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pg_ratings" ADD CONSTRAINT "pg_ratings_pg_id_pg_master_id_fk" FOREIGN KEY ("pg_id") REFERENCES "public"."pg_master"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pg_ratings" ADD CONSTRAINT "pg_ratings_tenant_user_id_users_id_fk" FOREIGN KEY ("tenant_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pg_subscriptions" ADD CONSTRAINT "pg_subscriptions_pg_id_pg_master_id_fk" FOREIGN KEY ("pg_id") REFERENCES "public"."pg_master"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pg_subscriptions" ADD CONSTRAINT "pg_subscriptions_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pg_subscriptions" ADD CONSTRAINT "pg_subscriptions_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_history" ADD CONSTRAINT "tenant_history_tenant_user_id_users_id_fk" FOREIGN KEY ("tenant_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_history" ADD CONSTRAINT "tenant_history_pg_id_pg_master_id_fk" FOREIGN KEY ("pg_id") REFERENCES "public"."pg_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_history" ADD CONSTRAINT "tenant_history_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_history" ADD CONSTRAINT "tenant_history_recorded_by_owner_id_users_id_fk" FOREIGN KEY ("recorded_by_owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visit_requests" ADD CONSTRAINT "visit_requests_tenant_user_id_users_id_fk" FOREIGN KEY ("tenant_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visit_requests" ADD CONSTRAINT "visit_requests_pg_id_pg_master_id_fk" FOREIGN KEY ("pg_id") REFERENCES "public"."pg_master"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visit_requests" ADD CONSTRAINT "visit_requests_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visit_requests" ADD CONSTRAINT "visit_requests_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pg_master" ADD CONSTRAINT "pg_master_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;