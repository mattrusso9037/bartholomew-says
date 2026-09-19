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

- `lib/character-motion.ts` schedules long rests between seated, drowsy, stretching, and sleeping sequences. Adjacent visits never repeat. Sleeping reverses the curl clip to wake; stretching reverses the final sitting segment, then plays it forward to settle.
- `Bartholomew.tsx` owns animation blending, root-motion normalization, head stabilization, and pupil tracking. The supplied mesh has no eye bones, so the pupil effect adjusts the original texture locally within the eye sockets.
- `SleepingBlanket.tsx` fits a small cloth height field over the body with a curved neckline behind the head. `lib/blanket-motion.ts` times its arrival during descent and keeps it on the book briefly after waking. The curl clip is trimmed to its moving section; the reversed rise blends into the seated idle. Breathing and small edge ripples animate the woven velvet material.
- `Plants.tsx` batches curved ivy leaves into one instanced mesh and merges its stems. Moth trails use fixed particle buffers with short lifetimes.
- The Atmosphere toggle and system reduced-motion preference stop the animation schedule, gaze, cloth, and ambient motion. Hidden tabs stop rendering. Mobile reduces pixel density, foliage, trails, cloth resolution, and shadow resolution.

## Character asset

The user-supplied Meshy exports in `public/models/` remain the source assets. The scene loads `bartholomew-animated.glb`, which shares one skin, mesh, and texture set across four clips instead of loading a complete model for each animation.

Regenerate after changing those source exports:

```sh
node scripts/prepare-character.mjs
```

The script uses Next.js's installed `sharp` dependency to resize embedded textures. It preserves the original materials and rig. Asset-specific eye coordinates, head corrections, and root-motion normalization must be revisited if the character mesh or skeleton changes.
