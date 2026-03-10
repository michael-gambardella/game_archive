'use client';

import styles from './GameList.module.css';

type Props = {
  isOpen: boolean;
  imageUrl: string | null;
  onClose: () => void;
};

export default function ArtworkModal({ isOpen, imageUrl, onClose }: Props) {
  if (!isOpen || !imageUrl) return null;

  return (
    <div className={styles['artwork-modal']} onClick={onClose}>
      <span className={styles['close-button']} onClick={onClose}>
        &times;
      </span>
      <img src={imageUrl} alt="Game Artwork" className={styles['artwork-image']} />
    </div>
  );
}