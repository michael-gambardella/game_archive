'use client';

import styles from './GameList.module.css';

type SearchCriteria = {
  title: string;
  developer: string;
  publisher: string;
  genre: string;
  platform: string;
};

type Props = {
  criteria: SearchCriteria;
  onChange: (field: keyof SearchCriteria, value: string) => void;
  onSearch: () => void;
  onClear: () => void;
};

export default function SearchBar({ criteria, onChange, onSearch, onClear }: Props) {
  return (
    <div className={styles['search-container']}>
      <input
        type="text"
        value={criteria.title}
        placeholder="Search by title"
        onChange={e => onChange('title', e.target.value)}
      />
      <input
        type="text"
        value={criteria.developer}
        placeholder="Search by developer"
        onChange={e => onChange('developer', e.target.value)}
      />
      <input
        type="text"
        value={criteria.publisher}
        placeholder="Search by publisher"
        onChange={e => onChange('publisher', e.target.value)}
      />
      <input
        type="text"
        value={criteria.genre}
        placeholder="Search by genre"
        onChange={e => onChange('genre', e.target.value)}
      />
      <input
        type="text"
        value={criteria.platform}
        placeholder="Search by platform"
        onChange={e => onChange('platform', e.target.value)}
      />
      <div className={styles['button-container']}>
        <button onClick={onSearch}>Search</button>
        <button onClick={onClear}>Clear</button>
      </div>
    </div>
  );
}