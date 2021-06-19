"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
class VideoPlayerWindow extends electron_1.BrowserWindow {
    constructor(url) {
        super({
            width: 1000,
            height: 600,
            minWidth: 1000,
            minHeight: 600,
            darkTheme: true,
            backgroundColor: "#060606",
            title: "YTS-Player",
            autoHideMenuBar: true,
            webPreferences: {
                enableRemoteModule: false
            }
        });
        this.setMenu(electron_1.Menu.buildFromTemplate([
            {
                label: "About",
                submenu: [
                    {
                        label: "View Shortcuts",
                        click: () => {
                            electron_1.shell.openExternal('https://github.com/sampotts/plyr#shortcuts');
                        }
                    },
                    {
                        label: 'Plyr Player',
                        click: () => {
                            electron_1.shell.openExternal("https://github.com/sampotts/plyr");
                        },
                    }
                ]
            }
        ]));
        this.loadURL(url);
    }
}
exports.default = VideoPlayerWindow;
