import { BrowserWindow, Menu, shell } from 'electron';
import path from 'path';

class VideoPlayerWindow extends BrowserWindow {
  constructor(url: string) {
    super({
      width: 1000,
      height: 600,
      minWidth: 1000,
      minHeight: 600,
      darkTheme: true,
      backgroundColor: '#060606',
      title: 'YTS-Player',
      autoHideMenuBar: true,
      webPreferences: {},
      icon:
        process.platform === 'linux'
          ? path.join(__dirname, '../assets/icons/256x256.png')
          : undefined,
    });
    this.setMenu(
      Menu.buildFromTemplate([
        {
          label: 'About',
          submenu: [
            {
              label: 'View Shortcuts',
              click: () => {
                shell.openExternal(
                  'https://github.com/sampotts/plyr#shortcuts'
                );
              },
            },
            {
              label: 'Plyr Player',
              click: () => {
                shell.openExternal('https://github.com/sampotts/plyr');
              },
            },
          ],
        },
      ])
    );
    this.loadURL(url);
  }
}

export default VideoPlayerWindow;
