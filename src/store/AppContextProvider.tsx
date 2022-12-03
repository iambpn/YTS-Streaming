import React, { createContext, useState } from 'react';

interface Queries {
  search: string;
  quality: string;
  genre: string;
  rating: string;
  sortBy: string;
}

interface UpdateQueries {
  search: Function;
  quality: Function;
  genre: Function;
  rating: Function;
  sortBy: Function;
}

interface IContext {
  currentQueries: Queries;
  updateQueries: UpdateQueries;
  isQueryStateModified: Function;
  currentPage: string;
  updateCurrentPage: Function;
}
const defaultQueries = {
  search: '',
  quality: 'All',
  genre: 'All',
  rating: 'All',
  sortBy: 'date_added',
};

const AppContext = createContext<IContext>({
  currentQueries: defaultQueries,
  updateQueries: {
    search: Function,
    quality: Function,
    genre: Function,
    rating: Function,
    sortBy: Function,
  },
  isQueryStateModified: Function,
  currentPage: '1',
  updateCurrentPage: Function,
});

export default function AppContextProvider(props: {
  children: React.ReactNode;
}) {
  const [search, updateSearch] = useState<string>('');
  const [quality, updateQuality] = useState<string>('All');
  const [genre, updateGenre] = useState<string>('All');
  const [rating, updateRating] = useState<string>('All');
  const [sortBy, updateSortBy] = useState<string>('date_added');
  const [currentPage, updateCurrentPage] = useState('1');

  const isQueryStateModified = (): boolean => {
    return (
      search.trim() === '' &&
      quality === 'All' &&
      genre === 'All' &&
      rating === 'All' &&
      sortBy === 'date_added'
    );
  };

  const context: IContext = {
    currentQueries: {
      search,
      quality,
      genre,
      rating,
      sortBy,
    },
    updateQueries: {
      search: updateSearch,
      quality: updateQuality,
      genre: updateGenre,
      rating: updateRating,
      sortBy: updateSortBy,
    },
    isQueryStateModified,
    currentPage,
    updateCurrentPage,
  };

  return (
    <AppContext.Provider value={context}>{props.children}</AppContext.Provider>
  );
}

export { AppContext, AppContextProvider, defaultQueries };
