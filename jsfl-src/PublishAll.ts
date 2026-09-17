/// <reference types="@types/jsfl"/>

(() => {
  const script_root = fl.scriptURI.substring(0, fl.scriptURI.lastIndexOf("/"));
  fl.runScript(`${script_root}/lib.jsfl`, "publishAll", []);
})();
