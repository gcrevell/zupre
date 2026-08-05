import { FunctionComponent } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { Intensity } from './weatherFx';
import cloudSprite from './assets/cloud.png';
import styles from './card.module.css';

type Props = {
  intensity: Intensity;
  isNight: boolean;
  windSpeed?: number;
  windBearing?: number;
};

const MAX_CLOUDS = 18;
const COUNT_MAP: Record<Intensity, number> = { light: 6, normal: 8, heavy: 12 };
const DAY_OPACITY: Record<Intensity, number> = { light: 0.65, normal: 0.5, heavy: 0.4 };

type Cloud = {
  width: number;
  height: number;
  topPercent: number;
  opacity: number;
  speed: number;
  offset: number;
};

const makeClouds = (): Cloud[] => {
  const clouds = Array.from({ length: MAX_CLOUDS }, (_, i): Cloud => {
    const width = Math.floor(Math.random() * 180) + 140;
    return {
      width,
      height: Math.floor(width * 0.6),
      topPercent: Math.random() * 0.6 - 0.4,
      opacity: Math.random() * 0.35 + 0.5,
      speed: 0.012 + Math.random() * 0.028,
      offset: i / MAX_CLOUDS + Math.random() * 0.08,
    };
  });
  return clouds.sort((a, b) => a.opacity - b.opacity);
};

// Module-level cache: the day sprite decodes once and the night variant (a
// canvas hue-shifted copy) is computed once from it, then shared by every
// Clouds instance on the dashboard instead of redone per card/mount.
let cachedDayImg: HTMLImageElement | null = null;
let cachedNightCanvas: HTMLCanvasElement | null = null;
let loadPromise: Promise<void> | null = null;

const createNightCloud = (img: HTMLImageElement): HTMLCanvasElement | null => {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const offscreen = document.createElement('canvas');
  offscreen.width = w;
  offscreen.height = h;
  const octx = offscreen.getContext('2d');
  if (!octx) return null;

  octx.drawImage(img, 0, 0);
  const imageData = octx.getImageData(0, 0, w, h);
  const { data } = imageData;

  const hueShift = (215 * Math.PI) / 180;
  const cosH = Math.cos(hueShift);
  const sinH = Math.sin(hueShift);

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    r *= 0.4;
    g *= 0.4;
    b *= 0.4;

    r = ((r / 255 - 0.5) * 1.25 + 0.5) * 255;
    g = ((g / 255 - 0.5) * 1.25 + 0.5) * 255;
    b = ((b / 255 - 0.5) * 1.25 + 0.5) * 255;

    const rr = r;
    const gg = g;
    const bb = b;
    r = rr * (0.213 + cosH * 0.787 - sinH * 0.213)
      + gg * (0.715 - cosH * 0.715 - sinH * 0.715)
      + bb * (0.072 - cosH * 0.072 + sinH * 0.928);
    g = rr * (0.213 - cosH * 0.213 + sinH * 0.143)
      + gg * (0.715 + cosH * 0.285 + sinH * 0.14)
      + bb * (0.072 - cosH * 0.072 - sinH * 0.283);
    b = rr * (0.213 - cosH * 0.213 - sinH * 0.787)
      + gg * (0.715 - cosH * 0.715 + sinH * 0.715)
      + bb * (0.072 + cosH * 0.928 + sinH * 0.072);

    data[i] = Math.max(0, Math.min(255, r));
    data[i + 1] = Math.max(0, Math.min(255, g));
    data[i + 2] = Math.max(0, Math.min(255, b));
  }

  octx.putImageData(imageData, 0, 0);
  return offscreen;
};

const loadCloudImage = (): Promise<void> => {
  if (!loadPromise) {
    loadPromise = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        cachedDayImg = img;
        cachedNightCanvas = createNightCloud(img);
        resolve();
      };
      img.onerror = () => resolve();
      img.src = cloudSprite;
    });
  }
  return loadPromise;
};

export const Clouds: FunctionComponent<Props> = ({
  intensity, isNight, windSpeed, windBearing,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cloudsRef = useRef<Cloud[] | undefined>(undefined);
  if (!cloudsRef.current) cloudsRef.current = makeClouds();

  useEffect(() => {
    const canvas = canvasRef.current;
    const clouds = cloudsRef.current;
    if (!canvas || !clouds) return undefined;

    let animId: number | null = null;
    let lastTime = 0;
    let visible = true;
    let cancelled = false;

    const bearing = windBearing ?? NaN;
    const direction = !Number.isNaN(bearing) && bearing >= 0 && bearing <= 180 ? -1 : 1;
    const speedMultiplier = 1 + Math.max(0, windSpeed ?? 0) * 0.02;
    const targetCount = Math.min(MAX_CLOUDS, COUNT_MAP[intensity] ?? 8);
    const dayOpacityFactor = DAY_OPACITY[intensity] ?? 0.5;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.floor(rect.width);
      const h = Math.floor(rect.height);
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }
      return { w, h, dpr };
    };

    const animate = (timestamp: number) => {
      if (cancelled || !visible || document.hidden) {
        animId = null;
        return;
      }

      const delta = lastTime ? Math.min((timestamp - lastTime) / 16.67, 3) : 1;
      lastTime = timestamp;

      const { w, h, dpr } = resize();
      const ctx = w > 0 && h > 0 ? canvas.getContext('2d', { alpha: true }) : null;
      const img = isNight && cachedNightCanvas ? cachedNightCanvas : cachedDayImg;

      if (!ctx || !img) {
        animId = requestAnimationFrame(animate);
        return;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < targetCount; i += 1) {
        const cloud = clouds[i];
        cloud.offset += cloud.speed * speedMultiplier * direction * delta * 0.01;

        if (direction > 0 && cloud.offset > 1.3) {
          cloud.offset = -0.3 - cloud.width / w;
        } else if (direction < 0 && cloud.offset < -0.3 - cloud.width / w) {
          cloud.offset = 1.3;
        }

        const x = cloud.offset * w;
        const y = cloud.topPercent * h;
        ctx.globalAlpha = isNight ? cloud.opacity * 0.5 : cloud.opacity * dayOpacityFactor;
        ctx.drawImage(img, x, y, cloud.width, cloud.height);
      }
      ctx.globalAlpha = 1;

      animId = requestAnimationFrame(animate);
    };

    const start = () => {
      if (animId == null) {
        lastTime = 0;
        animId = requestAnimationFrame(animate);
      }
    };
    const stop = () => {
      if (animId != null) {
        cancelAnimationFrame(animId);
        animId = null;
      }
    };

    loadCloudImage().then(() => {
      if (!cancelled) start();
    });

    const handleVisibility = () => {
      visible = !document.hidden;
      if (visible) start(); else stop();
    };
    document.addEventListener('visibilitychange', handleVisibility, { passive: true });

    let observer: IntersectionObserver | null = null;
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver((entries) => {
        visible = entries[0]?.isIntersecting ?? true;
        if (visible) start(); else stop();
      }, { threshold: 0 });
      observer.observe(canvas);
    }

    return () => {
      cancelled = true;
      stop();
      document.removeEventListener('visibilitychange', handleVisibility);
      observer?.disconnect();
    };
  }, [intensity, isNight, windSpeed, windBearing]);

  return <canvas ref={canvasRef} className={styles.cloudCanvas} />;
};
