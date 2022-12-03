import React from 'react';

interface MovieScreenshotsProps {
  title_long: string;
  medium_screenshot_image1: string;
  medium_screenshot_image2: string;
  medium_screenshot_image3: string;
}

export default function MovieScreenshots(props: MovieScreenshotsProps) {
  return (
    <div className="row mt-5 justify-content-center">
      <div className="col-4">
        <img
          src={props.medium_screenshot_image1}
          alt={props.title_long}
          className="img-fluid"
        />
      </div>
      <div className="col-4">
        <img
          src={props.medium_screenshot_image2}
          alt={props.title_long}
          className="img-fluid"
        />
      </div>
      <div className="col-4">
        <img
          src={props.medium_screenshot_image3}
          alt={props.title_long}
          className="img-fluid"
        />
      </div>
    </div>
  );
}
