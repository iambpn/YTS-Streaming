import React from 'react';
import './MovieCard.scss';
import { Link } from 'react-router-dom';

export interface MovieCardProps {
  id: string;
  title: string;
  year: string;
  rating: string;
  genres: string[];
  mediumImageCover: string;
}

export default function MovieCard(props: MovieCardProps) {
  return (
    <React.Fragment>
      <div className="col-3 mb-4">
        <div style={{ width: 'fit-content' }} className="d-inline-block">
          <Link
            to={'/movie/' + props.id}
            className="movie_link"
            style={{ color: '#060606' }}
          >
            <div className="card" style={{ border: '5px solid white' }}>
              <img
                className="img-fluid movie_image"
                src={props.mediumImageCover}
                alt={props.title}
                width="210"
                height="315"
              />
              <figcaption
                className="overlay d-none"
                style={{ paddingTop: '40px' }}
              >
                <div className="text-center" style={{ marginBottom: '25px' }}>
                  <h4
                    className="text-success fw-bold"
                    dangerouslySetInnerHTML={{ __html: '&#9733' }}
                  />
                  <h5 className="fw-bold">{props.rating} / 10</h5>
                </div>
                <div className="text-center">
                  {props.genres && (
                    <div>
                      <h5 className="fw-bold">
                        {props.genres.length > 0 ? props.genres[0] : ''}
                      </h5>
                      <h5 className="fw-bold">
                        {props.genres.length > 1 ? props.genres[1] : ''}
                      </h5>
                    </div>
                  )}
                </div>
                <div className="text-center" style={{ marginTop: '35px' }}>
                  <button className="btn btn-success fw-bold">
                    View Details
                  </button>
                </div>
              </figcaption>
            </div>
            <div className="card-footer p-0" style={{ width: '210px' }}>
              <span className="ps-2 text-white fw-bold d-block mt-1 movie_title">
                {props.title}
              </span>
              <span className="ps-2 d-block movie_date">{props.year}</span>
            </div>
          </Link>
        </div>
      </div>
    </React.Fragment>
  );
}
