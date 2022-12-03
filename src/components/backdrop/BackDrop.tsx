import React from 'react';
import styles from './BackDrop.module.scss';

interface BackDropProps {
  onClick: Function;
}

function BackDrop(props: BackDropProps) {
  return (
    <div
      className={styles.backdrop}
      onClick={() => {
        props.onClick();
      }}
    />
  );
}

export default BackDrop;
