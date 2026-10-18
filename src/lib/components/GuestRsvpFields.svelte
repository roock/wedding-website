<!-- src/lib/components/GuestRsvpFields.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  import { page } from '$app/stores';
  import { formSettings } from '$lib/stores/formSettings';

  export let guest;
  export let idPrefix;
  export let title;
  export let isPrimary = false;

  const dispatch = createEventDispatcher();

  const DEFAULT_LABELS = {
    nameLabel: 'Full Name',
    emailLabel: 'Email',
    attendanceQuestion: 'Will you be attending?',
    vegetarianQuestion: 'Are you vegetarian?',
    foodAllergiesLabel: 'Any food allergies?',
    lodgingQuestion: 'Are you planning on staying at the lodging?',
    transportQuestion: 'Are you planning on joining the transport to and from our lodging?',
    songRequestLabel: 'What song will get you on the dance floor?',
    specialNotesLabel: 'Any special note for the couple?'
  };

  // Additional guests are described by the primary guest, so second-person wording is made third-person
  function toThirdPerson(text, objectPronoun) {
    return text
      .replace(/\bYou\b/g, 'They')
      .replace(/\byou\b/g, objectPronoun)
      .replace(/\bYour\b/g, 'Their')
      .replace(/\byour\b/g, 'their');
  }

  function text(key, objectPronoun = 'they') {
    const value = $formSettings?.[key] || DEFAULT_LABELS[key];
    return isPrimary ? value : toThirdPerson(value, objectPronoun);
  }
  $: isGerman = $page.data.settings.language === 'de';
  $: yesLabel = isGerman ? 'Ja' : 'Yes';
  $: noLabel = isGerman ? 'Nein' : 'No';
</script>

<div class="bg-gray-50 p-6 rounded-lg space-y-6">
  <div class="border-b pb-4 flex items-center justify-between">
    <h3 class="text-xl font-medium">{title}</h3>
    {#if !isPrimary}
      <button
        type="button"
        on:click={() => dispatch('remove')}
        class="text-sm text-red-600 hover:underline"
      >
        {isGerman ? 'Entfernen' : 'Remove'}
      </button>
    {/if}
  </div>

  <div class="space-y-2">
    <label for="{idPrefix}-name" class="block">{text('nameLabel')}</label>
    <input
      type="text"
      id="{idPrefix}-name"
      bind:value={guest.name}
      required
      autocomplete="off"
      class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-opacity-50"
      style="focus-ring-color: var(--color-primary)"
    />
  </div>

  <div class="space-y-2">
    <label for="{idPrefix}-email" class="block">
      {text('emailLabel')}
    </label>
    <input
      type="email"
      id="{idPrefix}-email"
      bind:value={guest.email}
      autocomplete="off"
      class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-opacity-50"
      style="focus-ring-color: var(--color-primary)"
    />
  </div>

  <div class="space-y-2">
    <label class="block">{text('attendanceQuestion')}</label>
    <div class="space-x-4">
      <label class="inline-flex items-center">
        <input type="radio" bind:group={guest.attending} value="yes" class="mr-2" required />
        {yesLabel}
      </label>
      <label class="inline-flex items-center">
        <input type="radio" bind:group={guest.attending} value="no" class="mr-2" />
        {noLabel}
      </label>
    </div>
  </div>

  {#if guest.attending === 'yes'}
    <div class="space-y-2">
      <label class="block">{text('vegetarianQuestion')}</label>
      <div class="space-x-4">
        <label class="inline-flex items-center">
          <input
            type="radio"
            bind:group={guest.is_vegetarian}
            value="yes"
            class="mr-2"
            required
          />
          {yesLabel}
        </label>
        <label class="inline-flex items-center">
          <input type="radio" bind:group={guest.is_vegetarian} value="no" class="mr-2" />
          {noLabel}
        </label>
      </div>
    </div>

    <div class="space-y-2">
      <label for="{idPrefix}-food_allergies" class="block">{text('foodAllergiesLabel')}</label>
      <textarea
        id="{idPrefix}-food_allergies"
        bind:value={guest.food_allergies}
        rows="3"
        autocomplete="off"
        class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-opacity-50"
        style="focus-ring-color: var(--color-primary)"
      ></textarea>
    </div>

    <div class="space-y-2">
      <label class="block">{text('lodgingQuestion')}</label>
      <div class="space-x-4">
        <label class="inline-flex items-center">
          <input type="radio" bind:group={guest.lodging} value="yes" class="mr-2" required />
          {yesLabel}
        </label>
        <label class="inline-flex items-center">
          <input type="radio" bind:group={guest.lodging} value="no" class="mr-2" />
          {noLabel}
        </label>
      </div>
    </div>

    <div class="space-y-2">
      <label class="block">{text('transportQuestion')}</label>
      <div class="space-x-4">
        <label class="inline-flex items-center">
          <input
            type="radio"
            bind:group={guest.using_transport}
            value="yes"
            class="mr-2"
            required
          />
          {yesLabel}
        </label>
        <label class="inline-flex items-center">
          <input type="radio" bind:group={guest.using_transport} value="no" class="mr-2" />
          {noLabel}
        </label>
      </div>
    </div>

    <div class="space-y-2">
      <label for="{idPrefix}-song" class="block">{text('songRequestLabel', 'them')}</label>
      <input
        type="text"
        id="{idPrefix}-song"
        bind:value={guest.song}
        autocomplete="off"
        class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-opacity-50"
        style="focus-ring-color: var(--color-primary)"
      />
    </div>

    <div class="space-y-2">
      <label for="{idPrefix}-special_notes" class="block">{text('specialNotesLabel')}</label>
      <textarea
        id="{idPrefix}-special_notes"
        bind:value={guest.special_notes}
        rows="3"
        autocomplete="off"
        class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-opacity-50"
        style="focus-ring-color: var(--color-primary)"
      ></textarea>
    </div>
  {/if}
</div>
