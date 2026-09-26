(function () {
    var script_root = fl.scriptURI.substring(0, fl.scriptURI.lastIndexOf("/"));
    fl.runScript("".concat(script_root, "/lib.jsfl"), "publishOne", []);
})();
