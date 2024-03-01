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
import DownloaderWindow from './components/DownloaderWindow.js';
import MainWindow from './components/MainWindow.js';
import VideoPlayerWindow from './components/VideoPlayerWindow.js';
import {
  ASSETS_PATHs,
  DEV_SERVER,
  MB,
  PROD_SERVER,
  STREAM_SERVER,
  WINDOW_PATHs,
  captionConf,
  defaultCaptionFont,
} from './configs.js';
import { captionData, videoPlayData } from './electron.interface.js';

/* variable Initialization */
let mainWindow: Electron.BrowserWindow;
let videoPlayerWindow: Electron.BrowserWindow | undefined = undefined;
let downloaderWindow: BrowserWindow | undefined = undefined;

let webtorrent_client: WebTorrent.Instance | undefined = undefined;
let stream_server: http.Server | undefined = undefined;
let static_server: http.Server | undefined = undefined;

/* App Events */
// Starting Point
app.on('ready', () => {
  if (!isDev) {
    static_server = serverReactContent();
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
  closeStreamServer();
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

  webtorrent_client = getWebTorrentClient(data.maxCon, data.bandwidthLimit);

  const torrent = await new Promise<Torrent>((resolve, reject) => {
    webtorrent_client!.add(data.hash, {}, (torrent) => {
      resolve(torrent);
    });
  });

  const files = torrent.files.sort();

  const videoFile = files.find(function (file) {
    return file.name.endsWith('.mp4');
  });

  if (!videoFile) {
    const torrent_path = torrent.path;
    closeWebTorrentClient(() => {
      console.error(
        'Webtorrent client destroyed. Video File not found so, downloading movie instead'
      );
      downloadMovieInstead(
        data.hash,
        data.maxCon,
        data.bandwidthLimit,
        torrent_path
      );
    });
    return;
  }

  stream_server = createStreamServer(videoFile, torrent, data);

  torrent.on('error', function (err) {
    console.error('Torrent error: ', err.toString());

    resourceCleanUp(() => {
      console.error('Client destroyed due torrent error.');
    });

    dialog.showErrorBox('Torrent Error', err.toString());
  });

  torrent.on('noPeers', function (announceType) {
    console.warn('No Peer available to stream.', { announceType });
  });
});

/* Helper Functions */
function createStreamServer(
  videoFile: WebTorrent.TorrentFile,
  torrent: WebTorrent.Torrent,
  data: videoPlayData
) {
  const express_app = express();

  serveVideoPlayerAssets(express_app);

  express_app.get('/video', function (req, res) {
    const fileSize = videoFile.length;
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      let end = fileSize - 1;

      // if end range is specified then
      if (parts[1] && parseInt(parts[1], 10) < end) {
        end = parseInt(parts[1], 10);
      } else if (start + MB < end) {
        //  if end range is not specified then default to 1MB
        end = start + MB;
      }

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
        console.error('Stream error: ', err.toString());
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
        console.error('Stream error: ', err.toString());
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
        data.title === undefined ? 'YTS-Player' : 'YTS-Player - ' + data.title,
    });
  });

  const server = express_app.listen(
    +STREAM_SERVER.port,
    STREAM_SERVER.host,
    () => {
      console.log('Stream server ready');
      createVideoPlayerWindow();
    }
  );

  return server;
}

function serveVideoPlayerAssets(app: express.Express) {
  app.get('/plyr-js', function (req, res) {
    res.sendFile(ASSETS_PATHs.PLYR_JS);
  });

  app.get('/plyr-css', function (req, res) {
    res.sendFile(ASSETS_PATHs.PLYR_CSS);
  });

  app.get('/bootstrapv5', function (req, res) {
    res.sendFile(ASSETS_PATHs.BOOTSTRAP);
  });

  app.get('/streaming', function (req, res) {
    res.sendFile(ASSETS_PATHs.VIDEO_HTML_PATH);
  });

  app.get('/custom-caption', function (req, res) {
    try {
      const data = JSON.parse(fs.readFileSync(captionConf).toString());
      res.json(data);
    } catch {
      res.json(defaultCaptionFont);
    }
  });
}

function closeStreamServer() {
  if (stream_server) {
    stream_server.close((err) => {
      console.log('Closing Stream server');
      stream_server = undefined;

      if (err) {
        dialog.showErrorBox(
          'Stream Server error',
          'Error while closing streaming server'
        );
        console.error('Close Stream Server error: ', err.toString());
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
        dialog.showErrorBox(
          'Webtorrent client error',
          'Error while closing webtorrent client'
        );
        console.error('Closing Webtorrent Error: ', err.toString());
        return;
      }

      if (cb) {
        cb();
        return;
      }
    });
  }
}

function resourceCleanUp(cb?: Function) {
  closeStreamServer();
  closeWebTorrentClient(cb);
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
      console.error('Torrent error: ', err.toString());
      dialog.showErrorBox('Torrent Error', err.toString());
    });

    // if no peers in torrent
    torrent.on('noPeers', function (announceType) {
      console.warn('No peers available to stream.', { announceType });
    });
  });
}

function getWebTorrentClient(
  maxCon: string | null,
  bandwidthLimit: string | null
) {
  let limit =
    bandwidthLimit && Number(bandwidthLimit) > 0 ? Number(bandwidthLimit) : -1;

  const client = new WebTorrent({
    maxConns: maxCon ? Number(maxCon) : 55,
    //@ts-expect-error
    downloadLimit: limit * MB,
    uploadLimit: limit * MB,
  });

  client.on('error', (err) => {
    console.error('Webtorrent client error:', err.toString());
    resourceCleanUp();
    dialog.showErrorBox('Torrent Client Error', err.toString());
  });

  return client;
}

function createWindow() {
  const url = isDev
    ? `http://${DEV_SERVER.host}:${DEV_SERVER.port}`
    : `http://${PROD_SERVER.host}:${PROD_SERVER.port}`;
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
  const url = `http://${STREAM_SERVER.host}:${STREAM_SERVER.port}/streaming`;
  videoPlayerWindow = new VideoPlayerWindow(url);

  if (isDev) {
    videoPlayerWindow.webContents.toggleDevTools();
  }

  videoPlayerWindow.on('closed', () => {
    videoPlayerWindow = undefined;
    resourceCleanUp();
  });
}

function createDownloaderWindow() {
  const url = `file://${WINDOW_PATHs.DOWNLOAD_WINDOW_HTML}`;
  downloaderWindow = new DownloaderWindow(url);

  if (isDev) {
    downloaderWindow.webContents.toggleDevTools();
  }

  downloaderWindow.on('closed', () => {
    downloaderWindow = undefined;
    closeWebTorrentClient(() => {
      console.log('Downloader Window closed');
      ipcMain.removeAllListeners('download:stop');
      ipcMain.removeAllListeners('download:resume');
      ipcMain.removeAllListeners('download:pause');
    });
  });
}

function serverReactContent(): http.Server {
  let app: express.Express = express();

  /* Serve React Assets */
  app.use(
    '/assets',
    express.static(ASSETS_PATHs.REACT_BUILD, {
      index: false,
    })
  );

  app.get('/', (req, res) => {
    res.sendFile(WINDOW_PATHs.MAIN_WINDOW_HTML);
  });

  return app.listen(+PROD_SERVER.port, PROD_SERVER.host, () => {
    console.log('Static Content is ready.');
  });
}
