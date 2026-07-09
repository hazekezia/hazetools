/* eslint-disable */
import { useState, useEffect } from 'react';

const HISTORY_KEY = 'hz_color_history';
const FAVORITES_KEY = 'hz_color_favorites';
const MAX_HISTORY = 20;

export const useColorHistory = () => {
  const [history, setHistory] = useState(() => {
    try {
      const item = window.localStorage.getItem(HISTORY_KEY);
      return item ? JSON.parse(item) : [];
    } catch (error) {
      return [];
    }
  });

  const [favorites, setFavorites] = useState(() => {
    try {
      const item = window.localStorage.getItem(FAVORITES_KEY);
      return item ? JSON.parse(item) : [];
    } catch (error) {
      return [];
    }
  });

  useEffect(() => {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const addHistory = (colorHex) => {
    if (!colorHex) return;
    const hex = colorHex.toLowerCase();
    setHistory(prev => {
      const filtered = prev.filter(c => c.toLowerCase() !== hex);
      return [hex, ...filtered].slice(0, MAX_HISTORY);
    });
  };

  const clearHistory = () => setHistory([]);

  const toggleFavorite = (colorHex) => {
    if (!colorHex) return;
    const hex = colorHex.toLowerCase();
    setFavorites(prev => {
      if (prev.includes(hex)) {
        return prev.filter(c => c !== hex);
      } else {
        return [hex, ...prev];
      }
    });
  };

  const isFavorite = (colorHex) => {
    if (!colorHex) return false;
    return favorites.includes(colorHex.toLowerCase());
  };

  return {
    history,
    favorites,
    addHistory,
    clearHistory,
    toggleFavorite,
    isFavorite
  };
};
