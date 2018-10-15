import path from "path";
import electron from "electron";
const shell = electron.shell;

import jetpack from "fs-jetpack";

import {swapState, writeFile, populateFileList, setLineNumber, state, fileList, EDITOR, saveSettings, setNewFileDir, newFileDir, createFile, setSelectedLeaf} from "./model";
import {relToAbsPaths, fileToAbsPaths, absToRelPath} from "./helpers"

export {onClickLabel, onClickInternalLink, onChangeEditor, onInputSearch, onFileListChanged, onStateChanged, onKeydownSearch, toggleSearch, gotoPage, loadPage, onClickNewSubPage, onKeydownNewPage, onSelectedLeafChanged, getLeafFromPath};

/*************
 * Constants *
 *************/

import {BASEPATH, EXT} from "./constants";

/*************
 * Functions *
 *************/

/* Handlers */

function onClickLabel(ev) {
  try {
    const filePath = ev.target.dataset.path.endsWith(EXT) ? ev.target.dataset.path : ev.target.dataset.path + EXT;
    gotoPage(path.join(BASEPATH, filePath), ev);
    closeSearch()
  } catch (e) {
    console.log(e);
    console.log(ev.target.dataset);
  }
}

function onClickNewSubPage(ev) {
  const menu = ev.path[3];
  menu.close()
  const sidebarLabel = ev.path[4];
  setNewFileDir(sidebarLabel.dataset.path);
  toggleNewPageDialog();
  ev.preventDefault();
  ev.stopPropagation()
  ev.stopImmediatePropagation();
  return false;
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

function onKeydownNewPage(ev) {
  switch (ev.key) {

    case "Enter":
      const newPageDialog = document.querySelector("#new-page-dialog");
      const newPageInput = document.querySelector("#new-page-input");
      const newPageName = newPageInput.value.trim();
      const relPath = newFileDir() 
      // if relPath has extension cut
      const filepath = path.join(BASEPATH, relPath, newPageName + EXT);
      console.log(filepath);
      newPageDialog.close();
      const createdFilePath = createFile(newPageName, filepath);
      if (createdFilePath) {
        gotoPage(filepath);
      }

      break;

      /* const filePath = fileList()[current];
      gotoPage(filePath, ev);
      toggleSearch(); */
   
    default:
      return true;
  }
}

function onFileListChanged(ky, ref, old, nu) {
  const filelist = document.querySelector("#filelist");

  // delete children
  while (filelist.firstChild) {
    filelist.removeChild(filelist.firstChild);
  }
  // populate the list
  let i = 0;
  for (const path of nu) {
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

function onStateChanged(ky, ref, old, nu) {
  if (old.selectedLine !== nu.selectedLine) {
    const filelist = document.querySelector("#filelist");
    if (old.selectedLine > -1) {
      filelist.children[old.selectedLine].classList.remove("selected"); 
    }
    filelist.children[nu.selectedLine].classList.add("selected");
    filelist.children[nu.selectedLine].scrollIntoView(false);
    console.log(nu.selectedLine);
  }
  if (old.currentFile !== nu.currentFile) {
    saveSettings();
  }
  console.log("onStateChanged");
}

function onSelectedLeafChanged(ky, ref, old, nu) {
  if (old) {
    old.classList.remove('selected');
  }
  nu.classList.add('selected');
  openSidebarBranches(nu.parentElement);
}

/* Helper functions */

/**
 * Open all ancestor branches (x-accordion) of the given element in the sidebar
 * @param leaf - the leaf to start from 
 */
function openSidebarBranches(leaf) {
  if (leaf.id === 'nav' || leaf === null) {
    return;
  } else if (leaf.localName === 'x-accordion') {
    leaf.expanded = 'expanded';
    openSidebarBranches(leaf.parentElement);
  } else {
    openSidebarBranches(leaf.parentElement);
  }
}

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
}

function gotoPage (absFilePath, ev = null) {
    writeFile();
    loadPage(absFilePath)
    const leaf = getLeafFromPath(absToRelPath(absFilePath));
    setSelectedLeaf(leaf);
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

function closeSearch() {
  const search = document.querySelector("#search");
  if (search.open) {
    search.close()
    .then(() => editor.focus());
  }
}

function toggleNewPageDialog() {
  const newPageDialog = document.querySelector("#new-page-dialog");
  if (newPageDialog.open) {
    newPageDialog.close()
    .then(() => editor.focus());
  } else {
    const newPageInput = document.querySelector("#new-page-input");

    newPageDialog.showModal();
    newPageInput.value = "";
    newPageInput.focus();
  }
}

/**
 * Querys a leaf (x-label) from the given file path.
 * @param filePath - a relative filepathe
 * @return DOMNode
 */
function getLeafFromPath(filePath) {
  let query =  'x-label[data-path="' + filePath + '"]';
  let leaf = document.querySelector(query);
  if (leaf) {
    return leaf;
  } else {
    const pathWithoutExtension = filePath.slice(0, filePath.length - EXT.length);
    query = `x-label[data-path="${pathWithoutExtension}"]`
    leaf = document.querySelector(query);
    return leaf;
  }
}