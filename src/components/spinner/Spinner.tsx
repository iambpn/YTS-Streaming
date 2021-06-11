import React from "react";

export default function Spinner() {
    return (
        <div className={"d-flex justify-content-center"}>
            <img src="public_assets/images/preloader.gif" alt="preloading" className="img-fluid" width="400"
                 height="400"/>
        </div>
    );
}