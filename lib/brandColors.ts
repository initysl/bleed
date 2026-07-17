export interface BrandStyle {
  bg: string;
  text: 'light' | 'dark';
}

// Matched by substring against the lowercased subscription name, so
// "Netflix Premium" and "Netflix" both hit the same entry.
const BRANDS: Record<string, BrandStyle> = {
  netflix: { bg: '#E50914', text: 'light' },
  spotify: { bg: '#1DB954', text: 'dark' },
  youtube: { bg: '#FF0000', text: 'light' },
  medium: { bg: '#02B875', text: 'dark' },
  adobe: { bg: '#DA1F26', text: 'light' },
  twitter: { bg: '#1DA1F2', text: 'light' },
  framer: { bg: '#0055FF', text: 'light' },
  notion: { bg: '#000000', text: 'light' },
  amazon: { bg: '#FF9900', text: 'dark' },
  disney: { bg: '#113CCF', text: 'light' },
  hulu: { bg: '#1CE783', text: 'dark' },
  apple: { bg: '#000000', text: 'light' },
  github: { bg: '#181717', text: 'light' },
  slack: { bg: '#4A154B', text: 'light' },
  dropbox: { bg: '#0061FF', text: 'light' },
  chatgpt: { bg: '#10A37F', text: 'light' },
  openai: { bg: '#10A37F', text: 'light' },
  claude: { bg: '#DA7756', text: 'light' },
  canva: { bg: '#00C4CC', text: 'dark' },
  figma: { bg: '#A259FF', text: 'light' },
  linkedin: { bg: '#0A66C2', text: 'light' },
  icloud: { bg: '#3693F3', text: 'light' },
  'google one': { bg: '#4285F4', text: 'light' },
  playstation: { bg: '#003791', text: 'light' },
  xbox: { bg: '#107C10', text: 'light' },
};

// Unrecognized services fall back to the app's own pine accent, rather than
// defaulting to gray — keeps unrecognized rows feeling intentional, not broken.
const FALLBACK: BrandStyle = { bg: '#2F6F5E', text: 'light' };

export function getBrandStyle(name: string): BrandStyle {
  const key = name.toLowerCase();
  for (const [brand, style] of Object.entries(BRANDS)) {
    if (key.includes(brand)) return style;
  }
  return FALLBACK;
}
