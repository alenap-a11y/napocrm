ALTER TABLE seances 
  ALTER COLUMN tags TYPE text[] USING tags::text[];
