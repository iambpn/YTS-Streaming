/*
* This need to be converted by babel before using this.
* A babel compile minified of this is already added to download.html
* */
function Download() {
    const [apiData, updateApiData] = React.useState({
        "progress": 0,
        "downloadSpeed": 0,
        "uploadSpeed": 0,
        "title": "",
        "downloadSize": 0,
        "totalDownloaded": 0
    });

    const [isPaused, updatePause] = React.useState(false);

    React.useEffect(() => {
        window.api.receive("download:info", (data) => {
            // update speed
            data.uploadSpeed = (data.uploadSpeed / (1000 * 1000)).toString(); // to MB
            data.uploadSpeed = data.uploadSpeed.slice(0, (data.uploadSpeed.indexOf(".")) + 3) //Slice

            data.downloadSpeed = (data.downloadSpeed / (1000 * 1000)).toString();
            data.downloadSpeed = data.downloadSpeed.slice(0, (data.downloadSpeed.indexOf(".")) + 3)

            // update progress bar
            data.progress = (data.progress * 100).toString(); // to 100%
            data.progress = data.progress.slice(0, data.progress.indexOf(".") + 2); //slice

            data.totalDownloaded = (data.totalDownloaded / (1000 ** 3)).toString();
            data.totalDownloaded = data.totalDownloaded.slice(0, (data.totalDownloaded.indexOf(".")) + 4)

            data.downloadSize = (data.downloadSize / (1000 ** 3)).toString();
            data.downloadSize = data.downloadSize.slice(0, (data.downloadSize.indexOf(".")) + 4)

            updateApiData(data);
        })
    }, []);

    // let pauseOnClick = () => {
    //     window.api.send("download:pause", null);
    //     updatePause(true);
    // }

    // let resumeOnClick = () => {
    //     window.api.send("download:resume", null);
    //     updatePause(false);
    // }
    //
    let cancelOnClick = () => {
        window.api.send("download:stop", null);
    }

    return (
        <div className="container align-items-center d-flex" style={{height: "100vh"}}>
            <div className="w-100">
                <div className="row g-0 justify-content-between w-100">
                    <div className="col-8 g-0">
                        <h6 className="text-truncate w-100 d-inline-block mb-0">Downloading:
                            <span id="title">{apiData.title}</span>
                        </h6>
                    </div>
                    <div className="col-4 g-0 text-end" style={{fontSize: "16px"}}>
    <span className="pr-1">
    <span id="up_speed">
{apiData.uploadSpeed}
    </span> &uarr;M
    </span>
                        <span>/</span>
                        <span className="pr-2">
    <span id="down_speed">
{apiData.downloadSpeed}
    </span> &darr;M
    </span>
                    </div>
                </div>
                <div className="progress w-100">
                    <div className="progress-bar" id="progressBar" style={{width: apiData.progress + "%"}}>
                        {apiData.progress}%
                    </div>
                </div>
                <div className="d-flex justify-content-between w-100">
                    <div>
                        <span>{apiData.totalDownloaded} G</span>
                        <span>/</span>
                        <span>{apiData.downloadSize} G</span>
                    </div>
                    <div>
                        {
                            //     isPaused
                            //         ? (
                            //             <button className="btn btn-outline-primary m-1 mt-2" id="resume"
                            //                     onClick={resumeOnClick}>
                            //                 Resume
                            //             </button>
                            //         )
                            //         : (
                            //             <button className="btn btn-outline-warning m-1 mt-2" id="pause"
                            //                     onClick={pauseOnClick}>
                            //                 Pause
                            //             </button>
                            //         )
                        }
                        <button className="btn btn-outline-danger m-1 mt-2" id="cancel" onClick={cancelOnClick}>
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

ReactDOM.render(
    <Download/>,
    document.getElementById("root")
)