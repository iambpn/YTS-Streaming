import React, {useState} from "react";

type Props = {
    label: string,
    initialValue: number,
    handleFontSizeValue: Function
}

export default function CustomCaption(props: Props): JSX.Element {
    const [fontSize, setFontSize] = useState<number>(props.initialValue);

    let handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFontSize(Number(e.currentTarget.value));
        props.handleFontSizeValue(props.label,Number(e.currentTarget.value));
    }

    return (
        <div className={"d-flex justify-content-between flex-wrap align-items-center"}>
            <label htmlFor="setCaption">{props.label}</label>
            <p style={{background: "black", maxHeight: "150px", fontSize: fontSize}}
               className={"text-center w-50 flex-wrap py-1 overflow-hidden"}>AaBbCcDd</p>
            <input type="number" id={"setCaption"} style={{width: "13%"}} placeholder={"px"}
                   onChange={handleInputChange} value={fontSize}/>
        </div>
    )
}