import Editor from "tui-editor";
import {createAtom} from "js-atom";
import jetpack from "fs-jetpack";
import {find} from "find-in-files";
import Store from "electron-store";

import {BASEPATH, EXT} from "./constants";

/*************
 * Constants *
 *************/

export {EDITOR, swapState, writeFile, populateFileList, fileList, setLineNumber, setSelectedLeaf, state, addWatchToFileList, addWatchToState, addWatchToSelectedLeaf, saveSettings, currentFile, setNewFileDir, newFileDir, createFile, resetPageTree, addWatchToPageTree, pageTree, populatePageTree};

/***************************
 * State & Data Definition *
 ***************************/

const $fileList$ = createAtom(Object.freeze([]), {validator: Array.isArray});
const $pageTree$ = createAtom(Object.freeze([]), {validator: Array.isArray});
const $selectedLeaf$ = createAtom(null)


const store = new Store();
//store.set('currentFile', "currentFile");
const $state$ = createAtom(Object.freeze({
    currentFile: 
      store.get('currentFile') ? store.get('currentFile') : "",
    selectedLine: -1  ,
    isEditorChanged: false,
    newFileDir: "",
  }));
console.log($state$.deref());

const EDITOR = new Editor({
  el: document.querySelector('#editor'),
  initialEditType: 'wysiwyg',
  previewStyle: 'vertical',
  height: '100%',
  language: 'de_DE',
  events: {
    change: () => console.log("editor change"),
    //stateChange: () => console.log("stateChange")
  }
});
// TODO switch to prosemirror
// TODO switch between wysiwyg and markdown
// TODO add code blocks to wysiwyg
// TODO Upload images
// TODO Connect to akiee
window.editor = EDITOR;

/*************
 * Functions *
 *************/

/**
 * Consumes an delta object and mutates the state accordingly,
 * can be used to mutate available state attributes or create new ones.
 * ex. swapState({isEditorChanged: true})
 * @param {object} delta - the change of the $state$
 */
function swapState(delta) {
  $state$.swap(oldState => {
    return Object.freeze({
      ...oldState,
      ...delta
    });
  })
}


function writeFile() {
  const filePath = currentFile();
  const markdown = EDITOR.getMarkdown();
  // TODO save position in file
  if(filePath.length > 0) {
    /* console.log(markdown);
    console.log(filePath); */
    jetpack.write(filePath, markdown);
  }
}

function createFile(filename, filepath) {
  if (!jetpack.exists(filepath) && filename) {
    const created = new Date()
    jetpack.file(filepath, {
      content: `# ${filename}\nCreated ${created.toDateString()}`});
    populatePageTree();
    return filepath;
  }
  return false
}

function populateFileList(searchString="") {
  find({term: searchString, flags: 'ig'}, BASEPATH, "." + EXT)
  .then(function(results) {
    let fileList = [];
    for (var result in results) {
      fileList.push(result);
    }
    $fileList$.reset(Object.freeze(fileList));
  });
}

function populatePageTree() {
  jetpack.inspectTreeAsync(BASEPATH, {relativePath: true})
  .then(results => resetPageTree(results.children));
}

function resetPageTree(newPageTree) {
  $pageTree$.reset(newPageTree);
}

function fileList() {
  return $fileList$.deref();
}

function pageTree() {
  return $pageTree$.deref();
}

function state() {
  return $state$.deref();
}

function currentFile() {
  return $state$.deref().currentFile;
}

function newFileDir() {
  return $state$.deref().newFileDir;
}

function addWatchToState(key, fn) {
  $state$.addWatch(key, fn);
}

function addWatchToFileList(key, fn) {
  $fileList$.addWatch(key, fn);
}

function addWatchToPageTree(key, fn) {
  $pageTree$.addWatch(key, fn);
}

function addWatchToSelectedLeaf(key, fn) {
  $selectedLeaf$.addWatch(key, fn);
}

function setLineNumber(n) {
  swapState({selectedLine: n});
}

function setSelectedLeaf(domElement) {
  $selectedLeaf$.reset(domElement);
}

function saveSettings() {
  store.set('currentFile', currentFile());
}

function setNewFileDir(newPath) {
  if (newPath.endsWith(EXT)){
    return swapState({newFileDir: newPath.slice(0, newPath.length - EXT.length)})
  }
  return swapState({newFileDir: newPath});
}