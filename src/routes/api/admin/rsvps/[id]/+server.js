// Removes one guest. Empties parties are deleted; if a primary guest is removed while others remain,
// the earliest remaining guest is promoted so the party can still be matched by email on resubmission.
async function deleteRsvpGuest(db, id) {
  const guest = await db
    .prepare('SELECT party_id, is_primary FROM rsvp_guests WHERE id = ?')
    .bind(id)
    .first();
  if (!guest) {
    return { success: false };
  }

  await db.prepare('DELETE FROM rsvp_guests WHERE id = ?').bind(id).run();

  const remaining = await db
    .prepare('SELECT id FROM rsvp_guests WHERE party_id = ? ORDER BY id LIMIT 1')
    .bind(guest.party_id)
    .first();
  if (!remaining) {
    await db.prepare('DELETE FROM rsvp_parties WHERE id = ?').bind(guest.party_id).run();
  } else if (guest.is_primary) {
    await db.prepare('UPDATE rsvp_guests SET is_primary = 1 WHERE id = ?').bind(remaining.id).run();
  }

  return { success: true };
}

export async function DELETE({ params, platform }) {
  try {
    const { id } = params;

    if (!id || isNaN(id)) {
      return new Response(JSON.stringify({ error: 'Valid RSVP ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete the guest
    const result = await deleteRsvpGuest(platform.env.RSVPS, id);

    if (result.success) {
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ error: 'RSVP not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Error deleting RSVP:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete RSVP' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function PUT({ request, params, platform }) {
  try {
    const { id } = params;
    const rsvp = await request.json();

    if (!id || isNaN(id)) {
      return new Response(JSON.stringify({ error: 'Valid RSVP ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update the guest (party membership and primary flag are unchanged)
    const result = await platform.env.RSVPS.prepare(
      `
      UPDATE rsvp_guests
      SET name = ?,
          email = ?,
          attending = ?,
          is_vegetarian = ?,
          food_allergies = ?,
          lodging = ?,
          using_transport = ?,
          song = ?,
          special_notes = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `
    )
      .bind(
        rsvp.name,
        rsvp.email || null,
        rsvp.attending,
        rsvp.is_vegetarian,
        rsvp.food_allergies,
        rsvp.lodging,
        rsvp.using_transport,
        rsvp.song,
        rsvp.special_notes,
        id
      )
      .run();

    if (result.success) {
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ error: 'RSVP not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Error updating RSVP:', error);
    return new Response(JSON.stringify({ error: 'Failed to update RSVP' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
