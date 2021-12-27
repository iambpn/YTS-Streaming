import React, {useContext} from "react";
import SettingIcon from "./SettingIcon";
import {useLocation, useHistory, Link} from "react-router-dom";
import {AppContext,defaultQueries} from "../../store/AppContextProvider";

export default function Heading(props: any) {
    let showBackBtn = useLocation().pathname !== "/";
    let history = useHistory();
    let context = useContext(AppContext);

    let handleBack = ()=>{
        history.goBack();
    }

    let handleGoHome=()=>{
        context.updateQueries.search(defaultQueries.search);
        context.updateQueries.quality(defaultQueries.quality);
        context.updateQueries.genre(defaultQueries.genre);
        context.updateQueries.rating(defaultQueries.rating);
        context.updateQueries.sortBy(defaultQueries.sortBy);
    }

    return (
        <div className="border-bottom border-secondary">
            <div className="container">
                <div className="m-2">
                    {
                        showBackBtn &&
                        (<div className="float-start mt-3">
                            <span className="btn btn-outline-success" onClick={handleBack}>
                                &larr; Back
                            </span>
                        </div>)

                    }
                    <nav className="navbar navbar-dark bg-dark justify-content-center border-0">
                        <Link to="/" onClick={handleGoHome}>
                            <img src="./public_assets/images/logo_final.png" alt="Logo" className="d-inline-block align-top"/>
                        </Link>
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