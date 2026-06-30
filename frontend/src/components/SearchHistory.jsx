import React from 'react';

const SearchHistory = ({ favorites, history, onSelectCity, onRemoveFavorite, onClearHistory }) => {
  return (
    <div className="sidebar-panel">
      {/* Favorites Section */}
      <div className="list-section">
        <div className="list-title">
          <span>Favorite Cities</span>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            width="14" 
            height="14"
            style={{ color: '#ff4757' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        </div>
        
        {favorites.length === 0 ? (
          <div className="empty-list-msg">No favorite cities yet. Star a city to save it!</div>
        ) : (
          <ul className="city-list">
            {favorites.map((city) => (
              <li 
                key={city._id || `${city.lat}-${city.lon}`} 
                className="city-item animate-fade-in"
                onClick={() => onSelectCity(city)}
              >
                <div className="city-item-info">
                  <span className="city-item-name">{city.name}</span>
                  <span className="city-item-country">
                    {city.country}{city.state ? `, ${city.state}` : ''}
                  </span>
                </div>
                <button 
                  className="delete-item-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFavorite(city);
                  }}
                  title="Remove from favorites"
                  aria-label="Delete favorite"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="currentColor" 
                    viewBox="0 0 24 24" 
                    width="14" 
                    height="14"
                  >
                    <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* History Section */}
      <div className="list-section" style={{ marginTop: '1rem' }}>
        <div className="list-title">
          <span>Recent Searches</span>
          {history.length > 0 && (
            <button className="clear-btn" onClick={onClearHistory}>
              Clear
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="empty-list-msg">No recent searches. Try searching for a city!</div>
        ) : (
          <ul className="city-list">
            {history.map((city) => (
              <li 
                key={city._id || `${city.lat}-${city.lon}-${city.createdAt}`} 
                className="city-item animate-fade-in"
                onClick={() => onSelectCity(city)}
              >
                <div className="city-item-info">
                  <span className="city-item-name">{city.name}</span>
                  <span className="city-item-country">
                    {city.country}{city.state ? `, ${city.state}` : ''}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SearchHistory;
