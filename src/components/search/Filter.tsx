import React from "react";

type FilterProps = {
    label: string,
    values: string[],
    stateValue: string,
    updateStateValue: Function,
    updatePageNumber: Function
}

function capitalizeFirstLetter(words: string) {
    return words.split(" ").map((word, idx) => {
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).reduce((prev, current): string => {
        return prev + " " + current
    }).trim();
}

export default function Filter(props: FilterProps) {
    let options = props.values.map((value, index) => {
        return <option value={value} key={index}>{capitalizeFirstLetter(value)}</option>
    })

    let handleOnChangeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        props.updateStateValue(e.target.value);
        props.updatePageNumber("1");
    }

    return (
        <div className="col-3 col-lg-2">
            <label htmlFor={props.label} className={"form-label"}>{capitalizeFirstLetter(props.label)}:</label>
            <select className="form-select" id={props.label} value={props.stateValue} onChange={handleOnChangeSelect}>
                {options}
            </select>
        </div>
    );
}