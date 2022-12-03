import { app, dialog, globalShortcut, ipcMain, shell } from 'electron';
import isDev from 'electron-is-dev';
import windowStateKeeper from 'electron-window-state';
import { BrowserWindow } from 'electron/main';
import express from 'express';
import fs from 'fs';
import http from 'http';
import os from 'os';
import path from 'path';
import srt2vtt from 'srt2vtt';
import WebTorrent, { Torrent } from 'webtorrent';
import DownloaderWindow from './components/DownloaderWindow';
import MainWindow from './components/MainWindow';
import VideoPlayerWindow from './components/VideoPlayerWindow';
import { captionData, videoPlayData } from './electron.interface';

/**
 * __dirname: returns running file directory
 * process.cwd():  returns current working directory.
 */

/* Paths */
const ROOT_PATH = process.cwd();
const DIR_NAME = __dirname;

const PLYR_JS_PATH = path.join(
  DIR_NAME,
  'assets/video_player/plyr3.7.3.polyfilled.min.js'
);
const PLYR_CSS_PATH = path.join(
  DIR_NAME,
  'assets/video_player/plyr3.7.3.min.css'
);
const BOOTSTRAP_PATH = path.join(
  DIR_NAME,
  'assets/bootstrap/bootstrap.min.css'
);

const VIDEO_HTML_PATH = path.join(DIR_NAME, 'views/html/video.html');
const DOWNLOAD_HTML_PATH_DEV = path.join(DIR_NAME, 'views/html/download.html');
const PROD_HTML_PATH = path.join(DIR_NAME, 'index.html');

const DEV_STATIC_HOST = 'localhost';
const DEV_STATIC_PORT = '3000';
const PROD_STATIC_HOST = 'localhost';
const PROD_STATIC_PORT = '18080';
const PROD_ASSETS = path.join(DIR_NAME, 'assets');
const VIDEO_STREAM_HOST = 'localhost';
const VIDEO_STREAM_PORT = '19000';

/* Const Variable */
const MB = 1e6;

/* Setup caption config */
const captionConf = path.join(ROOT_PATH, '.CaptionConf');
const defaultCaptionFont = { fontSize: { small: 13, medium: 15, large: 21 } };

/* variable Initialization */
let mainWindow: Electron.BrowserWindow;
let videoPlayerWindow: Electron.BrowserWindow | undefined = undefined;
let webtorrent_client: WebTorrent.Instance | undefined = undefined;
let stream_server: http.Server | undefined = undefined;
let static_server: http.Server | undefined = undefined;
let downloaderWindow: BrowserWindow | undefined = undefined;

/* App Events */
// Starting Point
app.on('ready', () => {
  if (!isDev) {
    static_server = serveStaticContent(express());
  }
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('browser-window-focus', function () {
  globalShortcut.register('CommandOrControl+R', () => {
    console.log('CommandOrControl+R is pressed: Shortcut Disabled');
  });
  globalShortcut.register('F5', () => {
    console.log('F5 is pressed: Shortcut Disabled');
  });
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    console.log('Inspect Element: Shortcut Disabled');
  });
});

app.on('browser-window-blur', function () {
  globalShortcut.unregister('CommandOrControl+R');
  globalShortcut.unregister('F5');
  globalShortcut.unregister('CommandOrControl+Shift+I');
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  if (static_server) {
    static_server.close(() => {
      console.log('static server closed');
    });
  }
});

/* IPC CALLS */
ipcMain.on('ExternalLink:Open', (event, link: string) => {
  shell.openExternal(link);
});

ipcMain.on('Cache:ClearCache', (event, data: null) => {
  const dir = path.join(os.tmpdir(), 'webtorrent');
  if (fs.existsSync(dir)) {
    fs.rm(dir, { recursive: true }, () => {});
  }
});

ipcMain.on('Cache:ShowSpaceRequest', (event, data: null) => {
  const dir = path.join(os.tmpdir(), 'webtorrent');
  if (fs.existsSync(dir)) {
    fs.readdir(dir, (err, files) => {
      event.sender.send(
        'Cache:ShowSpaceResponse',
        `${files.length} folder are in cache. About ${
          files.length * 500
        } MB data`
      );
    });
  } else {
    event.sender.send('Cache:ShowSpaceResponse', '0 folder are in cache.');
  }
});

ipcMain.on('style:caption', (event, args: captionData) => {
  if (args.type === 'get') {
    try {
      const data = JSON.parse(fs.readFileSync(captionConf).toString());
      event.reply('get:style:caption', data);
    } catch {
      fs.writeFileSync(captionConf, JSON.stringify(defaultCaptionFont));
    }
  } else if (args.type === 'save') {
    fs.writeFileSync(captionConf, JSON.stringify(args.data));
  }
});

ipcMain.handle('video:play', async (event, data: videoPlayData) => {
  if (stream_server || webtorrent_client) {
    dialog.showErrorBox(
      'Movie player or Downloader is already running',
      'An instance of Movie Player | Downloader is already running. Please close the existing  or downloader window and try again.'
    );
    return;
  }

  const express_app = express();

  // hosting files
  express_app.get('/plyr-js', function (req, res) {
    res.sendFile(PLYR_JS_PATH);
  });

  express_app.get('/plyr-css', function (req, res) {
    res.sendFile(PLYR_CSS_PATH);
  });

  express_app.get('/bootstrapv5', function (req, res) {
    res.sendFile(BOOTSTRAP_PATH);
  });

  express_app.get('/streaming', function (req, res) {
    res.sendFile(VIDEO_HTML_PATH);
  });

  express_app.get('/custom-caption', function (req, res) {
    try {
      const data = JSON.parse(fs.readFileSync(captionConf).toString());
      res.json(data);
    } catch {
      res.json(defaultCaptionFont);
    }
  });
  // hosting files end

  webtorrent_client = getWebTorrentClient(data.maxCon, data.bandwidthLimit);

  const torrent: Torrent = await new Promise((resolve, reject) => {
    webtorrent_client!.add(data.hash, {}, (torrent) => {
      resolve(torrent);
    });
  });

  const files = torrent.files.sort();

  const videoFile = files.find(function (file) {
    return file.name.endsWith('.mp4');
  });

  if (!videoFile) {
    closeWebTorrentClient(() => {
      console.log('Webtorrent Client destroyed before downloading Movie');
      downloadMovieInstead(
        data.hash,
        data.maxCon,
        data.bandwidthLimit,
        torrent.path
      );
    });
    return;
  } else {
    // host video file
    express_app.get('/video', function (req, res) {
      const fileSize = videoFile.length;
      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const contentLength = end - start + 1;
        const stream = videoFile.createReadStream({ start, end });
        const head = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': contentLength,
          'Content-Type': 'video/mp4',
        };
        res.writeHead(206, head);
        stream.once('error', (err) => {
          console.log(err.toString());
        });
        // pipe readable stream through writable stream (res)
        stream.pipe(res);
      } else {
        const head = {
          'Content-Length': fileSize,
          'Content-Type': 'video/mp4',
        };
        res.writeHead(200, head);
        const stream = videoFile.createReadStream();
        stream.once('error', (err) => {
          console.log(err.toString());
        });
        stream.pipe(res);
      }
    });

    // subtitle api
    express_app.get('/subtitleApi/add', (req, res) => {
      try {
        if (req.query.path) {
          const path_query = req.query.path as string;
          const subtitle_path: string[] = path_query.split('.');
          if (subtitle_path[subtitle_path.length - 1] === 'srt') {
            const srtData = fs.readFileSync(path_query);
            const newPath = path.join(torrent.path, '/', 'customCaption.vtt');
            srt2vtt(srtData, function (err: any, vttData: any) {
              if (err) throw new Error(err);
              fs.writeFileSync(newPath, vttData);
              fs.createReadStream(newPath).pipe(res);
            });
          } else if (subtitle_path[subtitle_path.length - 1] === 'vtt') {
            fs.createReadStream(path_query).pipe(res);
          } else {
            throw new Error(
              'Subtitle MIME type not supported. Should be .srt or .vtt'
            );
          }
        } else {
          throw new Error('Subtitle path not found');
        }
      } catch (err: any) {
        dialog.showErrorBox('Error while adding subtitle', err.toString());
        res.sendStatus(400);
      }
    });

    // downloadInfo api
    express_app.get('/downloadInfo', (req, res) => {
      res.json({
        total_downloaded: torrent.downloaded,
        total_size: torrent.length,
        path: torrent.path,
      });
    });

    // speed api
    express_app.get('/speed', (req, res) => {
      res.json({ up: torrent.uploadSpeed, down: torrent.downloadSpeed });
    });

    // get Title api
    express_app.get('/title', (req, res) => {
      res.json({
        title:
          data.title === undefined
            ? 'YTS-Player'
            : 'YTS-Player - ' + data.title,
      });
    });

    // start server
    stream_server = express_app.listen(
      +VIDEO_STREAM_PORT,
      VIDEO_STREAM_HOST,
      () => {
        console.log('server ready');
        createVideoPlayerWindow();
      }
    );
  }

  // if torrent error occurs
  torrent.on('error', function (err) {
    if (webtorrent_client) {
      closeWebTorrentClient(() => {
        console.log('Client destroyed due torrent error.');
      });
    }
    dialog.showErrorBox('Torrent Error', err.toString());
  });

  // if no peers in torrent
  torrent.on('noPeers', function (announceType) {
    if (webtorrent_client) {
      closeWebTorrentClient(() => {
        console.log('Client destroyed due to no peers or network issue.');
      });
    }
    dialog.showErrorBox('Torrent Warning', 'No peers available to stream.');
  });

  // error in torrent client
  webtorrent_client.on('error', (err) => {
    if (webtorrent_client) {
      closeWebTorrentClient(() => {
        console.log('Client destroyed due to Torrent client error.');
        console.log(err.toString());
      });
    }
    dialog.showErrorBox('Torrent Client Error', err.toString());
  });
});

/* Helper Functions */
function closeStreamServer() {
  if (stream_server) {
    stream_server.close((err) => {
      console.log('Closing Stream server');
      stream_server = undefined;
      if (err) {
        console.log(err.toString());
      }
    });
  }
}

function closeWebTorrentClient(cb?: Function) {
  if (webtorrent_client) {
    webtorrent_client.destroy((err) => {
      console.log('Closing WebTorrent Client');
      webtorrent_client = undefined;
      if (err) {
        console.log(err.toString());
        return;
      }

      if (cb) {
        cb();
        return;
      }
    });
  }
}

function downloadMovieInstead(
  hash: string,
  maxCon: string | null,
  bandwidthLimit: string | null,
  previousPath: string
) {
  // delete previous path
  if (fs.existsSync(previousPath)) {
    fs.rm(previousPath, { recursive: true }, () => {});
  }

  const downloadOption = dialog.showMessageBoxSync(mainWindow, {
    type: 'info',
    title: 'Media content not supported by YTS Player',
    message: 'Do you want to download it instead?',
    detail:
      'No stream-able video source found in the torrent to stream. \nYou can download it instead and play with another video player',
    buttons: ['Download', 'Cancel'],
    defaultId: 0,
    cancelId: 1,
    noLink: true,
  });

  let downloadPath: string[] | undefined;
  if (downloadOption === 0) {
    downloadPath = dialog.showOpenDialogSync({
      title: 'Choose Download Location',
      properties: ['dontAddToRecent', 'openDirectory'],
    });
  }

  if (downloadPath === undefined) {
    return;
  }

  // only download no need to stream from here
  webtorrent_client = getWebTorrentClient(maxCon, bandwidthLimit);
  webtorrent_client.add(hash, { path: downloadPath[0] }, (torrent) => {
    createDownloaderWindow();

    // add IPC listener for torrent
    ipcMain.on('download:stop', () => {
      if (downloaderWindow) {
        downloaderWindow.close();
      }
    });

    ipcMain.on('download:pause', () => {
      console.log('torrent Paused');
      if (webtorrent_client) {
        //@ts-expect-error
        webtorrent_client.throttleDownload(0);
        //@ts-expect-error
        webtorrent_client.throttleUpload(0);
      }
    });

    ipcMain.on('download:resume', () => {
      console.log('torrent resumed');
      if (webtorrent_client) {
        //@ts-expect-error
        webtorrent_client.throttleDownload(-1);
        //@ts-expect-error
        webtorrent_client.throttleUpload(-1);
      }
    });

    // every time torrent downloads
    torrent.on('download', (bytes) => {
      downloaderWindow!.webContents.send('download:info', {
        progress: torrent.progress,
        downloadSpeed: torrent.downloadSpeed,
        uploadSpeed: torrent.uploadSpeed,
        title: torrent.name,
        downloadSize: torrent.length,
        totalDownloaded: torrent.downloaded,
      });
      downloaderWindow!.setProgressBar(torrent.progress);
    });

    // on torrent complete
    torrent.on('done', () => {
      downloaderWindow!.close();
      const completeRes = dialog.showMessageBoxSync({
        type: 'info',
        title: 'Download Completed',
        message: torrent.name + ' downloaded',
        buttons: ['Close', 'Open Folder'],
        cancelId: 0,
        defaultId: 1,
        noLink: true,
      });
      if (completeRes === 1 && downloadPath !== undefined) {
        shell.openPath(downloadPath[0]);
      }
    });

    // if torrent error occurs
    torrent.on('error', function (err) {
      dialog.showErrorBox('Torrent Error', err.toString());
    });

    // if no peers in torrent
    torrent.on('noPeers', function (announceType) {
      dialog.showErrorBox('Torrent Warning', 'No peers available to stream.');
    });
  });

  // error in torrent client
  webtorrent_client.on('error', (err) => {
    dialog.showErrorBox('Torrent Client Error', err.toString());
  });
}

function getWebTorrentClient(
  maxCon: string | null,
  bandwidthLimit: string | null
): WebTorrent.Instance {
  let limit =
    bandwidthLimit && Number(bandwidthLimit) > 0 ? Number(bandwidthLimit) : -1;
  return new WebTorrent({
    maxConns: maxCon ? Number(maxCon) : 55,
    //@ts-expect-error
    downloadLimit: limit * MB,
    uploadLimit: limit * MB,
  });
}

function createWindow() {
  const url = isDev
    ? `http://${DEV_STATIC_HOST}:${DEV_STATIC_PORT}`
    : `http://${PROD_STATIC_HOST}:${PROD_STATIC_PORT}`;
  const state = windowStateKeeper({
    defaultWidth: 1200,
    defaultHeight: 1000,
  });
  mainWindow = new MainWindow(url, state);

  if (isDev) {
    mainWindow.setAutoHideMenuBar(true);
  } else {
    mainWindow.setMenuBarVisibility(false);
  }

  mainWindow.on('closed', () => {
    if (videoPlayerWindow) {
      videoPlayerWindow.close();
    }

    if (downloaderWindow) {
      downloaderWindow.close();
    }
  });

  state.manage(mainWindow);
}

function createVideoPlayerWindow() {
  const url = `http://${VIDEO_STREAM_HOST}:${VIDEO_STREAM_PORT}/streaming`;
  videoPlayerWindow = new VideoPlayerWindow(url);

  if (isDev) {
    videoPlayerWindow.webContents.toggleDevTools();
  }

  videoPlayerWindow.on('closed', () => {
    videoPlayerWindow = undefined;
    closeStreamServer();
    closeWebTorrentClient();
  });
}

function createDownloaderWindow() {
  const url = `file://${DOWNLOAD_HTML_PATH_DEV}`;
  downloaderWindow = new DownloaderWindow(url);

  if (isDev) {
    downloaderWindow.webContents.toggleDevTools();
  }

  downloaderWindow.on('closed', () => {
    downloaderWindow = undefined;
    closeWebTorrentClient(() => {
      console.log('Client destroyed on window closed');
      ipcMain.removeAllListeners('download:stop');
      ipcMain.removeAllListeners('download:resume');
      ipcMain.removeAllListeners('download:pause');
    });
  });
}

function serveStaticContent(app: express.Express): http.Server {
  /* Serve React Assets */
  app.use(
    '/assets',
    express.static(PROD_ASSETS, {
      index: false,
    })
  );

  app.get('/', (req, res) => {
    res.sendFile(PROD_HTML_PATH);
  });

  return app.listen(+PROD_STATIC_PORT, PROD_STATIC_HOST, () => {
    console.log('Static Content is ready.');
  });
}
