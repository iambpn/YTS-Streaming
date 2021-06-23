import {app, dialog, globalShortcut, ipcMain, shell} from "electron";
import isDev from "electron-is-dev";
import windowStateKeeper from "electron-window-state";
import path from "path";
import MainWindow from "./electron_app/MainWindow";
import VideoPlayerWindow from "./electron_app/VideoPlayerWindow";
import os from "os";
import fs from "fs";
import WebTorrent from "webtorrent";
import express from "express";
import srt2vtt from "srt2vtt";
import http from "http";
import DownloaderWindow from "./electron_app/DownloaderWindow";

//@ts-ignore
let mainWindow: Electron.BrowserWindow = null;
//@ts-ignore
let videoPlayerWindow: Electron.BrowserWindow = null;
//@ts-ignore
let client: WebTorrent.Instance = null;
//@ts-ignore
let server: http.Server = null;
//@ts-ignore
let downloaderWindow: BrowserWindow = null;

ipcMain.on("ExternalLink:Open", (event, link: string) => {
    shell.openExternal(link)
});

ipcMain.on("Cache:ClearCache", (event, data: null) => {
    let dir = path.join(os.tmpdir(), 'webtorrent');
    if (fs.existsSync(dir)) {
        fs.rmdir(dir, {recursive: true}, () => {
        })
    }
})

ipcMain.on("Cache:ShowSpaceRequest", (event, data: null) => {
    let dir = path.join(os.tmpdir(), 'webtorrent');
    if (fs.existsSync(dir)) {
        fs.readdir(dir, (err, files) => {
            event.sender.send("Cache:ShowSpaceResponse", `${files.length} folder are in cache. About ${files.length * 500} MB data`);
        });
    } else {
        event.sender.send("Cache:ShowSpaceResponse", `0 folder are in cache.`);
    }
})

type videoPlayData = {
    hash: string,
    title?: string,
    maxCon: string | null
}
ipcMain.on("video:play", (event, data: videoPlayData) => {
    if (server != null || client != null) {
        dialog.showErrorBox("Movie player or Downloader is already running", "An instance of Movie Player | Downloader is already running. Please close the existing  or downloader window and try again.");
        return;
    }

    let app = express();

    //hosting files
    app.get("/plyr-js", function (req, res) {
        res.sendFile(path.join(__dirname, "public_assets/video_player/plyr3.6.8.polyfilled.min.js"));
    });

    app.get("/plyr-css", function (req, res) {
        res.sendFile(path.join(__dirname, "public_assets/video_player/plyr3.6.8.min.css"));
    });

    app.get("/bootstrapv5", function (req, res) {
        res.sendFile(path.join(__dirname, "public_assets/bootstrap/bootstrap.min.css"));
    });

    app.get("/streaming", function (req, res) {
        res.sendFile(path.join(__dirname, "video.html"));
    });
    // hosting files end

    let maxCon = data.maxCon !== null ? Number(data.maxCon) : 55;
    client = new WebTorrent({maxConns: maxCon});

    client.add(data.hash, {}, (torrent) => {
        let files = torrent.files.sort()
        let videoFile = files.find(function (file) {
            return file.name.endsWith(".mp4");
        });

        if (videoFile === undefined) {
            client.destroy(() => {
                console.log("Client destroyed before download Movie");
                //@ts-ignore
                client = null;
                downloadMovieInstead(data.hash, maxCon, torrent.path);
            });
            return;

        } else {
            // host video file
            app.get("/video", function (req, res) {
                const fileSize = videoFile!.length;
                const range = req.headers.range;
                if (range) {
                    const parts = range.replace(/bytes=/, "").split("-");
                    const start = parseInt(parts[0], 10);
                    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
                    const chunkSize = end - start + 1;
                    const stream = videoFile!.createReadStream({start, end});
                    const head = {
                        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
                        "Accept-Ranges": "bytes",
                        "Content-Length": chunkSize,
                        "Content-Type": "video/mp4",
                    };
                    res.writeHead(206, head);
                    stream.pipe(res);
                } else {
                    const head = {
                        "Content-Length": fileSize,
                        "Content-Type": "video/mp4",
                    };
                    res.writeHead(200, head);
                    videoFile!.createReadStream().pipe(res);
                }
            });

            //subtitle api
            app.get('/subtitleApi/add', (req, res) => {
                try {
                    if (req.query.path) {
                        //@ts-ignore
                        let path_query: string = req.query.path;
                        let subtitle_path: string[] = path_query.split('.');
                        if (subtitle_path[subtitle_path.length - 1] === 'srt') {
                            let srtData = fs.readFileSync(path_query);
                            let newPath = path.join(torrent.path, "/", 'customCaption.vtt');
                            srt2vtt(srtData, function (err: any, vttData: any) {
                                if (err) throw new Error(err);
                                fs.writeFileSync(newPath, vttData);
                                fs.createReadStream(newPath).pipe(res);
                            });
                        } else if (subtitle_path[subtitle_path.length - 1] === 'vtt') {
                            fs.createReadStream(path_query).pipe(res);
                        } else {
                            throw new Error("Subtitle MIME type not supported. Should be .srt or .vtt");
                        }
                    } else {
                        throw new Error("Subtitle path not found");
                    }
                } catch (err) {
                    dialog.showErrorBox("Error while adding subtitle", err.toString())
                    res.sendStatus(400);
                }
            });

            // downloadInfo api
            app.get("/downloadInfo",(req,res)=>{
                res.json({'total_downloaded': torrent.downloaded, 'total_size': torrent.length})
            });

            //speed api
            app.get("/speed", (req, res) => {
                res.json({'up': torrent.uploadSpeed, 'down': torrent.downloadSpeed})
            });

            //get Title api
            app.get("/title", (req, res) => {
                res.json({'title': data.title === undefined ? "YTS-Player" : "YTS-Player - "+data.title})
            });

            // start server
            server = app.listen(9000, 'localhost', () => {
                console.log("server ready");
                createVideoPlayerWindow();
            });
        }

        //if torrent error occurs
        torrent.on('error', function (err) {
            dialog.showErrorBox('Torrent Error', err.toString());
        })

        // if no peers in torrent
        torrent.on('noPeers', function (announceType) {
            dialog.showErrorBox('Torrent Warning', 'No peers available to stream.');
        })
    })

    // error in torrent client
    client.on("error", (err) => {
        dialog.showErrorBox("Torrent Client Error", err.toString());
    })
})

function closeServerAndClient() {
    //@ts-ignore
    server.close(() => {
        console.log("server closed")
        //@ts-ignore
        server = null;
    })
    client.destroy(() => {
        //@ts-ignore
        client = null;
    });
}

function downloadMovieInstead(hash: string, maxCon: number, previousPath: string) {
    // delete previous path
    if (fs.existsSync(previousPath)) {
        fs.rmdir(previousPath, {recursive: true}, () => {
        })
    }

    let downloadOption = dialog.showMessageBoxSync(mainWindow, {
        type: "info",
        title: "Media content not supported by YTS Player",
        message: "Do you want to download it instead?",
        detail: "No streamable video source found in the torrent to stream. \nYou can download it instead and play with another video player",
        buttons: ["Download", "Cancel"],
        defaultId: 0,
        cancelId: 1,
        noLink: true
    });

    let downloadPath: string[] | undefined = undefined;
    if (downloadOption === 0) {
        downloadPath = dialog.showOpenDialogSync({
            title: "Choose Download Location",
            properties: [
                "dontAddToRecent",
                "openDirectory",
            ]
        });
    }

    if (downloadPath === undefined) {
        return;
    }

    // only download no need to stream from here
    client = new WebTorrent({maxConns: maxCon});
    client.add(hash, {path: downloadPath[0]}, (torrent) => {
        createDownloaderWindow();

        // add IPC listener for torrent
        ipcMain.on("download:stop", () => {
            downloaderWindow.close();
        })

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
        torrent.on("download", (bytes) => {
            downloaderWindow.webContents.send("download:info", {
                "progress": torrent.progress,
                "downloadSpeed": torrent.downloadSpeed,
                "uploadSpeed": torrent.uploadSpeed,
                "title": torrent.name,
                "downloadSize": torrent.length,
                "totalDownloaded": torrent.downloaded
            })
            downloaderWindow.setProgressBar(torrent.progress);
        })

        // on torrent complete
        torrent.on("done", () => {
            downloaderWindow.close();
            let completeRes = dialog.showMessageBoxSync({
                type: "info",
                title: "Download Completed",
                message: torrent.name + " downloaded",
                buttons: ["Close", "Open Folder"],
                cancelId: 0,
                defaultId: 1,
                noLink: true
            })
            if (completeRes === 1 && downloadPath !== undefined) {
                shell.openPath(downloadPath[0]);
            }
        })

        //if torrent error occurs
        torrent.on('error', function (err) {
            dialog.showErrorBox('Torrent Error', err.toString());
        })

        // if no peers in torrent
        torrent.on('noPeers', function (announceType) {
            dialog.showErrorBox('Torrent Warning', 'No peers available to stream.');
        })
    })

    // error in torrent client
    client.on("error", (err) => {
        dialog.showErrorBox("Torrent Client Error", err.toString());
    })
}

function createWindow() {
    let url = isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../build/index.html')}`;
    let state = windowStateKeeper({
        defaultWidth: 1200,
        defaultHeight: 1000
    });
    mainWindow = new MainWindow(url, state);

    if (isDev) {
        mainWindow.setAutoHideMenuBar(true);
    } else {
        mainWindow.setMenuBarVisibility(false);
    }

    mainWindow.on('closed', () => {
        //@ts-ignore
        mainWindow = null;
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
    let url = "http://127.0.0.1:9000/streaming";
    videoPlayerWindow = new VideoPlayerWindow(url);

    if (isDev) {
        videoPlayerWindow.webContents.toggleDevTools();
    }

    videoPlayerWindow.on('closed', () => {
        closeServerAndClient()
        //@ts-ignore
        videoPlayerWindow = null;
    });
}

function createDownloaderWindow() {
    let url = isDev ? `file://${path.join(__dirname, 'download.html')}` : `file://${path.join(__dirname, '../build/download.html')}`;
    downloaderWindow = new DownloaderWindow(url);

    if (isDev) {
        downloaderWindow.webContents.toggleDevTools();
    }

    downloaderWindow.on('closed', () => {
        client.destroy(() => {
            console.log("Client destroyed on window closed")
            ipcMain.removeAllListeners("download:stop")
            // ipcMain.removeAllListeners("download:resume")
            // ipcMain.removeAllListeners("download:pause")
            //@ts-ignore
            client = null;
        })
        //@ts-ignore
        downloaderWindow = null;
    });
}

app.on('ready', () => {
    createWindow();
});

app.on('browser-window-focus', function () {
    globalShortcut.register("CommandOrControl+R", () => {
        console.log("CommandOrControl+R is pressed: Shortcut Disabled");
    });
    globalShortcut.register("F5", () => {
        console.log("F5 is pressed: Shortcut Disabled");
    });
    globalShortcut.register("CommandOrControl+Shift+I", () => {
        console.log("Inspect Element: Shortcut Disabled");
    });
});

app.on('browser-window-blur', function () {
    globalShortcut.unregister('CommandOrControl+R');
    globalShortcut.unregister('F5');
    globalShortcut.unregister('CommandOrControl+Shift+I')
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (MainWindow.getAllWindows().length === 0) {
        createWindow();
    }
});