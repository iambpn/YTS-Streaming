import React, {createContext, useState} from "react";

type Queries = {
    search: string,
    quality: string,
    genre: string,
    rating: string,
    sortBy: string
};

type UpdateQueries = {
    search: Function,
    quality: Function,
    genre: Function,
    rating: Function,
    sortBy: Function
}

type IContext = {
    currentQueries: Queries,
    updateQueries: UpdateQueries,
    isQueryStateModified: Function,
    currentPage:string,
    updateCurrentPage:Function
};

const AppContext = createContext<IContext>({
    currentQueries: {
        search: "",
        quality: "All",
        genre: "All",
        rating: "All",
        sortBy: "date_added"
    },
    updateQueries: {
        search: Function,
        quality: Function,
        genre: Function,
        rating: Function,
        sortBy: Function
    },
    isQueryStateModified:Function,
    currentPage:"1",
    updateCurrentPage:Function
});

export default function AppContextProvider(props: { children: React.ReactNode }) {
    const [search, updateSearch] = useState<string>("");
    const [quality, updateQuality] = useState<string>("All");
    const [genre, updateGenre] = useState<string>("All");
    const [rating, updateRating] = useState<string>("All");
    const [sortBy, updateSortBy] = useState<string>("date_added");
    const [currentPage, updateCurrentPage] = useState("1");

    let isQueryStateModified = ():boolean => {
        return (search.trim() === "" && quality === "All" && genre === "All"
            && rating === "All" && sortBy === "date_added");
    }

    const context: IContext = {
        currentQueries: {
            search,
            quality,
            genre,
            rating,
            sortBy
        },
        updateQueries: {
            search: updateSearch,
            quality: updateQuality,
            genre: updateGenre,
            rating: updateRating,
            sortBy: updateSortBy
        },
        isQueryStateModified,
        currentPage,
        updateCurrentPage
    };

    return (
        <AppContext.Provider value={context}>
            {props.children}
        </AppContext.Provider>
    );

}

export {AppContext, AppContextProvider};