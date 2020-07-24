;!macro customInstall
;	this will be run after completing install
;	CreateShortCut "$INSTDIR\ReadIt!.lnk" "$INSTDIR\ReadIt!.exe" "" "" "" SW_SHOWNORMAL "CONTROL|SHIFT|`" ""
;!macroend

;to remove install dir after uninstall
!macro customUnInstall
	RMDir /r $INSTDIR
!macroend

;availabel macro function to use in electron-builder
;customHeader, preInit, customInit, customUnInit, customInstall, customUnInstall, customRemoveFiles, customInstallMode