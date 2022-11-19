import React from 'react';
import { Outlet } from 'react-router-dom';
import './App.scss';
import AppContextProvider from './store/AppContextProvider';

function App() {
  return (
    <React.Fragment>
      <AppContextProvider>
        <Outlet />
      </AppContextProvider>
    </React.Fragment>
  );
}

export default App;
