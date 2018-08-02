import jetpack from "fs-jetpack"; 

import {onClickLabel, onInputSearch, onFileListChanged, onStateChanged, onKeydownSearch, toggleSearch} from "./controller"
import {populateFileList, addWatchToState, addWatchToFileList} from "./model";

/*************
 * Constants *
 *************/

import {BASEPATH, EXT} from "./constants";

/*************
 * Functions *
 *************/


function setupView() {

    let tree = jetpack.inspectTree(BASEPATH, {relativePath: true}).children;
    let sidebar = createSidebar(tree);

    const nav = document.querySelector("#nav");
    nav.innerHTML = sidebar;
    let labels = document.querySelectorAll("#nav x-label");
    const searchinput = document.querySelector("#searchinput");

    document.querySelector("#app").style.display = "flex";
    
    for (const label of labels) {
      label.addEventListener('click', onClickLabel);
    }
    
    searchinput.addEventListener('input', onInputSearch);
    searchinput.addEventListener('keydown', onKeydownSearch);
    searchinput.focus();

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
}

function createSidebar(tree) {
  if (tree.length === 0) {
    return "";
  }

  const first = tree[0]; 
  const rest = tree.slice(1);
  const isTxt = first.name.endsWith(EXT);
  const isDir = (first.type === "dir") ? true : false;
  const name = isDir ? first.name : first.name.slice(0,-EXT.length);
  if ( isDir && hasFile(name, rest) && hasChild(first)) {
    return accordion(first) + createSidebar(rest.slice(1)); //
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
    return `<x-label data-path="${el.relativePath}">${name}</x-label>`;
  }
  
  function accordion(el, expanded="expanded") {
    return `<x-accordion ${expanded}>
    <header>
      ${label(el.name, el)}
    </header>
  
    <main>
      ${createSidebar(el.children)}
    </main>
  </x-accordion>`
  }

export {setupView};