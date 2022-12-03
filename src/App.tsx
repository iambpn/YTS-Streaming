import React from 'react';
import { Outlet, Route, Routes } from 'react-router-dom';
import './App.scss';
import EntryPage from './pages/EntryPage';
import MovieDetails from './pages/MovieDetails';
import AppContextProvider from './store/AppContextProvider';

function App() {
  return (
    <React.Fragment>
      <AppContextProvider>
        <Routes>
          <Route path="/" element={<EntryPage />} />
          <Route path="movie/:id" element={<MovieDetails />} />
        </Routes>
      </AppContextProvider>
    </React.Fragment>
  );
}

export default App;
