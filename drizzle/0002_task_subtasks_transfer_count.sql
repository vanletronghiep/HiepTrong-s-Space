ALTER TABLE `tasks` ADD `subtasks` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` ADD `transfer_count` integer DEFAULT 0 NOT NULL;