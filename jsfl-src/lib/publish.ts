/// <reference types="@types/jsfl"/>
/// <reference path="./tool.ts" />
/// <reference path="./declaration.ts" />

function publish(config: PublishConfig): boolean {
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

    // Animate 2024 可能把后续未命名关键帧当成新实例，先把同库元件的名字补齐
    fillMissingInstanceNames(temp_fla_dom);

    const duplicate_messages = collectDuplicateInstanceNameMessages(temp_fla_dom);
    if (duplicate_messages.length > 0) {
        alert(`${dom_name}.fla 存在重复的实例名，已取消发布：\n\n${duplicate_messages.join("\n")}`);
        temp_fla_dom.close(false);
        FLfile.remove(temp_fla_url);
        return false;
    }

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
    return true;
}

/**
 * 同一时间轴（一个场景或一个元件）里，不同图层也不能出现相同的实例名。
 * Animate 发布时会把第二个静默改成 name_1，这里提前拦下。
 */
function collectDuplicateInstanceNameMessages(dom: FlashDocument): string[] {
    const messages: string[] = [];

    const timelines = dom.timelines;
    for (let t = 0; t < timelines.length; t++) {
        const timeline = timelines[t];
        appendDuplicateNameMessages(messages, `场景「${timeline.name}」`, timeline);
    }

    const items = dom.library.items;
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (
            (item.itemType === "movie clip" || item.itemType === "button" || item.itemType === "graphic") &&
            item.timeline
        ) {
            appendDuplicateNameMessages(messages, `元件「${item.name}」`, item.timeline);
        }
    }

    return messages;
}

function appendDuplicateNameMessages(messages: string[], owner: string, timeline: FlashTimeline) {
    const name_to_layers: { [name: string]: string[] } = {};
    const layers = timeline.layers;

    for (let i = 0; i < layers.length; i++) {
        const layer = layers[i];
        if (layer.layerType === "folder" || layer.layerType === "guide") {
            continue;
        }

        const names_on_layer: { [name: string]: boolean } = {};
        const frames = layer.frames;

        for (let f = 0; f < frames.length; f++) {
            const frame = frames[f];
            if (frame.startFrame !== f) {
                continue;
            }

            const names_on_frame: { [name: string]: number } = {};
            const elements = frame.elements;
            for (let e = 0; e < elements.length; e++) {
                const element = elements[e];
                if (element.elementType !== "instance" || !element.name) {
                    continue;
                }

                const instance_name = element.name;
                names_on_frame[instance_name] = (names_on_frame[instance_name] || 0) + 1;
                names_on_layer[instance_name] = true;
            }

            for (const instance_name in names_on_frame) {
                if (names_on_frame[instance_name] > 1) {
                    messages.push(`${owner} 图层「${layer.name}」第 ${f + 1} 帧上有多个名为「${instance_name}」的实例`);
                }
            }
        }

        for (const instance_name in names_on_layer) {
            if (!name_to_layers[instance_name]) {
                name_to_layers[instance_name] = [];
            }
            name_to_layers[instance_name].push(layer.name);
        }
    }

    for (const instance_name in name_to_layers) {
        const layer_names = name_to_layers[instance_name];
        if (layer_names.length > 1) {
            messages.push(`${owner} 的实例名「${instance_name}」出现在图层：${layer_names.join("、")}`);
        }
    }
}

/**
 * 遍历文档场景和库元件时间轴：
 * 某一层的关键帧如果都是同一个库元件的单个实例（影片剪辑 / 按钮 / 图形），
 * 就把已有实例名补到未命名的后续关键帧上。
 */
function fillMissingInstanceNames(dom: FlashDocument) {
    const timelines = dom.timelines;
    for (let t = 0; t < timelines.length; t++) {
        fillTimelineInstanceNames(timelines[t]);
    }

    const items = dom.library.items;
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (
            (item.itemType === "movie clip" || item.itemType === "button" || item.itemType === "graphic") &&
            item.timeline
        ) {
            fillTimelineInstanceNames(item.timeline);
        }
    }
}

function fillTimelineInstanceNames(timeline: FlashTimeline) {
    const layers = timeline.layers;
    for (let i = 0; i < layers.length; i++) {
        const layer = layers[i];
        if (layer.layerType === "folder" || layer.layerType === "guide") {
            continue;
        }
        fillLayerInstanceNames(timeline, i);
    }
}

function fillLayerInstanceNames(timeline: FlashTimeline, layer_index: number) {
    const layer = timeline.layers[layer_index];
    const frame_indexes: number[] = [];
    const frames = layer.frames;

    for (let f = 0; f < frames.length; f++) {
        const frame = frames[f];
        if (frame.startFrame !== f) {
            continue;
        }

        const clip = getSingleSymbolInstance(frame);
        if (clip === undefined) {
            return;
        }
        if (clip) {
            frame_indexes.push(f);
        }
    }

    if (frame_indexes.length < 2) {
        return;
    }

    const first_clip = getSingleSymbolInstance(layer.frames[frame_indexes[0]]);
    const library_name = first_clip && first_clip.libraryItem && first_clip.libraryItem.name;
    if (!library_name) {
        return;
    }

    let instance_name = "";
    for (let i = 0; i < frame_indexes.length; i++) {
        const clip = getSingleSymbolInstance(layer.frames[frame_indexes[i]]);
        if (!clip || !clip.libraryItem || clip.libraryItem.name !== library_name) {
            return;
        }
        if (clip.name) {
            if (instance_name && instance_name !== clip.name) {
                return;
            }
            instance_name = clip.name;
        }
    }

    if (!instance_name) {
        return;
    }

    timeline.setSelectedLayers(layer_index, true);

    for (let i = 0; i < frame_indexes.length; i++) {
        const frame_index = frame_indexes[i];
        timeline.currentFrame = frame_index;
        const clip = getSingleSymbolInstance(timeline.layers[layer_index].frames[frame_index]);
        if (clip && !clip.name) {
            clip.name = instance_name;
        }
    }
}

/**
 * 关键帧上恰好一个符号实例（影片剪辑 / 按钮 / 图形）时返回该实例；
 * 没有则返回 null；超过一个返回 undefined（这层不处理）。
 */
function getSingleSymbolInstance(frame: FlashFrame): FlashElement | null | undefined {
    let found: FlashElement | null = null;
    const elements = frame.elements;

    for (let e = 0; e < elements.length; e++) {
        const element = elements[e];
        if (element.elementType !== "instance") {
            continue;
        }

        const item = element.libraryItem;
        if (
            !item ||
            (item.itemType !== "movie clip" && item.itemType !== "button" && item.itemType !== "graphic")
        ) {
            continue;
        }

        if (found) {
            return undefined;
        }
        found = element;
    }

    return found;
}
