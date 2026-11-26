function createPublishConfig(dom) {
    var dom_name = dom.name.replace(/\.fla$/i, "");
    var proj_folder = dom.pathURI.replace("/anims/".concat(dom.name), "");
    var publish_js_folder = "".concat(proj_folder, "/src/assets/anims");
    var publish_js_url = "".concat(publish_js_folder, "/").concat(dom_name, ".js");
    var publish_image_folder = "".concat(proj_folder, "/src/assets/images");
    var publish_image_url = "".concat(publish_image_folder, "/").concat(dom_name);
    return {
        dom: dom,
        dom_name: dom_name,
        proj_folder: proj_folder,
        publish_js_folder: publish_js_folder,
        publish_js_url: publish_js_url,
        publish_image_folder: publish_image_folder,
        publish_image_url: publish_image_url
    };
}
var IMAGE_EXTS = ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"];
function parseImages(config) {
    var publish_image_url = config.publish_image_url;
    if (!FLfile.exists(publish_image_url)) {
        return;
    }
    var file_names = FLfile.listFolder(publish_image_url, "files");
    if (!file_names || file_names.length === 0) {
        return;
    }
    file_names.sort();
    var import_lines = [];
    var export_names = [];
    var used_names = {};
    for (var i = 0; i < file_names.length; i++) {
        var file_name = file_names[i];
        if (!isImageFile(file_name)) {
            continue;
        }
        var export_name = stripFileExtension(file_name);
        if (!export_name || used_names[export_name]) {
            continue;
        }
        used_names[export_name] = true;
        export_names.push(export_name);
        import_lines.push("import ".concat(export_name, " from \"./").concat(file_name, "?url\";"));
    }
    if (export_names.length === 0) {
        return;
    }
    var lines = [];
    for (var i = 0; i < import_lines.length; i++) {
        lines.push(import_lines[i]);
    }
    lines.push("");
    lines.push("export default {");
    for (var i = 0; i < export_names.length; i++) {
        lines.push("  ".concat(export_names[i], ","));
    }
    lines.push("};");
    lines.push("");
    FLfile.write("".concat(publish_image_url, "/index.ts"), lines.join("\n"));
}
function parseAllImages() {
    var script_root = fl.scriptURI.substring(0, fl.scriptURI.lastIndexOf("/"));
    var proj_folder = script_root.substring(0, script_root.lastIndexOf("/"));
    var images_folder = "".concat(proj_folder, "/src/assets/images");
    if (!FLfile.exists(images_folder)) {
        return;
    }
    var folder_names = FLfile.listFolder(images_folder, "directories");
    if (!folder_names || folder_names.length === 0) {
        return;
    }
    folder_names.sort();
    var import_lines = [];
    var export_names = [];
    for (var i = 0; i < folder_names.length; i++) {
        var folder_name = folder_names[i];
        if (!folder_name) {
            continue;
        }
        import_lines.push("import ".concat(folder_name, " from \"./").concat(folder_name, "\";"));
        export_names.push(folder_name);
    }
    if (export_names.length === 0) {
        return;
    }
    var lines = [];
    for (var i = 0; i < import_lines.length; i++) {
        lines.push(import_lines[i]);
    }
    lines.push("");
    lines.push("export default {");
    for (var i = 0; i < export_names.length; i++) {
        lines.push("  ".concat(export_names[i], ","));
    }
    lines.push("};");
    lines.push("");
    FLfile.write("".concat(images_folder, "/index.ts"), lines.join("\n"));
}
function parseAllAnim() {
    var script_root = fl.scriptURI.substring(0, fl.scriptURI.lastIndexOf("/"));
    var proj_folder = script_root.substring(0, script_root.lastIndexOf("/"));
    var anims_js_folder = "".concat(proj_folder, "/src/assets/anims");
    if (!FLfile.exists(anims_js_folder)) {
        return;
    }
    var file_names = FLfile.listFolder("".concat(anims_js_folder, "/*.js"), "files");
    if (!file_names || file_names.length === 0) {
        return;
    }
    file_names.sort();
    var import_lines = [];
    var export_names = [];
    var used_names = {};
    for (var i = 0; i < file_names.length; i++) {
        var file_name = file_names[i];
        var export_name = stripFileExtension(file_name);
        if (!export_name || used_names[export_name]) {
            continue;
        }
        used_names[export_name] = true;
        export_names.push(export_name);
        import_lines.push("import ".concat(export_name, " from \"./").concat(file_name, "?url\";"));
    }
    if (export_names.length === 0) {
        return;
    }
    var lines = [];
    for (var i = 0; i < import_lines.length; i++) {
        lines.push(import_lines[i]);
    }
    lines.push("");
    lines.push("export default {");
    for (var i = 0; i < export_names.length; i++) {
        lines.push("  ".concat(export_names[i], ","));
    }
    lines.push("};");
    lines.push("");
    FLfile.write("".concat(anims_js_folder, "/index.ts"), lines.join("\n"));
}
function isImageFile(file_name) {
    var dot = file_name.lastIndexOf(".");
    if (dot < 0) {
        return false;
    }
    var ext = file_name.substring(dot + 1).toLowerCase();
    for (var i = 0; i < IMAGE_EXTS.length; i++) {
        if (IMAGE_EXTS[i] === ext) {
            return true;
        }
    }
    return false;
}
function stripFileExtension(file_name) {
    var dot = file_name.lastIndexOf(".");
    return dot < 0 ? file_name : file_name.substring(0, dot);
}
function declaration(config) {
    var dom = config.dom, dom_name = config.dom_name, proj_folder = config.proj_folder;
    var dts_folder = "".concat(proj_folder, "/src/types/anims");
    var dts_url = "".concat(dts_folder, "/").concat(dom_name, ".d.ts");
    ensureDtsFolder(dts_folder);
    FLfile.write(dts_url, buildDtsContent(dom, dom_name));
}
function clearAnimDts() {
    var script_root = fl.scriptURI.substring(0, fl.scriptURI.lastIndexOf("/"));
    var proj_folder = script_root.substring(0, script_root.lastIndexOf("/"));
    var dts_folder = "".concat(proj_folder, "/src/types/anims");
    if (!FLfile.exists(dts_folder)) {
        return;
    }
    var dts_names = FLfile.listFolder("".concat(dts_folder, "/*.d.ts"), "files");
    if (!dts_names || dts_names.length === 0) {
        return;
    }
    for (var i = 0; i < dts_names.length; i++) {
        FLfile.remove("".concat(dts_folder, "/").concat(dts_names[i]));
    }
}
function ensureDtsFolder(folder_url) {
    if (FLfile.exists(folder_url)) {
        return;
    }
    var parent_url = folder_url.substring(0, folder_url.lastIndexOf("/"));
    if (parent_url && !FLfile.exists(parent_url)) {
        ensureDtsFolder(parent_url);
    }
    FLfile.createFolder(folder_url);
}
function buildDtsContent(dom, dom_name) {
    var default_props = collectDocumentSceneProps(dom);
    var exported_classes = collectExportedClasses(dom);
    var lines = [];
    lines.push("declare namespace anim {");
    lines.push("  declare namespace ".concat(dom_name, " {"));
    lines.push(emitClass("_default", default_props, "    "));
    if (exported_classes.length > 0) {
        lines.push("");
        for (var i = 0; i < exported_classes.length; i++) {
            var exported = exported_classes[i];
            lines.push(emitClass(exported.name, exported.props, "    "));
        }
    }
    lines.push("");
    lines.push("  }");
    lines.push("");
    lines.push("  declare interface Lib {");
    lines.push("    ".concat(dom_name, ": {"));
    lines.push("      ".concat(dom_name, ": typeof ").concat(dom_name, "._default;"));
    for (var i = 0; i < exported_classes.length; i++) {
        var class_name = exported_classes[i].name;
        lines.push("      ".concat(class_name, ": typeof ").concat(dom_name, ".").concat(class_name, ";"));
    }
    lines.push("    }");
    lines.push("  }");
    lines.push("}");
    lines.push("");
    return lines.join("\n");
}
function collectDocumentSceneProps(dom) {
    var props = [];
    var seen = {};
    var timelines = dom.timelines;
    for (var t = 0; t < timelines.length; t++) {
        var collected = collectTimelineProps(timelines[t], {});
        for (var i = 0; i < collected.length; i++) {
            var prop = collected[i];
            if (seen[prop.name]) {
                continue;
            }
            seen[prop.name] = true;
            props.push(prop);
        }
    }
    return props;
}
function collectExportedClasses(dom) {
    var classes = [];
    var items = dom.library.items;
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (!item.linkageExportForAS) {
            continue;
        }
        var class_name = item.linkageClassName;
        if (!isDtsIdentifier(class_name)) {
            continue;
        }
        if (item.itemType !== "movie clip" && item.itemType !== "button" && item.itemType !== "graphic") {
            continue;
        }
        classes.push({
            name: class_name,
            props: item.timeline ? collectTimelineProps(item.timeline, {}) : []
        });
    }
    return classes;
}
function collectTimelineProps(timeline, ancestors) {
    var props = [];
    var seen = {};
    var layers = timeline.layers;
    for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];
        if (layer.layerType === "folder" || layer.layerType === "guide") {
            continue;
        }
        var frames_1 = layer.frames;
        for (var f = 0; f < frames_1.length; f++) {
            var frame = frames_1[f];
            if (frame.startFrame !== f) {
                continue;
            }
            var elements = frame.elements;
            for (var e = 0; e < elements.length; e++) {
                var element = elements[e];
                if (!isDtsIdentifier(element.name) || seen[element.name]) {
                    continue;
                }
                if (element.elementType === "text") {
                    seen[element.name] = true;
                    props.push({ name: element.name, kind: "text", children: [] });
                    continue;
                }
                if (element.elementType !== "instance") {
                    continue;
                }
                var item = element.libraryItem;
                if (!item || (item.itemType !== "movie clip" && item.itemType !== "button" && item.itemType !== "graphic")) {
                    continue;
                }
                seen[element.name] = true;
                var children = [];
                if (item.timeline && !ancestors[item.name]) {
                    ancestors[item.name] = true;
                    children = collectTimelineProps(item.timeline, ancestors);
                    delete ancestors[item.name];
                }
                props.push({ name: element.name, kind: "clip", children: children });
            }
        }
    }
    return props;
}
function emitClass(class_name, props, indent) {
    var lines = [];
    lines.push("".concat(indent, "declare class ").concat(class_name, " extends createjs.MovieClip {"));
    if (props.length > 0) {
        lines.push(emitProps(props, indent + "  "));
    }
    lines.push("".concat(indent, "}"));
    return lines.join("\n");
}
function emitProps(props, indent) {
    var lines = [];
    for (var i = 0; i < props.length; i++) {
        var prop = props[i];
        if (prop.kind === "text") {
            lines.push("".concat(indent).concat(prop.name, ": createjs.Text;"));
            continue;
        }
        if (prop.children.length === 0) {
            lines.push("".concat(indent).concat(prop.name, ": createjs.MovieClip;"));
            continue;
        }
        lines.push("".concat(indent).concat(prop.name, ": createjs.MovieClip & {"));
        lines.push(emitProps(prop.children, indent + "  "));
        lines.push("".concat(indent, "};"));
    }
    return lines.join("\n");
}
function isDtsIdentifier(name) {
    return !!name && /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name);
}
function parseCompositionsMap() {
    var script_root = fl.scriptURI.substring(0, fl.scriptURI.lastIndexOf("/"));
    var proj_folder = script_root.substring(0, script_root.lastIndexOf("/"));
    var anims_js_folder = "".concat(proj_folder, "/src/assets/anims");
    var map_folder = "".concat(proj_folder, "/src/plugins/flash");
    var map_url = "".concat(map_folder, "/CompositionsMap.ts");
    var entries = [];
    if (FLfile.exists(anims_js_folder)) {
        var js_names = FLfile.listFolder("".concat(anims_js_folder, "/*.js"), "files");
        if (js_names && js_names.length > 0) {
            js_names.sort();
            for (var i = 0; i < js_names.length; i++) {
                var js_name = js_names[i];
                var anim_name = js_name.replace(/\.js$/i, "");
                if (!isCompositionMapName(anim_name)) {
                    continue;
                }
                var source = FLfile.read("".concat(anims_js_folder, "/").concat(js_name));
                var key = extractCompositionKey(source);
                if (!key) {
                    continue;
                }
                entries.push({ name: anim_name, key: key });
            }
        }
    }
    ensureDtsFolder(map_folder);
    FLfile.write(map_url, buildCompositionsMapContent(entries));
}
function extractCompositionKey(source) {
    if (!source) {
        return "";
    }
    var match = source.match(/an\.compositions\s*\[\s*['"]([^'"]+)['"]\s*\]/);
    return match && match[1] ? match[1] : "";
}
function buildCompositionsMapContent(entries) {
    var lines = [];
    if (entries.length === 0) {
        lines.push("const CompositionsMap = {} as const;");
    }
    else {
        lines.push("const CompositionsMap = {");
        for (var i = 0; i < entries.length; i++) {
            lines.push("  ".concat(entries[i].name, ": \"").concat(entries[i].key, "\","));
        }
        lines.push("} as const;");
    }
    lines.push("export type CompositionsMapType = typeof CompositionsMap;");
    lines.push("export default CompositionsMap;");
    lines.push("");
    return lines.join("\n");
}
function isCompositionMapName(name) {
    return !!name && /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name);
}
function publish(config) {
    var dom = config.dom, dom_name = config.dom_name, proj_folder = config.proj_folder, publish_js_folder = config.publish_js_folder, publish_js_url = config.publish_js_url, publish_image_folder = config.publish_image_folder, publish_image_url = config.publish_image_url;
    if (!FLfile.exists(publish_js_folder)) {
        FLfile.createFolder(publish_js_folder);
    }
    if (!FLfile.exists(publish_image_folder)) {
        FLfile.createFolder(publish_image_folder);
    }
    if (FLfile.exists(publish_image_url)) {
        FLfile.remove(publish_image_url);
    }
    var temp_fla_url = "".concat(publish_js_folder, "/").concat(dom_name, ".fla");
    FLfile.copy(dom.pathURI, temp_fla_url);
    var temp_fla_dom = fl.openDocument(temp_fla_url);
    fillMissingInstanceNames(temp_fla_dom);
    var duplicate_messages = collectDuplicateInstanceNameMessages(temp_fla_dom);
    if (duplicate_messages.length > 0) {
        alert("".concat(dom_name, ".fla \u5B58\u5728\u91CD\u590D\u7684\u5B9E\u4F8B\u540D\uFF0C\u5DF2\u53D6\u6D88\u53D1\u5E03\uFF1A\n\n").concat(duplicate_messages.join("\n")));
        temp_fla_dom.close(false);
        FLfile.remove(temp_fla_url);
        return false;
    }
    var xml = temp_fla_dom.exportPublishProfileString();
    fl.trace(xml);
    var h5_reg = /(<PublishProperties[^>]*name="JavaScript\/HTML".*?>)([\s\S]*?)(<\/PublishProperties>)/;
    xml = xml.replace(h5_reg, function (_, openTag, inner, closeTag) {
        inner = inner.replace(/<Property name="imagesPath">[^<]*<\/Property>/, "<Property name=\"imagesPath\">../images/".concat(dom_name, "</Property>"));
        return openTag + inner + closeTag;
    });
    var _a = {
        texture: [true, true],
        sprite_sheet: [true, false],
        images: [false, false]
    }["images"], isSpriteSheet = _a[0], isConverion = _a[1];
    xml = xml.replace(/<Property name="exportImages">[^<]*<\/Property>/, "<Property name=\"exportImages\">true</Property>");
    xml = xml.replace(/<Property name="exportAsSpritesheet">[^<]*<\/Property>/, "<Property name=\"exportAsSpritesheet\">".concat(isSpriteSheet, "</Property>"));
    xml = xml.replace(/<Property name="textureConversion">[^<]*<\/Property>/, "<Property name=\"textureConversion\">".concat(isConverion, "</Property>"));
    xml = xml.replace(/<Property name="exportHTML">[^<]*<\/Property>/, '<Property name="exportHTML">false</Property>');
    temp_fla_dom.importPublishProfileString(xml);
    temp_fla_dom.publish();
    temp_fla_dom.close(false);
    FLfile.remove(temp_fla_url);
    return true;
}
function collectDuplicateInstanceNameMessages(dom) {
    var messages = [];
    var timelines = dom.timelines;
    for (var t = 0; t < timelines.length; t++) {
        var timeline = timelines[t];
        appendDuplicateNameMessages(messages, "\u573A\u666F\u300C".concat(timeline.name, "\u300D"), timeline);
    }
    var items = dom.library.items;
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if ((item.itemType === "movie clip" || item.itemType === "button" || item.itemType === "graphic") &&
            item.timeline) {
            appendDuplicateNameMessages(messages, "\u5143\u4EF6\u300C".concat(item.name, "\u300D"), item.timeline);
        }
    }
    return messages;
}
function appendDuplicateNameMessages(messages, owner, timeline) {
    var name_to_layers = {};
    var layers = timeline.layers;
    for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];
        if (layer.layerType === "folder" || layer.layerType === "guide") {
            continue;
        }
        var names_on_layer = {};
        var frames_2 = layer.frames;
        for (var f = 0; f < frames_2.length; f++) {
            var frame = frames_2[f];
            if (frame.startFrame !== f) {
                continue;
            }
            var names_on_frame = {};
            var elements = frame.elements;
            for (var e = 0; e < elements.length; e++) {
                var element = elements[e];
                if (element.elementType !== "instance" || !element.name) {
                    continue;
                }
                var instance_name = element.name;
                names_on_frame[instance_name] = (names_on_frame[instance_name] || 0) + 1;
                names_on_layer[instance_name] = true;
            }
            for (var instance_name in names_on_frame) {
                if (names_on_frame[instance_name] > 1) {
                    messages.push("".concat(owner, " \u56FE\u5C42\u300C").concat(layer.name, "\u300D\u7B2C ").concat(f + 1, " \u5E27\u4E0A\u6709\u591A\u4E2A\u540D\u4E3A\u300C").concat(instance_name, "\u300D\u7684\u5B9E\u4F8B"));
                }
            }
        }
        for (var instance_name in names_on_layer) {
            if (!name_to_layers[instance_name]) {
                name_to_layers[instance_name] = [];
            }
            name_to_layers[instance_name].push(layer.name);
        }
    }
    for (var instance_name in name_to_layers) {
        var layer_names = name_to_layers[instance_name];
        if (layer_names.length > 1) {
            messages.push("".concat(owner, " \u7684\u5B9E\u4F8B\u540D\u300C").concat(instance_name, "\u300D\u51FA\u73B0\u5728\u56FE\u5C42\uFF1A").concat(layer_names.join("、")));
        }
    }
}
function fillMissingInstanceNames(dom) {
    var timelines = dom.timelines;
    for (var t = 0; t < timelines.length; t++) {
        fillTimelineInstanceNames(timelines[t]);
    }
    var items = dom.library.items;
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if ((item.itemType === "movie clip" || item.itemType === "button" || item.itemType === "graphic") &&
            item.timeline) {
            fillTimelineInstanceNames(item.timeline);
        }
    }
}
function fillTimelineInstanceNames(timeline) {
    var layers = timeline.layers;
    for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];
        if (layer.layerType === "folder" || layer.layerType === "guide") {
            continue;
        }
        fillLayerInstanceNames(timeline, i);
    }
}
function fillLayerInstanceNames(timeline, layer_index) {
    var layer = timeline.layers[layer_index];
    var frame_indexes = [];
    var frames = layer.frames;
    for (var f = 0; f < frames.length; f++) {
        var frame = frames[f];
        if (frame.startFrame !== f) {
            continue;
        }
        var clip = getSingleSymbolInstance(frame);
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
    var first_clip = getSingleSymbolInstance(layer.frames[frame_indexes[0]]);
    var library_name = first_clip && first_clip.libraryItem && first_clip.libraryItem.name;
    if (!library_name) {
        return;
    }
    var instance_name = "";
    for (var i = 0; i < frame_indexes.length; i++) {
        var clip = getSingleSymbolInstance(layer.frames[frame_indexes[i]]);
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
    for (var i = 0; i < frame_indexes.length; i++) {
        var frame_index = frame_indexes[i];
        timeline.currentFrame = frame_index;
        var clip = getSingleSymbolInstance(timeline.layers[layer_index].frames[frame_index]);
        if (clip && !clip.name) {
            clip.name = instance_name;
        }
    }
}
function getSingleSymbolInstance(frame) {
    var found = null;
    var elements = frame.elements;
    for (var e = 0; e < elements.length; e++) {
        var element = elements[e];
        if (element.elementType !== "instance") {
            continue;
        }
        var item = element.libraryItem;
        if (!item ||
            (item.itemType !== "movie clip" && item.itemType !== "button" && item.itemType !== "graphic")) {
            continue;
        }
        if (found) {
            return undefined;
        }
        found = element;
    }
    return found;
}
function publishAll() {
    if (fl.documents && fl.documents.length > 0) {
        if (!confirm("即将关闭所有编辑中的fla文件，是否继续？")) {
            return;
        }
        for (var i = fl.documents.length - 1; i >= 0; i--) {
            var dom = fl.documents[i];
            fl.saveDocument(dom);
            fl.closeDocument(dom, false);
        }
    }
    var script_root = fl.scriptURI.substring(0, fl.scriptURI.lastIndexOf("/"));
    var proj_folder = script_root.substring(0, script_root.lastIndexOf("/"));
    var anims_folder = "".concat(proj_folder, "/anims");
    if (!FLfile.exists(anims_folder)) {
        alert("未找到当前项目的 anims 目录。");
        return;
    }
    var listed_fla_names = FLfile.listFolder("".concat(anims_folder, "/*.fla"), "files");
    var fla_names = [];
    if (listed_fla_names) {
        for (var i = 0; i < listed_fla_names.length; i++) {
            if (listed_fla_names[i].toLowerCase() === "lib.fla") {
                continue;
            }
            fla_names.push(listed_fla_names[i]);
        }
    }
    if (fla_names.length === 0) {
        alert("当前项目的 anims 目录中没有找到 fla 文件。");
        return;
    }
    var failed_fla_names = [];
    clearAnimDts();
    for (var i = 0; i < fla_names.length; i++) {
        var fla_name = fla_names[i];
        var fla_url = "".concat(anims_folder, "/").concat(fla_name);
        var dom = fl.openDocument(fla_url);
        var config = createPublishConfig(dom);
        try {
            if (!publish(config)) {
                failed_fla_names.push(fla_name);
                continue;
            }
            declaration(config);
            parseImages(config);
        }
        catch (error) {
            failed_fla_names.push(fla_name);
            fl.trace("\u53D1\u5E03\u5931\u8D25\uFF1A".concat(fla_name, "\n").concat(error));
        }
        finally {
            dom.close(false);
        }
    }
    parseAllImages();
    parseCompositionsMap();
    parseAllAnim();
    if (failed_fla_names.length > 0) {
        alert("\u4EE5\u4E0B fla \u6587\u4EF6\u53D1\u5E03\u5931\u8D25\uFF1A\n".concat(failed_fla_names.join("\n")));
    }
}
function publishOne() {
    var dom = fl.getDocumentDOM();
    if (!dom) {
        alert("请先打开当前项目中您需要发布的fla文件。");
        return;
    }
    dom.save();
    var config = createPublishConfig(dom);
    if (!publish(config)) {
        return;
    }
    declaration(config);
    parseImages(config);
    parseAllImages();
    parseCompositionsMap();
    parseAllAnim();
}
