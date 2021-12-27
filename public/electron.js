"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const electron_is_dev_1 = __importDefault(require("electron-is-dev"));
const electron_window_state_1 = __importDefault(require("electron-window-state"));
const path_1 = __importDefault(require("path"));
const MainWindow_1 = __importDefault(require("./electron_app/MainWindow"));
const VideoPlayerWindow_1 = __importDefault(require("./electron_app/VideoPlayerWindow"));
const os_1 = __importDefault(require("os"));
const fs_1 = __importDefault(require("fs"));
const webtorrent_1 = __importDefault(require("webtorrent"));
const express_1 = __importDefault(require("express"));
const srt2vtt_1 = __importDefault(require("srt2vtt"));
const DownloaderWindow_1 = __importDefault(require("./electron_app/DownloaderWindow"));
//@ts-ignore
let mainWindow = null;
//@ts-ignore
let videoPlayerWindow = null;
//@ts-ignore
let client = null;
//@ts-ignore
let server = null;
//@ts-ignore
let downloaderWindow = null;
electron_1.ipcMain.on("ExternalLink:Open", (event, link) => {
    electron_1.shell.openExternal(link);
});
electron_1.ipcMain.on("Cache:ClearCache", (event, data) => {
    let dir = path_1.default.join(os_1.default.tmpdir(), 'webtorrent');
    if (fs_1.default.existsSync(dir)) {
        fs_1.default.rmdir(dir, { recursive: true }, () => {
        });
    }
    else if (fs_1.default.existsSync("C:\\tmp")) {
        fs_1.default.rmdir("C:\\tmp", { recursive: true }, () => {
        });
    }
});
electron_1.ipcMain.on("Cache:ShowSpaceRequest", (event, data) => {
    let dir = path_1.default.join(os_1.default.tmpdir(), 'webtorrent');
    if (fs_1.default.existsSync(dir)) {
        fs_1.default.readdir(dir, (err, files) => {
            event.sender.send("Cache:ShowSpaceResponse", `${files.length} folder are in cache. About ${files.length * 500} MB data`);
        });
    }
    else if (fs_1.default.existsSync("C:\\tmp")) {
        fs_1.default.readdir(dir, (err, files) => {
            event.sender.send("Cache:ShowSpaceResponse", `${files.length} folder are in cache. About ${files.length * 500} MB data`);
        });
    }
    else {
        event.sender.send("Cache:ShowSpaceResponse", `0 folder are in cache.`);
    }
});
const captionConf = path_1.default.join(process.cwd(), ".CaptionConf");
const defaultCaptionFont = { "fontSize": { "small": 13, "medium": 15, "large": 21 } };
electron_1.ipcMain.on("style:caption", (event, args) => {
    if (args.type === "get") {
        try {
            let data = JSON.parse(fs_1.default.readFileSync(captionConf).toString());
            event.reply("get:style:caption", data);
        }
        catch (_a) {
            fs_1.default.writeFileSync(captionConf, JSON.stringify(defaultCaptionFont));
        }
    }
    else if (args.type === "save") {
        fs_1.default.writeFileSync(captionConf, JSON.stringify(args.data));
    }
});
electron_1.ipcMain.handle("video:play", (event, data) => __awaiter(void 0, void 0, void 0, function* () {
    if (server != null || client != null) {
        electron_1.dialog.showErrorBox("Movie player or Downloader is already running", "An instance of Movie Player | Downloader is already running. Please close the existing  or downloader window and try again.");
        return;
    }
    let app = express_1.default();
    //hosting files
    app.get("/plyr-js", function (req, res) {
        res.sendFile(path_1.default.join(__dirname, "public_assets/video_player/plyr3.6.8.polyfilled.min.js"));
    });
    app.get("/plyr-css", function (req, res) {
        res.sendFile(path_1.default.join(__dirname, "public_assets/video_player/plyr3.6.8.min.css"));
    });
    app.get("/bootstrapv5", function (req, res) {
        res.sendFile(path_1.default.join(__dirname, "public_assets/bootstrap/bootstrap.min.css"));
    });
    app.get("/streaming", function (req, res) {
        res.sendFile(path_1.default.join(__dirname, "video.html"));
    });
    app.get("/custom-caption", function (req, res) {
        try {
            let data = JSON.parse(fs_1.default.readFileSync(captionConf).toString());
            res.json(data);
        }
        catch (_a) {
            res.json(defaultCaptionFont);
        }
    });
    // hosting files end
    let maxCon = data.maxCon !== null ? Number(data.maxCon) : 55;
    client = new webtorrent_1.default({ maxConns: maxCon });
    let torrent = yield new Promise((resolve, reject) => {
        client.add(data.hash, {}, (torrent) => {
            resolve(torrent);
        });
    });
    let files = torrent.files.sort();
    let videoFile = files.find(function (file) {
        return file.name.endsWith(".mp4");
    });
    if (videoFile === undefined) {
        client.destroy(() => {
            console.log("Client destroyed before downloading Movie");
            //@ts-ignore
            client = null;
            downloadMovieInstead(data.hash, maxCon, torrent.path);
        });
        return;
    }
    else {
        // host video file
        app.get("/video", function (req, res) {
            const fileSize = videoFile.length;
            const range = req.headers.range;
            if (range) {
                const parts = range.replace(/bytes=/, "").split("-");
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
                const chunkSize = end - start + 1;
                const stream = videoFile.createReadStream({ start, end });
                const head = {
                    "Content-Range": `bytes ${start}-${end}/${fileSize}`,
                    "Accept-Ranges": "bytes",
                    "Content-Length": chunkSize,
                    "Content-Type": "video/mp4",
                };
                res.writeHead(206, head);
                stream.pipe(res);
            }
            else {
                const head = {
                    "Content-Length": fileSize,
                    "Content-Type": "video/mp4",
                };
                res.writeHead(200, head);
                videoFile.createReadStream().pipe(res);
            }
        });
        //subtitle api
        app.get('/subtitleApi/add', (req, res) => {
            try {
                if (req.query.path) {
                    //@ts-ignore
                    let path_query = req.query.path;
                    let subtitle_path = path_query.split('.');
                    if (subtitle_path[subtitle_path.length - 1] === 'srt') {
                        let srtData = fs_1.default.readFileSync(path_query);
                        let newPath = path_1.default.join(torrent.path, "/", 'customCaption.vtt');
                        srt2vtt_1.default(srtData, function (err, vttData) {
                            if (err)
                                throw new Error(err);
                            fs_1.default.writeFileSync(newPath, vttData);
                            fs_1.default.createReadStream(newPath).pipe(res);
                        });
                    }
                    else if (subtitle_path[subtitle_path.length - 1] === 'vtt') {
                        fs_1.default.createReadStream(path_query).pipe(res);
                    }
                    else {
                        throw new Error("Subtitle MIME type not supported. Should be .srt or .vtt");
                    }
                }
                else {
                    throw new Error("Subtitle path not found");
                }
            }
            catch (err) {
                electron_1.dialog.showErrorBox("Error while adding subtitle", err.toString());
                res.sendStatus(400);
            }
        });
        // downloadInfo api
        app.get("/downloadInfo", (req, res) => {
            res.json({ 'total_downloaded': torrent.downloaded, 'total_size': torrent.length, 'path': torrent.path });
        });
        //speed api
        app.get("/speed", (req, res) => {
            res.json({ 'up': torrent.uploadSpeed, 'down': torrent.downloadSpeed });
        });
        //get Title api
        app.get("/title", (req, res) => {
            res.json({ 'title': data.title === undefined ? "YTS-Player" : "YTS-Player - " + data.title });
        });
        // start server
        server = app.listen(9000, 'localhost', () => {
            console.log("server ready");
            createVideoPlayerWindow();
        });
    }
    //if torrent error occurs
    torrent.on('error', function (err) {
        client.destroy(() => {
            console.log("Client destroyed due torrent error.");
            //@ts-ignore
            client = null;
        });
        electron_1.dialog.showErrorBox('Torrent Error', err.toString());
    });
    // if no peers in torrent
    torrent.on('noPeers', function (announceType) {
        client.destroy(() => {
            console.log("Client destroyed due to no peers or network issue.");
            //@ts-ignore
            client = null;
        });
        electron_1.dialog.showErrorBox('Torrent Warning', 'No peers available to stream.');
    });
    // error in torrent client
    client.on("error", (err) => {
        if (client) {
            client.destroy(() => {
                console.log("Client destroyed due to Torrent client error.");
                console.log(err.toString());
                //@ts-ignore
                client = null;
            });
        }
        electron_1.dialog.showErrorBox("Torrent Client Error", err.toString());
    });
}));
function closeServerAndClient() {
    //@ts-ignore
    server.close(() => {
        console.log("server closed");
        //@ts-ignore
        server = null;
    });
    if (client) {
        client.destroy(() => {
            //@ts-ignore
            client = null;
        });
    }
}
function downloadMovieInstead(hash, maxCon, previousPath) {
    // delete previous path
    if (fs_1.default.existsSync(previousPath)) {
        fs_1.default.rmdir(previousPath, { recursive: true }, () => {
        });
    }
    let downloadOption = electron_1.dialog.showMessageBoxSync(mainWindow, {
        type: "info",
        title: "Media content not supported by YTS Player",
        message: "Do you want to download it instead?",
        detail: "No streamable video source found in the torrent to stream. \nYou can download it instead and play with another video player",
        buttons: ["Download", "Cancel"],
        defaultId: 0,
        cancelId: 1,
        noLink: true
    });
    let downloadPath = undefined;
    if (downloadOption === 0) {
        downloadPath = electron_1.dialog.showOpenDialogSync({
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
    client = new webtorrent_1.default({ maxConns: maxCon });
    client.add(hash, { path: downloadPath[0] }, (torrent) => {
        createDownloaderWindow();
        // add IPC listener for torrent
        electron_1.ipcMain.on("download:stop", () => {
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
        torrent.on("download", (bytes) => {
            downloaderWindow.webContents.send("download:info", {
                "progress": torrent.progress,
                "downloadSpeed": torrent.downloadSpeed,
                "uploadSpeed": torrent.uploadSpeed,
                "title": torrent.name,
                "downloadSize": torrent.length,
                "totalDownloaded": torrent.downloaded
            });
            downloaderWindow.setProgressBar(torrent.progress);
        });
        // on torrent complete
        torrent.on("done", () => {
            downloaderWindow.close();
            let completeRes = electron_1.dialog.showMessageBoxSync({
                type: "info",
                title: "Download Completed",
                message: torrent.name + " downloaded",
                buttons: ["Close", "Open Folder"],
                cancelId: 0,
                defaultId: 1,
                noLink: true
            });
            if (completeRes === 1 && downloadPath !== undefined) {
                electron_1.shell.openPath(downloadPath[0]);
            }
        });
        //if torrent error occurs
        torrent.on('error', function (err) {
            electron_1.dialog.showErrorBox('Torrent Error', err.toString());
        });
        // if no peers in torrent
        torrent.on('noPeers', function (announceType) {
            electron_1.dialog.showErrorBox('Torrent Warning', 'No peers available to stream.');
        });
    });
    // error in torrent client
    client.on("error", (err) => {
        electron_1.dialog.showErrorBox("Torrent Client Error", err.toString());
    });
}
function createWindow() {
    let url = electron_is_dev_1.default ? 'http://localhost:3000' : `file://${path_1.default.join(__dirname, '../build/index.html')}`;
    let state = electron_window_state_1.default({
        defaultWidth: 1200,
        defaultHeight: 1000
    });
    mainWindow = new MainWindow_1.default(url, state);
    if (electron_is_dev_1.default) {
        mainWindow.setAutoHideMenuBar(true);
    }
    else {
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
    videoPlayerWindow = new VideoPlayerWindow_1.default(url);
    if (electron_is_dev_1.default) {
        videoPlayerWindow.webContents.toggleDevTools();
    }
    videoPlayerWindow.on('closed', () => {
        closeServerAndClient();
        //@ts-ignore
        videoPlayerWindow = null;
    });
}
function createDownloaderWindow() {
    let url = electron_is_dev_1.default ? `file://${path_1.default.join(__dirname, 'download.html')}` : `file://${path_1.default.join(__dirname, '../build/download.html')}`;
    downloaderWindow = new DownloaderWindow_1.default(url);
    if (electron_is_dev_1.default) {
        downloaderWindow.webContents.toggleDevTools();
    }
    downloaderWindow.on('closed', () => {
        client.destroy(() => {
            console.log("Client destroyed on window closed");
            electron_1.ipcMain.removeAllListeners("download:stop");
            // ipcMain.removeAllListeners("download:resume")
            // ipcMain.removeAllListeners("download:pause")
            //@ts-ignore
            client = null;
        });
        //@ts-ignore
        downloaderWindow = null;
    });
}
electron_1.app.on('ready', () => {
    createWindow();
});
electron_1.app.on('browser-window-focus', function () {
    electron_1.globalShortcut.register("CommandOrControl+R", () => {
        console.log("CommandOrControl+R is pressed: Shortcut Disabled");
    });
    electron_1.globalShortcut.register("F5", () => {
        console.log("F5 is pressed: Shortcut Disabled");
    });
    electron_1.globalShortcut.register("CommandOrControl+Shift+I", () => {
        console.log("Inspect Element: Shortcut Disabled");
    });
});
electron_1.app.on('browser-window-blur', function () {
    electron_1.globalShortcut.unregister('CommandOrControl+R');
    electron_1.globalShortcut.unregister('F5');
    electron_1.globalShortcut.unregister('CommandOrControl+Shift+I');
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    if (MainWindow_1.default.getAllWindows().length === 0) {
        createWindow();
    }
});
