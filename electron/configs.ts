import path from 'path';
import { fileURLToPath } from 'url';

export const ROOT_PATH = process.cwd(); // Current working directory: from where it is called

export const get__dirname = (fileUrl: string) =>
  path.dirname(fileURLToPath(fileUrl));

export const ASSETS_PATHs = {
  PLYR_JS: path.join(
    get__dirname(import.meta.url),
    'assets/video_player/plyr3.7.3.polyfilled.min.js'
  ),
  PLYR_CSS: path.join(
    get__dirname(import.meta.url),
    'assets/video_player/plyr3.7.3.min.css'
  ),
  BOOTSTRAP: path.join(
    get__dirname(import.meta.url),
    'assets/bootstrap/bootstrap.min.css'
  ),
  VIDEO_HTML_PATH: path.join(
    get__dirname(import.meta.url),
    'views/html/video.html'
  ),
  REACT_BUILD: path.join(get__dirname(import.meta.url), 'assets'),
};

export const WINDOW_PATHs = {
  DOWNLOAD_WINDOW_HTML: path.join(
    get__dirname(import.meta.url),
    'views/html/download.html'
  ),
  MAIN_WINDOW_HTML: path.join(get__dirname(import.meta.url), 'index.html'),
};

export const DEV_SERVER = {
  host: 'localhost',
  port: '3000',
};

export const PROD_SERVER = {
  host: 'localhost',
  port: '18080',
};

export const STREAM_SERVER = {
  host: 'localhost',
  port: '19000',
};

/* Const Variable */
export const MB = 1e6;

/* Setup caption config */
export const captionConf = path.join(ROOT_PATH, '.CaptionConf');
export const defaultCaptionFont = {
  fontSize: { small: 13, medium: 15, large: 21 },
};
