import {ipcRenderer, contextBridge} from "electron";

contextBridge.exposeInMainWorld(
    "api", {
        send: (channel: string, data: any) => {
            let allow_channels = ["ExternalLink:Open","Cache:ClearCache","Cache:ShowSpaceRequest"];
            if (allow_channels.includes(channel)) {
                ipcRenderer.send(channel, data);
            }
        },
        receive: (channel: string, func: (...data: any) => void) => {
            let allow_channels = ["Cache:ShowSpaceResponse"];
            if (allow_channels.includes(channel)) {
                ipcRenderer.on(channel, (e, ...args) => func(...args));
            }
        }
    }
)