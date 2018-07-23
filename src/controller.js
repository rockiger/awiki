import path from "path";
import electron from "electron";
const shell = electron.shell;

import jetpack from "fs-jetpack";

import {swapState, writeFile} from "./model";
import {relToAbsPaths} from "./helpers"

export {onClickLabel, onClickInternalLink, onChangeEditor};

/*************
 * Constants *
 *************/
import {BASEPATH, EXT} from "./constants";

/*************
 * Functions *
 *************/

/* Handlers */

function onClickLabel(ev) {
  const filePath = ev.target.dataset.path.endsWith(EXT) ? ev.target.dataset.path : ev.target.dataset.path + EXT;;
  gotoPage(path.join(BASEPATH, filePath), ev);
}

function onClickInternalLink(ev) {
  const filePath = decodeURI(ev.target.href.replace("file:///", "/"));
  gotoPage(filePath, ev);
}

function onChangeEditor() {
  const isEditorChanged = $state$.deref().isEditorChanged;
  if (!isEditorChanged) {
    console.log("Editor changed");
    swapState({isEditorChanged: true});
  }
}

/* Helper functions */

function gotoPage (filePath, ev) {
    writeFile();
    swapState({currentFile: filePath});
    const dirPath = path.dirname(filePath); 
    let md = jetpack.read(filePath);
    md = relToAbsPaths(md, dirPath);
    editor.setMarkdown(md);
    editor.moveCursorToStart();
    editor.focus();
    addClickEventListenersToLinks();
    ev.preventDefault();
    ev.stopPropagation();
    return false;
}

function addClickEventListenersToLinks() {
    const links = document.querySelectorAll(".tui-editor-contents a");
    for (const link of links) {
      link.addEventListener("click", ev => {
        if (ev.target.href.endsWith(".markdown")) {
          console.log("Internal link clicked: ", ev.target.href)
          onClickInternalLink(ev);
        } else {
          console.log("External Link clicked", ev.target.href);
          shell.openItem(ev.target.href);
        }
      });
    }
}