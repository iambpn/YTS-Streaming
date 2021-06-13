import React from 'react';
import {Route, Switch} from "react-router-dom"
import './App.scss';
import EntryPage from "./pages/EntryPage";
import MovieDetails from "./pages/MovieDetails";
import AppContextProvider from "./store/AppContextProvider";

function App() {
    return (
        <React.Fragment>
            <AppContextProvider>
                <Switch>
                    <Route component={EntryPage} path={"/"} exact={true}/>
                    <Route component={MovieDetails} path={"/movie"} exact={true}/>
                </Switch>
            </AppContextProvider>
        </React.Fragment>
    );
}

export default App;
