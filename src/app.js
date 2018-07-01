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
import env from "env";


import Editor from "tui-editor";

const basePath = "/home/macco/mega/md/"
const ext = ".markdown";

let tree = jetpack.inspectTree(basePath, {relativePath: true}).children;
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
  language: 'de_DE'
});

/*************
 * Functions *
 *************/


function createSidebar(tree) {
  if (tree.length === 0) {
    return "";
  }

  const first = tree[0]; 
  const rest = tree.slice(1);
  const isTxt = first.name.endsWith(ext);
  const isDir = (first.type === "dir") ? true : false;
  const name = isDir ? first.name : first.name.slice(0,-ext.length);
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
    if (name + ext === e.name) {
      return true;
    }
  }
  return false;
}

function hasChild(el) {
  for (const child of el.children) {
    if (child.name.endsWith(ext)) {
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


function onClickLabel(ev) {
  const filePath = ev.target.dataset.path.endsWith(ext) ? ev.target.dataset.path : ev.target.dataset.path + ext;
  console.log(jetpack.read(basePath + filePath)); // TODO path with 
  //const editor = document.querySelector("#main > x-textarea");
  let md = jetpack.read(basePath + filePath);
  // TODO add absolute urls to links local links
  // TODO add absolute urls to local files
  editor.setMarkdown(md);
  // TODO add eventHandlers to links
  ev.stopPropagation();
  return false;
}
