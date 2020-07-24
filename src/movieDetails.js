const {remote, ipcRenderer} = require("electron");

let movie_id = getParameter(window.location);
let url = new URL("https://yts.mx/api/v2/movie_details.json?movie_id=00&with_images=true&with_cast=true");
let details_content;
let background_content = document.getElementById("background_content");

getData(url, movie_id)

function getData(url, id) {
    background_content.innerHTML = `<div class="text-center"><img src="../Assets/images/preloader.gif" alt="preloading" class="img-fluid" width="400" height="400"></div>`;
    url.searchParams.set("movie_id", id);
    fetch(url)
        .then(res => {
            res.json()
                .then(data => {
                    let movie = data.data.movie;
                    console.log(movie);
                    setBackground(movie);
                    generalIntro(movie);
                    screenshots(movie);
                    descriptionAndTrailer(movie);
                })
                .catch(err => {
                    ipcRenderer.send("console.log", err.toString())
                    goBack();
                })
        })
        .catch(err => {
            ipcRenderer.send("console.log", err.toString())
            goBack();
        });
}

function setBackground(movie) {
    let content = `<div style="background: linear-gradient(to bottom,rgba(33,30,30,0.65) 0,rgba(33,30,30,1) 100%), url(${movie.background_image}) no-repeat center center; background-size: cover; height: 580px; overflow: visible;">
    <div class="container" id="details_content"></div>
</div>`;
    background_content.innerHTML = content;
    details_content = document.getElementById("details_content");
}

function generalIntro(movie) {
    let links = "";
    for (torrent of movie.torrents) {
        links += `<a href="#" onclick="playVideo(event,'${torrent.hash}','${movie.title}')" title="Watch ${movie.title} in ${torrent.quality} Torrent" class="btn btn-secondary border-dark mr-2">${torrent.quality}.${torrent.type}</a>`
    }
    let content = `<div class="row pt-5 justify-content-center">
    <div class="col-5 col-lg-3">
        <div class="rounded" style="border:5px solid white; width: fit-content;">
            <img src="${movie.medium_cover_image}" class="d-inline-block align-top">
        </div>
    </div>
    <div class="col-1"></div>
    <div class="col-6 col-lg-5">
        <div id="movie_title_info">
            <h1 class="mb-4">${movie.title}</h1>
            <h2>${movie.year}</h2>
            <h2>${movie.genres.toString().replace(/,/gm, " / ")}</h2>
        </div>
        <p class="mt-4 mb-4">
            <em class="text-white align-middle" style="font-size: 1.3em;">Available in: &nbsp;</em>` +
        links
        + `
            <br><br>
            ${movie.imdb_code ? `<a href="#" class="btn btn-success" title="Download subtitles for ${movie.title}" onclick="openSubtitleLink(event,'${movie.imdb_code}')">Download Subtitles</a>` : ''}
        </p>
        <div>
            <div class="row">
                <div class="col-3 col-lg-2">
                    <img src="../Assets/images/logo-imdb-svg.svg" alt="IMDb Rating">
                </div>
                <div class="col rating_info text-white">
                    <span>${movie.rating}</span>
                    <span class="text-success">&#9733</span>
                </div>
            </div>
        </div>
    </div>
</div>`;
    details_content.innerHTML += content;
}

function screenshots(movie) {
    let content = `<div class="row mt-5 justify-content-center">
    <div class="col-4">
        <img src="${movie.medium_screenshot_image1}" alt="${movie.title_long} watch" class="img-fluid">
    </div>
    <div class="col-4">
        <img src="${movie.medium_screenshot_image2}" alt="${movie.title_long} watch" class="img-fluid">
    </div>
    <div class="col-4">
        <img src="${movie.medium_screenshot_image3}" alt="${movie.title_long} watch" class="img-fluid">
    </div>
</div>`;
    details_content.innerHTML += content;
}

function descriptionAndTrailer(movie) {
    let content = `<div class="row mt-5 mb-4 justify-content-center">
    <div class="col-6">
        <h3 style="font-size: 1.25em;" class="font-weight-bolder">Description :</h3>
        <p class="text-wrap text-justify" style="font-size: 1.1em;">
            ${movie.description_full}
        </p>
    </div>
    <div class="col-6 text-center" style="height: fit-content">
        <h3 style="font-size: 1.25em;" class="font-weight-bolder mb-4">Watch Trailer :</h3>
        <div class="trailer">
            <a href="#" onclick="openYoutubeLink(event,'${movie.yt_trailer_code}')">
                <img src="${movie.medium_screenshot_image1}"
                 alt="${movie.title}" class="img-fluid">
            </a>
        </div>
    </div>
</div>
<div>
    <h6 class="m-0 pl-1 d-inline-block"><a href="#" class="text-dark">Content from - YTS API V2</a></h6>
    <h6 class="m-0 p-1 float-right text-dark">Try cleaning the cache after watching movie by going to Settings > Clear Cache.</h6>
</div>`
    details_content.innerHTML += content;
}

function getParameter(url) {
    url = new URL(url);
    return url.searchParams.get("id");
}

window.playVideo = (event, hash, title) => {
    event.preventDefault();
    let settings = localStorage.getItem("settings");
    settings = settings==null?settings:JSON.parse(settings);
    ipcRenderer.send('server', {action: 'start', hash, title, settings});
}

window.goBack = () => {
    window.history.back();
}

window.openYoutubeLink = (e, code) => {
    e.preventDefault();
    if (code !== "") {
        openInBrowser("https://www.youtube.com/watch?v=" + code);
    }
};

window.openSubtitleLink = (e, code) => {
    e.preventDefault();
    if (code !== "") {
        openInBrowser("https://yifysubtitles.org/movie-imdb/" + code);
    }
};

function openInBrowser(link) {
    remote.shell.openExternal(link)
};