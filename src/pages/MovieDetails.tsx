import React, { useEffect, useState } from 'react';
import Heading from '../components/header/Heading';
import Spinner from '../components/spinner/Spinner';
import MovieIntro from '../components/movieintro/MovieIntro';
import MovieScreenshots from '../components/movieScreenshot/MovieScreenshots';
import MovieSynopsisTrailer from '../components/movieSynopsisAndTrailer/MovieSynopsisTrailer';
import Footer from '../components/footer/footer';
import { useParams } from 'react-router-dom';

const BaseURL = 'https://yts.mx/api/v2/movie_details.json';

export default function MovieDetails() {
  const [loading, updateLoading] = useState(true);
  const [response, updateResponse] = useState<any>('');
  const [suggestionResponse, updateSuggestionResponse] = useState<any>('');

  const { id: movie_id } = useParams();

  const fetchData = async (movieURL: URL, suggestionURL: URL) => {
    updateLoading(true);
    try {
      const res = await Promise.all([
        fetch(movieURL.href),
        fetch(suggestionURL.href),
      ]);
      const data = await Promise.all([res[0].json(), res[1].json()]);
      updateResponse(data[0]);
      updateSuggestionResponse(data[1]);
    } catch (err: any) {
      updateResponse(err.toString());
    }
    updateLoading(false);
  };

  useEffect(() => {
    const movieUrl = new URL(BaseURL);
    // @ts-expect-error{
    movieUrl.searchParams.set('movie_id', movie_id);
    movieUrl.searchParams.set('with_images', 'true');
    movieUrl.searchParams.set('with_cast', 'true');

    const suggestionUrl = new URL(
      'https://yts.mx/api/v2/movie_suggestions.json?movie_id=' + movie_id
    );

    fetchData(movieUrl, suggestionUrl);
  }, [movie_id]);

  return (
    <React.Fragment>
      <Heading />
      {loading ? (
        <Spinner />
      ) : (
        <div
          style={{
            background:
              'linear-gradient(to bottom,rgba(06,06,06,0.65) 0,rgba(06,06,06,1) 100%), url(' +
              response.data.movie.background_image +
              ') no-repeat center center',
            backgroundSize: 'cover',
            height: '580px',
            overflow: 'visible',
          }}
        >
          <div className={'container-lg'}>
            <MovieIntro
              movie={response.data.movie}
              suggestions={suggestionResponse.data.movies}
            />
            <MovieScreenshots
              title_long={response.data.movie.title_long}
              medium_screenshot_image1={
                response.data.movie?.medium_screenshot_image1
              }
              medium_screenshot_image2={
                response.data.movie?.medium_screenshot_image2
              }
              medium_screenshot_image3={
                response.data.movie?.medium_screenshot_image3
              }
            />
            <MovieSynopsisTrailer
              title={response.data.movie.title}
              screenshot={response.data.movie.medium_screenshot_image1}
              description_full={response.data.movie.description_full}
              yt_trailer_code={response.data.movie.yt_trailer_code}
              download_count={response.data.movie.download_count}
            />
            <Footer />
          </div>
        </div>
      )}
    </React.Fragment>
  );
}
