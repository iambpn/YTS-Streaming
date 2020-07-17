// java script for main.html
const {remote,ipcRenderer} = require("electron");

let movies_list_title = document.getElementById("movies_list_title");
let list_movies = document.getElementById("list_movies");
let page_selector= document.getElementById("page_selector");
let search_field = document.getElementById("search_field");
let search_button = document.getElementById("search_button");
let quality = document.getElementById("quality");
let rating = document.getElementById("rating");
let genre = document.getElementById("genre");
let order_by = document.getElementById("order_by");

let url;

if(remote.getGlobal("url")){
    url = new URL(remote.getGlobal("url"));
    setParameters(url);
}
else{
    url = new URL("https://yts.mx/api/v2/list_movies.json");
}


search_field.addEventListener("keyup",(e)=>{
    if(e.key === "Enter"){
        search_button.click();
    }
})

search_button.addEventListener("click",()=>{
   let search_query = search_field.value;
   if(search_query !== '' && search_query.trim() !=='' ){
       url = new URL(url.href.split('?')[0]);
       url.searchParams.set("query_term",search_query);
   }
   else{
       search_field.value = "";
       url = new URL(url.href.split('?')[0]);
   }
   quality.children[0].selected = true;
   rating.children[0].selected = true;
   genre.children[0].selected = true;
   order_by.children[0].selected = true;
   getData(url);
});

quality.addEventListener("change",()=>{
    url.searchParams.set("quality",quality.value);
    getData(url)
})

genre.addEventListener("change",()=>{
    url.searchParams.set("genre",genre.value);
    getData(url)
})

rating.addEventListener("change",()=>{
    url.searchParams.set("minimum_rating",rating.value);
    getData(url)
})

order_by.addEventListener("change",()=>{
    url.searchParams.set("sort_by",order_by.value);
    getData(url)
})

page_selector.addEventListener("change",()=>{
    url.searchParams.set("page",page_selector.value);
    getData(url)
})

getData(url);

function setParameters(url){
    if(url.searchParams.get("query_term")){
        search_field.value = url.searchParams.get("query_term");
    }

    if(url.searchParams.get("quality")){
        quality.value = url.searchParams.get("quality");
    }

    if(url.searchParams.get("genre")){
        genre.value =url.searchParams.get("genre");
    }

    if(url.searchParams.get("minimum_rating")){
        rating.value = url.searchParams.get("minimum_rating");
    }

    if(url.searchParams.get("sort_by")){
        order_by.value = url.searchParams.get("sort_by");
    }

    if(url.searchParams.get("page")){
        page_selector.value = url.searchParams.get("page");
    }
}

function getData(url){
    list_movies.innerHTML=`<img src="./Assets/images/preloader.gif" alt="preloading" class="img-fluid" width="400" height="400">`;
    ipcRenderer.send("saveUrl",url.href);
    fetch(url)
        .then(res=>{
            res.json()
                .then(data=>{
                    setTitle(data.data.movie_count);
                    showMovies(data.data.movies?data.data.movies:[]);
                    showPageNumbers(data.data.page_number, data.data.movie_count, data.data.limit);
                })
                .catch(err=>{
                    console.log(err)
                    movies_list_title.classList.remove("text-success");
                    movies_list_title.classList.add('text-danger');
                    movies_list_title.innerText = `Error while Fetching the movies data`;
                })
        })
        .catch(err=>{
            console.log(err)
            movies_list_title.classList.remove("text-success");
            movies_list_title.classList.add('text-danger');
            movies_list_title.innerText = `Error while Fetching the content`;
        })
}

function setTitle(title){
    movies_list_title.classList.remove("text-danger");
    movies_list_title.classList.add("text-success");
    movies_list_title.innerText = `${title} YTS Movies Available`;
}

function showPageNumbers(current_page_number,total_movies,limit){
    let total_page_number = Math.ceil(Number(total_movies)/Number(limit));
    let option;
    page_selector.innerHTML = '';
    for(let i=1;i<=total_page_number;i++){
        option = document.createElement('option');
        option.appendChild(document.createTextNode(`Page ${i}`));
        option.value = i;
        page_selector.appendChild(option);
    }
    document.getElementById("page_selector").value = current_page_number;
    page_selector.classList.remove('d-none');
}

function showMovies(movies) {
    let movie_card = '';
    list_movies.innerHTML = '';
    for (let movie of movies) {
        movie_card = `<div class="col-3 mb-4">
    <div style="width: fit-content;" class="d-inline-block">
        <a href="./src/movieDetails.html?id=${movie.id}" class="movie_link">
            <div class="card" style="border: 5px solid white;">
                <img class="img-fluid movie_image"
                     src="${movie.medium_cover_image}"
                     alt="${movie.title_long}" width="210" height="315">
                <figcaption class="overlay d-none" style="padding-top: 40px;">
                    <div class="text-center" style="margin-bottom: 25px;">
                        <h4 class="text-success font-weight-bold">&#9733</h4>
                        <h5 class="font-weight-bold">${movie.rating} / 10</h5>
                    </div>
                    <div class="text-center">
                        <h5 class="font-weight-bold">${movie.genres.length > 1 ? movie.genres[0] : ''}</h5>
                        <h5 class="font-weight-bold">${movie.genres.length > 1 ? movie.genres[1] : movie.genres[0]}</h5>
                    </div>
                    <div class="text-center" style="margin-top: 35px;">
                        <span class="btn btn-success font-weight-bold">View Details</span>
                    </div>
                </figcaption>
            </div>
            <div class="card-footer p-0" style="width: 210px">
                <span class="pl-2 text-white font-weight-bold d-block mt-1 movie_title">${movie.title}</span>
                <span class="pl-2 d-block movie_date">${movie.year}</span>
            </div>
        </a>
    </div>
</div>`
        list_movies.innerHTML += movie_card;
    }
}