/// <reference types="@types/jsfl"/>
/// <reference path="./tool.ts" />
/// <reference path="./declaration.ts" />

function publish(config: PublishConfig) {
    const { dom, dom_name, proj_folder, publish_js_folder, publish_js_url, publish_image_folder, publish_image_url } = config;

    // 创建JS发布路径
    if (!FLfile.exists(publish_js_folder)) {
        FLfile.createFolder(publish_js_folder);
    }

    // 创建图片发布路径
    if (!FLfile.exists(publish_image_folder)) {
        FLfile.createFolder(publish_image_folder);
    }

    // 删除原来发布的图片记录(发布的时候会自动重新创建)
    if (FLfile.exists(publish_image_url)) {
        FLfile.remove(publish_image_url);
    }

    // 复制临时文件
    const temp_fla_url = `${publish_js_folder}/${dom_name}.fla`;
    FLfile.copy(dom.pathURI, temp_fla_url);

    // 打开临时文件
    const temp_fla_dom = fl.openDocument(temp_fla_url);

    // 读取发布配置以进行修改
    let xml = temp_fla_dom.exportPublishProfileString();

    fl.trace(xml);

    // 这里修改图片的发布路径
    const h5_reg = /(<PublishProperties[^>]*name="JavaScript\/HTML".*?>)([\s\S]*?)(<\/PublishProperties>)/;
    xml = xml.replace(h5_reg, (_, openTag, inner, closeTag) => {
        inner = inner.replace(/<Property name="imagesPath">[^<]*<\/Property>/, `<Property name="imagesPath">../images/${dom_name}</Property>`);
        return openTag + inner + closeTag;
    });

    const [isSpriteSheet, isConverion] = {
        // 发布为 -> 纹理
        texture: [true, true],
        // 发布为 -> Sprite表
        sprite_sheet: [true, false],
        // 发布为 -> 图像资源
        images: [false, false],
    }["images"];

    xml = xml.replace(/<Property name="exportImages">[^<]*<\/Property>/, `<Property name="exportImages">true</Property>`);

    xml = xml.replace(/<Property name="exportAsSpritesheet">[^<]*<\/Property>/, `<Property name="exportAsSpritesheet">${isSpriteSheet}</Property>`);

    xml = xml.replace(/<Property name="textureConversion">[^<]*<\/Property>/, `<Property name="textureConversion">${isConverion}</Property>`);

    xml = xml.replace(
        // 发布时覆盖HTML文件
        /<Property name="exportHTML">[^<]*<\/Property>/,
        '<Property name="exportHTML">false</Property>',
    );

    // 将修改后的发布配置写入临时fla文件
    temp_fla_dom.importPublishProfileString(xml);

    // 发布
    temp_fla_dom.publish();

    // 关闭
    temp_fla_dom.close(false);

    // 删除文件
    FLfile.remove(temp_fla_url);
}
