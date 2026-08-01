import { HomeAssistant } from 'custom-card-helpers';
import { FunctionComponent } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import { Config } from 'types';
import { FormSchema, HaForm } from '@zupre/core';
import { ActionsField } from './ActionsField';
import { Tabs } from './Tabs';
import styles from './editor.module.css';

type Props = {
  config: Config;
  hass?: HomeAssistant;
  onChange: (config: Config) => void;
};

const LABELS: Record<string, string> = {
  name: 'Name',
  brightness_entity: 'Brightness entity (optional)',
  icon: 'Icon',
  icon_action_type: 'Tap action',
  icon_action_path: 'Navigate path',
};

const computeLabel = (schema: FormSchema) => LABELS[schema.name as string] ?? (schema.name as string);

// One field per form so the spacing between them is governed by our own
// container `gap` rather than ha-form's large fixed inter-row margin.
const NAME_SCHEMA: FormSchema[] = [{ name: 'name', required: true, selector: { text: {} } }];
const BRIGHTNESS_SCHEMA: FormSchema[] = [
  { name: 'brightness_entity', selector: { entity: { domain: 'input_number' } } },
];

const TABS = ['General', 'Actions'];

export const Editor: FunctionComponent<Props> = ({ config, hass, onChange }) => {
  const [tab, setTab] = useState(0);

  const iconActionType = config.icon_action?.type ?? 'none';
  const iconActionPath = config.icon_action?.type === 'navigate' ? config.icon_action.path : '';

  const nameData = useMemo(() => ({ name: config.name ?? '' }), [config.name]);
  const brightnessData = useMemo(
    () => ({ brightness_entity: config.brightness_entity ?? '' }),
    [config.brightness_entity],
  );

  const handleNameChange = (value: Record<string, unknown>) => {
    onChange({ ...config, name: String(value.name ?? '') });
  };

  const handleBrightnessChange = (value: Record<string, unknown>) => {
    onChange({ ...config, brightness_entity: (value.brightness_entity as string) || undefined });
  };

  const iconData = useMemo(() => ({
    icon: config.icon ?? '',
    icon_action_type: iconActionType,
    icon_action_path: iconActionPath,
  }), [config.icon, iconActionType, iconActionPath]);

  // Fields are stacked (not gridded) so the tap-action dropdown and its
  // conditional navigate path each get their own full-width line.
  const iconSchema = useMemo<FormSchema[]>(() => [
    { name: 'icon', selector: { icon: {} } },
    {
      name: 'icon_action_type',
      selector: {
        select: {
          mode: 'dropdown',
          options: [
            { value: 'none', label: 'None' },
            { value: 'navigate', label: 'Navigate' },
          ],
        },
      },
    },
    ...(iconActionType === 'navigate'
      ? [{ name: 'icon_action_path', selector: { text: {} } }]
      : []),
  ], [iconActionType]);

  const handleIconChange = (value: Record<string, unknown>) => {
    onChange({
      ...config,
      icon: String(value.icon ?? ''),
      icon_action: value.icon_action_type === 'navigate'
        ? { type: 'navigate', path: String(value.icon_action_path ?? '') }
        : undefined,
    });
  };

  return (
    <div className={styles.root}>
      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 0 ? (
        <div className={styles.tabPanel}>
          <div className={styles.fields}>
            <HaForm
              hass={hass}
              data={nameData}
              schema={NAME_SCHEMA}
              computeLabel={computeLabel}
              onChange={handleNameChange}
            />
            <HaForm
              hass={hass}
              data={brightnessData}
              schema={BRIGHTNESS_SCHEMA}
              computeLabel={computeLabel}
              onChange={handleBrightnessChange}
            />
          </div>

          <div className={styles.group}>
            <div className={styles.groupTitle}>Icon</div>
            <HaForm
              hass={hass}
              data={iconData}
              schema={iconSchema}
              computeLabel={computeLabel}
              onChange={handleIconChange}
            />
          </div>
        </div>
      ) : (
        <div className={styles.tabPanel}>
          <div className={styles.intro}>
            <div className={styles.introTitle}>Actions</div>
            <div className={styles.introSubtitle}>
              Quick-action buttons shown on the card. Each runs a script and can
              reflect an entity&apos;s state.
            </div>
          </div>
          <ActionsField
            hass={hass}
            actions={config.actions ?? []}
            onChange={(actions) => onChange({ ...config, actions: actions.length ? actions : undefined })}
          />
        </div>
      )}
    </div>
  );
};
