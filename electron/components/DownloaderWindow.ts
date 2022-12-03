import { BrowserWindow } from 'electron';
import isDev from 'electron-is-dev';
import path from 'path';

export default class DownloaderWindow extends BrowserWindow {
  constructor(url: string) {
    super({
      width: 550,
      height: 220,
      resizable: isDev,
      darkTheme: true,
      backgroundColor: '#060606',
      title: 'Downloader',
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        backgroundThrottling: false,
      },
    });
    this.setMenuBarVisibility(false);
    this.loadURL(url);
  }
}
