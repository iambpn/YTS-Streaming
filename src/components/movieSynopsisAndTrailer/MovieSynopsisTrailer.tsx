import React from "react";
import "./MovieSynopsisTrailer.scss"

type MovieSynopsisTrailerProps = {
    title: string,
    screenshot: string,
    description_full: string,
    yt_trailer_code: string,
    download_count:string
}

export default function MovieSynopsisTrailer(props: MovieSynopsisTrailerProps) {
    let handleOpenTrailer = () => {
        //@ts-ignore
        window.api.send("ExternalLink:Open", "https://www.youtube.com/watch?v=" + props.yt_trailer_code);
    }

    return (
        <div className="row mt-5 mb-4 justify-content-center">
            <div className="col-6">
                <h3 style={{fontSize: "1.25em"}} className="fw-bolder">Synopsis</h3>
                <p className="text-wrap fw-lighter" style={{fontSize: "1em", textAlign: "justify"}}>
                    {props.description_full}
                </p>
            </div>
            <div className="col-6 text-center" style={{height: "max-content"}}>
                <h3 style={{fontSize: "1.25em"}} className="fw-bolder mb-4">Watch Trailer :</h3>
                <div className="trailer" style={{position: "relative", cursor: "pointer"}} onClick={handleOpenTrailer}>
                    <img src={props.screenshot} alt={props.title} className="img-fluid"
                         style={{minWidth: "175px", minHeight: "135px"}}/>
                </div>
            </div>
        </div>
    );
}