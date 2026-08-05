import { FunctionComponent } from 'preact';
import { useMemo } from 'preact/hooks';
import { Intensity, PrecipKind } from './weatherFx';
import styles from './card.module.css';

type Props = {
  kind: PrecipKind;
  intensity: Intensity;
  // mm of precipitation from the current entity's attributes — only used to
  // scale rain particle count, mirroring the original module's "heavier
  // rain when precipitation is reported" behavior.
  precipitation?: number;
  // Raw `--custom-property:value;...` string carried on a condition's
  // PrecipSpec (used by snowy-rainy to darken/thin its rain layer).
  styleOverride?: string;
};

type ParticleStyle = Record<string, string | number>;

const COUNTS: Record<PrecipKind, Record<Intensity, number>> = {
  rain: { light: 16, normal: 26, heavy: 44 },
  snow: { light: 72, normal: 120, heavy: 180 },
  hail: { light: 14, normal: 22, heavy: 34 },
  stars: { light: 14, normal: 32, heavy: 46 },
};

const rand = (max: number) => Math.random() * max;

const parseStyleOverride = (style?: string): ParticleStyle => {
  if (!style) return {};
  return Object.fromEntries(
    style
      .split(';')
      .map((pair) => pair.trim())
      .filter(Boolean)
      .map((pair) => {
        const [key, value] = pair.split(':');
        return [key.trim(), value.trim()];
      }),
  );
};

const buildRain = (count: number, invert: boolean, overrides: ParticleStyle): ParticleStyle[] => {
  const step = 100 / count;
  return Array.from({ length: count }, (_, i) => {
    const pos = i * step + rand(step * 0.6);
    const side = invert ? 'right' : 'left';
    const base = 1.1 + rand(0.7);
    return {
      ...overrides,
      [side]: `${pos}%`,
      bottom: `${100 + Math.floor(rand(40))}%`,
      '--d': `${base.toFixed(2)}s`,
      '--dl': `-${rand(base).toFixed(2)}s`,
    };
  });
};

const buildSnow = (count: number, scale: number, opacity: number): ParticleStyle[] => Array.from(
  { length: count },
  () => {
    const base = 14 + rand(12);
    const size = Math.min(4, (rand(2.5) + 1.5) * scale);
    const op = Math.min(1, Math.max(0.9, opacity));
    return {
      left: `${rand(100).toFixed(2)}%`,
      top: `${-150 - Math.floor(rand(200))}px`,
      '--d': `${base.toFixed(2)}s`,
      '--dl': `-${rand(base).toFixed(2)}s`,
      '--drift': `${(rand(36) - 18).toFixed(1)}px`,
      width: `${size.toFixed(1)}px`,
      height: `${size.toFixed(1)}px`,
      opacity: op.toFixed(2),
    };
  },
);

const buildHail = (count: number, scale: number): ParticleStyle[] => Array.from(
  { length: count },
  () => {
    const base = 2.4 + rand(1.8);
    const size = Math.min(4, Math.max(2, (rand(2) + 2) * scale));
    return {
      left: `${rand(100).toFixed(2)}%`,
      top: `${-120 - Math.floor(rand(160))}px`,
      '--d': `${base.toFixed(2)}s`,
      '--dl': `-${rand(base).toFixed(2)}s`,
      '--drift': `${(rand(8) - 4).toFixed(1)}px`,
      width: `${size.toFixed(1)}px`,
      height: `${size.toFixed(1)}px`,
      opacity: 1,
    };
  },
);

const buildStars = (count: number, scale: number, opacity: number): ParticleStyle[] => Array.from(
  { length: count },
  () => {
    const base = 2 + rand(3);
    const size = (rand(1.8) + 0.6) * scale;
    const op = Math.min(1, Math.max(0.35, opacity * Math.random()));
    return {
      left: `${rand(100).toFixed(2)}%`,
      top: `${rand(50).toFixed(2)}%`,
      width: `${size.toFixed(2)}px`,
      height: `${size.toFixed(2)}px`,
      opacity: op.toFixed(2),
      '--d': `${base.toFixed(2)}s`,
      '--dl': `-${rand(base).toFixed(2)}s`,
    };
  },
);

const KIND_CLASS: Record<PrecipKind, string> = {
  rain: styles.particleRain,
  snow: styles.particleSnow,
  hail: styles.particleHail,
  stars: styles.particleStar,
};

// Front/back rows give a cheap parallax look. Generated once per
// [kind, intensity, count] via useMemo so the random layout doesn't reshuffle
// on every re-render — this card's `hass` prop changes on every HA state
// update anywhere in the system, so without memoizing, particles would jump
// to new positions constantly instead of animating smoothly.
export const Particles: FunctionComponent<Props> = ({
  kind, intensity, precipitation, styleOverride,
}) => {
  const count = useMemo(() => {
    const base = COUNTS[kind][intensity];
    if (kind === 'rain' && precipitation != null && !Number.isNaN(precipitation) && precipitation > 0) {
      return Math.min(200, Math.max(10, Math.floor(precipitation * 8 + 10)));
    }
    return base;
  }, [kind, intensity, precipitation]);

  const overrides = useMemo(() => parseStyleOverride(styleOverride), [styleOverride]);

  const { front, back } = useMemo(() => {
    switch (kind) {
      case 'rain':
        return { front: buildRain(count, false, overrides), back: buildRain(count, true, overrides) };
      case 'snow':
        return { front: buildSnow(count, 1, 1), back: buildSnow(count, 0.8, 0.75) };
      case 'hail':
        return { front: buildHail(count, 1), back: buildHail(count, 0.9) };
      case 'stars':
      default:
        return { front: buildStars(count, 1, 1), back: buildStars(count, 0.85, 0.7) };
    }
  }, [kind, count, overrides]);

  const particleClass = KIND_CLASS[kind];
  const wrapClass = kind === 'stars' ? `${styles.particleWrap} ${styles.particleWrapStars}` : styles.particleWrap;

  return (
    <div className={wrapClass}>
      <div className={styles.particleRow}>
        {front.map((style, i) => (
          <div key={i} className={particleClass} style={style} />
        ))}
      </div>
      <div className={`${styles.particleRow} ${styles.particleRowBack}`}>
        {back.map((style, i) => (
          <div key={i} className={particleClass} style={style} />
        ))}
      </div>
    </div>
  );
};
