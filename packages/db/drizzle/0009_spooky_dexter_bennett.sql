ALTER TABLE "desktops" DROP CONSTRAINT "desktops_owner_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "desktops" ADD CONSTRAINT "desktops_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;