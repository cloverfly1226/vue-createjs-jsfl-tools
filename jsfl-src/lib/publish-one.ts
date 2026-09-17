/// <reference types="@types/jsfl"/>

function publishOne() {
  const dom = fl.getDocumentDOM();
  if (!dom) {
    alert("请先打开当前项目中您需要发布的fla文件。");
    return;
  }

  dom.save();
  publish(dom);
}
