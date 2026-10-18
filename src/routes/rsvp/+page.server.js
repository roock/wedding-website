// src/routes/rsvp/+page.server.js
// Loaded on the server so guests get the saved form labels on first render.
// /api/admin/* is behind Cloudflare Zero Trust, so the public page must not fetch it.
export async function load({ platform }) {
  if (!platform?.env?.RSVPS) {
    return { formSettings: null };
  }

  try {
    const formSettings = await platform.env.RSVPS.prepare(
      'SELECT * FROM form_settings WHERE id = 1'
    ).first();
    return { formSettings: formSettings ?? null };
  } catch (error) {
    console.error('Failed to load form settings:', error);
    return { formSettings: null };
  }
}
