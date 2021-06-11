import React, {useEffect, useState} from 'react';
import './App.scss';
import Heading from "./components/header/Heading";
import SearchAndFilterBox from "./components/search/SearchAndFilterBox";
import MovieList from "./components/movielist/MovieList";
import Spinner from "./components/spinner/Spinner";

function App() {
    const [searchResponse, updateSearchResponse] = useState<any>("");
    const [loading, updateLoading] = useState(false);
    const [previousURL, updatePreviousUrl] = useState<URL>(new URL("https://yts.mx/api/v2/list_movies.json"));
    const [currentPage, updateCurrentPage] = useState("1");


    let fetchData = (url: URL) => {
        updatePreviousUrl(url);
        updateLoading(true);
        fetch(url.href)
            .then(res => res.json())
            .then(data => {
                updateSearchResponse(data);
                updateLoading(false);
            })
            .catch((err) => {
                updateSearchResponse(err.toString());
            })
    }

    let handlePageChange = (page: string) => {
        updateCurrentPage(page);
        previousURL.searchParams.set("page", page);
        fetchData(previousURL);
    }

    useEffect(() => {
        // previous URL is used as the base url because thi runs at start so previous url is not updated
        fetchData(previousURL);
    }, [])
    return (
        <React.Fragment>
            <Heading/>
            <SearchAndFilterBox fetchData={fetchData}/>
            {
                loading
                    ? <Spinner/>
                    : <MovieList movieListOrError={searchResponse} handlePageChange={handlePageChange} currentPage={currentPage}/>
            }
            {/*footer*/}
        </React.Fragment>
    );
}

export default App;
