// this js file is shared in both movieDetails.html and main.html
const {shell} = require("electron");

//load settings from local storage
window.loadSettings =()=>{
    let data = localStorage.getItem("settings");
    if(data != null){
        data = JSON.parse(data);
        document.getElementById("max_connection").value = data.max_conn;
    }
    else{
        document.getElementById("max_connection").value = '';
    }
}

//update settings from local storage
window.updateYTSSettings = (event)=>{
    let max_conn = document.getElementById("max_connection").value;
    max_conn = max_conn === ''? 55 : parseInt(max_conn);

    if(max_conn === 55){ //check for default value if default value then remove data
        localStorage.removeItem("settings");
        loadSettings();
    }
    else {
        localStorage.setItem('settings', JSON.stringify({max_conn}));
    }

    document.getElementById("close_modal").click();
}

window.openWebTorrent = ()=>{
    shell.openExternal('https://webtorrent.io');
}

window.viewProject = ()=>{
    shell.openExternal('https://github.com/mbpn1/YTS-Streaming');
}

window.checkUpdate = ()=>{
    shell.openExternal('https://github.com/mbpn1/YTS-Streaming/releases/');
};