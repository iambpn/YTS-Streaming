import React from "react";
import SettingIcon from "./SettingIcon";
import {useLocation, useHistory} from "react-router-dom";

export default function Heading(props: any) {
    let showBackBtn = useLocation().pathname !== "/";
    let history = useHistory();

    let handleBack = ()=>{
        history.goBack();
    }

    return (
        <div className="border-bottom border-secondary">
            <div className="container">
                <div className="m-3">
                    {
                        showBackBtn &&
                        (<div className="float-start mt-2">
                            <span className="btn btn-outline-success" onClick={handleBack}>
                                &larr; Back
                            </span>
                        </div>)

                    }
                    <nav className="navbar navbar-dark bg-dark justify-content-center border-0">
                        <img src="./public_assets/images/logo-YTS.svg" alt="Logo" className="d-inline-block align-top"/>
                    </nav>
                    <div className="position-absolute" style={{top: "27px", right: "150px"}}>
                        {/*Setting Icon*/}
                        <SettingIcon/>
                    </div>
                </div>
            </div>
        </div>
    )
}