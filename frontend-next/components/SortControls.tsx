'use client';

type Props = {
  canSort: boolean;
  onSortByTitle: () => void;
  onSortByReleaseDate: () => void;
};

export default function SortControls({ canSort, onSortByTitle, onSortByReleaseDate }: Props) {
  if (!canSort) return null;

  return (
    <div id="sort-buttons">
      <button onClick={onSortByTitle}>Sort by Title (A–Z)</button>
      <button onClick={onSortByReleaseDate}>Sort by Release Date</button>
    </div>
  );
}