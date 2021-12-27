import {ipcRenderer, contextBridge} from "electron";

contextBridge.exposeInMainWorld(
    "api", {
        send: (channel: string, data: any) => {
            let allow_channels = ["ExternalLink:Open","Cache:ClearCache","Cache:ShowSpaceRequest","download:stop",
              "download:pause", "download:resume", "style:caption"];
            if (allow_channels.includes(channel)) {
                ipcRenderer.send(channel, data);
            }
        },
        invoke:async(channel: string, data: any)=>{
          let allow_channels = ["video:play"];
          if (allow_channels.includes(channel)) {
            return await ipcRenderer.invoke(channel, data);
          }
        },
        receive: (channel: string, func: (...data: any) => void) => {
            let allow_channels = ["Cache:ShowSpaceResponse","download:info","get:style:caption"];
            if (allow_channels.includes(channel)) {
                ipcRenderer.on(channel, (e, ...args) => func(...args));
            }
        }
    }
)