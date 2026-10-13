-- Add language support to site settings
ALTER TABLE form_settings ADD COLUMN language TEXT DEFAULT 'en';
