/// <reference types="@types/jsfl"/>
/// <reference path="./declaration.ts" />

/**
 * 扫描 `src/assets/anims/` 下发布出的 JS，读取 `AdobeAn.compositions` 的 key，
 * 生成 `{项目}/src/plugins/flash/CompositionsMap.ts`。
 */
function parseCompositionsMap() {
    const script_root = fl.scriptURI.substring(0, fl.scriptURI.lastIndexOf("/"));
    const proj_folder = script_root.substring(0, script_root.lastIndexOf("/"));
    const anims_js_folder = `${proj_folder}/src/assets/anims`;
    const map_folder = `${proj_folder}/src/plugins/flash`;
    const map_url = `${map_folder}/CompositionsMap.ts`;

    const entries: { name: string; key: string }[] = [];

    if (FLfile.exists(anims_js_folder)) {
        const js_names = FLfile.listFolder(`${anims_js_folder}/*.js`, "files" as any);
        if (js_names && js_names.length > 0) {
            js_names.sort();
            for (let i = 0; i < js_names.length; i++) {
                const js_name = js_names[i];
                const anim_name = js_name.replace(/\.js$/i, "");
                if (!isCompositionMapName(anim_name)) {
                    continue;
                }

                const source = FLfile.read(`${anims_js_folder}/${js_name}`);
                const key = extractCompositionKey(source);
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

/** 从 Animate 导出的 JS 里取出 `an.compositions['...']` 的 id */
function extractCompositionKey(source: string): string {
    if (!source) {
        return "";
    }

    const match = source.match(/an\.compositions\s*\[\s*['"]([^'"]+)['"]\s*\]/);
    return match && match[1] ? match[1] : "";
}

function buildCompositionsMapContent(entries: { name: string; key: string }[]): string {
    const lines: string[] = [];
    if (entries.length === 0) {
        lines.push("const CompositionsMap = {} as const;");
    } else {
        lines.push("const CompositionsMap = {");
        for (let i = 0; i < entries.length; i++) {
            lines.push(`  ${entries[i].name}: "${entries[i].key}",`);
        }
        lines.push("} as const;");
    }
    lines.push("export type CompositionsMapType = typeof CompositionsMap;");
    lines.push("export default CompositionsMap;");
    lines.push("");
    return lines.join("\n");
}

function isCompositionMapName(name: string): boolean {
    return !!name && /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name);
}
