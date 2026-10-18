<!-- src/routes/+page.svelte -->
<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  export let data;

  let daysUntil;
  let formattedDate;

  // Compute couple names based on order preference
  $: coupleNames =
    data.settings.nameOrder === 'groom-first'
      ? `${data.settings.groomName} & ${data.settings.brideName}`
      : `${data.settings.brideName} & ${data.settings.groomName}`;

  // Calculate days until wedding
  $: {
    const weddingDateTime = new Date(`${data.settings.weddingDate}T${data.settings.weddingTime}`);
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const weddingStart = new Date(
      weddingDateTime.getFullYear(),
      weddingDateTime.getMonth(),
      weddingDateTime.getDate()
    );
    daysUntil = Math.ceil((weddingStart - todayStart) / (1000 * 60 * 60 * 24));
  }

  // Format wedding date
  $: {
    const date = new Date(`${data.settings.weddingDate}T${data.settings.weddingTime}`);
    const locale = data.settings.language === 'de' ? 'de-DE' : 'en-US';
    formattedDate = date.toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
</script>

<svelte:head>
  <title>{coupleNames}'s Wedding</title>
</svelte:head>

<div class="min-h-screen flex flex-col items-center justify-center p-4">
  <h1 class="text-4xl font-bold mb-8">{coupleNames}</h1>

  {#if data.settings.showCountdown && data.settings.countdownText}
    <div class="text-2xl mb-8">
      {daysUntil} {data.settings.language === 'de' ? (data.settings.countdownText_de || 'Tage bis zu unserer Hochzeit') : (data.settings.countdownText || 'days until our wedding')}
    </div>
  {/if}

  <div class="text-xl mb-8">
    {formattedDate}
  </div>

  <div class="text-2xl font-medium mb-4">
    {data.settings.venueName}
  </div>

  <div class="text-lg text-center mb-8 whitespace-pre-wrap">
    {data.settings.venueAddress}
  </div>

  {#if !data.settings.restrictToHomePage}
    <a
      href={data.settings.rsvpButtonLink}
      class="bg-primary text-white px-8 py-3 rounded-full text-lg hover:bg-primary/90 transition-colors"
    >
      {data.settings.rsvpButtonText}
    </a>
  {/if}
</div>
