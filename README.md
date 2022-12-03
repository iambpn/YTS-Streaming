<!--
  Title: YTS Streaming
  Description: yts streaming is an torrent movie streaming app based on electronJS and yts api. yts streaming is only available for windows platform. It helps to stream movies directly from torrent.
  Author: Bipin Maharjan
  -->

<!-- Keywords: yts streaming, yts movie streaming app, desktop yts streaming app, yts online streaming, yts movies online streaming, yts online movie streaming -->

# YTS-Streaming v3.0 - Migrating to vite.

YTS-streaming application is an electron app for windows platform. Through YTS streaming application you can stream any movie available YTS(yify) movie website.
YTS-streaming uses the content from the official YTS API v2. This app is simple to use with a minimalists design. It is more or less like the original YTS website with the ability to play the movie within the app and download the movies that are not supported by YTS player.

### Download App > [Link to Releases](https://github.com/mbpn1/YTS-Streaming/releases) Download latest release

### Features

- YTS Website in windows app
- Torrent streaming within the app
- Built in player
- Support for captions
- Support for downloading if not playable
- Support for playing external torrent link.
- Support for Up/Down speed limit.

### Issues or Limitations

- YST logins, review and commenting feature not implemented
- An automatic update is not implemented. (Need to do manual update app if a new version is released)

**Clear Cache after watching the movie to free up the disk space. The cache are saved at <temp_folder>/webTorrent**

## Major dependency

- [Link to WebTorrent.io](http://webtorrent.io)
- [Link to plyr player](https://plyr.io/)
- [Link to Electron](https://www.electronjs.org/)
- [Link to Electron-Builder](https://github.com/electron-userland/electron-builder)
- Check package.json for more dependency

## To-Do:

- Support to see downloaded movies
- Allowing user to copying downloaded movies directly form the app.

# Preview

**Home**
![YTS-Streaming Home](https://user-images.githubusercontent.com/21078512/123229175-c7420200-d4f5-11eb-90da-39dd3a09bad0.png)

**Movie Player**
![YTS-Streaming Player](https://user-images.githubusercontent.com/21078512/111864151-77e4b680-8987-11eb-9a9b-26ec228162a8.png)

**Settings**
_Movies you have watched were downloaded in `<temp_folder>/webtorrent/` folder of your os so, it's good to clear cache to free up space. You can also copy the fully downloaded movie from the temp folder. To clear cache, there is a clear cache button within the app settings._
