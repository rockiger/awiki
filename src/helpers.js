export {relToAbsPaths};

function relToAbsPaths(mdString, dirPath) {
    const replacement = '(' + dirPath + '/';
    const newString = mdString.replace(/\(\.\//gm, replacement);
    return newString;
}