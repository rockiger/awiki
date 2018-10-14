import {BASEPATH} from "./constants";

export {relToAbsPaths, fileToAbsPaths, absToRelPath};

function relToAbsPaths(mdString, dirPath) {
    const replacement = '(' + dirPath + '/';
    const newString = mdString.replace(/\(\.\//gm, replacement);
    return newString;
}

function absToRelPath(absPath) {
    return `./${absPath.slice(BASEPATH.length)}`;
}

function fileToAbsPaths(mdstring) {
    const newString = mdstring.replace(/file:\/\/\//gm, '/');
    return newString;
}