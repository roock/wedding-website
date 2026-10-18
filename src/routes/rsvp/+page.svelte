<!-- src/routes/rsvp/+page.svelte -->
<script>
  import { formSettings } from '$lib/stores/formSettings';
  import { page } from '$app/stores';
  import GuestRsvpFields from '$lib/components/GuestRsvpFields.svelte';

  export let data;

  // Compute couple names based on order preference
  $: coupleNames =
    $page.data.settings.nameOrder === 'groom-first'
      ? `${$page.data.settings.groomName} & ${$page.data.settings.brideName}`
      : `${$page.data.settings.brideName} & ${$page.data.settings.groomName}`;
  $: isGerman = $page.data.settings.language === 'de';

  const emptyGuest = () => ({
    name: '',
    email: '',
    attending: '',
    is_vegetarian: '',
    food_allergies: '',
    lodging: '',
    using_transport: '',
    song: '',
    special_notes: ''
  });

  let primary = emptyGuest();
  // Each additional guest gets a stable key so Svelte keeps its DOM when others are removed
  let guests = [];
  let nextGuestKey = 0;

  let submitting = false;
  let submitted = false;
  let isUpdate = false;
  let error = null;

  // Form settings come from the server load function; keep store defaults if none are saved
  if (data.formSettings) {
    formSettings.set(data.formSettings);
  }

  function addGuest() {
    guests = [...guests, { key: nextGuestKey++, ...emptyGuest() }];
  }

  function removeGuest(key) {
    guests = guests.filter((guest) => guest.key !== key);
  }

  function isAnswered(guest) {
    if (!guest.attending) return false;
    if (guest.attending === 'yes') {
      return !!(guest.is_vegetarian && guest.lodging && guest.using_transport);
    }
    return true;
  }

  async function handleSubmit() {
    const primaryValid = primary.name.trim() && isAnswered(primary);
    const guestsValid = guests.every((guest) => guest.name.trim() && isAnswered(guest));

    if (!primaryValid || !guestsValid) {
      error = isGerman
        ? 'Bitte fülle alle erforderlichen Felder aus, bevor du absendest.'
        : 'Please fill in all required fields before submitting.';
      return;
    }

    submitting = true;
    error = null;

    try {
      const requestData = {
        primary,
        guests: guests.map((guest) => ({
          name: guest.name,
          email: guest.email,
          attending: guest.attending,
          is_vegetarian: guest.is_vegetarian,
          food_allergies: guest.food_allergies,
          lodging: guest.lodging,
          using_transport: guest.using_transport,
          song: guest.song,
          special_notes: guest.special_notes
        }))
      };

      const response = await fetch('/api/rsvp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        throw new Error(`Server returned invalid JSON: ${responseText}`);
      }

      if (!response.ok) {
        throw new Error(result.details || result.error || 'Failed to submit RSVP');
      }

      isUpdate = result.isUpdate;
      submitted = true;
    } catch (e) {
      error = e.message;
      console.error('RSVP Error:', e);
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>RSVP | {coupleNames} Wedding</title>
</svelte:head>

<div class="max-w-2xl mx-auto px-4 py-12">
  <h1 class="text-4xl text-center font-light mb-12">
    {isGerman ? 'Antwort' : 'RSVP'}
  </h1>

  {#if submitted}
    <div class="text-center py-12 bg-white rounded-lg shadow-sm">
      <h2 class="text-2xl mb-4">
        {isGerman ? 'Vielen Dank für deine Antwort!' : 'Thank you for your RSVP!'}
      </h2>
      <p class="text-gray-600">
        {#if isUpdate}
          {isGerman
            ? 'Deine Antwort wurde erfolgreich aktualisiert.'
            : 'Your RSVP has been successfully updated.'}
        {:else}
          {isGerman ? 'Wir freuen uns, mit dir zu feiern!' : "We're excited to celebrate with you!"}
        {/if}
      </p>
      {#if isUpdate}
        <button
          class="mt-6 text-primary hover:text-primary/80 underline"
          on:click={() => {
            submitted = false;
            isUpdate = false;
            error = null;
          }}
        >
          {isGerman ? 'Eine weitere Änderung vornehmen' : 'Make another change'}
        </button>
      {/if}
    </div>
  {:else}
    <form
      on:submit|preventDefault={handleSubmit}
      class="space-y-6 bg-white p-8 rounded-lg shadow-sm"
    >
      <GuestRsvpFields
        guest={primary}
        idPrefix="primary"
        title={isGerman ? 'Deine Antwort' : 'Your RSVP'}
        isPrimary={true}
      />

      {#each guests as guest, index (guest.key)}
        <GuestRsvpFields
          {guest}
          idPrefix={`guest-${guest.key}`}
          title={`${isGerman ? 'Weiterer Gast' : 'Additional guest'} ${index + 1}`}
          isPrimary={false}
          on:remove={() => removeGuest(guest.key)}
        />
      {/each}

      <button
        type="button"
        on:click={addGuest}
        class="w-full border-2 border-dashed border-gray-300 text-gray-600 px-4 py-2 rounded hover:border-primary hover:text-primary transition-colors"
      >
        + {isGerman ? 'Weiteren Gast hinzufügen' : 'Add another guest'}
      </button>

      <div class="pt-6">
        <button
          type="submit"
          disabled={submitting}
          class="w-full bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {submitting
            ? isGerman
              ? 'Wird eingereicht...'
              : 'Submitting...'
            : isGerman
              ? 'Antwort einreichen'
              : 'Submit RSVP'}
        </button>
      </div>

      {#if error}
        <div class="bg-red-50 text-red-600 p-4 rounded mb-6">
          {error}
        </div>
      {/if}
    </form>
  {/if}
</div>
