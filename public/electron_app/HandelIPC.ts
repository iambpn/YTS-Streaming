import {ipcMain, shell} from "electron";
import path from "path";
import os from "os";
import fs from "fs";

ipcMain.on("ExternalLink:Open",(event,link:string)=>{
    shell.openExternal(link)
});

ipcMain.on("Cache:ClearCache",(event,data:null)=>{
    let dir = path.join(os.tmpdir(),'webtorrent');
    if(fs.existsSync(dir)) {
        fs.rmdir(dir, {recursive: true}, () => {
        })
    }
})

ipcMain.on("Cache:ShowSpaceRequest",(event,data:null)=>{
    let dir = path.join(os.tmpdir(),'webtorrent');
    if(fs.existsSync(dir)) {
        fs.readdir(dir, (err, files) => {
            event.sender.send("Cache:ShowSpaceResponse", `${files.length} folder are in cache. About ${files.length * 500} MB data`);
        });
    }
    else{
        event.sender.send("Cache:ShowSpaceResponse", `0 folder are in cache.`);
    }
})