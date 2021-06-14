import React from "react";

export default function ErrorHandling(props:{error:any}) {
    return (
        <div className="mt-3">
            <h5 className={"text-center text-danger"}>
                {
                    typeof (props.error) == "string"
                        ? props.error
                        : props.error.status_message
                }
            </h5>
        </div>
    );
}