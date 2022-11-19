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

/**
 * ROOT_PATH: returns running file directory
 * process.cwd():  returns current working directory.
 */

/* Types */
interface captionData {
  type: string;
  data?: any;
}
interface videoPlayData {
  hash: string;
  title?: string;
  maxCon: string | null;
}

/* Paths */
const ROOT_PATH = process.cwd();
const PLYR_JS_PATH = path.join(
  ROOT_PATH,
  'electron/assets/express/video_player/plyr3.6.8.polyfilled.min.js'
);
const PLYR_CSS_PATH = path.join(
  ROOT_PATH,
  'electron/assets/express/video_player/plyr3.6.8.min.css'
);
const BOOTSTRAP_PATH = path.join(
  ROOT_PATH,
  'electron/assets/common/bootstrap/bootstrap.min.css'
);
const VIDEO_HTML_PATH = path.join(ROOT_PATH, 'electron/views/video.html');
const PROD_HTML_PATH = path.join(ROOT_PATH, 'react_build/index.html');
const DOWNLOAD_HTML_PATH_DEV = path.join(
  ROOT_PATH,
  'electron/views/download.html'
);

/* variable Initialization */
let mainWindow: Electron.BrowserWindow;
let videoPlayerWindow: Electron.BrowserWindow;
let webtorrent_client: WebTorrent.Instance;
let server: http.Server;
let downloaderWindow: BrowserWindow;

/* Setup caption config */
const captionConf = path.join(process.cwd(), '.CaptionConf');
const defaultCaptionFont = { fontSize: { small: 13, medium: 15, large: 21 } };

/* IPC CALLS */
ipcMain.on('ExternalLink:Open', (event, link: string) => {
  shell.openExternal(link);
});

ipcMain.on('Cache:ClearCache', (event, data: null) => {
  const dir = path.join(os.tmpdir(), 'webtorrent');
  if (fs.existsSync(dir)) {
    fs.rmdir(dir, { recursive: true }, () => {});
  } else if (fs.existsSync('C:\\tmp')) {
    fs.rmdir('C:\\tmp', { recursive: true }, () => {});
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
  } else if (fs.existsSync('C:\\tmp')) {
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
  if (server != null || webtorrent_client != null) {
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

  const maxCon = data.maxCon !== null ? Number(data.maxCon) : 55;
  webtorrent_client = new WebTorrent({ maxConns: maxCon });

  const torrent: Torrent = await new Promise((resolve, reject) => {
    webtorrent_client.add(data.hash, {}, (torrent) => {
      resolve(torrent);
    });
  });

  const files = torrent.files.sort();

  const videoFile = files.find(function (file) {
    return file.name.endsWith('.mp4');
  });

  if (videoFile === undefined) {
    webtorrent_client.destroy(() => {
      console.log('Client destroyed before downloading Movie');
      downloadMovieInstead(data.hash, maxCon, torrent.path);
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
        const chunkSize = end - start + 1;
        const stream = videoFile.createReadStream({ start, end });
        const head = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': 'video/mp4',
        };
        res.writeHead(206, head);
        stream.pipe(res);
      } else {
        const head = {
          'Content-Length': fileSize,
          'Content-Type': 'video/mp4',
        };
        res.writeHead(200, head);
        videoFile.createReadStream().pipe(res);
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
    server = express_app.listen(9000, 'localhost', () => {
      console.log('server ready');
      createVideoPlayerWindow();
    });
  }

  // if torrent error occurs
  torrent.on('error', function (err) {
    webtorrent_client.destroy(() => {
      console.log('Client destroyed due torrent error.');
    });
    dialog.showErrorBox('Torrent Error', err.toString());
  });

  // if no peers in torrent
  torrent.on('noPeers', function (announceType) {
    webtorrent_client.destroy(() => {
      console.log('Client destroyed due to no peers or network issue.');
    });
    dialog.showErrorBox('Torrent Warning', 'No peers available to stream.');
  });

  // error in torrent client
  webtorrent_client.on('error', (err) => {
    if (webtorrent_client) {
      webtorrent_client.destroy(() => {
        console.log('Client destroyed due to Torrent client error.');
        console.log(err.toString());
      });
    }
    dialog.showErrorBox('Torrent Client Error', err.toString());
  });
});

/* Helper Functions */
function closeServerAndClient() {
  server.close(() => {
    console.log('server closed');
  });
  if (webtorrent_client) {
    webtorrent_client.destroy(() => {});
  }
}

function downloadMovieInstead(
  hash: string,
  maxCon: number,
  previousPath: string
) {
  // delete previous path
  if (fs.existsSync(previousPath)) {
    fs.rmdir(previousPath, { recursive: true }, () => {});
  }

  const downloadOption = dialog.showMessageBoxSync(mainWindow, {
    type: 'info',
    title: 'Media content not supported by YTS Player',
    message: 'Do you want to download it instead?',
    detail:
      'No streamable video source found in the torrent to stream. \nYou can download it instead and play with another video player',
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
  webtorrent_client = new WebTorrent({ maxConns: maxCon });
  webtorrent_client.add(hash, { path: downloadPath[0] }, (torrent) => {
    createDownloaderWindow();

    // add IPC listener for torrent
    ipcMain.on('download:stop', () => {
      downloaderWindow.close();
    });

    // ipcMain.on("download:pause", () => {
    //     console.log("torrent Paused");
    //     torrent.pause()
    // })
    //
    // ipcMain.on("download:resume", () => {
    //     console.log("torrent resumed");
    //     torrent.resume();
    // })

    // every time torrent downloads
    torrent.on('download', (bytes) => {
      downloaderWindow.webContents.send('download:info', {
        progress: torrent.progress,
        downloadSpeed: torrent.downloadSpeed,
        uploadSpeed: torrent.uploadSpeed,
        title: torrent.name,
        downloadSize: torrent.length,
        totalDownloaded: torrent.downloaded,
      });
      downloaderWindow.setProgressBar(torrent.progress);
    });

    // on torrent complete
    torrent.on('done', () => {
      downloaderWindow.close();
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

function createWindow() {
  const url = isDev ? 'http://localhost:3000' : `file://${PROD_HTML_PATH}`;
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
    if (videoPlayerWindow != null) {
      videoPlayerWindow.close();
    }

    if (downloaderWindow != null) {
      downloaderWindow.close();
    }
  });

  state.manage(mainWindow);
}

function createVideoPlayerWindow() {
  const url = 'http://127.0.0.1:9000/streaming';
  videoPlayerWindow = new VideoPlayerWindow(url);

  if (isDev) {
    videoPlayerWindow.webContents.toggleDevTools();
  }

  videoPlayerWindow.on('closed', () => {
    closeServerAndClient();
  });
}

function createDownloaderWindow() {
  const url = isDev
    ? `file://${DOWNLOAD_HTML_PATH_DEV}`
    : `file://${DOWNLOAD_HTML_PATH_DEV}`;
  downloaderWindow = new DownloaderWindow(url);

  if (isDev) {
    downloaderWindow.webContents.toggleDevTools();
  }

  downloaderWindow.on('closed', () => {
    webtorrent_client.destroy(() => {
      console.log('Client destroyed on window closed');
      ipcMain.removeAllListeners('download:stop');
      // ipcMain.removeAllListeners("download:resume")
      // ipcMain.removeAllListeners("download:pause")
    });
  });
}

/* App Events */

// Main Event : Starting Point
app.on('ready', () => {
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
