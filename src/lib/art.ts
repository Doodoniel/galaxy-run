/**
 * The ten illustrations live in `public/`, which Vite copies through without
 * fingerprinting the filenames. A redrawn picture therefore needs its own
 * version tag, or browsers keep serving the one they already have.
 *
 * Bump `ART_VERSION` whenever a file in `public/art` changes.
 */
const ART_VERSION = '2';

export const artUrl = (name: string) => `${import.meta.env.BASE_URL}art/${name}.webp?v=${ART_VERSION}`;
