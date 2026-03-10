// frontend-next/components/GameList.tsx
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import styles from './GameList.module.css';
import ArtworkModal from './ArtworkModal';
import SearchBar from './SearchBar';
import SortControls from './SortControls';

const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;
const imageBaseUrl = process.env.NEXT_PUBLIC_IMAGE_BASE_URL ?? '/game images';

type SearchCriteria = {
  title: string;
  developer: string;
  publisher: string;
  genre: string;
  platform: string;
};

type Game = {
  id: number;
  title: string;
  developer: string;
  publisher: string;
  genre: string;
  platform: string;
  release_date: string;
  artwork_url: string;
};

export default function GameList() {
  const [videoGamesData, setVideoGamesData] = useState<Game[]>([]);
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    title: '',
    developer: '',
    publisher: '',
    genre: '',
    platform: '',
  });
  const [selectedArtworkUrl, setSelectedArtworkUrl] = useState<string | null>(null);
  const [noResultsMessage, setNoResultsMessage] = useState('');
  const [localFilteredGames, setLocalFilteredGames] = useState<Game[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  // initial fetch
  useEffect(() => {
    fetch(`${apiUrl}/videogames`, { headers: { 'Content-Type': 'application/json' } })
      .then((res) => res.json())
      .then((data: Game[]) => {
        if (Array.isArray(data)) setVideoGamesData(data);
      })
      .catch((err: unknown) => console.error('Error fetching data:', err));
  }, []);

  const debouncedServerSearch = useCallback(
    async (criteria: SearchCriteria) => {
      try {
        const queryString = Object.entries(criteria)
          .filter(([_, value]) => value)
          .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
          .join('&');

        const res = await fetch(`${apiUrl}/videogames?${queryString}`, {
          headers: { 'Content-Type': 'application/json' },
        });
        const data: Game[] = await res.json();

        if (Array.isArray(data)) {
          setFilteredGames(data);
          setIsTyping(false);
        }
      } catch (err: unknown) {
        console.error('Error fetching filtered data:', err);
      }
    },
    []
  );

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedSearch = useCallback(
    (criteria: SearchCriteria) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        debouncedServerSearch(criteria);
      }, 500);
    },
    [debouncedServerSearch]
  );

  const handleSearch = useCallback(() => {
    const hasCriteria = Object.values(searchCriteria).some(Boolean);

    if (!hasCriteria) {
      setFilteredGames([]);
      setLocalFilteredGames([]);
      setNoResultsMessage('Please enter search criteria');
      return;
    }

    if (Array.isArray(videoGamesData)) {
      const filtered = videoGamesData.filter(game => {
        return (
          (!searchCriteria.title ||
            game.title.toLowerCase().includes(searchCriteria.title.toLowerCase())) &&
          (!searchCriteria.developer ||
            game.developer.toLowerCase().includes(searchCriteria.developer.toLowerCase())) &&
          (!searchCriteria.publisher ||
            game.publisher.toLowerCase().includes(searchCriteria.publisher.toLowerCase())) &&
          (!searchCriteria.genre ||
            game.genre.toLowerCase().includes(searchCriteria.genre.toLowerCase())) &&
          (!searchCriteria.platform ||
            game.platform.toLowerCase().includes(searchCriteria.platform.toLowerCase()))
        );
      });

      setLocalFilteredGames(filtered);
      setNoResultsMessage(
        filtered.length === 0 ? 'No results found that met search criteria' : ''
      );
    }

    debouncedSearch(searchCriteria);
  }, [searchCriteria, videoGamesData, debouncedSearch]);

  const handleTitleClick = (artworkUrl: string) => {
    if (artworkUrl.startsWith('http')) {
      setSelectedArtworkUrl(artworkUrl);
    } else {
      const normalized = artworkUrl.replace(/^\//, '');
      // If DB already includes the folder (e.g. "game images/foo.png"), use as-is to avoid duplicate path
      if (normalized.startsWith('game images/')) {
        setSelectedArtworkUrl(`/${normalized}`);
      } else {
        const base = imageBaseUrl.replace(/\/?$/, '/');
        setSelectedArtworkUrl(`${base}${artworkUrl}`);
      }
    }
  };

  const handleCloseArtwork = () => {
    setSelectedArtworkUrl(null);
  };

  return (
    <div className={styles.container}>
      <img src="/video-game-archive-logo.png" alt="Video Game Archive" className={styles.logo} />

      <SearchBar
        criteria={searchCriteria}
        onChange={(field: keyof SearchCriteria, value: string) => {
          setSearchCriteria(prev => ({ ...prev, [field]: value }));
          setIsTyping(true);
          handleSearch();
        }}
        onSearch={handleSearch}
        onClear={() => {
          setSearchCriteria({
            title: '',
            developer: '',
            publisher: '',
            genre: '',
            platform: '',
          });
          setFilteredGames([]);
          setLocalFilteredGames([]);
          setNoResultsMessage('');
        }}
      />

      <div className={styles.sortButtons}>
        <SortControls
          canSort={localFilteredGames.length > 0 || filteredGames.length > 0}
          onSortByTitle={() => {
          setFilteredGames(prev => [...prev].sort((a, b) => a.title.localeCompare(b.title)));
        }}
        onSortByReleaseDate={() => {
          setFilteredGames(prev =>
            [...prev].sort(
              (a, b) => new Date(a.release_date).getTime() - new Date(b.release_date).getTime()
            )
          );
        }}
        />
      </div>

      {noResultsMessage && !localFilteredGames.length && !filteredGames.length && (
        <div className={styles['no-results-message']}>{noResultsMessage}</div>
      )}

      {(localFilteredGames.length > 0 || filteredGames.length > 0) && (
        <table id="videogames-table" className={styles.gamesTable}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Developer</th>
              <th>Publisher</th>
              <th>Genre</th>
              <th>Release Date</th>
              <th>Platform</th>
            </tr>
          </thead>
          <tbody>
            {(isTyping ? localFilteredGames : filteredGames).map(game => (
              <tr key={game.id}>
                <td
                  onClick={() => handleTitleClick(game.artwork_url)}
                  className={styles['clickable-title']}
                >
                  {game.title}
                </td>
                <td>{game.developer}</td>
                <td>{game.publisher}</td>
                <td>{game.genre}</td>
                <td>{new Date(game.release_date).toISOString().split('T')[0]}</td>
                <td>{game.platform}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <ArtworkModal
        isOpen={!!selectedArtworkUrl}
        imageUrl={selectedArtworkUrl}
        onClose={handleCloseArtwork}
      />
    </div>
  );
}