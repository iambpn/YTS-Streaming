import { BrowserWindow } from 'electron';
import path from 'path';
import windowStateKeeper from 'electron-window-state';

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
        preload: path.join(__dirname, 'preload.js'),
        backgroundThrottling: false,
      },
      icon:
        process.platform === 'linux'
          ? path.join(__dirname, '../assets/icons/256x256.png')
          : undefined,
    });
    this.loadURL(url);
  }
}

export default MainWindow;
