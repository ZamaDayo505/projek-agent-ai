Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Get project directory
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
backendDir = scriptDir & "\backend"
frontendDir = scriptDir & "\frontend"

' 1. Start FastAPI backend silently on host 0.0.0.0
WshShell.Run "cmd /c cd /d """ & backendDir & """ && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000", 0, False

' 2. Start Vite frontend silently on host 0.0.0.0
WshShell.Run "cmd /c cd /d """ & frontendDir & """ && npm run dev", 0, False

' 3. Wait 2.5 seconds for servers to initialize
WScript.Sleep 2500

' 4. Launch in Standalone Native-Like Desktop App Mode
appUrl = "http://localhost:5173"
msedgePath = WshShell.ExpandEnvironmentStrings("%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe")
chromePath = WshShell.ExpandEnvironmentStrings("%ProgramFiles%\Google\Chrome\Application\chrome.exe")

If fso.FileExists(msedgePath) Then
    WshShell.Run """" & msedgePath & """ --app=""" & appUrl & """ --window-size=1200,800", 1, False
ElseIf fso.FileExists(chromePath) Then
    WshShell.Run """" & chromePath & """ --app=""" & appUrl & """ --window-size=1200,800", 1, False
Else
    WshShell.Run appUrl, 1, False
End If
