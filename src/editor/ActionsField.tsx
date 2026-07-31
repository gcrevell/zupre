import { HomeAssistant } from 'custom-card-helpers';
import { FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';
import { RoomAction } from 'types';
import { FormSchema, HaForm } from './HaForm';
import styles from './editor.module.css';

type Props = {
  hass?: HomeAssistant;
  actions: RoomAction[];
  onChange: (actions: RoomAction[]) => void;
};

const emptyAction: RoomAction = { icon: 'mdi:flash', enabled_entity: '', script: '' };

const ACTION_SCHEMA: FormSchema[] = [
  { name: 'icon', selector: { icon: {} } },
  { name: 'enabled_entity', selector: { entity: {} } },
  { name: 'script', selector: { entity: { domain: 'script' } } },
];

const ACTION_LABELS: Record<string, string> = {
  icon: 'Icon',
  enabled_entity: 'Enabled when',
  script: 'Script',
};

const computeActionLabel = (schema: FormSchema) => ACTION_LABELS[schema.name as string] ?? (schema.name as string);

export const ActionsField: FunctionComponent<Props> = ({ hass, actions, onChange }) => {
  // Collapse to just the header rows so a long list reads clearly as a list;
  // built by hand (rather than ha-expansion-panel) so it depends only on
  // components already known to render inside this editor.
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggle = (index: number) => setExpanded((prev) => {
    const next = new Set(prev);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    return next;
  });

  const updateAt = (index: number, patch: Partial<RoomAction>) => {
    onChange(actions.map((action, i) => (i === index ? { ...action, ...patch } : action)));
  };

  const removeAt = (index: number) => onChange(actions.filter((_, i) => i !== index));

  const add = () => {
    setExpanded((prev) => new Set(prev).add(actions.length));
    onChange([...actions, { ...emptyAction }]);
  };

  return (
    <div className={styles.actions}>
      {actions.map((action, index) => {
        const isOpen = expanded.has(index);
        return (
          <ha-card outlined key={index} className={styles.actionCard}>
            <div className={styles.actionHeader}>
              <button
                type="button"
                className={styles.actionSummary}
                aria-expanded={isOpen}
                onClick={() => toggle(index)}
              >
                <ha-icon
                  className={styles.chevron}
                  icon={isOpen ? 'mdi:chevron-down' : 'mdi:chevron-right'}
                />
                <ha-icon icon={action.icon || 'mdi:flash'} />
                <span className={styles.actionTitle}>{`Action ${index + 1}`}</span>
              </button>
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => removeAt(index)}
                aria-label="Remove action"
              >
                <ha-icon icon="mdi:delete-outline" />
              </button>
            </div>
            {isOpen && (
              <div className={styles.actionContent}>
                <HaForm
                  hass={hass}
                  data={action}
                  schema={ACTION_SCHEMA}
                  computeLabel={computeActionLabel}
                  onChange={(value) => updateAt(index, {
                    icon: String(value.icon ?? ''),
                    enabled_entity: String(value.enabled_entity ?? ''),
                    script: String(value.script ?? ''),
                  })}
                />
              </div>
            )}
          </ha-card>
        );
      })}
      <button type="button" className={styles.addBtn} onClick={add}>
        <ha-icon className={styles.addIcon} icon="mdi:plus" />
        Add action
      </button>
    </div>
  );
};
