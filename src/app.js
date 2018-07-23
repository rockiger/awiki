import "./stylesheets/main.css";

// Small helpers you might want to keep
import "./helpers/context_menu.js";
import "./helpers/external_links.js";

// ----------------------------------------------------------------------------
// Everything below is just to show you how it works. You can delete all of it.
// ----------------------------------------------------------------------------

/*********
 * Setup *
 *********/
import jetpack from "fs-jetpack";
import path from "path";
const shell = require('electron').shell;

import Editor from "tui-editor";
import {createAtom} from "js-atom";

const BASEPATH = "/home/macco/mega/md/";
const EXT = ".markdown";

let tree = jetpack.inspectTree(BASEPATH, {relativePath: true}).children;
let sidebar = createSidebar(tree);

const nav = document.querySelector("#nav");
nav.innerHTML = sidebar;
let labels = document.querySelectorAll("#nav x-label");

document.querySelector("#app").style.display = "flex";

for (const label of labels) {
  label.addEventListener('click', onClickLabel)
}

var editor = new Editor({
  el: document.querySelector('#editor'),
  initialEditType: 'wysiwyg',
  previewStyle: 'vertical',
  height: '100%',
  language: 'de_DE',
  events: {
    change: onChangeEditor,
    //stateChange: () => console.log("stateChange")
  }
});
window.editor = editor;


/*********
 * State *
 *********/

const $state$ = createAtom({
  currentFile: "",
  isEditorChanged: false
});

/**
 * Consumes an delta object and mutates the state accordingly,
 * can be used to mutate available state attributes or create new ones.
 * ex. swapState({isEditorChanged: true})
 * @param {object} delta - the change of the $state$
 */
function swapState(delta) {
  $state$.swap(oldState => {
    return {
      ...oldState,
      ...delta
    };
  })
}

/*************
 * Functions *
 *************/


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

function relToAbsPaths(mdString, dirPath) {
  const replacement = '(' + dirPath + '/';
  const newString = mdString.replace(/\(\.\//gm, replacement);
  return newString;
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

function writeFile() {
  const filePath = $state$.deref().currentFile;
  const markdown = editor.getMarkdown();
  if(filePath.length > 0) {
    console.log(markdown);
    console.log(filePath);
    jetpack.write(filePath, markdown);
  }
}