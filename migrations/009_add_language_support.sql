-- Add language support to form_settings table
ALTER TABLE form_settings ADD COLUMN language TEXT DEFAULT 'en';

-- Add German language fields
ALTER TABLE form_settings ADD COLUMN nameLabel_de TEXT DEFAULT 'Vollständiger Name';
ALTER TABLE form_settings ADD COLUMN emailLabel_de TEXT DEFAULT 'E-Mail';
ALTER TABLE form_settings ADD COLUMN attendanceQuestion_de TEXT DEFAULT 'Wirst du kommen?';
ALTER TABLE form_settings ADD COLUMN additionalGuestsLabel_de TEXT DEFAULT 'Anzahl zusätzlicher Gäste';
ALTER TABLE form_settings ADD COLUMN vegetarianQuestion_de TEXT DEFAULT 'Bist du Vegetarier?';
ALTER TABLE form_settings ADD COLUMN foodAllergiesLabel_de TEXT DEFAULT 'Irgendwelche Lebensmittelallergien?';
ALTER TABLE form_settings ADD COLUMN lodgingQuestion_de TEXT DEFAULT 'Planst du in der Unterkunft zu bleiben?';
ALTER TABLE form_settings ADD COLUMN transportQuestion_de TEXT DEFAULT 'Planst du, den Transport zu und von unserer Unterkunft zu nutzen?';
ALTER TABLE form_settings ADD COLUMN songRequestLabel_de TEXT DEFAULT 'Welches Lied bringt dich auf die Tanzfläche?';
ALTER TABLE form_settings ADD COLUMN specialNotesLabel_de TEXT DEFAULT 'Irgendwelche besonderen Anmerkungen für das Paar?';
