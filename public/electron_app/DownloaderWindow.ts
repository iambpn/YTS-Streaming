import {BrowserWindow} from "electron";
import path from "path";

export default class DownloaderWindow extends BrowserWindow{
    constructor(url:string) {
        super({
            width:550,
            height:220,
            resizable:false,
            darkTheme: true,
            backgroundColor: "#060606",
            title: "Downloader",
            webPreferences:{
                preload: path.join(__dirname, "preload.js"),
                enableRemoteModule:false,
                backgroundThrottling: false
            }
        });
        this.setMenuBarVisibility(false);
        this.loadURL(url);
    }
}