export const languages = {
  en: 'English',
  de: 'Deutsch'
};

export const translations = {
  en: {
    // Homepage countdown
    daysUntilWedding: 'days until our wedding',
    // RSVP page
    rsvpHeading: 'RSVP',
    thankYouHeading: 'Thank you for your RSVP!',
    thankYouMessage: "We're excited to celebrate with you!",
    thankYouUpdateMessage: 'Your RSVP has been successfully updated.',
    makeAnotherChange: 'Make another change'
  },
  de: {
    // Homepage countdown
    daysUntilWedding: 'Tage bis zu unserer Hochzeit',
    // RSVP page
    rsvpHeading: 'Antwort',
    thankYouHeading: 'Vielen Dank für deine Antwort!',
    thankYouMessage: 'Wir freuen uns, mit dir zu feiern!',
    thankYouUpdateMessage: 'Deine Antwort wurde erfolgreich aktualisiert.',
    makeAnotherChange: 'Eine weitere Änderung vornehmen'
  }
};

export function getTranslation(key, language = 'en') {
  return translations[language]?.[key] ?? translations.en[key] ?? key;
}
