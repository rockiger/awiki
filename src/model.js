import Editor from "tui-editor";
import {createAtom} from "js-atom";
import jetpack from "fs-jetpack";
import {find} from "find-in-files";

import {BASEPATH, EXT} from "./constants";

/*************
 * Constants *
 *************/

export {EDITOR, swapState, writeFile, populateFileList, fileList, setLineNumber, state, addWatchToFileList, addWatchToState};

/***************************
 * State & Data Definition *
 ***************************/

const $fileList$ = createAtom(Object.freeze([]), {validator: Array.isArray});

const $state$ = createAtom(Object.freeze({
    currentFile: "",
    selectedLine: -1  ,
    isEditorChanged: false
  }));
  
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
  const filePath = $state$.deref().currentFile;
  const markdown = EDITOR.getMarkdown();
  if(filePath.length > 0) {
    console.log(markdown);
    console.log(filePath);
    jetpack.write(filePath, markdown);
  }
}

function populateFileList(searchString="") {
  find(searchString, BASEPATH, "." + EXT)
  .then(function(results) {
    let fileList = [];
    for (var result in results) {
      fileList.push(result);
    }
    $fileList$.reset(Object.freeze(fileList));
  });
}

function fileList() {
  return $fileList$.deref();
}

function state() {
  return $state$.deref();
}

function addWatchToState(key, fn) {
  $state$.addWatch(key, fn);
}

function addWatchToFileList(key, fn) {
  $fileList$.addWatch(key, fn);
}


function setLineNumber(n) {
  swapState({selectedLine: n});
}