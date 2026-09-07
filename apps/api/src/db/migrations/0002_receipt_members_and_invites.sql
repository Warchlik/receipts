-- Restructure user_receipts into receipt_members: synthetic uuid PK instead of
-- the composite (user_id, receipt_id) PK, nullable user_id, and a new guest_name
-- column so a receipt member can be a guest (no auth account) instead of a user.
ALTER TABLE "user_receipts" RENAME TO "receipt_members";--> statement-breakpoint
ALTER TABLE "receipt_members" DROP CONSTRAINT "user_receipts_user_id_receipt_id_pk";--> statement-breakpoint
ALTER TABLE "receipt_members" ADD COLUMN "id" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "receipt_members" ADD COLUMN "guest_name" text;--> statement-breakpoint
ALTER TABLE "receipt_members" ADD COLUMN "invited_by" text;--> statement-breakpoint
UPDATE "receipt_members" SET "invited_by" = "user_id" WHERE "invited_by" IS NULL;--> statement-breakpoint
ALTER TABLE "receipt_members" ALTER COLUMN "invited_by" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "receipt_members" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "receipt_members" RENAME CONSTRAINT "user_receipts_user_id_user_id_fk" TO "receipt_members_user_id_user_id_fk";--> statement-breakpoint
ALTER TABLE "receipt_members" RENAME CONSTRAINT "user_receipts_receipt_id_receipts_id_fk" TO "receipt_members_receipt_id_receipts_id_fk";--> statement-breakpoint
ALTER TABLE "receipt_members" ADD CONSTRAINT "receipt_members_invited_by_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipt_members" ADD CONSTRAINT "receipt_members_pkey" PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "receipt_members" ADD CONSTRAINT "receipt_members_user_xor_guest" CHECK (("user_id" IS NOT NULL AND "guest_name" IS NULL) OR ("user_id" IS NULL AND "guest_name" IS NOT NULL));--> statement-breakpoint
CREATE UNIQUE INDEX "receipt_members_receipt_user_unique" ON "receipt_members" USING btree ("receipt_id","user_id") WHERE "receipt_members"."user_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "receipt_members_receipt_guest_unique" ON "receipt_members" USING btree ("receipt_id",lower("guest_name")) WHERE "receipt_members"."guest_name" IS NOT NULL;--> statement-breakpoint
CREATE TABLE "receipt_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"receipt_id" uuid NOT NULL,
	"member_id" uuid,
	"token" text NOT NULL,
	"created_by" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "receipt_invites_token_unique" UNIQUE("token")
);--> statement-breakpoint
ALTER TABLE "receipt_invites" ADD CONSTRAINT "receipt_invites_receipt_id_receipts_id_fk" FOREIGN KEY ("receipt_id") REFERENCES "public"."receipts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipt_invites" ADD CONSTRAINT "receipt_invites_member_id_receipt_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."receipt_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipt_invites" ADD CONSTRAINT "receipt_invites_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
