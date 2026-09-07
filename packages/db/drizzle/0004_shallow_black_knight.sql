CREATE TABLE "desktop_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"desktop_id" uuid NOT NULL,
	"folder_id" uuid,
	"file_id" uuid,
	"x" bigint DEFAULT 24 NOT NULL,
	"y" bigint DEFAULT 24 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "desktop_items_folder_unique" UNIQUE("folder_id"),
	CONSTRAINT "desktop_items_file_unique" UNIQUE("file_id")
);
--> statement-breakpoint
ALTER TABLE "desktops" ALTER COLUMN "settings" SET DEFAULT '{"theme":{"backgroundColor":"#245edb","accentColor":"#ffffff","windowStyle":"classic","windowOpacity":0.95,"taskbarStyle":"classic","taskbarPosition":"bottom","iconStyle":"classic","font":"system"},"layout":{"iconSize":"medium","iconSpacing":"wide","iconLabelPosition":"below","showTaskbar":true,"showClock":true,"showCollaborators":true}}'::jsonb;--> statement-breakpoint
ALTER TABLE "desktop_items" ADD CONSTRAINT "desktop_items_desktop_id_desktops_id_fk" FOREIGN KEY ("desktop_id") REFERENCES "public"."desktops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "desktop_items" ADD CONSTRAINT "desktop_items_folder_id_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."folders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "desktop_items" ADD CONSTRAINT "desktop_items_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "desktop_items_desktop_id_idx" ON "desktop_items" USING btree ("desktop_id");--> statement-breakpoint
CREATE INDEX "desktop_items_folder_id_idx" ON "desktop_items" USING btree ("folder_id");--> statement-breakpoint
CREATE INDEX "desktop_items_file_id_idx" ON "desktop_items" USING btree ("file_id");