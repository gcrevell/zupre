import { useConfig, useEntity, useUser } from 'hooks';
import { FunctionComponent } from 'preact';
import styles from './card.module.css';

const Card: FunctionComponent = () => {
  const sun = useEntity('sun.sun');
  const config = useConfig();
  const user = useUser();

  return (
    <div class={styles.root}>
      <p class={styles.text}>
        <b>
          Hi,
          {' '}
          { user?.name }
          !
        </b>
      </p>
      <p class={styles.text}><b>{ sun?.attributes.friendly_name }</b></p>
      <p class={styles.text}>{ sun?.state }</p>
      <pre>
        { JSON.stringify(config || {}, null, 2) }
      </pre>
    </div>
  );
};

export default Card;
