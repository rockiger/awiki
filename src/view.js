import jetpack from "fs-jetpack";

import {onClickLabel} from "./controller"
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

    document.querySelector("#app").style.display = "flex";

    for (const label of labels) {
        label.addEventListener('click', onClickLabel)
    }
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
    console.log(name);
    console.log(list)
    for (const e of list) {
      console.log(e.name);
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