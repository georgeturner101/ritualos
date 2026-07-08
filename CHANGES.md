# RitualOS Cleanup — What Changed

Drop-in replacements for: index.html, script.js, style.css, mobile.html, firebase-config.js, sitemap.xml.
The look and feel is untouched — this pass was performance, bugs, SEO hygiene, and accessibility.

## Performance (the big wins)
- **Ghost trail**: was creating ~60 DOM nodes *per second* on desktop (one every animation frame). Now throttled like the mobile version. This alone will make the site feel noticeably smoother.
- **Sparkles**: were created on *every* mousemove event. Now throttled to ~22/second max.
- **Window dragging**: every window used to add its own document-wide mousemove listener (12+ listeners running on every mouse move, growing each time the Tuna popup appeared). Now one delegated handler for all windows, including ones created later.
- **Tuna game**: the game loop and arrow-key listener now stop when the window closes (previously ran forever in the background).
- **Clock**: ticks every 30s instead of every second (it only shows minutes).
- **Scripts deferred**, Spotify iframe lazy-loaded, boot logo preloaded.
- **Duplicate analytics removed**: Google Analytics was being loaded twice (gtag + firebase-analytics-compat, same G- ID). Firebase analytics removed; gtag kept.

## Bugs fixed
- **Spotify embed URL was broken** — it literally ended in `?...`. Now a working embed URL.
- **Dragging a desktop icon no longer accidentally opens its window** on release.
- **Arrow keys no longer scroll the page** while playing Tuna.
- **GT Paint's Ctrl+Z/Y shortcuts** only fire while GT Paint is open (previously hijacked undo everywhere once Paint had been opened).
- **Start menu** now closes when you click elsewhere or launch an app.
- **Mobile ghost** repelled twice per tap (pointerdown + touchstart both firing) — fixed.
- **Resizing the browser** used to recenter every open window, wiping your arrangement — now windows are just kept on-screen.
- **Video/PDF viewers** stop playback / clear the frame when closed.
- Corrupted localStorage icon positions can no longer break the desktop (safe JSON parse).
- Removed dead code: unused mobile PDF viewer markup + function.

## SEO
- **Removed the "Artist Keywords" hidden text block.** Keyword-stuffed hidden text is explicitly against Google's spam policies and can hurt ranking. Replaced with one concise visually-hidden h1 (screen-reader/SEO safe pattern).
- Removed the meta keywords tag (ignored by Google since 2009; reads as spam signal).
- Structured data: added YouTube + Spotify to sameAs, added Wellington locality.
- Sitemap: removed mobile.html (it canonicalises to the homepage, so listing it sends mixed signals).
- Better mobile detection (iPadOS now detected; it reports as "Macintosh").

## Accessibility
- All X close buttons have aria-labels; audio toggle is a real button; keyboard focus visible; prefers-reduced-motion respected (sparkles/trails/animations calm down for users who ask for it).

## Content note (check these!)
- "sophomore album scheduled for release in 2025" → changed to "is forthcoming" (both desktop + mobile About). Reword as you like.
- Mobile Contact now includes Spotify (was desktop-only).

## Things I can't fix from the code side
1. **Firebase database rules** — your DB config is public (that's normal), but make sure Realtime Database rules only allow writes to /scores, validate score as a number and name length, and add ".indexOn": "score". Otherwise anyone can write anything to your database.
2. **og:image** is the ghost icon — make a proper 1200×630 share image (a still from a work would look great when the site is shared).
3. **church.mp4 + audio files** — worth compressing (HandBrake for the video, ~2–5MB target) since they gate first impressions.
