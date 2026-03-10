import React, { useEffect, useState, useCallback, useMemo } from 'react';
import './game_index.css';
import axios from 'axios';
import debounce from 'lodash/debounce';

// The GameList component is the main component for the game list page.
const GameList = () => {
  const [videoGamesData, setVideoGamesData] = useState([]);
  const [filteredGames, setFilteredGames] = useState([]);
  const [searchCriteria, setSearchCriteria] = useState({
    title: '',
    developer: '',
    publisher: '',
    genre: '',
    platform: ''
  });
  const [selectedGameArtwork, setSelectedGameArtwork] = useState(null);
  const [noResultsMessage, setNoResultsMessage] = useState('');

  // Add new state for real-time filtering
  const [localFilteredGames, setLocalFilteredGames] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  const apiUrl = window.location.hostname === 'localhost'
    ? 'http://localhost:3001'
    : process.env.REACT_APP_API_URL;

  // Modified useEffect to fetch initial data
  useEffect(() => {
    axios.get(`${apiUrl}/videogames`, {
      headers: {
        'Content-Type': 'application/json',
      }
    })
    .then(response => {
      if (Array.isArray(response.data)) {
        setVideoGamesData(response.data);
      } else {
        console.error('Unexpected data format:', response.data);
      }
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    });
  }, [apiUrl]);

  // Fix the debouncedServerSearch implementation
  const debouncedServerSearch = useCallback(
    // Pass an inline function as recommended
    async (criteria) => {
      try {
        const queryString = Object.entries(criteria)
          .filter(([_, value]) => value)
          .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
          .join('&');

        const response = await axios.get(`${apiUrl}/videogames?${queryString}`, {
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (Array.isArray(response.data)) {
          setFilteredGames(response.data);
          setIsTyping(false);
        }
      } catch (error) {
        console.error('Error fetching filtered data:', error);
      }
    },
    [apiUrl, setFilteredGames, setIsTyping] // Add all dependencies
  );

  // Memoize the debounced function
  const debouncedSearch = useMemo(
    () => debounce(debouncedServerSearch, 500),
    [debouncedServerSearch]
  );

  // Update handleSearch to use the memoized debounced function
  const handleSearch = useCallback(() => {
    if (!Object.values(searchCriteria).some(Boolean)) {
      setFilteredGames([]);
      setLocalFilteredGames([]);
      setNoResultsMessage('Please enter search criteria');
      return;
    }

    // Immediate local filtering
    if (Array.isArray(videoGamesData)) {
      const filtered = videoGamesData.filter(game => {
        return (
          (!searchCriteria.title || game.title.toLowerCase().includes(searchCriteria.title.toLowerCase())) &&
          (!searchCriteria.developer || game.developer.toLowerCase().includes(searchCriteria.developer.toLowerCase())) &&
          (!searchCriteria.publisher || game.publisher.toLowerCase().includes(searchCriteria.publisher.toLowerCase())) &&
          (!searchCriteria.genre || game.genre.toLowerCase().includes(searchCriteria.genre.toLowerCase())) &&
          (!searchCriteria.platform || game.platform.toLowerCase().includes(searchCriteria.platform.toLowerCase()))
        );
      });

      setLocalFilteredGames(filtered);
      setNoResultsMessage(filtered.length === 0 ? 'No results found that met search criteria' : '');
    }

    // Use the memoized debounced search
    debouncedSearch(searchCriteria);
  }, [searchCriteria, videoGamesData, debouncedSearch, setFilteredGames, setLocalFilteredGames, setNoResultsMessage]);

  // Modified input handlers
  const handleInputChange = (field, value) => {
    setSearchCriteria(prev => ({ ...prev, [field]: value }));
    setIsTyping(true);
    handleSearch();
  };

  // Sort the games by title
  const handleSortByTitle = () => {
    const sorted = [...filteredGames].sort((a, b) => a.title.localeCompare(b.title));
    setFilteredGames(sorted);
  };

  // Sort the games by release date
  const handleSortByReleaseDate = () => {
    const sorted = [...filteredGames].sort((a, b) => new Date(a.release_date) - new Date(b.release_date));
    setFilteredGames(sorted);
  };

  // Open the artwork modal
  const handleTitleClick = artwork_url => {
    if (artwork_url.startsWith('http')) {
      setSelectedGameArtwork(artwork_url);
    } else {
      setSelectedGameArtwork(`${process.env.PUBLIC_URL}/game images/${artwork_url}`);
    }
  };

  // Close the artwork modal
  const handleCloseArtwork = () => {
    setSelectedGameArtwork(null);
  };

  // Clear the search criteria
  const handleClear = () => {
    setSearchCriteria({
      title: '',
      developer: '',
      publisher: '',
      genre: '',
      platform: ''
    });
    setFilteredGames([]);
    setLocalFilteredGames([]);
    setNoResultsMessage('');
  };

  return (
    <div className="container">
      <img src={`${process.env.PUBLIC_URL}/video-game-archive-logo.png`} alt="Video Game Archive" className="logo" />
      <div className="search-container">
        <input 
          type="text" 
          id="title" 
          value={searchCriteria.title} 
          placeholder="Search by title" 
          onChange={e => handleInputChange('title', e.target.value)} 
        />
        <input type="text" id="developer" value={searchCriteria.developer} placeholder="Search by developer" onChange={e => handleInputChange('developer', e.target.value)} />
        <input type="text" id="publisher" value={searchCriteria.publisher} placeholder="Search by publisher" onChange={e => handleInputChange('publisher', e.target.value)} />
        <input type="text" id="genre" value={searchCriteria.genre} placeholder="Search by genre" onChange={e => handleInputChange('genre', e.target.value)} />
        <input type="text" id="platform" value={searchCriteria.platform} placeholder="Search by platform" onChange={e => handleInputChange('platform', e.target.value)} />
        <div className="button-container">
          <button onClick={handleSearch}>Search</button>
          <button onClick={handleClear}>Clear</button>
        </div>
      </div>
      <div id="sort-buttons" style={{ display: (localFilteredGames.length || filteredGames.length) ? 'block' : 'none' }}>
        <button onClick={handleSortByTitle}>Sort by Title (A-Z)</button>
        <button onClick={handleSortByReleaseDate}>Sort by Release Date</button>
      </div>
      {noResultsMessage && !localFilteredGames.length && !filteredGames.length && (
        <div className="no-results-message">
          {noResultsMessage}
        </div>
      )}
      {(localFilteredGames.length > 0 || filteredGames.length > 0) && (
        <table id="videogames-table">
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
                <td onClick={() => handleTitleClick(game.artwork_url)} className="clickable-title">{game.title}</td>
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
      {selectedGameArtwork && (
        <div className="artwork-modal" onClick={handleCloseArtwork}>
          <span className="close-button" onClick={handleCloseArtwork}>&times;</span>
          <img src={selectedGameArtwork} alt="Game Artwork" className="artwork-image" />
        </div>
      )}
    </div>
  );
};

export default GameList;