import { json } from '@sveltejs/kit';

const DEFAULT_SETTINGS_EN = {
  language: 'en',
  nameLabel: 'Full Name',
  emailLabel: 'Email',
  attendanceQuestion: 'Will you be attending?',
  additionalGuestsLabel: 'Number of Additional Guests',
  vegetarianQuestion: 'Are you vegetarian?',
  foodAllergiesLabel: 'Any food allergies?',
  lodgingQuestion: 'Are you planning on staying at the lodging?',
  transportQuestion: 'Are you planning on joining the transport to and from our lodging?',
  songRequestLabel: 'What song will get you on the dance floor?',
  specialNotesLabel: 'Any special note for the couple?'
};

const DEFAULT_SETTINGS_DE = {
  language: 'de',
  nameLabel: 'Vollständiger Name',
  emailLabel: 'E-Mail',
  attendanceQuestion: 'Wirst du kommen?',
  additionalGuestsLabel: 'Anzahl zusätzlicher Gäste',
  vegetarianQuestion: 'Bist du Vegetarier?',
  foodAllergiesLabel: 'Irgendwelche Lebensmittelallergien?',
  lodgingQuestion: 'Planst du in der Unterkunft zu bleiben?',
  transportQuestion: 'Planst du, den Transport zu und von unserer Unterkunft zu nutzen?',
  songRequestLabel: 'Welches Lied bringt dich auf die Tanzfläche?',
  specialNotesLabel: 'Irgendwelche besonderen Anmerkungen für das Paar?'
};

export async function GET({ platform, url }) {
  try {
    const language = url.searchParams.get('language') || 'en';
    const settings = await platform.env.RSVPS.prepare(
      'SELECT * FROM form_settings WHERE id = 1'
    ).first();

    if (!settings) {
      return json(language === 'de' ? DEFAULT_SETTINGS_DE : DEFAULT_SETTINGS_EN);
    }

    // Return labels for the requested language
    if (language === 'de') {
      return json({
        language: 'de',
        nameLabel: settings.nameLabel_de || DEFAULT_SETTINGS_DE.nameLabel,
        emailLabel: settings.emailLabel_de || DEFAULT_SETTINGS_DE.emailLabel,
        attendanceQuestion: settings.attendanceQuestion_de || DEFAULT_SETTINGS_DE.attendanceQuestion,
        additionalGuestsLabel: settings.additionalGuestsLabel_de || DEFAULT_SETTINGS_DE.additionalGuestsLabel,
        vegetarianQuestion: settings.vegetarianQuestion_de || DEFAULT_SETTINGS_DE.vegetarianQuestion,
        foodAllergiesLabel: settings.foodAllergiesLabel_de || DEFAULT_SETTINGS_DE.foodAllergiesLabel,
        lodgingQuestion: settings.lodgingQuestion_de || DEFAULT_SETTINGS_DE.lodgingQuestion,
        transportQuestion: settings.transportQuestion_de || DEFAULT_SETTINGS_DE.transportQuestion,
        songRequestLabel: settings.songRequestLabel_de || DEFAULT_SETTINGS_DE.songRequestLabel,
        specialNotesLabel: settings.specialNotesLabel_de || DEFAULT_SETTINGS_DE.specialNotesLabel
      });
    }

    return json({
      language: 'en',
      nameLabel: settings.nameLabel || DEFAULT_SETTINGS_EN.nameLabel,
      emailLabel: settings.emailLabel || DEFAULT_SETTINGS_EN.emailLabel,
      attendanceQuestion: settings.attendanceQuestion || DEFAULT_SETTINGS_EN.attendanceQuestion,
      additionalGuestsLabel: settings.additionalGuestsLabel || DEFAULT_SETTINGS_EN.additionalGuestsLabel,
      vegetarianQuestion: settings.vegetarianQuestion || DEFAULT_SETTINGS_EN.vegetarianQuestion,
      foodAllergiesLabel: settings.foodAllergiesLabel || DEFAULT_SETTINGS_EN.foodAllergiesLabel,
      lodgingQuestion: settings.lodgingQuestion || DEFAULT_SETTINGS_EN.lodgingQuestion,
      transportQuestion: settings.transportQuestion || DEFAULT_SETTINGS_EN.transportQuestion,
      songRequestLabel: settings.songRequestLabel || DEFAULT_SETTINGS_EN.songRequestLabel,
      specialNotesLabel: settings.specialNotesLabel || DEFAULT_SETTINGS_EN.specialNotesLabel
    });
  } catch (error) {
    console.error('Error fetching form settings:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch form settings' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST({ request, platform }) {
  try {
    const settings = await request.json();

    await platform.env.RSVPS.prepare(
      `
      INSERT OR REPLACE INTO form_settings (
        id,
        language,
        nameLabel,
        emailLabel,
        attendanceQuestion,
        additionalGuestsLabel,
        vegetarianQuestion,
        foodAllergiesLabel,
        lodgingQuestion,
        transportQuestion,
        songRequestLabel,
        specialNotesLabel,
        nameLabel_de,
        emailLabel_de,
        attendanceQuestion_de,
        additionalGuestsLabel_de,
        vegetarianQuestion_de,
        foodAllergiesLabel_de,
        lodgingQuestion_de,
        transportQuestion_de,
        songRequestLabel_de,
        specialNotesLabel_de
      ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    )
      .bind(
        settings.language || 'en',
        settings.nameLabel || DEFAULT_SETTINGS_EN.nameLabel,
        settings.emailLabel || DEFAULT_SETTINGS_EN.emailLabel,
        settings.attendanceQuestion || DEFAULT_SETTINGS_EN.attendanceQuestion,
        settings.additionalGuestsLabel || DEFAULT_SETTINGS_EN.additionalGuestsLabel,
        settings.vegetarianQuestion || DEFAULT_SETTINGS_EN.vegetarianQuestion,
        settings.foodAllergiesLabel || DEFAULT_SETTINGS_EN.foodAllergiesLabel,
        settings.lodgingQuestion || DEFAULT_SETTINGS_EN.lodgingQuestion,
        settings.transportQuestion || DEFAULT_SETTINGS_EN.transportQuestion,
        settings.songRequestLabel || DEFAULT_SETTINGS_EN.songRequestLabel,
        settings.specialNotesLabel || DEFAULT_SETTINGS_EN.specialNotesLabel,
        settings.nameLabel_de || DEFAULT_SETTINGS_DE.nameLabel,
        settings.emailLabel_de || DEFAULT_SETTINGS_DE.emailLabel,
        settings.attendanceQuestion_de || DEFAULT_SETTINGS_DE.attendanceQuestion,
        settings.additionalGuestsLabel_de || DEFAULT_SETTINGS_DE.additionalGuestsLabel,
        settings.vegetarianQuestion_de || DEFAULT_SETTINGS_DE.vegetarianQuestion,
        settings.foodAllergiesLabel_de || DEFAULT_SETTINGS_DE.foodAllergiesLabel,
        settings.lodgingQuestion_de || DEFAULT_SETTINGS_DE.lodgingQuestion,
        settings.transportQuestion_de || DEFAULT_SETTINGS_DE.transportQuestion,
        settings.songRequestLabel_de || DEFAULT_SETTINGS_DE.songRequestLabel,
        settings.specialNotesLabel_de || DEFAULT_SETTINGS_DE.specialNotesLabel
      )
      .run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error saving form settings:', error);
    return new Response(JSON.stringify({ error: 'Failed to save form settings' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
