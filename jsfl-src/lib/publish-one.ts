/// <reference types="@types/jsfl"/>
/// <reference path="./publish.ts" />
/// <reference path="./declaration.ts" />
/// <reference path="./assets.ts" />
/// <reference path="./compositions.ts" />

function publishOne() {
    const dom = fl.getDocumentDOM();
    if (!dom) {
        alert("请先打开当前项目中您需要发布的fla文件。");
        return;
    }

    dom.save();

    const config = createPublishConfig(dom);

    publish(config);

    declaration(config);

    parseImages(config);

    parseAllImages();

    parseCompositionsMap();
}
