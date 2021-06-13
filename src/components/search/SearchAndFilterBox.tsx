import React, {useEffect, useRef, useContext} from "react";
import Filter from "./Filter";
import {AppContext} from "../../store/AppContextProvider";

const FilterTypes = {
    "quality": ["All", "720p", "1080p", "2160p", "3D"],
    "genre": ["All", "Action", "Adventure", "Animation", "Biography", "Comedy", "Crime", "Documentary", "Drama",
        "Family", "Fantasy", "Film-Noir", "Game-Show", "History", "Horror", "Music", "Musical", "Mystery", "News",
        "Reality-TV", "Romance", "Sci-Fi", "Sport", "Talk-Show", "Thriller", "War", "Western"],
    "rating": ["All", "9+", "8+", "7+", "6+", "5+", "4+", "3+", "2+", "1+"],
    "sort by": ["date_added", "download_count", "like_count", "title", "year", "rating", "peers", "seeds"]
}
const Base_URL = "https://yts.mx/api/v2/list_movies.json";

type SearchAndFilterBoxProps = {
    fetchData: Function
}

export default function SearchAndFilterBox(props: SearchAndFilterBoxProps) {
    //extracting data from context (AppContext)
    const context = useContext(AppContext);
    const [searchInput,quality,genre,rating,sortBy] = [
        context.currentQueries.search,
        context.currentQueries.quality,
        context.currentQueries.genre,
        context.currentQueries.rating,
        context.currentQueries.sortBy
    ];

    const [updateSearchInput,updateQuality,updateGenre,updateRating,updateSortBy] = [
        context.updateQueries.search,
        context.updateQueries.quality,
        context.updateQueries.genre,
        context.updateQueries.rating,
        context.updateQueries.sortBy
    ];

    let handleSearchInput = (e: React.FormEvent<HTMLInputElement>) => {
        updateSearchInput(e.currentTarget.value);
    }

    let handleEnterKey = (keyCode: string) => {
        if (keyCode.toLowerCase() === "enter") {
            handleSearch();
        }
    }

    let resetStates = () => {
        updateQuality("All");
        updateGenre("All");
        updateRating("All");
        updateSortBy("date_added");
    }

    let handleSearch = () => {
        let url = new URL(Base_URL);
        url.searchParams.set("query_term", searchInput)
        resetStates();
        props.fetchData(url);
    }

    let initial = useRef<boolean>(true);
    useEffect(() => {
        if (initial.current) {
            initial.current = false;
        } else {
            // run only on update
            let url = new URL(Base_URL);
            if (searchInput.trim() !== "") {
                url.searchParams.set("query_term", searchInput)
            }
            if (quality.toLowerCase() !== "all") {
                url.searchParams.set("quality", quality);
            }
            if (genre.toLowerCase() !== "all") {
                url.searchParams.set("genre", genre);
            }
            if (rating.toLowerCase() !== "all") {
                url.searchParams.set("minimum_rating", rating.replace("+", ""));
            }
            if (sortBy.toLowerCase() !== "date_added") {
                url.searchParams.set("sort_by", sortBy);
            }
            props.fetchData(url);
        }
    }, [quality, genre, rating, sortBy])

    let searchBox = (
        <div className="row justify-content-center">
            <div className="col-12 col-lg-8">
                <div className="row">
                    <div className="col-10 g-2">
                        <input type="text" className="form-control" placeholder="Search Movies" value={searchInput}
                               onChange={handleSearchInput}
                               onKeyUp={(e) => {
                                   handleEnterKey(e.code)
                               }}/>
                    </div>
                    <div className="col-2 g-2">
                        <input type="button" value="Search" className="form-control btn-success"
                               onClick={(e) => {
                                   e.currentTarget.blur();
                                   handleSearch();
                               }}/>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <React.Fragment>
            <div className={"container mt-3 pb-3"}>
                {searchBox}
                <div>
                    <div className="row justify-content-center mt-4">
                        <Filter label={"quality"} values={FilterTypes["quality"]} stateValue={quality}
                                updateStateValue={updateQuality}/>
                        <Filter label={"genre"} values={FilterTypes["genre"]} stateValue={genre}
                                updateStateValue={updateGenre}/>
                        <Filter label={"rating"} values={FilterTypes["rating"]} stateValue={rating}
                                updateStateValue={updateRating}/>
                        <Filter label={"sort by"} values={FilterTypes["sort by"]} stateValue={sortBy}
                                updateStateValue={updateSortBy}/>
                    </div>
                </div>
            </div>
            <div className="w-100 border-bottom border-secondary"/>
        </React.Fragment>
    );
}