// Modules
const {app, BrowserWindow, ipcMain} = require('electron');
const windowStateKeeper = require('electron-window-state');

let mainWindow;

ipcMain.on("saveUrl",(e,args)=>{
    global.url = args;
})

// Create a new BrowserWindow when `app` is ready
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
        webPreferences: {nodeIntegration: true}
    });

    mainWindow.setBackgroundColor("#211e1e");

    //manage new window state
    state.manage(mainWindow);

    // Load main.html into the new BrowserWindow
    mainWindow.loadFile('main.html')

    // Open DevTools - Remove for PRODUCTION!
    mainWindow.webContents.openDevTools()

    // Listen for window being closed
    mainWindow.on('closed', () => {
        mainWindow = null
    })
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
