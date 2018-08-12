export {relToAbsPaths, fileToAbsPaths};

function relToAbsPaths(mdString, dirPath) {
    const replacement = '(' + dirPath + '/';
    const newString = mdString.replace(/\(\.\//gm, replacement);
    return newString;
}

function fileToAbsPaths(mdstring) {
    const newString = mdstring.replace(/file:\/\/\//gm, '/');
    return newString;
}