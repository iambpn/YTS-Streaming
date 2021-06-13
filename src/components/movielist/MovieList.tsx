import React from "react";
import MovieCard from "../moviecard/MovieCard";
import ErrorHandling from "../Error Handling/ErrorHandling";

type MovieListProps = {
    movieListOrError: any,
    handlePageChange: Function,
    currentPage: string
}

export default function MovieList(props: MovieListProps) {

    //Error Handling
    if (props.movieListOrError.status !== "ok") {
        return <ErrorHandling error={props.movieListOrError}/>
    }

    let movieListCount = props.movieListOrError.data.movie_count;
    let limit = props.movieListOrError.data.limit;

    let total_page_number = Math.ceil(Number(movieListCount) / Number(limit));
    let pageNumber: JSX.Element = (
        <div className="row g-0">
            <div className="col"/>
            <div className="col-2 me-3">
                <select id="page_selector" className="form-select" onChange={
                    (e) => {
                        props.handlePageChange(e.target.value)
                    }} value={props.currentPage}>
                    {
                        Array(total_page_number).fill(0).map(
                            (value, index) => {
                                return <option value={index + 1} key={index}>Page {index + 1}</option>
                            }
                        )
                    }
                </select>
            </div>
        </div>
    );

    let listOfMovieCard = (
        props.movieListOrError.data.movies?.map((movie: any, index: number) => {
            return <MovieCard id={movie.id} title={movie.title} year={movie.year} rating={movie.rating}
                              genres={movie.genres} mediumImageCover={movie.medium_cover_image} key={movie.id}/>
        })
    );

    return (
        <React.Fragment>
            <div>
                <div className="mt-3">
                    <h5 className={"text-center text-success"}>{`${movieListCount} YTS Movies Available`}</h5>
                </div>
                {pageNumber}
                <div className="container-lg mt-4" style={{minHeight: "400px"}}>
                    <div className="row justify-content-center">
                        {listOfMovieCard}
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
}
