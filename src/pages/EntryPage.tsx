import React, {useContext, useEffect, useState} from "react";
import SearchAndFilterBox from "../components/search/SearchAndFilterBox";
import Spinner from "../components/spinner/Spinner";
import MovieList from "../components/movielist/MovieList";
import Heading from "../components/header/Heading";
import {AppContext} from "../store/AppContextProvider";

export default function EntryPage() {
    const [searchResponse, updateSearchResponse] = useState<any>("");
    const [loading, updateLoading] = useState(false);
    const [previousURL, updatePreviousUrl] = useState<URL>(new URL("https://yts.mx/api/v2/list_movies.json"));
    const context = useContext(AppContext);

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
        context.updateCurrentPage(page);
        previousURL.searchParams.set("page", page);
        fetchData(previousURL);
    }

    useEffect(() => {
            if (context.isQueryStateModified) {
                if (context.currentQueries.search.trim() !== "") {
                    previousURL.searchParams.set("query_term", context.currentQueries.search)
                }
                if (context.currentQueries.quality.toLowerCase() !== "all") {
                    previousURL.searchParams.set("quality", context.currentQueries.quality);
                }
                if (context.currentQueries.genre.toLowerCase() !== "all") {
                    previousURL.searchParams.set("genre", context.currentQueries.genre);
                }
                if (context.currentQueries.rating.toLowerCase() !== "all") {
                    previousURL.searchParams.set("minimum_rating", context.currentQueries.rating.replace("+", ""));
                }
                if (context.currentQueries.sortBy.toLowerCase() !== "date_added") {
                    previousURL.searchParams.set("sort_by", context.currentQueries.sortBy);
                }
            }
            fetchData(previousURL);
        }, []
    )
    return (
        <React.Fragment>
            <Heading/>
            <SearchAndFilterBox fetchData={fetchData}/>
            {
                loading
                    ? <Spinner/>
                    : <MovieList movieListOrError={searchResponse} handlePageChange={handlePageChange}
                                 currentPage={context.currentPage}/>
            }
            {/*footer*/}
        </React.Fragment>
    );
}