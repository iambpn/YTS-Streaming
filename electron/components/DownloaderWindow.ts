import { BrowserWindow } from 'electron';
import isDev from 'electron-is-dev';
import path from 'path';
import { get__dirname } from '../configs.js';

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
        preload: path.join(get__dirname(import.meta.url), 'preload.js'),
        backgroundThrottling: false,
      },
      icon:
        process.platform === 'linux'
          ? path.join(
              get__dirname(import.meta.url),
              '../assets/icons/256x256.png'
            )
          : undefined,
    });
    this.setMenuBarVisibility(false);
    this.loadURL(url);
  }
}
