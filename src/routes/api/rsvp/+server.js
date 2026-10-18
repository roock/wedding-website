// src/routes/api/rsvp/+server.js
import { sendRsvpConfirmationEmail } from '$lib/services/email';

const ANSWER_DEFAULTS = {
  is_vegetarian: 'no',
  food_allergies: '',
  lodging: 'no',
  using_transport: 'no',
  song: '',
  special_notes: ''
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function toGuestRow(guest, isPrimary) {
  return {
    name: guest.name.trim(),
    email: guest.email?.trim() || null,
    is_primary: isPrimary ? 1 : 0,
    attending: guest.attending,
    is_vegetarian: guest.is_vegetarian || ANSWER_DEFAULTS.is_vegetarian,
    food_allergies: guest.food_allergies || ANSWER_DEFAULTS.food_allergies,
    lodging: guest.lodging || ANSWER_DEFAULTS.lodging,
    using_transport: guest.using_transport || ANSWER_DEFAULTS.using_transport,
    song: guest.song || ANSWER_DEFAULTS.song,
    special_notes: guest.special_notes || ANSWER_DEFAULTS.special_notes
  };
}

function validateGuest(guest, label) {
  const missing = [];
  if (!guest.name?.trim()) missing.push(`${label} name`);
  if (!guest.attending) missing.push(`${label} attending`);
  return missing;
}

export async function POST({ request, platform }) {
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Received RSVP request`);

  try {
    const data = await request.json();
    const { primary, skipEmail } = data;

    if (!primary) {
      return jsonResponse(
        { error: 'Missing required fields', details: 'Missing: primary guest data' },
        400
      );
    }

    const missingFields = validateGuest(primary, 'Primary guest');
    const additionalGuests = Array.isArray(data.guests) ? data.guests : [];
    additionalGuests.forEach((guest, index) => {
      missingFields.push(...validateGuest(guest, `Guest ${index + 1}`));
    });
    if (missingFields.length > 0) {
      return jsonResponse(
        { error: 'Missing required fields', details: `Missing: ${missingFields.join(', ')}` },
        400
      );
    }

    const db = platform.env.RSVPS;

    // A party is identified by the primary guest's email; resubmitting with the same email updates it
    let existing = null;
    if (primary.email?.trim()) {
      existing = await db
        .prepare(
          'SELECT party_id FROM rsvp_guests WHERE is_primary = 1 AND LOWER(email) = LOWER(?) LIMIT 1'
        )
        .bind(primary.email.trim())
        .first();
    }
    const isUpdate = !!existing;

    let partyId = existing?.party_id;
    if (!isUpdate) {
      const created = await db.prepare('INSERT INTO rsvp_parties DEFAULT VALUES').run();
      partyId = created.meta.last_row_id;
    }

    const guestRows = [
      toGuestRow(primary, true),
      ...additionalGuests.map((guest) => toGuestRow(guest, false))
    ];
    const insertGuest = db.prepare(
      `INSERT INTO rsvp_guests (
        party_id, name, email, is_primary, attending, is_vegetarian,
        food_allergies, lodging, using_transport, song, special_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const statements = [];
    if (isUpdate) {
      statements.push(
        db.prepare('DELETE FROM rsvp_guests WHERE party_id = ?').bind(partyId),
        db
          .prepare('UPDATE rsvp_parties SET updated_at = CURRENT_TIMESTAMP WHERE id = ?')
          .bind(partyId)
      );
    }
    for (const row of guestRows) {
      statements.push(
        insertGuest.bind(
          partyId,
          row.name,
          row.email,
          row.is_primary,
          row.attending,
          row.is_vegetarian,
          row.food_allergies,
          row.lodging,
          row.using_transport,
          row.song,
          row.special_notes
        )
      );
    }
    // D1 batches run atomically, so the party's guest set is never left half-written
    await db.batch(statements);

    if (primary.attending === 'yes' && !skipEmail && primary.email?.trim()) {
      try {
        await sendRsvpConfirmationEmail(primary, platform);
        console.log(`[${requestId}] Confirmation email sent to ${primary.email}`);
      } catch (emailError) {
        console.error(`[${requestId}] Failed to send confirmation email:`, emailError);
        // Don't fail the request if email fails
      }
    }

    return jsonResponse({
      success: true,
      isUpdate,
      message: isUpdate ? 'RSVP updated successfully' : 'RSVP submitted successfully'
    });
  } catch (error) {
    console.error(`[${requestId}] RSVP Error:`, error);
    return jsonResponse({ error: 'Failed to process RSVP', details: error.message }, 500);
  }
}
