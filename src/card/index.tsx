import { useConfig, useEntity, useUser } from 'hooks';
import { FunctionComponent } from 'preact';
import styles from './card.module.css';

export const Card: FunctionComponent = () => {
  const sun = useEntity('sun.sun');
  const config = useConfig();
  const user = useUser();

  return (
    <div className={styles.root}>
      <p className={styles.text}>
        <b>
          Hi,
          {' '}
          { user?.name }
          !
        </b>
      </p>
      <p className={styles.text}><b>{ sun?.attributes.friendly_name }</b></p>
      <p className={styles.text}>{ sun?.state }</p>
      <pre>
        { JSON.stringify(config || {}, null, 2) }
      </pre>
    </div>
  );
};
