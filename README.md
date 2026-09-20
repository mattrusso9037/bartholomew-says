# Bartholomew Says

A quote reader with a painted cathedral background and a React Three Fiber foreground diorama. Next.js App Router, Three.js, and Framer Motion.

```sh
npm install
npm run dev -- --port 3000
npm test
npm run lint
npm run build
```

Quotes and attribution live in `data/quotes.ts`. Quote selection and sharing remain in `app/page.tsx`; word reveals are in `components/quote/QuoteDisplay.tsx`.

## Scene and motion

- `CathedralArrival.tsx` provides the initial moonlit SVG reveal while scene assets and the background load. Its arched door outline advances deterministically to 95%, then completes and zooms into the cathedral when the scene is ready. A 12-second fallback prevents the page from getting stuck if an asset fails to settle.
- The caption's **Tuck me in** button requests the existing sleep sequence without changing the quote. It reports settling/sleeping states and selects a still resting pose when reduced motion is enabled.

- `lib/character-motion.ts` schedules long rests between seated, drowsy, stretching, and sleeping sequences. Adjacent visits never repeat. Sleeping reverses the curl clip to wake; stretching reverses the final sitting segment, then plays it forward to settle.
- `Bartholomew.tsx` owns animation blending, root-motion normalization, head stabilization, and pupil tracking. The supplied mesh has no eye bones, so the pupil effect adjusts the original texture locally within the eye sockets.
- `SleepingBlanket.tsx` fits a small cloth height field over the body with a curved neckline behind the head. `lib/blanket-motion.ts` times its arrival during descent and keeps it on the book briefly after waking. The curl clip is trimmed to its moving section; the reversed rise blends into the seated idle. Breathing and small edge ripples animate the woven velvet material.
- `Plants.tsx` renders the ivy-crowned shelf asset and disposes its cloned materials. Moth trails use fixed particle buffers with short lifetimes (25 per moth on mobile, 90 on desktop).
- System reduced-motion stops ambient animation. Hidden tabs and offscreen dioramas stop rendering. Mobile caps pixel density, uses two moths, a pre-shaped breathing blanket, and no shadow maps.

## Character asset

The user-supplied Meshy exports in `public/models/` remain the source assets. The scene loads `bartholomew-animated.glb`, which shares one skin, mesh, and texture set across four clips instead of loading a complete model for each animation.

Regenerate after changing those source exports:

```sh
node scripts/prepare-character.mjs
node scripts/prepare-mobile-character.mjs
```

The scripts use Next.js's installed `sharp` dependency to resize embedded textures. The mobile variant uses 1K maps, preserving every geometry, skin, and animation buffer; desktop keeps 2K maps. Asset-specific eye coordinates, head corrections, and root-motion normalization must be revisited if the character mesh or skeleton changes.
