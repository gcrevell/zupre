import { FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';
import { useEntity, useHass } from 'hooks';
import styles from './card.module.css';

const FRACTIONS = [1, 2 / 3, 1 / 3];

type Props = {
  entity: string;
  locked?: boolean;
};

export const BrightnessControl: FunctionComponent<Props> = ({ entity, locked }) => {
  const hass = useHass();
  const inputNumber = useEntity(entity);
  const [hovered, setHovered] = useState<number | undefined>(undefined);
  const min = Number(inputNumber?.attributes.min ?? 0);
  const max = Number(inputNumber?.attributes.max ?? 100);
  const range = max - min;
  const currentValue = Number(inputNumber?.state);

  const levels = FRACTIONS.map((fraction, index) => ({
    value: 3 - index,
    target: min + range * fraction,
  }));

  const currentFraction = range > 0 ? (currentValue - min) / range : 0;
  const selected = Number.isFinite(currentValue) && currentFraction > 0
    ? levels.reduce((closest, level) => (
      Math.abs(level.target - currentValue) < Math.abs(closest.target - currentValue) ? level : closest
    )).value
    : undefined;

  // A segment is "active" if it's at or below the selected level (untouched by
  // hover). Hovering previews extending the fill up to the hovered level, but
  // only for segments beyond what's already active — segments already active
  // stay active-colored rather than flipping to the hover color.
  const activeFloor = selected ?? 0;
  const previewFloor = hovered !== undefined ? Math.max(activeFloor, hovered) : activeFloor;

  const setLevel = (target: number) => {
    if (locked) return;
    hass?.callService('input_number', 'set_value', { entity_id: entity, value: target });
  };

  return (
    <div className={styles.brightness} role="radiogroup" aria-label="Brightness">
      {levels.map(({ value: level, target }) => {
        const isActive = level <= activeFloor;
        const isPreview = !isActive && level <= previewFloor;
        return (
          <label
            key={level}
            className={`${styles.brightnessSeg} ${isActive ? styles.brightnessSegActive : ''} ${isPreview ? styles.brightnessSegHover : ''}`}
            onMouseEnter={() => setHovered(level)}
            onMouseLeave={() => setHovered(undefined)}
          >
            <input
              type="radio"
              name={`lvl-${entity}`}
              checked={selected === level}
              onChange={() => setLevel(target)}
            />
            <span />
          </label>
        );
      })}
    </div>
  );
};
