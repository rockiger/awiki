import { app, BrowserWindow } from "electron";

export const searchMenuTemplate = {
  label: "Search",
  submenu: [
    { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
    {
      label: "Find in Wiki",
      accelerator: "CmdOrCtrl+Shift+l",
      click: () => {
          const win = BrowserWindow.getFocusedWindow().toggleDevTools();
          win.webContents.executeJavaScript('openSearch()');
      }
    }
  ]
};
