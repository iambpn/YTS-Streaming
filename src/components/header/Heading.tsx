import React, {useState} from "react";
import SettingIcon from "./SettingIcon";

export default function Heading() {
    return (
        <div className="border-bottom border-secondary">
            <div className="container">
                <div className="m-3">
                    <nav className="navbar navbar-dark bg-dark justify-content-center border-0">
                        <img src="public_assets/images/logo-YTS.svg" alt="Logo" className="d-inline-block align-top"/>
                    </nav>
                    <div className="position-absolute" style={{top: "27px", right: "150px"}}>
                        {/*Setting Icon*/}
                        <SettingIcon />
                    </div>
                </div>
            </div>
        </div>
    )
}