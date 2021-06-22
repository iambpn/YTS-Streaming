import React, {useEffect, useState} from "react";
import BackDrop from "../backdrop/BackDrop";
import package_json from "../../../package.json";
import styles from "./SettingsModal.module.scss";

type SettingsModalProps = {
    openSettings: React.Dispatch<React.SetStateAction<boolean>>
}

function getMaxConSettings(): string | null {
    return localStorage.getItem("MaxCon");
}

function SettingModal(props: SettingsModalProps) {
    const [maxCon, updateMaxCon] = useState<number>(55);
    const [cachedSpaceTitle, updateCachedSpaceTitle] = useState<string>("");
    const [torrentLink, updateTorrentLink] = useState<string>("");

    useEffect(() => {
        let maxCon = localStorage.getItem("MaxCon");
        if (maxCon !== null) {
            updateMaxCon(Number(maxCon))
        }
    }, [])

    let handleMaxConChange = (e: React.FormEvent<HTMLInputElement>) => {
        if (Number(e.currentTarget.value) === 0) {
            updateMaxCon(55);
        } else {
            updateMaxCon(Number(e.currentTarget.value));
        }
    }

    let handleCloseModal = () => {
        props.openSettings(false);
        localStorage.setItem("MaxCon", String(maxCon));
    }

    let handleOpenLink = (link: string) => {
        //@ts-ignore
        window.api.send("ExternalLink:Open", link);
        handleCloseModal();
    }

    let handleClearCache = () => {
        //@ts-ignore
        window.api.send("Cache:ClearCache", null);
        handleCloseModal();
    }

    let handleShowCachedSpace = () => {
        //@ts-ignore
        window.api.send("Cache:ShowSpaceRequest", null);
        //@ts-ignore
        window.api.receive("Cache:ShowSpaceResponse", (data: string) => {
            updateCachedSpaceTitle(data);
        });
    }

    let handlePlayExternalSrc = () => {
        if (torrentLink.trim() !== "") {
            // @ts-ignore
            window.api.send("video:play", {
                hash: torrentLink,
                maxCon: maxCon,
            })
            handleCloseModal();
        }
    }

    return (
        <React.Fragment>
            <BackDrop onClick={handleCloseModal}/>
            <div className={styles.modal}>
                <div className={"modal-dialog"} style={{margin: "0", maxWidth: "inherit"}}>
                    <div className="modal-content">
                        <div className="modal-header border-secondary">
                            <div className={"w-100 text-center"}>
                                <h5 className={"modal-title"}>YST Settings V.{package_json.version}</h5>
                            </div>
                            <button type="button" className="btn-close" style={{margin: ".5rem"}}
                                    onClick={handleCloseModal}/>
                        </div>
                        <div className="modal-body">
                            <div className="d-flex justify-content-center">
                                <label htmlFor="max_connection" className="col-form-label w-50 text-center"
                                       title={"default = 55"}>
                                    Max Connection on Torrent
                                </label>
                                <div style={{width: "35%"}}>
                                    <input type="number" className="form-control" id="max_connection" value={maxCon}
                                           onChange={handleMaxConChange}/>
                                </div>
                            </div>
                        </div>
                        <div className="modal-body border-top border-secondary">
                            <div>
                                <label htmlFor={"magnetLink"}>Play from External Source:</label>
                                <div className={"row g-2 align-items-end"}>
                                    <div className="col-11">
                                        <input type="text" className="form-control mt-2" id="magnetLink"
                                               value={torrentLink}
                                               onChange={(e) => {
                                                   updateTorrentLink(e.currentTarget.value);
                                               }}
                                               onKeyUp={(e) => {
                                                   if (e.code.toLowerCase() === "enter") {
                                                       handlePlayExternalSrc()
                                                   }
                                               }} placeholder={"Torrent magnet link / Torrent hash"}/>
                                    </div>
                                    <div className={"col-1 text-center"}>
                                        <svg className={"btn-outline-success " + styles.playSvg}
                                             onClick={handlePlayExternalSrc} xlinkTitle={"Play"}>
                                            <use xlinkHref="./public_assets/images/play-button.svg#Capa_1"></use>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-body border-top border-secondary">
                            <div className="d-flex justify-content-evenly">
                                <button className="btn btn-primary" onClick={() => {
                                    handleOpenLink("https://github.com/mbpn1/YTS-Streaming/releases/");
                                }}>
                                    Check for Update
                                </button>
                                <button className="btn btn-secondary" onClick={() => {
                                    handleOpenLink("https://github.com/mbpn1/YTS-Streaming");
                                }} title="View Project on Github">
                                    View on Github
                                </button>
                                <button className="btn btn-secondary" id="clear_cache" onClick={handleClearCache}
                                        title={cachedSpaceTitle}
                                        onMouseOver={handleShowCachedSpace}>
                                    Clear Cache
                                </button>
                            </div>
                            <div className="d-flex justify-content-center align-items-center mt-4 mb-2">
                                <span style={{fontSize: "17px"}} className="me-3">Special thanks to:</span>
                                <button className="btn btn-outline-danger" style={{fontSize: "16px"}}
                                        onClick={() => {
                                            handleOpenLink("https://webtorrent.io");
                                        }}>
                                    Web Torrent
                                </button>
                            </div>
                        </div>
                        <div className="modal-footer border-secondary">
                            <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
}

export default SettingModal;
export {getMaxConSettings}