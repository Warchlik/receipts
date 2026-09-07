CREATE TYPE "public"."split_type" AS ENUM('equal', 'manual', 'itemized');--> statement-breakpoint
CREATE TABLE "expense_splits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expense_id" uuid NOT NULL,
	"member_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "receipts" ADD COLUMN "split_type" "split_type" DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "title" text NOT NULL DEFAULT 'Wydatek';--> statement-breakpoint
ALTER TABLE "expenses" ALTER COLUMN "title" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "receipt_members" ADD COLUMN "amount_owed_override" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "expense_splits" ADD CONSTRAINT "expense_splits_expense_id_expenses_id_fk" FOREIGN KEY ("expense_id") REFERENCES "public"."expenses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_splits" ADD CONSTRAINT "expense_splits_member_id_receipt_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."receipt_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "expense_splits_expense_member_unique" ON "expense_splits" USING btree ("expense_id","member_id");