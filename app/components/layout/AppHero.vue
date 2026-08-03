<template>
  <!--
    Three text elements, one voice: headline, subtext, and the composer that
    follows it as the primary action. No eyebrow, no version label, no scroll cue,
    no trust strip. The headline is the only place the app raises its volume, and
    the accented word is the verb the whole product is named after.
  -->
  <div class="flex flex-col gap-4">
    <!--
      The h1, not the wordmark in the header. This sentence is what the page is
      about, and it is the only heading on it: the brand name in the sticky bar is
      a label, so it stays a <p> rather than competing for the outline.
    -->
    <h1 class="display-xl max-w-[18ch] text-ink">
      Break it into pieces small enough to
      <span class="text-accent">start</span>.
    </h1>

    <p class="max-w-[52ch] text-[0.9375rem] text-ink-muted">
      Drop in whatever you have been avoiding. Get back five ordered steps, each with a time estimate.
    </p>
  </div>
</template>
