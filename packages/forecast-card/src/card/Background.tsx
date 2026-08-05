import { FunctionComponent } from 'preact';
import { useMemo } from 'preact/hooks';
import { CloudStyle } from '../types';
import { resolveFx } from './weatherFx';
import { Particles } from './Particles';
import { Clouds } from './Clouds';
import { CssClouds } from './CssClouds';
import styles from './card.module.css';

type Props = {
  condition: string;
  isNight: boolean;
  windSpeed?: number;
  windBearing?: number;
  precipitation?: number;
  animationsEnabled: boolean;
  cloudStyle: CloudStyle;
};

// Two flashes with independently-random delays, matching the original
// module's lightning effect. A separate component (rather than inlining the
// Math.random() calls in Background) so its useMemo only re-rolls the
// delays when it actually (re)mounts — Background itself re-renders on
// every hass tick, which would otherwise reshuffle the flash timing
// constantly.
const Flash: FunctionComponent = () => {
  const delays = useMemo(() => [1 + Math.random() * 3, 1 + Math.random() * 3], []);
  return (
    <>
      <div className={styles.flash} style={{ animationDelay: `${delays[0].toFixed(2)}s` }} />
      <div className={styles.flash} style={{ animationDelay: `${delays[1].toFixed(2)}s` }} />
    </>
  );
};

export const Background: FunctionComponent<Props> = ({
  condition, isNight, windSpeed, windBearing, precipitation, animationsEnabled, cloudStyle,
}) => {
  const fx = resolveFx(condition, isNight);

  return (
    <div className={styles.background} style={{ backgroundImage: fx.bg }}>
      {animationsEnabled && fx.precip?.map((spec) => (
        <Particles
          key={`${spec.kind}-${spec.intensity}`}
          kind={spec.kind}
          intensity={spec.intensity}
          precipitation={spec.kind === 'rain' ? precipitation : undefined}
          styleOverride={spec.style}
        />
      ))}
      {animationsEnabled && fx.clouds && cloudStyle === 'image' && (
        <Clouds
          intensity={fx.clouds.intensity}
          isNight={fx.clouds.isNight}
          windSpeed={windSpeed}
          windBearing={windBearing}
        />
      )}
      {animationsEnabled && fx.clouds && cloudStyle === 'css' && (
        <CssClouds intensity={fx.clouds.intensity} isNight={fx.clouds.isNight} />
      )}
      {animationsEnabled && fx.flash && <Flash />}
    </div>
  );
};
