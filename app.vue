<template>
  <NuxtPage />
</template>

<script setup>
import './globals.css';

useHead({
  title: 'Break Stuff - AI Powered Task Breakdown',
  meta: [
    {
      name: 'description',
      content: 'Break Stuff helps you organize and break down complex tasks into smaller, actionable subtasks using AI.'
    },
    { name: 'keywords', content: 'task list, AI planner, productivity, task management, organization' },
    { name: 'author', content: 'Felipe' },
    { name: 'robots', content: 'index, follow' },
    { property: 'og:title', content: 'Break Stuff - AI Task Breakdown' },
    {
      property: 'og:description',
      content: 'Use AI to break complex tasks into manageable steps and optimize your workflow.'
    },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:title', content: 'Break Stuff - AI Task Breakdown' },
    {
      name: 'twitter:description',
      content: 'Automate your task planning with AI-powered task breakdowns.'
    },
    { name: 'color-scheme', content: 'light dark' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }
  ],
  link: [
    { rel: 'icon', type: 'image/png', href: '/favicon.png' },
    { rel: 'canonical', href: 'https://breakstuff.netlify.app/' }
  ]
});
</script>
