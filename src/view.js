import jetpack from "fs-jetpack"; 

import {populateFileList, addWatchToState, addWatchToFileList, saveSettings, currentFile} from "./model";
import {onClickLabel, onInputSearch, onFileListChanged, onStateChanged, onKeydownSearch, toggleSearch, loadPage, onClickNewSubPage, onKeydownNewPage} from "./controller"

/*************
 * Constants *
 *************/

import {BASEPATH, EXT} from "./constants";
import { writeFile } from "./model";

/*************
 * Functions *
 *************/


function setupView() {
    updateSidebar()
    
    const searchinput = document.querySelector("#searchinput");
    const newPageInput = document.querySelector("#new-page-input");

    document.querySelector("#app").style.display = "flex";

    loadPage(currentFile());
    
    searchinput.addEventListener('input', onInputSearch);
    searchinput.addEventListener('keydown', onKeydownSearch);
    searchinput.focus();

    newPageInput.addEventListener('keydown', onKeydownNewPage);

    addWatchToState("$state$ changed", onStateChanged);
    addWatchToFileList("$fileList$ changed", onFileListChanged);

    populateFileList();

    document.addEventListener('keyup', ev => {
      const ky = ev.key;
      if (ev.ctrlKey && ev.shiftKey && ev.key === "F") {
        toggleSearch();
      }
    });
    // TODO Get prober menu wroking
    window.addEventListener('beforeunload', ev => saveSettings());
    window.addEventListener('beforeunload', ev => writeFile());
    window.addEventListener('blur', ev => writeFile());
}

function createSidebar(tree, expanded="") {
  if (tree.length === 0) {
    return "";
  }

  // TODO Open only the first level
  const first = tree[0]; 
  const rest = tree.slice(1);
  const isTxt = first.name.endsWith(EXT);
  const isDir = (first.type === "dir") ? true : false;
  const name = isDir ? first.name : first.name.slice(0,-EXT.length);
  if ( isDir && hasFile(name, rest) && hasChild(first)) {
    return accordion(first, expanded) + createSidebar(rest.slice(1)); //
  } else if (isTxt) {
    return label(name, first) + createSidebar(rest);
  } else {
    return createSidebar(rest);
  }
}
  
  function hasFile(name, list) {
    for (const e of list) {
      if (name + EXT === e.name) {
        return true;
      }
    }
    return false;
  }
  
  function hasChild(el) {
    for (const child of el.children) {
      if (child.name.endsWith(EXT)) {
        return true;
      }
    }
    return false;
  }
  
  function label(name, el) {
    return `<x-label class="sidebar-label" data-path="${el.relativePath}">${name}
        <x-contextmenu>
          <x-menu>
            <x-menuitem>
              <x-label class="new-sub-page-item">New Sub Page...</x-label>
            </x-menuitem>
          </x-menu>
      </x-contextmenu>
    </x-label>`;
  }
  
  function accordion(el, expanded="") {
    return `<x-accordion ${expanded}>
    <header>
      ${label(el.name, el)}
    </header>
  
    <main>
      ${createSidebar(el.children)}
    </main>
  </x-accordion>`
  }

function updateSidebar() {
    let tree = jetpack.inspectTree(BASEPATH, {relativePath: true}).children;
    let sidebar = createSidebar(tree, "expanded");

    const nav = document.querySelector("#nav");
    nav.innerHTML = sidebar;
    let labels = document.querySelectorAll(".sidebar-label");
    const newSubPageItems = document.querySelectorAll(".new-sub-page-item");
    
    for (const label of labels) {
      label.addEventListener('click', onClickLabel);
    }

    for (const newSubPageItem of newSubPageItems) {
      newSubPageItem.addEventListener('click', onClickNewSubPage);
    }
}
export {setupView, updateSidebar};