import React, { useState } from 'react';
import './MovieIntro.scss';
import { useNavigate } from 'react-router-dom';
import { getMaxConSettings } from '../header/SettingsModal';

interface MovieIntroProps {
  movie: any;
  suggestions: any[];
}

export default function MovieIntro(props: MovieIntroProps) {
  const navigate = useNavigate();
  const [playing, setPlaying] = useState<boolean>(false);

  const handleClickOnLink = async (hash: string) => {
    setPlaying(true);
    const maxCon = getMaxConSettings();
    // @ts-expect-error
    await window.api.invoke('video:play', {
      hash,
      title: props.movie.title,
      maxCon,
    });
    setPlaying(false);
  };

  const downloadSubtitle = () => {
    // @ts-expect-error
    window.api.send(
      'ExternalLink:Open',
      'https://yifysubtitles.org/movie-imdb/' + props.movie.imdb_code
    );
  };

  const links = [];
  for (const torrent of props.movie.torrents) {
    const button = (
      <button
        title={
          'Watch ' + props.movie.title + ' in ' + torrent.quality + ' Torrent'
        }
        className="btn btn-secondary border-dark ms-1 me-2 mb-2"
        onClick={(e) => {
          handleClickOnLink(torrent.hash);
        }}
        key={torrent.hash}
      >
        {torrent.quality + '.' + torrent.type}
      </button>
    );

    links.push(button);
  }

  const suggestions: JSX.Element[] = [];
  props.suggestions.forEach((suggestion) => {
    const tmp = (
      <div
        className={'col-6 mb-4 g-0 d-flex justify-content-center'}
        title={suggestion.title}
        onClick={(e) => {
          navigate('/movie/' + suggestion.id);
        }}
        key={suggestion.id}
      >
        <div
          className="rounded suggestion"
          style={{ border: '5px solid white', width: 'max-content' }}
        >
          <img
            src={suggestion.medium_cover_image}
            className="d-inline-block align-top"
            width={100}
            height={140}
            alt={''}
          />
        </div>
      </div>
    );
    suggestions.push(tmp);
  });

  return (
    <React.Fragment>
      <div className={'row justify-content-center pt-5'}>
        <div className="col-3 col-lg-3 d-flex justify-content-center mb-lg-0 mb-5">
          <div
            className="rounded"
            style={{ border: '5px solid white', width: 'max-content' }}
          >
            <img
              src={props.movie.medium_cover_image}
              className="d-inline-block align-top"
              style={{ minWidth: '210px', minHeight: '315px' }}
              alt={''}
            />
          </div>
        </div>
        <div className="col-lg-1" />
        <div className="col-6 col-lg-5">
          <div id="movie_title_info">
            <h1 className="mb-3">{props.movie.title}</h1>
            <h2>{props.movie.year}</h2>
            <h2>{props.movie.genres.toString()}</h2>
          </div>
          <div className="mt-4 mb-4">
            <em
              className="text-white align-middle"
              style={{ fontSize: '1.1em' }}
            >
              Available in: {playing ? 'Opening Player...' : ''}{' '}
            </em>
            {links}
          </div>
          <div className={'mb-4'}>
            <button
              className="btn btn-success"
              title={'Download subtitles for ' + props.movie.title}
              style={{ fontSize: '.9em' }}
              onClick={downloadSubtitle}
            >
              Download Subtitles
            </button>
          </div>
          <div className="row">
            <div className="col-3 col-lg-2">
              <img src="/assets/images/logo-imdb-svg.svg" alt="IMDB" />
            </div>
            <div className="col rating_info text-white">
              <span>{props.movie.rating}</span>
              <span
                className="text-success"
                dangerouslySetInnerHTML={{ __html: '&#9733' }}
              />
            </div>
          </div>
        </div>
        <div className={'col-4 col-lg-3'}>
          <h6 className={'fw-bolder'}>Similar Movies</h6>
          <div className="row">{suggestions}</div>
        </div>
      </div>
    </React.Fragment>
  );
}
