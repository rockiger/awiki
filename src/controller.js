import path from "path";
import electron from "electron";
const shell = electron.shell;

import jetpack from "fs-jetpack";

import {swapState, writeFile, populateFileList, setLineNumber, state, fileList, EDITOR, saveSettings} from "./model";
import {relToAbsPaths, fileToAbsPaths} from "./helpers"

export {onClickLabel, onClickInternalLink, onChangeEditor, onInputSearch, onFileListChanged, onStateChanged, onKeydownSearch, toggleSearch, gotoPage, loadPage};

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

function onInputSearch(ev) {
  console.log(ev.target.value);
  populateFileList(ev.target.value);
}

function onKeydownSearch(ev) {
  const length = fileList().length - 1;
  const current = state().selectedLine;
  console.log(ev.key);
  switch (ev.key) {

    case "ArrowDown":
      const down = current === length ? 0 : (current + 1);
      setLineNumber(down);
      ev.preventDefault();
      return false;
  
    case "ArrowUp":
      const up = current === 0 ? length : (current - 1);
      setLineNumber(up);
      ev.preventDefault();
      return false;

    case "Enter":
      const filePath = fileList()[current];
      gotoPage(filePath, ev);
      toggleSearch();

    case "Escape":
    case "Tab":
      toggleSearch();
      
    default:
      return true;
  }
}

function onFileListChanged(ky, ref, old, nw) {
  const filelist = document.querySelector("#filelist");

  // delete children
  while (filelist.firstChild) {
    filelist.removeChild(filelist.firstChild);
  }
  // populate the list
  let i = 0;
  for (const path of nw) {
    if (path.endsWith(EXT)) {
      const li = document.createElement("li");
      const relPath = path.slice(BASEPATH.length, - EXT.length);
      const lineText = relPath.split("/").join(" > ");
      li.dataset.path = relPath;
      (i === state().selectedLine) ? li.classList.add("selected") : false;
      
      li.addEventListener('click', onClickLabel);
      li.appendChild(document.createTextNode(lineText));
      filelist.appendChild(li);
      i++;
    }
  }

  setLineNumber(0);
}

function onStateChanged(ky, ref, old, nw) {
  if (old.selectedLine !== nw.selectedLine) {
    const filelist = document.querySelector("#filelist");
    if (old.selectedLine > -1) {
      filelist.children[old.selectedLine].classList.remove("selected"); 
    }
    filelist.children[nw.selectedLine].classList.add("selected");
    console.log(nw.selectedLine);
  }
  if (old.currentFile !== nw.currentFile) {
    saveSettings();
  }
  console.log("onStateChanged");
}

/* Helper functions */

function loadPage(filePath) {
    swapState({currentFile: filePath});
    const dirPath = path.dirname(filePath); 
    let md = jetpack.read(filePath);
    md = relToAbsPaths(md, dirPath);
    md = fileToAbsPaths(md);
    editor.setMarkdown(md);
    editor.moveCursorToStart(); // TODO Load positon in file
    editor.focus();
    addClickEventListenersToLinks();
    // TODO mark page in sidebar and open accordions accordingly
}

function gotoPage (filePath, ev = null) {
    writeFile();
    loadPage(filePath)
    addClickEventListenersToLinks();
    if (ev) {
      ev.preventDefault();
      ev.stopPropagation();
    }
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

function toggleSearch() {
  const search = document.querySelector("#search");
  if (search.open) {
    search.close()
    .then(() => editor.focus());
  }
  else {
    const searchinput = document.querySelector("#searchinput");
    
    search.showModal();
    searchinput.value = "";
    searchinput.focus();
  }
}