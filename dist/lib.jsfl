function Declaration(dom) {
    var _a = createPublishConfig(dom), dom_name = _a.dom_name, proj_folder = _a.proj_folder;
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
        var collected = collectTimelineProps(timelines[t], true, {});
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
        if (item.itemType !== "movie clip" &&
            item.itemType !== "button" &&
            item.itemType !== "graphic") {
            continue;
        }
        classes.push({
            name: class_name,
            props: item.timeline ? collectTimelineProps(item.timeline, false, {}) : []
        });
    }
    return classes;
}
function collectTimelineProps(timeline, recursive, ancestors) {
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
                if (!item ||
                    (item.itemType !== "movie clip" &&
                        item.itemType !== "button" &&
                        item.itemType !== "graphic")) {
                    continue;
                }
                seen[element.name] = true;
                var children = [];
                if (recursive && item.timeline && !ancestors[item.name]) {
                    ancestors[item.name] = true;
                    children = collectTimelineProps(item.timeline, true, ancestors);
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
    var fla_names = FLfile.listFolder("".concat(anims_folder, "/*.fla"), "files");
    if (!fla_names || fla_names.length === 0) {
        alert("当前项目的 anims 目录中没有找到 fla 文件。");
        return;
    }
    var failed_fla_names = [];
    for (var i = 0; i < fla_names.length; i++) {
        var fla_name = fla_names[i];
        var fla_url = "".concat(anims_folder, "/").concat(fla_name);
        var dom = fl.openDocument(fla_url);
        try {
            publish(dom);
        }
        catch (error) {
            failed_fla_names.push(fla_name);
            fl.trace("\u53D1\u5E03\u5931\u8D25\uFF1A".concat(fla_name, "\n").concat(error));
        }
        finally {
            dom.close(false);
        }
    }
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
    publish(dom);
}
function publish(dom) {
    var _a = createPublishConfig(dom), dom_name = _a.dom_name, proj_folder = _a.proj_folder, publish_js_folder = _a.publish_js_folder, publish_js_url = _a.publish_js_url, publish_image_folder = _a.publish_image_folder, publish_image_url = _a.publish_image_url;
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
    var xml = temp_fla_dom.exportPublishProfileString();
    fl.trace(xml);
    var h5_reg = /(<PublishProperties[^>]*name="JavaScript\/HTML".*?>)([\s\S]*?)(<\/PublishProperties>)/;
    xml = xml.replace(h5_reg, function (_, openTag, inner, closeTag) {
        inner = inner.replace(/<Property name="imagesPath">[^<]*<\/Property>/, "<Property name=\"imagesPath\">../images/".concat(dom_name, "</Property>"));
        return openTag + inner + closeTag;
    });
    var _b = {
        texture: [true, true],
        sprite_sheet: [true, false],
        images: [false, false]
    }["images"], isSpriteSheet = _b[0], isConverion = _b[1];
    xml = xml.replace(/<Property name="exportImages">[^<]*<\/Property>/, "<Property name=\"exportImages\">true</Property>");
    xml = xml.replace(/<Property name="exportAsSpritesheet">[^<]*<\/Property>/, "<Property name=\"exportAsSpritesheet\">".concat(isSpriteSheet, "</Property>"));
    xml = xml.replace(/<Property name="textureConversion">[^<]*<\/Property>/, "<Property name=\"textureConversion\">".concat(isConverion, "</Property>"));
    xml = xml.replace(/<Property name="exportHTML">[^<]*<\/Property>/, '<Property name="exportHTML">false</Property>');
    temp_fla_dom.importPublishProfileString(xml);
    temp_fla_dom.publish();
    temp_fla_dom.close(false);
    FLfile.remove(temp_fla_url);
    Declaration(dom);
}
function createPublishConfig(dom) {
    var dom_name = dom.name.replace(/\.fla$/i, "");
    var proj_folder = dom.pathURI.replace("/anims/".concat(dom.name), "");
    var publish_js_folder = "".concat(proj_folder, "/src/assets/anims");
    var publish_js_url = "".concat(publish_js_folder, "/").concat(dom_name, ".js");
    var publish_image_folder = "".concat(proj_folder, "/src/assets/images");
    var publish_image_url = "".concat(publish_image_folder, "/").concat(dom_name);
    return {
        dom_name: dom_name,
        proj_folder: proj_folder,
        publish_js_folder: publish_js_folder,
        publish_js_url: publish_js_url,
        publish_image_folder: publish_image_folder,
        publish_image_url: publish_image_url
    };
}
