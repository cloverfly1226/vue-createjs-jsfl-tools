/// <reference types="@types/jsfl"/>

/** 具名时间轴对象：动态文本或影片剪辑实例 */
type DtsProp = {
    name: string;
    kind: "text" | "clip";
    children: DtsProp[];
};

/** 库中已导出的 linkage 类 */
type DtsClass = {
    name: string;
    props: DtsProp[];
};

/**
 * 根据当前 fla 的舞台与库结构，生成 CreateJS 类型声明。
 * 输出到 `{项目}/src/types/anims/{fla名}.d.ts`。
 */
function declaration(config: PublishConfig) {
    const { dom, dom_name, proj_folder } = config;
    const dts_folder = `${proj_folder}/src/types/anims`;
    const dts_url = `${dts_folder}/${dom_name}.d.ts`;

    ensureDtsFolder(dts_folder);
    FLfile.write(dts_url, buildDtsContent(dom, dom_name));
}

/**
 * 删除项目 `src/types/anims/` 下的全部 `.d.ts` 文件。
 * 目录不存在或没有声明文件时直接返回。
 */
function clearAnimDts() {
    const script_root = fl.scriptURI.substring(0, fl.scriptURI.lastIndexOf("/"));
    const proj_folder = script_root.substring(0, script_root.lastIndexOf("/"));
    const dts_folder = `${proj_folder}/src/types/anims`;

    if (!FLfile.exists(dts_folder)) {
        return;
    }

    const dts_names = FLfile.listFolder(`${dts_folder}/*.d.ts`, "files" as any);
    if (!dts_names || dts_names.length === 0) {
        return;
    }

    for (let i = 0; i < dts_names.length; i++) {
        FLfile.remove(`${dts_folder}/${dts_names[i]}`);
    }
}

/** 递归创建目录（FLfile.createFolder 一次只能建一层） */
function ensureDtsFolder(folder_url: string) {
    if (FLfile.exists(folder_url)) {
        return;
    }

    const parent_url = folder_url.substring(0, folder_url.lastIndexOf("/"));
    if (parent_url && !FLfile.exists(parent_url)) {
        ensureDtsFolder(parent_url);
    }

    FLfile.createFolder(folder_url);
}

/**
 * 拼出完整 d.ts：
 * 1. `_default`：主时间轴具名实例（递归子元件）
 * 2. linkage 类：库里勾了导出的元件（只收一层）
 * 3. `Lib`：对应发布 JS 里的 `lib` 构造函数表
 */
function buildDtsContent(dom: FlashDocument, dom_name: string): string {
    const default_props = collectDocumentSceneProps(dom);
    const exported_classes = collectExportedClasses(dom);

    const lines: string[] = [];
    lines.push("declare namespace anim {");
    lines.push(`  declare namespace ${dom_name} {`);
    lines.push(emitClass("_default", default_props, "    "));

    if (exported_classes.length > 0) {
        lines.push("");
        for (let i = 0; i < exported_classes.length; i++) {
            const exported = exported_classes[i];
            lines.push(emitClass(exported.name, exported.props, "    "));
        }
    }

    lines.push("");
    lines.push("  }");
    lines.push("");
    lines.push("  declare interface Lib {");
    lines.push(`    ${dom_name}: {`);
    lines.push(`      ${dom_name}: typeof ${dom_name}._default;`);
    for (let i = 0; i < exported_classes.length; i++) {
        const class_name = exported_classes[i].name;
        lines.push(`      ${class_name}: typeof ${dom_name}.${class_name};`);
    }
    lines.push("    }");
    lines.push("  }");
    lines.push("}");
    lines.push("");

    return lines.join("\n");
}

/**
 * 收集文档所有场景上的具名实例，作为 `_default`。
 * 多场景时按时间轴顺序合并，同名只保留第一次出现。
 */
function collectDocumentSceneProps(dom: FlashDocument): DtsProp[] {
    const props: DtsProp[] = [];
    const seen: { [propName: string]: boolean } = {};
    const timelines = dom.timelines;

    for (let t = 0; t < timelines.length; t++) {
        const collected = collectTimelineProps(timelines[t], true, {});
        for (let i = 0; i < collected.length; i++) {
            const prop = collected[i];
            if (seen[prop.name]) {
                continue;
            }
            seen[prop.name] = true;
            props.push(prop);
        }
    }

    return props;
}

/**
 * 收集库中「为 ActionScript 导出」的影片剪辑 / 按钮 / 图形。
 * 类名取 `linkageClassName`；内部只扫当前时间轴一层，不递归子元件。
 */
function collectExportedClasses(dom: FlashDocument): DtsClass[] {
    const classes: DtsClass[] = [];
    const items = dom.library.items;

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.linkageExportForAS) {
            continue;
        }

        const class_name = item.linkageClassName;
        if (!isDtsIdentifier(class_name)) {
            continue;
        }

        if (item.itemType !== "movie clip" && item.itemType !== "button" && item.itemType !== "graphic") {
            continue;
        }

        classes.push({
            name: class_name,
            props: item.timeline ? collectTimelineProps(item.timeline, false, {}) : [],
        });
    }

    return classes;
}

/**
 * 遍历一条时间轴上的具名对象。
 * @param recursive 为 true 时进入子元件时间轴（主舞台 `_default`）；linkage 类传 false。
 * @param ancestors 已在递归链上的库元件名，用来打断循环引用。
 */
function collectTimelineProps(timeline: FlashTimeline, recursive: boolean, ancestors: { [itemName: string]: boolean }): DtsProp[] {
    const props: DtsProp[] = [];
    const seen: { [propName: string]: boolean } = {};
    const layers = timeline.layers;

    for (let i = 0; i < layers.length; i++) {
        const layer = layers[i];
        // 参考线和文件夹层不会发布成可访问实例
        if (layer.layerType === "folder" || layer.layerType === "guide") {
            continue;
        }

        const frames = layer.frames;
        for (let f = 0; f < frames.length; f++) {
            const frame = frames[f];
            // frames 按帧展开，只处理关键帧，避免同一实例重复计入
            if (frame.startFrame !== f) {
                continue;
            }

            const elements = frame.elements;
            for (let e = 0; e < elements.length; e++) {
                const element = elements[e];
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

                const item = element.libraryItem;
                if (!item || (item.itemType !== "movie clip" && item.itemType !== "button" && item.itemType !== "graphic")) {
                    continue;
                }

                seen[element.name] = true;

                let children: DtsProp[] = [];
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

/** 输出一个 extends MovieClip 的 declare class */
function emitClass(class_name: string, props: DtsProp[], indent: string): string {
    const lines: string[] = [];
    lines.push(`${indent}declare class ${class_name} extends createjs.MovieClip {`);
    if (props.length > 0) {
        lines.push(emitProps(props, indent + "  "));
    }
    lines.push(`${indent}}`);
    return lines.join("\n");
}

/**
 * 输出类字段。无子属性时写成 MovieClip / Text；
 * 有子属性时写成 `MovieClip & { ... }`。
 */
function emitProps(props: DtsProp[], indent: string): string {
    const lines: string[] = [];

    for (let i = 0; i < props.length; i++) {
        const prop = props[i];
        if (prop.kind === "text") {
            lines.push(`${indent}${prop.name}: createjs.Text;`);
            continue;
        }

        if (prop.children.length === 0) {
            lines.push(`${indent}${prop.name}: createjs.MovieClip;`);
            continue;
        }

        lines.push(`${indent}${prop.name}: createjs.MovieClip & {`);
        lines.push(emitProps(prop.children, indent + "  "));
        lines.push(`${indent}};`);
    }

    return lines.join("\n");
}

/** 实例名 / 类名必须是合法 TS 标识符，无名对象不进入声明 */
function isDtsIdentifier(name: string): boolean {
    return !!name && /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name);
}
