-- One party per submitted RSVP; a party holds one or more guests (one of them is_primary)
CREATE TABLE rsvp_parties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rsvp_guests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  party_id INTEGER NOT NULL REFERENCES rsvp_parties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  is_primary INTEGER NOT NULL DEFAULT 0,
  attending TEXT NOT NULL,
  is_vegetarian TEXT DEFAULT 'no',
  food_allergies TEXT,
  lodging TEXT DEFAULT 'no',
  using_transport TEXT DEFAULT 'no',
  song TEXT,
  special_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rsvp_guests_party_id ON rsvp_guests(party_id);
CREATE INDEX idx_rsvp_guests_primary_email ON rsvp_guests(email);

-- Carry over existing single-person RSVPs: each legacy row becomes its own party with one primary guest
INSERT INTO rsvp_parties (id, created_at, updated_at)
SELECT id, created_at, updated_at FROM rsvps;

INSERT INTO rsvp_guests (party_id, name, email, is_primary, attending, is_vegetarian, food_allergies, lodging, using_transport, song, special_notes, created_at, updated_at)
SELECT id, name, email, 1, attending, is_vegetarian, food_allergies, lodging, using_transport, song, special_notes, created_at, updated_at
FROM rsvps;
