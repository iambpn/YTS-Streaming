import { BrowserWindow } from 'electron';
import windowStateKeeper from 'electron-window-state';
import path from 'path';
import { get__dirname } from '../configs.js';

class MainWindow extends BrowserWindow {
  constructor(url: string, state: windowStateKeeper.State) {
    super({
      x: state.x,
      y: state.y,
      width: state.width,
      height: state.height,
      minWidth: 1000,
      minHeight: 600,
      darkTheme: true,
      backgroundColor: '#060606',
      title: 'YTS-Streaming',
      webPreferences: {
        preload: path.join(get__dirname(import.meta.url), 'preload.cjs'),
        backgroundThrottling: false,
      },
      icon:
        process.platform === 'linux'
          ? path.join(get__dirname(import.meta.url), '../assets/icons/256x256.png')
          : undefined,
    });
    this.loadURL(url);
  }
}

export default MainWindow;
