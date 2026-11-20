ALTER TABLE `tasks` ADD `repeat_weekly` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` ADD `repeat_until` text;