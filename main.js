// Modules
const {app, BrowserWindow, ipcMain, dialog, Menu, shell} = require('electron');
const windowStateKeeper = require('electron-window-state');
const express = require("express");
const path = require("path");
const fs = require("fs");
const WebTorrent = require("webtorrent");
const srt2vtt = require('srt2vtt');

let mainWindow, moviePlayerWindow;
let server = null;
let client = null;
let file_path;

//ipc messages handlers

//save url in global variable for going back from movie details to main html
ipcMain.on("saveUrl", (e, args) => {
    global.url = args;
});

// console.log in main processs
ipcMain.on("console.log", (e, args) => {
    console.log(args);
});

// start server and configure for streaming
ipcMain.on("server", (e, args) => {
    if (args.action === 'start') {
        if (server == null && client == null) {
            // express initialization
            server = express();

            // hosting public files
            server.use("/", express.static(path.join(__dirname, "public")));

            server.get("/streaming", function (req, res) {
                res.sendFile(path.join(__dirname,"public","video.html"));
            });

            // webTorrent configuration
            let torrentId = args.hash;

            if(args.settings != null && args.settings.max_conn !== 55){
                client = new WebTorrent({maxConns:args.settings.max_conn});
            }
            else{
                client = new WebTorrent();
            }

            // adding torrent with call back function
            client.add(torrentId, function (torrent) {
                // Torrents can contain many files. Let's use the .mp4 file
                let file = torrent.files.find(function (file) {
                    return file.name.endsWith(".mp4");
                });

                file_path = torrent.path;

                server.get("/video", function (req, res) {
                    const fileSize = file.length;
                    const range = req.headers.range;
                    if (range) {
                        const parts = range.replace(/bytes=/, "").split("-");
                        const start = parseInt(parts[0], 10);
                        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
                        const chunksize = end - start + 1;
                        const stream = file.createReadStream({start, end});
                        const head = {
                            "Content-Range": `bytes ${start}-${end}/${fileSize}`,
                            "Accept-Ranges": "bytes",
                            "Content-Length": chunksize,
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
                        file.createReadStream().pipe(res);
                    }
                });

                //subtitle api
                server.get('/subtitleapi/add',(req,res)=>{
                    if(req.query.path) {
                        let subtitle_path = req.query.path.split('.');
                        if(subtitle_path[subtitle_path.length -1] === 'srt'){
                            let srtData = fs.readFileSync(req.query.path);
                            let newPath = path.join(torrent.path,"/",'caption1.vtt');
                            srt2vtt(srtData, function(err, vttData) {
                                if (err) throw new Error(err);
                                fs.writeFileSync(newPath, vttData);
                                fs.createReadStream(newPath).pipe(res);
                            });
                        }
                        else if(subtitle_path[subtitle_path.length -1] === 'vtt'){
                            fs.createReadStream(newPath).pipe(res);
                        }
                        else{
                            res.sendStatus(400);
                        }
                    }
                    else{
                        res.sendStatus(400);
                    }
                });

                //speed api
                server.get("/speed",(req,res)=>{
                    res.json({'up':torrent.uploadSpeed,'down':torrent.downloadSpeed})
                });

                //get Title api
                server.get("/title",(req,res)=>{
                    res.json({'title':args.title})
                });

                //if torrent error occurs
                torrent.on('error', function (err) {
                    dialog.showErrorBox('Torrent Error', err.toString());
                })

                // if no peers in torrent
                torrent.on('noPeers', function (announceType) {
                    dialog.showErrorBox('Torrent Warning', 'No peers available to stream.');
                })

                //Strating server
                server = server.listen(8000,'localhost', () => {
                    createMoviePlayerWindow();
                })
            });

            //if error on client
            client.on('error', function (err) {
                dialog.showErrorBox('Torrent client Error', err.toString());
            })
        } else {
            //error
            dialog.showErrorBox("Movie player is already running", "An instance of Movie Player is already running. Please close the existing movie player and try again.")
        }
    }
})

// stop torrent downloading and streaming server(Express)
function stopServerAndDownloading() {
    if (server != null && client != null) {
        server.close(() => {
            server = null;
        });
        client.destroy(() => {
            client = null
        });
        // delete the file after closing the movie player
        // fs.rmdir(file_path, {recursive: true},()=>{})
    } else {
        //error
        dialog.showErrorBox("Movie player not initialized", "Movie player is not initialized. Please restart the app and try again.");
    }
}

// Create a Main BrowserWindow when `app` is ready
function createWindow() {
    let state = windowStateKeeper({
        defaultWidth: 1200,
        defaultHeight: 1000,
    });

    mainWindow = new BrowserWindow({
        x: state.x,
        y: state.y,
        width: state.width,
        height: state.height,
        minWidth: 1000,
        minHeight: 600,
        darkTheme:true,
        webPreferences: {nodeIntegration: true,enableRemoteModule: true}
    });

    // set background color of mainWindow
    mainWindow.setBackgroundColor("#211e1e");

    //set Menu bar visibility to off
    mainWindow.setMenuBarVisibility(false);

    //manage new window state
    state.manage(mainWindow);

    // Load main.html into the new BrowserWindow
    mainWindow.loadFile('main.html')

    // Open DevTools - Remove for PRODUCTION!
    //mainWindow.webContents.openDevTools()

    // Listen for window being closed
    mainWindow.on('closed', () => {
        mainWindow = null
    })
}

//generating menu from template
let menu_from_template = Menu.buildFromTemplate([
    {
        label:"About",
        submenu: [
            {
                label:"View Shortcuts",
                click: ()=> {shell.openExternal('https://github.com/sampotts/plyr#shortcuts')}
            },
            {
                label: 'Plyr Player',
                click: ()=>{shell.openExternal("https://github.com/sampotts/plyr")},
            }
        ]
    }
]);

// Create a Movie player BrowserWindow
function createMoviePlayerWindow() {
    moviePlayerWindow = new BrowserWindow({
        width: 1000,
        height: 600,
        minWidth: 1000,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            parent: mainWindow,
            enableRemoteModule: false,
        }
    });

    //set window background
    moviePlayerWindow.setBackgroundColor("#000000");

    //set window menu
    moviePlayerWindow.setMenu(menu_from_template);

    // Load html into the new BrowserWindow
    moviePlayerWindow.loadURL('http://127.0.0.1:8000/streaming');

    // Open DevTools - Remove for PRODUCTION!
    // moviePlayerWindow.webContents.openDevTools()

    // Listen for window being closed
    moviePlayerWindow.on('closed', () => {
        stopServerAndDownloading()
        moviePlayerWindow = null
    })

    // events
    moviePlayerWindow.on("enter-full-screen", ()=>{moviePlayerWindow.setMenuBarVisibility(false)})
    moviePlayerWindow.on("leave-full-screen", ()=>{moviePlayerWindow.setMenuBarVisibility(true)})
}

// Electron `app` is ready
app.on('ready', createWindow)

// Quit when all windows are closed - (Not macOS - Darwin)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

// When app icon is clicked and app is running, (macOS) recreate the BrowserWindow
app.on('activate', () => {
    if (mainWindow === null) createWindow()
})
