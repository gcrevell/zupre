// Condition -> background/animation mapping. Gradients and particle/cloud
// tuning are ported from Bubble Card's weather_forecast module
// (https://github.com/Clooos/bubble-card, MIT © 2023 Cloos) — see this
// package's README for attribution.

export type PrecipKind = 'rain' | 'snow' | 'hail' | 'stars';
export type Intensity = 'light' | 'normal' | 'heavy';

export type PrecipSpec = {
  kind: PrecipKind;
  intensity: Intensity;
  style?: string;
};

export type CloudSpec = {
  intensity: Intensity;
  isNight: boolean;
};

export type FxEntry = {
  bg: string;
  precip?: PrecipSpec[];
  clouds?: CloudSpec;
  flash?: boolean;
};

const FX: Record<string, FxEntry> = {
  sunny: {
    bg: `
      linear-gradient(rgba(255,255,255,.06) 0%, rgba(255,255,255,0) 30%),
      radial-gradient(200% 150% at 50% 0%, rgb(255 238 230) 0%, rgba(255,245,204,0) 60%),
      linear-gradient(rgb(0 127 255) 0%, rgb(0 149 255) 50%, rgb(0 139 255) 100%)
    `,
  },
  'clear-night': {
    bg: `
      radial-gradient(120% 100% at 50% 130%, hsla(260,80%,6%,.8) 0%, rgba(0,0,0,0) 60%),
      linear-gradient(180deg, hsl(235,47%,17%) 0%, hsl(252,39%,22%) 55%, hsl(260,35%,18%) 100%)
    `,
    precip: [{ kind: 'stars', intensity: 'normal' }],
  },
  partlycloudy: {
    bg: `
      radial-gradient(160% 120% at 85% -10%, hsla(48,95%,85%,.55) 0%, rgba(255,255,255,0) 55%),
      linear-gradient(180deg, hsl(214,25%,78%) 0%, hsl(209,22%,70%) 50%, hsl(207,48%,57%) 100%)
    `,
    clouds: { intensity: 'light', isNight: false },
  },
  'partlycloudy-night': {
    bg: `
      radial-gradient(160% 120% at 85% -10%, hsla(260,35%,20%,.6) 0%, rgba(0,0,0,0) 55%),
      linear-gradient(180deg, hsl(235,32%,16%) 0%, hsl(242,28%,20%) 55%, hsl(250,26%,18%) 100%)
    `,
    precip: [{ kind: 'stars', intensity: 'light' }],
    clouds: { intensity: 'light', isNight: true },
  },
  cloudy: {
    bg: 'linear-gradient(180deg, hsl(210,16%,65%) 0%, hsl(210,12%,58%) 50%, hsl(210,10%,52%) 100%)',
    clouds: { intensity: 'heavy', isNight: false },
  },
  'cloudy-night': {
    bg: 'linear-gradient(180deg, hsl(230,16%,24%) 0%, hsl(235,14%,22%) 55%, hsl(240,12%,20%) 100%)',
    clouds: { intensity: 'heavy', isNight: true },
  },
  fog: {
    bg: 'linear-gradient(180deg, hsl(210,20%,85%) 0%, hsl(210,20%,80%) 45%, hsl(210,20%,76%) 100%)',
  },
  windy: {
    bg: 'linear-gradient(180deg, hsl(205,40%,78%) 0%, hsl(205,40%,72%) 50%, hsl(205,38%,66%) 100%)',
  },
  'windy-variant': {
    bg: 'linear-gradient(180deg, hsl(205,40%,78%) 0%, hsl(205,40%,72%) 50%, hsl(205,38%,66%) 100%)',
    clouds: { intensity: 'heavy', isNight: false },
  },
  hail: {
    bg: 'linear-gradient(180deg, hsl(208,28%,62%) 0%, hsl(210,28%,56%) 55%, hsl(210,28%,52%) 100%)',
    precip: [{ kind: 'hail', intensity: 'normal' }],
  },
  rainy: {
    bg: 'linear-gradient(180deg, hsl(208,32%,52%) 0%, hsl(210,30%,58%) 60%, hsl(210,28%,66%) 100%)',
    precip: [{ kind: 'rain', intensity: 'normal' }],
  },
  pouring: {
    bg: 'linear-gradient(180deg, hsl(210,24%,32%) 0%, hsl(210,22%,40%) 55%, hsl(210,22%,48%) 100%)',
    precip: [{ kind: 'rain', intensity: 'heavy' }],
  },
  lightning: {
    bg: 'linear-gradient(180deg, hsl(220,18%,18%) 0%, hsl(220,16%,28%) 55%, hsl(220,16%,36%) 100%)',
    flash: true,
  },
  'lightning-rainy': {
    bg: 'linear-gradient(180deg, hsl(220,18%,18%) 0%, hsl(220,16%,28%) 55%, hsl(220,16%,36%) 100%)',
    precip: [{ kind: 'rain', intensity: 'normal' }],
    flash: true,
  },
  snowy: {
    bg: 'linear-gradient(180deg, hsl(208 46% 74%) 0%, hsl(210,42%,96%) 55%, hsl(210,46%,98%) 100%)',
    precip: [{ kind: 'snow', intensity: 'normal' }],
  },
  'snowy-rainy': {
    bg: 'linear-gradient(180deg, hsl(212 17% 53%) 0%, hsl(210,34%,92%) 55%, hsl(210,38%,96%) 100%)',
    precip: [
      { kind: 'snow', intensity: 'light' },
      {
        kind: 'rain',
        intensity: 'normal',
        style: '--rain-r:20;--rain-g:20;--rain-b:20;--rain-a:.58;--rain-w:1.6px;--rain-h:90%',
      },
    ],
  },
  exceptional: {
    bg: 'linear-gradient(180deg, hsl(12,64%,38%) 0%, hsl(12,58%,44%) 55%, hsl(12,54%,50%) 100%)',
  },
  default: {
    bg: `
      radial-gradient(120% 80% at 50% 120%, hsla(42,92%,84%,.55) 0%, rgba(255,255,255,0) 55%),
      linear-gradient(180deg, hsl(205,60%,78%) 0%, hsl(210,62%,70%) 55%, hsl(200,58%,64%) 100%)
    `,
  },
  'default-night': {
    bg: `
      radial-gradient(120% 80% at 50% 120%, hsla(260,60%,10%,.6) 0%, rgba(0,0,0,0) 55%),
      linear-gradient(180deg, hsl(235,30%,16%) 0%, hsl(245,26%,18%) 55%, hsl(255,24%,16%) 100%)
    `,
  },
  'rainy-night': {
    bg: `
      radial-gradient(120% 80% at 50% 120%, hsla(220,44%,14%,.7) 0%, rgba(0,0,0,0) 55%),
      linear-gradient(180deg, hsl(215,22%,22%) 0%, hsl(215,20%,26%) 55%, hsl(215,18%,30%) 100%)
    `,
    precip: [{ kind: 'rain', intensity: 'normal' }],
  },
  'pouring-night': {
    bg: `
      radial-gradient(120% 80% at 50% 120%, hsla(220,44%,12%,.8) 0%, rgba(0,0,0,0) 55%),
      linear-gradient(180deg, hsl(215,20%,16%) 0%, hsl(215,18%,22%) 55%, hsl(215,16%,28%) 100%)
    `,
    precip: [{ kind: 'rain', intensity: 'heavy' }],
  },
  'hail-night': {
    bg: `
      radial-gradient(120% 80% at 50% 120%, hsla(210,36%,16%,.65) 0%, rgba(0,0,0,0) 55%),
      linear-gradient(180deg, hsl(210,24%,22%) 0%, hsl(210,22%,28%) 55%, hsl(210,20%,32%) 100%)
    `,
    precip: [{ kind: 'hail', intensity: 'normal' }],
  },
  'snowy-night': {
    bg: `
      radial-gradient(120% 80% at 50% 120%, hsla(220,28%,16%,.6) 0%, rgba(0,0,0,0) 55%),
      linear-gradient(180deg, hsl(220,20%,22%) 0%, hsl(220,18%,30%) 55%, hsl(220,16%,34%) 100%)
    `,
    precip: [{ kind: 'snow', intensity: 'normal' }],
  },
  'snowy-rainy-night': {
    bg: `
      radial-gradient(120% 80% at 50% 120%, hsla(215,28%,14%,.65) 0%, rgba(0,0,0,0) 55%),
      linear-gradient(180deg, hsl(215,18%,22%) 0%, hsl(215,18%,28%) 55%, hsl(215,16%,32%) 100%)
    `,
    precip: [
      { kind: 'snow', intensity: 'light' },
      {
        kind: 'rain',
        intensity: 'normal',
        style: '--rain-r:200;--rain-g:200;--rain-b:200;--rain-a:.66;--rain-w:1.4px;--rain-h:82%',
      },
    ],
  },
  'lightning-night': {
    bg: `
      radial-gradient(120% 80% at 50% 120%, hsla(230,32%,10%,.72) 0%, rgba(0,0,0,0) 55%),
      linear-gradient(180deg, hsl(230,18%,16%) 0%, hsl(230,18%,22%) 55%, hsl(230,16%,28%) 100%)
    `,
    flash: true,
  },
  'lightning-rainy-night': {
    bg: `
      radial-gradient(120% 80% at 50% 120%, hsla(230,32%,10%,.72) 0%, rgba(0,0,0,0) 55%),
      linear-gradient(180deg, hsl(230,18%,16%) 0%, hsl(230,18%,22%) 55%, hsl(230,16%,28%) 100%)
    `,
    precip: [{ kind: 'rain', intensity: 'normal' }],
    flash: true,
  },
  'windy-variant-night': {
    bg: 'linear-gradient(180deg, hsl(230,16%,24%) 0%, hsl(235,14%,22%) 55%, hsl(240,12%,20%) 100%)',
    clouds: { intensity: 'heavy', isNight: true },
  },
};

const keyForNight = (condition: string): string => {
  if (condition === 'clear' || condition === 'sunny') return 'clear-night';
  return condition ? `${condition}-night` : 'default-night';
};

// `conditionRaw` may already carry a `-night`/`-day` suffix (some weather
// integrations encode day/night directly in the entity state); `isNightHint`
// covers integrations that don't, derived from `forecast.is_daytime` /
// `sun.sun` / local hour by the caller (see forecast.ts's `isNight`).
export const resolveFx = (conditionRaw: string, isNightHint: boolean): FxEntry => {
  const raw = (conditionRaw || '').toLowerCase();
  const base = raw.replace(/-night$/, '').replace(/-day$/, '');
  const isNightMode = raw.endsWith('-night') || isNightHint;
  const key = isNightMode ? keyForNight(base) : base;
  return FX[key] ?? (isNightMode ? FX['default-night'] : FX.default);
};
