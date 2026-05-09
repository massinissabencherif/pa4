# Comicster Brutalist Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Comicster's GitHub-dark aesthetic with Comic Noir Brutalism — `#0F0F0F` background, `#E02020` red accent, Impact headings, Courier New body, dot-grid halftone texture, editorial print layout across 6 files.

**Architecture:** Pure template/CSS replacement. All Vue logic, composables, API calls, and reactive state remain untouched. The design system is established first in `main.css`, then each page is rewritten in dependency order (layout → homepage → auth → search).

**Tech Stack:** Nuxt 4, Vue 3, TailwindCSS. Impact + Courier New are system fonts — no Google Fonts import.

**Spec:** `docs/superpowers/specs/2026-04-29-brutalist-redesign-design.md`
**Branch:** `new-design`
**Dev server:** `cd /home/ubuntu/pa4/frontend && npm run dev` → http://localhost:3000

---

## File Map

| File | Change |
|---|---|
| `frontend/app/assets/css/main.css` | Full replacement — design tokens, base layer, component classes |
| `frontend/app/layouts/default.vue` | Template only — new navbar + footer |
| `frontend/app/pages/index.vue` | Template + script additions — two-column hero + features grid |
| `frontend/app/pages/auth/login.vue` | Template only — card layout, underline inputs, 2FA redesign |
| `frontend/app/pages/auth/register.vue` | Template only — card with marketing strip |
| `frontend/app/pages/comics/search.vue` | Template only — header strip, search bar, filters, grid, pagination |

---

### Task 1: CSS Design System

**Files:**
- Modify: `frontend/app/assets/css/main.css`

This is the foundation — all other tasks depend on these classes.

- [ ] **Step 1: Replace `main.css` entirely**

```css
/* No Google Fonts import — Impact and Courier New are system fonts */

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    scroll-behavior: smooth;
  }

  body {
    @apply antialiased;
    background-color: #0f0f0f;
    color: #d4d4d4;
    font-family: 'Courier New', Courier, monospace;
  }

  /* Dot-grid halftone texture — fixed, full-bleed, behind all content */
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image: radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px);
    background-size: 6px 6px;
    pointer-events: none;
    z-index: 0;
  }

  h1, h2, h3 {
    font-family: impact, sans-serif;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }
}

@layer components {
  /* ── Buttons ── */
  .btn-primary {
    @apply inline-flex items-center justify-center transition-all duration-150 active:scale-95;
    font-family: impact, sans-serif;
    font-size: 13px;
    letter-spacing: 3px;
    text-transform: uppercase;
    background-color: #e02020;
    color: #ffffff;
    padding: 11px 24px;
    border-radius: 0;
    border: none;
  }
  .btn-primary:hover {
    background-color: #c81a1a;
  }
  .btn-primary:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .btn-ghost {
    @apply inline-flex items-center justify-center transition-all duration-150 active:scale-95;
    font-family: 'Courier New', Courier, monospace;
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    border: 1px solid #2a2a2a;
    color: #d4d4d4;
    padding: 10px 20px;
    border-radius: 0;
    background: transparent;
  }
  .btn-ghost:hover {
    border-color: #e02020;
    color: #e02020;
  }

  /* OAuth buttons (login page) */
  .btn-oauth {
    @apply inline-flex items-center justify-center transition-all duration-150;
    gap: 8px;
    background: #111111;
    border: 1px solid #2a2a2a;
    color: #d4d4d4;
    font-family: 'Courier New', Courier, monospace;
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    padding: 10px;
    border-radius: 0;
    text-decoration: none;
  }
  .btn-oauth:hover {
    border-color: #e02020;
    color: #d4d4d4;
  }

  /* ── Card ── */
  .card {
    background-color: #111111;
    border: 1px solid #1e1e1e;
    border-top: 2px solid #e02020;
    border-radius: 0;
  }

  /* ── Input — underline only ── */
  .input {
    @apply w-full outline-none transition-all duration-150;
    font-family: 'Courier New', Courier, monospace;
    font-size: 13px;
    background: transparent;
    border: none;
    border-bottom: 1px solid #2a2a2a;
    color: #d4d4d4;
    padding: 10px 0;
    border-radius: 0;
    letter-spacing: 1px;
  }
  .input::placeholder {
    color: #333333;
  }
  .input:focus {
    border-bottom: 2px solid #e02020;
    padding-bottom: 9px;
  }

  /* ── Badges ── */
  .badge {
    @apply inline-flex items-center;
    font-family: 'Courier New', Courier, monospace;
    font-size: 8px;
    letter-spacing: 3px;
    text-transform: uppercase;
    background-color: #e02020;
    color: #ffffff;
    padding: 3px 8px;
    border-radius: 0;
  }

  .badge-outline {
    @apply inline-flex items-center;
    font-family: 'Courier New', Courier, monospace;
    font-size: 8px;
    letter-spacing: 3px;
    text-transform: uppercase;
    border: 1px solid #e02020;
    color: #e02020;
    padding: 3px 8px;
    border-radius: 0;
    background: transparent;
  }

  /* kept for backward compatibility with unredesigned pages */
  .glass {
    background-color: #111111;
    border: 1px solid #1e1e1e;
  }
}
```

- [ ] **Step 2: Verify Tailwind compiles without errors**

```bash
cd /home/ubuntu/pa4/frontend && npm run build 2>&1 | tail -20
```

Expected: build exits 0, no CSS parsing errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/app/assets/css/main.css
git commit -m "style: replace CSS design system — Comic Noir Brutalism tokens and components"
```

---

### Task 2: Layout — Navbar + Footer (`default.vue`)

**Files:**
- Modify: `frontend/app/layouts/default.vue`

Replace **only** the `<template>` block. The `<script setup>` block (Umami, isAdmin, scrolled) stays completely unchanged.

- [ ] **Step 1: Replace the `<template>` block**

```vue
<template>
  <div class="min-h-screen flex flex-col" style="position:relative;z-index:1;">

    <!-- Navbar -->
    <header class="fixed top-0 inset-x-0 z-50" style="background:#0f0f0f;border-bottom:1px solid #1e1e1e;">
      <div style="height:2px;background:#e02020;"></div>
      <div class="max-w-[1100px] mx-auto px-6 h-[52px] flex items-center justify-between">

        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-[10px]" aria-label="Comicster — Accueil">
          <div style="width:26px;height:26px;background:#e02020;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <span style="font-family:impact,sans-serif;font-size:15px;color:#fff;line-height:1;">C</span>
          </div>
          <span style="font-family:impact,sans-serif;font-size:18px;letter-spacing:4px;color:#fff;text-transform:uppercase;">COMICSTER</span>
        </NuxtLink>

        <!-- Nav links -->
        <nav class="hidden sm:flex items-center" aria-label="Navigation principale">
          <NuxtLink
            v-if="isLoggedIn"
            to="/feed"
            style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:3px;text-transform:uppercase;color:#888;padding:0 14px;height:52px;display:flex;align-items:center;border-left:1px solid #1a1a1a;border-right:1px solid #1a1a1a;text-decoration:none;transition:color 0.15s;"
            active-class="!text-[#e02020]"
          >Feed</NuxtLink>
          <NuxtLink
            v-if="isLoggedIn"
            to="/comics/search"
            style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:3px;text-transform:uppercase;color:#888;padding:0 14px;height:52px;display:flex;align-items:center;border-right:1px solid #1a1a1a;text-decoration:none;transition:color 0.15s;"
            active-class="!text-[#e02020]"
          >Explorer</NuxtLink>
          <NuxtLink
            v-if="isLoggedIn"
            to="/journal"
            style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:3px;text-transform:uppercase;color:#888;padding:0 14px;height:52px;display:flex;align-items:center;border-right:1px solid #1a1a1a;text-decoration:none;transition:color 0.15s;"
            active-class="!text-[#e02020]"
          >Journal</NuxtLink>
          <NuxtLink
            v-if="isLoggedIn"
            to="/lists"
            style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:3px;text-transform:uppercase;color:#888;padding:0 14px;height:52px;display:flex;align-items:center;border-right:1px solid #1a1a1a;text-decoration:none;transition:color 0.15s;"
            active-class="!text-[#e02020]"
          >Listes</NuxtLink>
          <NuxtLink
            v-if="isLoggedIn"
            to="/reviews"
            style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:3px;text-transform:uppercase;color:#888;padding:0 14px;height:52px;display:flex;align-items:center;border-right:1px solid #1a1a1a;text-decoration:none;transition:color 0.15s;"
            active-class="!text-[#e02020]"
          >Avis</NuxtLink>
          <NuxtLink
            v-if="isLoggedIn"
            to="/dashboard"
            style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:3px;text-transform:uppercase;color:#888;padding:0 14px;height:52px;display:flex;align-items:center;border-right:1px solid #1a1a1a;text-decoration:none;transition:color 0.15s;"
            active-class="!text-[#e02020]"
          >Stats</NuxtLink>
        </nav>

        <!-- Auth actions -->
        <div class="flex items-center gap-3">
          <template v-if="isLoggedIn">
            <span class="hidden sm:block" style="font-family:'Courier New',monospace;font-size:7px;letter-spacing:3px;color:#333;text-transform:uppercase;">№ 2026</span>
            <NuxtLink
              v-if="isAdmin"
              to="/admin"
              class="hidden sm:flex items-center btn-ghost"
              style="font-size:9px;padding:6px 12px;border-color:#e02020;color:#e02020;"
            >ADMIN</NuxtLink>
            <NuxtLink
              to="/settings/security"
              class="hidden sm:flex items-center gap-2"
              style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:2px;color:#888;text-transform:uppercase;text-decoration:none;transition:color 0.15s;"
              :title="`Connecté en tant que ${user?.username}`"
            >
              <div style="width:6px;height:6px;border-radius:50%;background:#22c55e;flex-shrink:0;"></div>
              {{ user?.username }}
            </NuxtLink>
            <button
              @click="logout"
              style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:2px;color:#555;text-transform:uppercase;background:none;border:none;cursor:pointer;transition:color 0.15s;"
            >DÉCO_</button>
          </template>
          <template v-else>
            <span class="hidden sm:block" style="font-family:'Courier New',monospace;font-size:7px;letter-spacing:3px;color:#333;text-transform:uppercase;">№ 2026</span>
            <NuxtLink
              to="/auth/login"
              style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:3px;text-transform:uppercase;color:#888;text-decoration:none;padding:7px 14px;border:1px solid #2a2a2a;transition:border-color 0.15s,color 0.15s;"
            >LOGIN_</NuxtLink>
            <NuxtLink to="/auth/register" class="btn-primary" style="font-size:11px;padding:8px 16px;">
              S'INSCRIRE
            </NuxtLink>
          </template>
        </div>

      </div>
    </header>

    <!-- Page content -->
    <main class="flex-1" style="padding-top:54px;position:relative;z-index:1;">
      <slot />
    </main>

    <!-- Footer -->
    <footer style="border-top:1px solid #1e1e1e;position:relative;z-index:1;">
      <div style="height:2px;background:#e02020;"></div>
      <div class="max-w-[1100px] mx-auto px-6 py-[22px] flex flex-col sm:flex-row items-center justify-between gap-3">
        <span style="font-family:impact,sans-serif;font-size:13px;letter-spacing:4px;color:#333;text-transform:uppercase;">
          COMICSTER — TON JOURNAL DE COMICS
        </span>
        <div class="flex">
          <NuxtLink to="/comics/search" style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:3px;color:#555;text-transform:uppercase;text-decoration:none;padding:0 16px;border-right:1px solid #1a1a1a;transition:color 0.15s;">Explorer</NuxtLink>
          <NuxtLink to="/rgpd" style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:3px;color:#555;text-transform:uppercase;text-decoration:none;padding:0 16px;border-right:1px solid #1a1a1a;transition:color 0.15s;">RGPD</NuxtLink>
          <NuxtLink to="/mentions-legales" style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:3px;color:#555;text-transform:uppercase;text-decoration:none;padding:0 16px;transition:color 0.15s;">Mentions</NuxtLink>
        </div>
      </div>
    </footer>

  </div>
</template>
```

- [ ] **Step 2: Verify layout in browser**

Start dev server if not running: `cd /home/ubuntu/pa4/frontend && npm run dev`

Open http://localhost:3000. Expected:
- 2px red rule at very top of navbar
- Red square logo mark with "C"
- Nav links in Courier New 8px uppercase separated by vertical 1px lines
- `№ 2026` marker before auth buttons
- Footer with 2px red rule on top, minimal links

- [ ] **Step 3: Commit**

```bash
git add frontend/app/layouts/default.vue
git commit -m "style: brutalist navbar and footer — red top rule, pipe nav, edition number"
```

---

### Task 3: Homepage (`index.vue`)

**Files:**
- Modify: `frontend/app/pages/index.vue`

Replace the `<template>` block. Also extend `<script setup>` with two static data arrays (the sidebar trending list and features grid). All existing logic stays.

- [ ] **Step 1: Replace the full file**

```vue
<template>
  <div>

    <!-- Hero -->
    <section style="border-bottom:1px solid #1e1e1e;">
      <div
        class="max-w-[1100px] mx-auto px-6 py-20"
        style="display:grid;grid-template-columns:1fr 320px;gap:48px;align-items:center;min-height:86vh;"
      >

        <!-- Left -->
        <div>
          <div class="flex items-center gap-[10px] mb-5" style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:5px;color:#e02020;text-transform:uppercase;">
            <div style="width:20px;height:2px;background:#e02020;flex-shrink:0;"></div>
            Ton journal de comics
          </div>

          <h1 style="font-family:impact,sans-serif;font-size:clamp(48px,6vw,72px);line-height:0.9;color:#fff;text-transform:uppercase;letter-spacing:0;margin-bottom:24px;">
            SUIS.<br>
            <span style="-webkit-text-stroke:1px rgba(255,255,255,0.2);color:transparent;display:block;">NOTE.</span>
            PARTAGE.
          </h1>

          <p style="font-family:'Courier New',monospace;font-size:15px;line-height:1.9;color:#d4d4d4;max-width:460px;margin-bottom:32px;">
            Journal de lecture, avis, listes personnalisées.<br>
            Tout ce qu'il te faut pour ne jamais perdre le fil.
          </p>

          <div class="flex flex-wrap gap-3">
            <NuxtLink to="/auth/register" class="btn-primary">COMMENCER ▶</NuxtLink>
            <NuxtLink to="/auth/login" class="btn-ghost">SE CONNECTER_</NuxtLink>
          </div>

          <!-- Stats bar -->
          <div style="display:flex;margin-top:48px;border-top:1px solid #1e1e1e;padding-top:28px;">
            <div style="flex:1;padding-right:28px;border-right:1px solid #1e1e1e;margin-right:28px;">
              <div style="font-family:impact,sans-serif;font-size:30px;color:#fff;letter-spacing:1px;">10K+</div>
              <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px;color:#888;text-transform:uppercase;margin-top:4px;">Comics</div>
            </div>
            <div style="flex:1;padding-right:28px;border-right:1px solid #1e1e1e;margin-right:28px;">
              <div style="font-family:impact,sans-serif;font-size:30px;color:#fff;letter-spacing:1px;">GRATUIT</div>
              <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px;color:#888;text-transform:uppercase;margin-top:4px;">Pour toujours</div>
            </div>
            <div style="flex:1;">
              <div style="font-family:impact,sans-serif;font-size:30px;color:#fff;letter-spacing:1px;">MARVEL</div>
              <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px;color:#888;text-transform:uppercase;margin-top:4px;">& autres</div>
            </div>
          </div>
        </div>

        <!-- Right — Trending sidebar -->
        <div style="border:1px solid #1e1e1e;border-top:2px solid #e02020;">
          <div style="padding:12px 16px;border-bottom:1px solid #1e1e1e;display:flex;justify-content:space-between;align-items:center;">
            <span style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:3px;color:#e02020;text-transform:uppercase;">Tendances</span>
            <span style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:2px;color:#333;">№ 024</span>
          </div>
          <div
            v-for="(item, i) in trendingItems"
            :key="i"
            style="padding:14px 16px;border-bottom:1px solid #1a1a1a;display:flex;gap:12px;align-items:flex-start;"
          >
            <div style="width:36px;height:50px;background:#1e1e1e;flex-shrink:0;position:relative;overflow:hidden;">
              <div style="position:absolute;inset:0;background-image:radial-gradient(circle,rgba(255,255,255,0.06) 1px,transparent 1px);background-size:4px 4px;"></div>
              <span style="position:absolute;bottom:3px;left:3px;font-family:impact,sans-serif;font-size:11px;color:#e02020;z-index:1;">{{ String(i + 1).padStart(2, '0') }}</span>
            </div>
            <div>
              <div style="font-family:impact,sans-serif;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#fff;margin-bottom:4px;line-height:1.15;">{{ item.title }}</div>
              <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:1px;color:#888;text-transform:uppercase;">{{ item.meta }}</div>
              <div style="display:inline-flex;align-items:center;font-family:'Courier New',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;padding:2px 6px;margin-top:6px;border:1px solid #e02020;color:#e02020;">{{ item.status }}</div>
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- Features -->
    <section style="border-bottom:1px solid #1e1e1e;">
      <div class="max-w-[1100px] mx-auto px-6 py-16">
        <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:36px;">
          <div>
            <div style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:5px;color:#e02020;text-transform:uppercase;margin-bottom:10px;">Fonctionnalités</div>
            <div style="font-family:impact,sans-serif;font-size:38px;color:#fff;text-transform:uppercase;letter-spacing:1px;">TOUT CE QU'IL TE FAUT</div>
          </div>
          <div style="font-family:impact,sans-serif;font-size:80px;color:rgba(255,255,255,0.03);line-height:1;">04</div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:#1e1e1e;">
          <div v-for="(f, i) in features" :key="f.title" style="background:#0f0f0f;padding:28px 22px;position:relative;">
            <div style="position:absolute;top:14px;right:14px;font-family:impact,sans-serif;font-size:48px;color:rgba(255,255,255,0.04);line-height:1;pointer-events:none;">{{ String(i + 1).padStart(2, '0') }}</div>
            <div style="width:24px;height:2px;background:#e02020;margin-bottom:18px;"></div>
            <div style="font-family:impact,sans-serif;font-size:16px;letter-spacing:1px;text-transform:uppercase;color:#fff;margin-bottom:10px;">{{ f.title }}</div>
            <div style="font-family:'Courier New',monospace;font-size:13px;line-height:1.7;color:#d4d4d4;">{{ f.desc }}</div>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup>
const { isLoggedIn } = useAuth()

if (isLoggedIn.value) {
  await navigateTo('/feed')
}

const trendingItems = [
  { title: 'Amazing Spider-Man', meta: 'Marvel · 1963', status: 'En cours' },
  { title: 'Batman: Year One', meta: 'DC · 1987', status: 'Terminé' },
  { title: 'Watchmen', meta: 'DC · 1986', status: 'À lire' },
  { title: 'Saga Vol. 1', meta: 'Image · 2012', status: 'En cours' },
]

const features = [
  { title: 'Journal de lecture', desc: 'Marque ce que tu lis, ce que tu as terminé, ce que tu veux découvrir.' },
  { title: 'Notes & avis', desc: 'Note de 1 à 5 étoiles et laisse ton avis sur chaque comic.' },
  { title: 'Listes perso', desc: 'Crée des sélections thématiques et partage-les avec la communauté.' },
  { title: 'Recommandations', desc: 'Découvre de nouveaux comics basés sur tes genres et auteurs préférés.' },
]
</script>
```

- [ ] **Step 2: Verify homepage in browser (logged out)**

Open http://localhost:3000. Expected:
- Two-column layout: hero left, trending sidebar right
- "NOTE." rendered as outline/ghost (transparent with white stroke)
- Red eyebrow line before tagline
- Stats bar with Impact numbers
- 4-column features grid with 1px dark gap and ghost numbers

- [ ] **Step 3: Commit**

```bash
git add frontend/app/pages/index.vue
git commit -m "style: brutalist homepage — two-column hero, ghost heading, features grid"
```

---

### Task 4: Login Page (`login.vue`)

**Files:**
- Modify: `frontend/app/pages/auth/login.vue`

Replace **only** the `<template>` block. The `<script setup>` (form, totpCode, error, loading, step, submit, submit2FA, onMounted) stays completely unchanged.

- [ ] **Step 1: Replace the `<template>` block**

```vue
<template>
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:48px 24px;background:#0f0f0f;position:relative;">
    <div style="position:fixed;inset:0;background-image:radial-gradient(circle,rgba(255,255,255,0.055) 1px,transparent 1px);background-size:6px 6px;pointer-events:none;z-index:0;"></div>

    <div style="width:100%;max-width:380px;position:relative;z-index:1;">
      <div class="card">

        <!-- Header -->
        <div style="padding:20px 28px;border-bottom:1px solid #1e1e1e;display:flex;align-items:center;justify-content:space-between;">
          <NuxtLink to="/" class="flex items-center gap-[10px]">
            <div style="width:24px;height:24px;background:#e02020;display:flex;align-items:center;justify-content:center;">
              <span style="font-family:impact,sans-serif;font-size:13px;color:#fff;line-height:1;">C</span>
            </div>
            <span style="font-family:impact,sans-serif;font-size:15px;letter-spacing:4px;color:#fff;text-transform:uppercase;">COMICSTER</span>
          </NuxtLink>
          <span style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:3px;color:#333;">№ 002</span>
        </div>

        <!-- Body -->
        <div style="padding:28px;">

          <!-- 2FA step -->
          <template v-if="step === '2fa'">
            <div style="font-family:impact,sans-serif;font-size:28px;letter-spacing:2px;text-transform:uppercase;color:#fff;margin-bottom:4px;">VÉRIFICATION</div>
            <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:3px;color:#555;text-transform:uppercase;margin-bottom:28px;">Code de ton application 2FA</div>

            <form @submit.prevent="submit2FA" aria-label="Vérification 2FA">
              <div style="margin-bottom:24px;">
                <input
                  id="totp-code"
                  v-model="totpCode"
                  type="text"
                  inputmode="numeric"
                  maxlength="6"
                  required
                  placeholder="000000"
                  autofocus
                  autocomplete="one-time-code"
                  style="width:100%;background:transparent;border:none;border-bottom:2px solid #e02020;color:#fff;font-family:impact,sans-serif;font-size:28px;letter-spacing:12px;text-align:center;padding:10px 0;outline:none;"
                />
                <div style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:2px;color:#555;text-transform:uppercase;text-align:center;margin-top:8px;">Code à 6 chiffres — expire dans 30s</div>
              </div>

              <div v-if="error" role="alert" style="display:flex;align-items:center;gap:8px;background:rgba(224,32,32,0.08);border:1px solid rgba(224,32,32,0.2);padding:10px 12px;font-family:'Courier New',monospace;font-size:11px;color:#e02020;margin-bottom:16px;">
                <span aria-hidden="true">⚠</span>{{ error }}
              </div>

              <button type="submit" :disabled="loading" class="btn-primary" style="width:100%;justify-content:center;margin-bottom:14px;">
                <span v-if="loading">Vérification…</span>
                <span v-else>VÉRIFIER ▶</span>
              </button>
              <button type="button" @click="step = 'credentials'; error = ''" style="width:100%;text-align:center;font-family:'Courier New',monospace;font-size:9px;letter-spacing:2px;color:#555;text-transform:uppercase;background:none;border:none;cursor:pointer;">
                ← Retour
              </button>
            </form>
          </template>

          <!-- Credentials step -->
          <template v-else>
            <div style="font-family:impact,sans-serif;font-size:28px;letter-spacing:2px;text-transform:uppercase;color:#fff;margin-bottom:4px;">CONNEXION</div>
            <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:3px;color:#555;text-transform:uppercase;margin-bottom:28px;">Ton univers comics t'attend</div>

            <form @submit.prevent="submit" class="space-y-5" aria-label="Connexion par email">
              <div>
                <label for="login-email" style="display:block;font-family:'Courier New',monospace;font-size:9px;letter-spacing:4px;color:#888;text-transform:uppercase;margin-bottom:8px;">Email</label>
                <input id="login-email" v-model="form.email" type="email" required placeholder="toi@example.com" class="input" autocomplete="email" />
              </div>
              <div>
                <label for="login-password" style="display:block;font-family:'Courier New',monospace;font-size:9px;letter-spacing:4px;color:#888;text-transform:uppercase;margin-bottom:8px;">Mot de passe</label>
                <input id="login-password" v-model="form.password" type="password" required placeholder="••••••••" class="input" autocomplete="current-password" />
              </div>

              <div v-if="error" role="alert" style="display:flex;align-items:center;gap:8px;background:rgba(224,32,32,0.08);border:1px solid rgba(224,32,32,0.2);padding:10px 12px;font-family:'Courier New',monospace;font-size:11px;color:#e02020;">
                <span aria-hidden="true">⚠</span>{{ error }}
              </div>

              <button type="submit" :disabled="loading" class="btn-primary" style="width:100%;justify-content:center;margin-top:8px;">
                <span v-if="loading" class="flex items-center gap-2">
                  <svg class="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Connexion…
                </span>
                <span v-else>SE CONNECTER ▶</span>
              </button>
            </form>

            <!-- Divider -->
            <div class="flex items-center gap-3 my-6">
              <div style="flex:1;height:1px;background:#1e1e1e;"></div>
              <span style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:3px;color:#333;text-transform:uppercase;">ou</span>
              <div style="flex:1;height:1px;background:#1e1e1e;"></div>
            </div>

            <!-- OAuth -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
              <a :href="`${apiBase}/auth/google`" aria-label="Se connecter avec Google" class="btn-oauth">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"/>
                  <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z"/>
                  <path fill="#4A90D9" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z"/>
                  <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067Z"/>
                </svg>
                Google
              </a>
              <a :href="`${apiBase}/auth/github`" aria-label="Se connecter avec GitHub" class="btn-oauth">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                </svg>
                GitHub
              </a>
            </div>
          </template>

        </div>

        <!-- Footer -->
        <div style="padding:14px 28px;border-top:1px solid #1e1e1e;text-align:center;font-family:'Courier New',monospace;font-size:11px;color:#555;display:flex;align-items:center;justify-content:center;gap:6px;">
          Pas de compte ?
          <NuxtLink to="/auth/register" style="color:#e02020;text-decoration:none;letter-spacing:1px;">S'inscrire →</NuxtLink>
        </div>

      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Verify login page in browser**

Open http://localhost:3000/auth/login. Expected:
- Dot-grid background visible
- Red-bordered card with `№ 002` in header
- Impact `CONNEXION` heading
- Underline-only email + password inputs (no box border)
- Full-width red submit button
- `ou` divider with thin lines
- 2-column OAuth grid, borders turn red on hover

- [ ] **Step 3: Commit**

```bash
git add frontend/app/pages/auth/login.vue
git commit -m "style: brutalist login — card layout, underline inputs, 2FA step redesign"
```

---

### Task 5: Register Page (`register.vue`)

**Files:**
- Modify: `frontend/app/pages/auth/register.vue`

Replace **only** the `<template>` block. The `<script setup>` (form, register, features, RESERVED_USERNAMES, usernameReserved, passwordMismatch, passwordStrength, strengthColor, submit) stays completely unchanged — including the existing `features` array.

- [ ] **Step 1: Replace the `<template>` block**

```vue
<template>
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:48px 24px;background:#0f0f0f;position:relative;">
    <div style="position:fixed;inset:0;background-image:radial-gradient(circle,rgba(255,255,255,0.055) 1px,transparent 1px);background-size:6px 6px;pointer-events:none;z-index:0;"></div>

    <div style="width:100%;max-width:420px;position:relative;z-index:1;">
      <div class="card">

        <!-- Header -->
        <div style="padding:20px 28px;border-bottom:1px solid #1e1e1e;display:flex;align-items:center;justify-content:space-between;">
          <NuxtLink to="/" class="flex items-center gap-[10px]">
            <div style="width:24px;height:24px;background:#e02020;display:flex;align-items:center;justify-content:center;">
              <span style="font-family:impact,sans-serif;font-size:13px;color:#fff;line-height:1;">C</span>
            </div>
            <span style="font-family:impact,sans-serif;font-size:15px;letter-spacing:4px;color:#fff;text-transform:uppercase;">COMICSTER</span>
          </NuxtLink>
          <span style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:3px;color:#333;">№ 003</span>
        </div>

        <!-- Marketing strip -->
        <div style="padding:20px 28px;border-bottom:1px solid #1e1e1e;">
          <div style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:4px;color:#e02020;text-transform:uppercase;margin-bottom:14px;">Pourquoi Comicster ?</div>
          <div
            v-for="(f, i) in features"
            :key="f.title"
            style="display:flex;gap:14px;padding:12px 0;align-items:flex-start;"
            :style="i < features.length - 1 ? 'border-bottom:1px solid #1a1a1a;' : ''"
          >
            <div style="font-family:impact,sans-serif;font-size:22px;color:#e02020;line-height:1;flex-shrink:0;width:28px;">{{ String(i + 1).padStart(2, '0') }}</div>
            <div>
              <div style="font-family:impact,sans-serif;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#fff;margin-bottom:3px;">{{ f.title }}</div>
              <div style="font-family:'Courier New',monospace;font-size:12px;line-height:1.6;color:#d4d4d4;">{{ f.desc }}</div>
            </div>
          </div>
        </div>

        <!-- Form body -->
        <div style="padding:28px;">
          <div style="font-family:impact,sans-serif;font-size:28px;letter-spacing:2px;text-transform:uppercase;color:#fff;margin-bottom:4px;">CRÉER UN COMPTE</div>
          <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:3px;color:#555;text-transform:uppercase;margin-bottom:28px;">Gratuit · Sans carte bancaire</div>

          <form @submit.prevent="submit" class="space-y-5">
            <div>
              <label style="display:block;font-family:'Courier New',monospace;font-size:9px;letter-spacing:4px;color:#888;text-transform:uppercase;margin-bottom:8px;">Email</label>
              <input v-model="form.email" type="email" required placeholder="toi@example.com" class="input" />
            </div>

            <div>
              <label style="display:block;font-family:'Courier New',monospace;font-size:9px;letter-spacing:4px;color:#888;text-transform:uppercase;margin-bottom:8px;">Nom d'utilisateur</label>
              <input
                v-model="form.username"
                type="text"
                required
                minlength="3"
                placeholder="spider_reader"
                class="input"
                :style="usernameReserved ? 'border-bottom-color:#e02020;' : ''"
              />
              <p v-if="usernameReserved" style="font-family:'Courier New',monospace;font-size:11px;color:#e02020;margin-top:4px;">Ce nom d'utilisateur est réservé.</p>
            </div>

            <div>
              <label style="display:block;font-family:'Courier New',monospace;font-size:9px;letter-spacing:4px;color:#888;text-transform:uppercase;margin-bottom:8px;">Mot de passe</label>
              <input v-model="form.password" type="password" required minlength="8" placeholder="Au moins 8 caractères" class="input" />
              <div v-if="form.password.length > 0" style="display:flex;gap:3px;margin-top:6px;">
                <div
                  v-for="i in 4"
                  :key="i"
                  style="height:2px;flex:1;transition:background 0.3s;"
                  :style="{ background: i <= passwordStrength ? strengthColor : '#1e1e1e' }"
                ></div>
              </div>
            </div>

            <div>
              <label style="display:block;font-family:'Courier New',monospace;font-size:9px;letter-spacing:4px;color:#888;text-transform:uppercase;margin-bottom:8px;">Confirmer le mot de passe</label>
              <input
                v-model="form.passwordConfirm"
                type="password"
                required
                placeholder="Répète ton mot de passe"
                class="input"
                :style="passwordMismatch ? 'border-bottom-color:#e02020;' : ''"
              />
              <p v-if="passwordMismatch" style="font-family:'Courier New',monospace;font-size:11px;color:#e02020;margin-top:4px;">Les mots de passe ne correspondent pas.</p>
            </div>

            <div v-if="error" style="display:flex;align-items:center;gap:8px;background:rgba(224,32,32,0.08);border:1px solid rgba(224,32,32,0.2);padding:10px 12px;font-family:'Courier New',monospace;font-size:11px;color:#e02020;">
              <span>⚠</span> {{ error }}
            </div>

            <button type="submit" :disabled="loading" class="btn-primary" style="width:100%;justify-content:center;margin-top:8px;">
              <span v-if="loading" class="flex items-center gap-2">
                <svg class="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Création…
              </span>
              <span v-else>COMMENCER GRATUITEMENT ▶</span>
            </button>
          </form>
        </div>

        <!-- Footer -->
        <div style="padding:14px 28px;border-top:1px solid #1e1e1e;text-align:center;font-family:'Courier New',monospace;font-size:11px;color:#555;display:flex;align-items:center;justify-content:center;gap:6px;">
          Déjà un compte ?
          <NuxtLink to="/auth/login" style="color:#e02020;text-decoration:none;letter-spacing:1px;">Se connecter →</NuxtLink>
        </div>

      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Verify register page in browser**

Open http://localhost:3000/auth/register. Expected:
- Marketing strip with numbered features (01–04) using the existing `features` array from script
- All four form fields with underline-only inputs
- Password strength bar (4 segments, 2px tall, transitions red→amber→green)
- Validation messages in red when username reserved or passwords mismatch

- [ ] **Step 3: Commit**

```bash
git add frontend/app/pages/auth/register.vue
git commit -m "style: brutalist register — marketing strip, underline inputs, strength bar"
```

---

### Task 6: Search Page (`search.vue`)

**Files:**
- Modify: `frontend/app/pages/comics/search.vue`

Replace **only** the `<template>` block. The entire `<script setup>` (all fetch logic, pagination, filters, `getComicCover` import) stays unchanged.

- [ ] **Step 1: Replace the `<template>` block**

```vue
<template>
  <div>

    <!-- Page header -->
    <div style="border-bottom:1px solid #1e1e1e;">
      <div class="max-w-[1100px] mx-auto px-6 pt-9 pb-0">
        <div style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:5px;color:#e02020;text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;gap:10px;">
          <div style="width:16px;height:2px;background:#e02020;flex-shrink:0;"></div>
          Bibliothèque · {{ total }} comics
        </div>
        <div style="font-family:impact,sans-serif;font-size:52px;letter-spacing:1px;color:#fff;text-transform:uppercase;line-height:1;padding-bottom:18px;">EXPLORER</div>
      </div>
    </div>

    <!-- Search bar -->
    <div style="border-bottom:1px solid #1e1e1e;">
      <div class="max-w-[1100px] mx-auto px-6 py-5">
        <form @submit.prevent="doSearch" style="display:flex;">
          <div style="flex:1;display:flex;align-items:stretch;border:1px solid #2a2a2a;border-right:none;">
            <div style="padding:0 14px;display:flex;align-items:center;border-right:1px solid #1e1e1e;flex-shrink:0;font-family:'Courier New',monospace;font-size:9px;letter-spacing:3px;color:#333;text-transform:uppercase;white-space:nowrap;">
              QUERY_
            </div>
            <input
              v-model="query"
              type="text"
              placeholder="Titre, auteur, éditeur…"
              style="flex:1;background:transparent;border:none;color:#d4d4d4;font-family:'Courier New',monospace;font-size:14px;letter-spacing:1px;padding:14px 16px;outline:none;"
            />
          </div>
          <button
            type="submit"
            :disabled="loading"
            class="btn-primary"
            style="border-radius:0;padding:0 28px;flex-shrink:0;font-size:12px;disabled:opacity-40;"
          >{{ loading ? '…' : 'RECHERCHER ▶' }}</button>
        </form>
      </div>
    </div>

    <!-- Filters strip -->
    <div style="border-bottom:1px solid #1e1e1e;">
      <div class="max-w-[1100px] mx-auto px-6" style="display:flex;align-items:center;height:44px;">
        <span style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:4px;color:#555;text-transform:uppercase;padding-right:20px;border-right:1px solid #1e1e1e;flex-shrink:0;">FILTRES</span>
        <select
          v-model="selectedGenre"
          @change="doSearch"
          style="background:transparent;border:none;border-right:1px solid #1e1e1e;color:#888;font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;padding:0 32px 0 16px;height:44px;outline:none;cursor:pointer;appearance:none;background-image:url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2710%27 height=%276%27 fill=%27none%27%3E%3Cpath stroke=%27%23555%27 stroke-width=%271.5%27 d=%27M1 1l4 4 4-4%27/%3E%3C/svg%3E');background-repeat:no-repeat;background-position:right 12px center;"
        >
          <option value="" style="background:#111;">Tous les genres</option>
          <option v-for="g in genres" :key="g" :value="g" style="background:#111;">{{ g }}</option>
        </select>
        <select
          v-model="selectedAuthor"
          @change="doSearch"
          style="background:transparent;border:none;border-right:1px solid #1e1e1e;color:#888;font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;padding:0 32px 0 16px;height:44px;outline:none;cursor:pointer;appearance:none;background-image:url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2710%27 height=%276%27 fill=%27none%27%3E%3Cpath stroke=%27%23555%27 stroke-width=%271.5%27 d=%27M1 1l4 4 4-4%27/%3E%3C/svg%3E');background-repeat:no-repeat;background-position:right 12px center;"
        >
          <option value="" style="background:#111;">Tous les éditeurs</option>
          <option v-for="a in authorNames" :key="a" :value="a" style="background:#111;">{{ a }}</option>
        </select>
        <button
          v-if="selectedGenre || selectedAuthor || query"
          @click="clearFilters"
          class="btn-ghost"
          style="margin-left:auto;font-size:9px;letter-spacing:3px;padding:6px 14px;"
        >× RÉINITIALISER</button>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="max-w-[1100px] mx-auto px-6 mt-6">
      <div style="display:flex;align-items:center;gap:8px;background:rgba(224,32,32,0.08);border:1px solid rgba(224,32,32,0.2);padding:12px 16px;font-family:'Courier New',monospace;font-size:12px;color:#e02020;">
        ⚠ {{ error }}
      </div>
    </div>

    <!-- Results -->
    <template v-if="displayedComics.length">

      <!-- Results meta -->
      <div class="max-w-[1100px] mx-auto px-6 py-5" style="display:flex;justify-content:space-between;align-items:center;">
        <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px;color:#888;text-transform:uppercase;">
          <span style="font-family:impact,sans-serif;font-size:14px;letter-spacing:1px;color:#e02020;">{{ total }}</span>
          &nbsp;résultat{{ total > 1 ? 's' : '' }}
          <span v-if="lastQuery"> pour "{{ lastQuery }}"</span>
          <span v-if="selectedGenre"> · {{ selectedGenre }}</span>
          <span v-if="selectedAuthor"> · {{ selectedAuthor }}</span>
        </div>
        <div v-if="totalPages > 1" style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:3px;color:#333;text-transform:uppercase;">
          Page {{ currentPage }} / {{ totalPages }}
        </div>
      </div>

      <!-- Comics grid -->
      <div class="max-w-[1100px] mx-auto px-6 pb-12" style="display:grid;grid-template-columns:repeat(5,1fr);gap:1px;background:#1a1a1a;">
        <NuxtLink
          v-for="comic in displayedComics"
          :key="comic.id"
          :to="`/comics/${comic.externalId}`"
          class="group"
          style="background:#0f0f0f;display:flex;flex-direction:column;text-decoration:none;overflow:hidden;"
        >
          <!-- Cover -->
          <div style="aspect-ratio:2/3;position:relative;overflow:hidden;background:#1a1a1a;">
            <img
              :src="getComicCover(comic)"
              :alt="comic.title"
              class="w-full h-full object-cover block group-hover:scale-[1.03]"
              style="transition:transform 0.2s;"
              loading="lazy"
            />
            <!-- Hover overlay -->
            <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.85) 0%,transparent 50%);display:flex;align-items:flex-end;padding:10px;opacity:0;transition:opacity 0.2s;" class="group-hover:opacity-100">
              <span style="font-family:impact,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#e02020;">VOIR →</span>
            </div>
          </div>
          <!-- Info strip -->
          <div style="padding:10px 12px 14px;border-top:1px solid #1a1a1a;flex:1;">
            <div style="font-family:impact,sans-serif;font-size:13px;letter-spacing:0.5px;text-transform:uppercase;color:#fff;line-height:1.15;margin-bottom:5px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">{{ comic.title }}</div>
            <div v-if="comic.authors?.length" style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:1px;color:#888;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ comic.authors.join(', ') }}</div>
          </div>
        </NuxtLink>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="max-w-[1100px] mx-auto px-6 pb-14" style="display:flex;align-items:center;border-top:1px solid #1e1e1e;padding-top:24px;margin-top:0;">
        <button
          @click="goToPage(currentPage - 1)"
          :disabled="currentPage === 1 || loading"
          style="background:transparent;border:1px solid #1e1e1e;border-right:none;color:#555;font-family:'Courier New',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;padding:9px 16px;cursor:pointer;border-radius:0;"
          :style="(currentPage === 1 || loading) ? 'opacity:0.25;cursor:not-allowed;' : ''"
        >← PRÉC</button>

        <template v-for="p in pageNumbers" :key="p">
          <span
            v-if="p === '...'"
            style="padding:9px 10px;color:#333;font-size:9px;font-family:'Courier New',monospace;border:1px solid #1e1e1e;border-right:none;"
          >…</span>
          <button
            v-else
            @click="goToPage(p)"
            :disabled="loading"
            style="background:transparent;border:1px solid #1e1e1e;border-right:none;font-family:'Courier New',monospace;font-size:9px;letter-spacing:1px;padding:9px 14px;cursor:pointer;border-radius:0;transition:background 0.15s,color 0.15s;"
            :style="p === currentPage ? 'background:#e02020;color:#fff;border-color:#e02020;' : 'color:#555;'"
          >{{ p }}</button>
        </template>

        <button
          @click="goToPage(currentPage + 1)"
          :disabled="currentPage === totalPages || loading"
          style="background:transparent;border:1px solid #1e1e1e;color:#555;font-family:'Courier New',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;padding:9px 16px;cursor:pointer;border-radius:0;"
          :style="(currentPage === totalPages || loading) ? 'opacity:0.25;cursor:not-allowed;' : ''"
        >SUIV →</button>
      </div>

    </template>

    <!-- Empty state -->
    <div v-else-if="!loading" style="text-align:center;padding:96px 24px;">
      <div style="font-family:impact,sans-serif;font-size:48px;letter-spacing:2px;text-transform:uppercase;color:#1e1e1e;margin-bottom:14px;">AUCUN RÉSULTAT</div>
      <div style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:3px;color:#333;text-transform:uppercase;">Essaie d'autres critères de recherche.</div>
    </div>

  </div>
</template>
```

- [ ] **Step 2: Verify search page in browser**

Open http://localhost:3000/comics/search. Expected:
- `EXPLORER` heading (Impact 52px) with red eyebrow showing total count
- `QUERY_` prefixed search bar flush against red submit button
- Filters strip with custom chevron dropdowns
- 5-column comic grid with 1px dark gap (covers slightly desaturated, red "VOIR →" on hover)
- Red active page in pagination, border-connected buttons

- [ ] **Step 3: Run e2e tests to confirm behavior is intact**

```bash
cd /home/ubuntu/pa4 && npx playwright test --reporter=line 2>&1 | tail -30
```

Expected: all existing tests pass. Template changes don't affect functionality.

If Playwright isn't installed: `cd /home/ubuntu/pa4 && npx playwright test --list 2>&1 | head -5` to confirm test presence.

- [ ] **Step 4: Commit**

```bash
git add frontend/app/pages/comics/search.vue
git commit -m "style: brutalist search — header strip, inline search, filter strip, 5-col grid"
```

---

### Task 7: Final Verification

- [ ] **Step 1: Production build check**

```bash
cd /home/ubuntu/pa4/frontend && npm run build 2>&1 | tail -30
```

Expected: exits 0, no errors. If it fails, check the error — most likely a malformed template tag.

- [ ] **Step 2: Visual smoke test across all 4 pages**

Start dev server: `cd /home/ubuntu/pa4/frontend && npm run dev`

| URL | Check |
|---|---|
| http://localhost:3000 | dot-grid texture, two-column hero, ghost NOTE., red accent |
| http://localhost:3000/auth/login | card with red top border, underline inputs, 2FA works |
| http://localhost:3000/auth/register | marketing strip renders, strength bar animates |
| http://localhost:3000/comics/search | QUERY_ search bar, 5-col grid, red pagination |

Global checks on every page:
- [ ] `#0F0F0F` dark background with dot-grid visible
- [ ] Impact font for all headings, Courier New everywhere else
- [ ] No rounded corners (buttons, cards, badges, inputs)
- [ ] Red `#E02020` accent consistent across all interactive elements
- [ ] Navbar: 2px red top rule, pipe-separated links, `№ 2026`
- [ ] Footer: 2px red rule, minimal link row

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "style: Comic Noir Brutalism redesign complete — 6 files"
```
