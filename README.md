# YTS-Streaming v2.0 - Rewritten in ReactJS.
 YTS-streaming is an electron app for windows platform. Through YTS-streaming you can stream any movie available YTS movie website.
 YTS-Streaming uses the content from the official YST API v2. This app is simple to use with a minimalistic design. It is more or less like the original YST website with the ability to play the movie within the app and download the movies that are not supported by YTS player.
 
 ### Download App > [Link to Releases](https://github.com/mbpn1/YTS-Streaming/releases) Download latest release
 
 ### Features
 - YTS Website in windows app
 - Torrent streaming within the app
 - Built in player
 - Support for captions
 - Support for downloading if not playable
 - Support for playing external torrent link.
 
 ### Issues or Limitations
 - Not allowed to limit the bandwidth. i.e Will stream a movie in full bandwidth
 - YST logins, review and commenting feature not implemented
 - An automatic update is not implemented. (Need to do manual update app if a new version is released)

**Clear Cache after watching the movie to free up the disk space. The cache are saved at %temp%/webTorrent**

## links to dependency
- [Link to WebTorrent.io](http://webtorrent.io)
- [Link to plyr player](https://plyr.io/)
- [Link to Electron](https://www.electronjs.org/)
- [Link to Electron-Builder](https://github.com/electron-userland/electron-builder)
- Check package.json for more dependency

## Things to add:
- Support to see downloaded movies
- Allowing user to copying downloaded movies directly form the app.

## Near Future changes : 
- Full Implementation of YTS API.

# Preview
**Home**
![image](https://user-images.githubusercontent.com/21078512/123229175-c7420200-d4f5-11eb-90da-39dd3a09bad0.png)

  
**Movie Player**
![image](https://user-images.githubusercontent.com/21078512/111864151-77e4b680-8987-11eb-9a9b-26ec228162a8.png)


**Settings**  
*Movies you watched were downloaded in `%temp%/webtorrent/` so, it's good to clear cache from time to time to free up those spaces. You can also copy the fully downloaded movie from the temp folder. To clear cache, there is a clear cache button within the app settings.*
![image](https://user-images.githubusercontent.com/21078512/123229296-dfb21c80-d4f5-11eb-9a5f-57e51465294b.png)


