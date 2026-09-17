/// <reference types="@types/jsfl"/>
/// <reference path="./tool.ts" />

const IMAGE_EXTS = ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"];

/**
 * 读取当前 fla 发布出的图片目录，生成可被 Vite 使用的图片模块。
 * 输出到 `{项目}/src/assets/images/{fla名}/index.ts`。
 */
function parseImages(config: PublishConfig) {
    const { publish_image_url } = config;

    if (!FLfile.exists(publish_image_url)) {
        return;
    }

    const file_names = FLfile.listFolder(publish_image_url, "files" as any);
    if (!file_names || file_names.length === 0) {
        return;
    }

    file_names.sort();

    const import_lines: string[] = [];
    const export_names: string[] = [];
    const used_names: { [name: string]: boolean } = {};

    for (let i = 0; i < file_names.length; i++) {
        const file_name = file_names[i];
        if (!isImageFile(file_name)) {
            continue;
        }

        const export_name = toImageExportName(file_name);
        if (!export_name || used_names[export_name]) {
            continue;
        }

        used_names[export_name] = true;
        export_names.push(export_name);
        import_lines.push(`import ${export_name} from "./${file_name}?url";`);
    }

    if (export_names.length === 0) {
        return;
    }

    const lines: string[] = [];
    for (let i = 0; i < import_lines.length; i++) {
        lines.push(import_lines[i]);
    }
    lines.push("");
    lines.push("export default {");
    for (let i = 0; i < export_names.length; i++) {
        lines.push(`  ${export_names[i]},`);
    }
    lines.push("};");
    lines.push("");

    FLfile.write(`${publish_image_url}/index.ts`, lines.join("\n"));
}

/**
 * 遍历 `src/assets/images/` 下的子文件夹，生成父级图片总表。
 * 输出到 `{项目}/src/assets/images/index.ts`。
 */
function parseAllImages() {
    const script_root = fl.scriptURI.substring(0, fl.scriptURI.lastIndexOf("/"));
    const proj_folder = script_root.substring(0, script_root.lastIndexOf("/"));
    const images_folder = `${proj_folder}/src/assets/images`;

    if (!FLfile.exists(images_folder)) {
        return;
    }

    const folder_names = FLfile.listFolder(images_folder, "directories" as any);
    if (!folder_names || folder_names.length === 0) {
        return;
    }

    folder_names.sort();

    const import_lines: string[] = [];
    const export_names: string[] = [];

    for (let i = 0; i < folder_names.length; i++) {
        const folder_name = folder_names[i];
        if (!isImageExportIdentifier(folder_name)) {
            continue;
        }

        import_lines.push(`import ${folder_name} from "./${folder_name}";`);
        export_names.push(folder_name);
    }

    if (export_names.length === 0) {
        return;
    }

    const lines: string[] = [];
    for (let i = 0; i < import_lines.length; i++) {
        lines.push(import_lines[i]);
    }
    lines.push("");
    lines.push("export default {");
    for (let i = 0; i < export_names.length; i++) {
        lines.push(`  ${export_names[i]},`);
    }
    lines.push("};");
    lines.push("");

    FLfile.write(`${images_folder}/index.ts`, lines.join("\n"));
}

/** 按扩展名判断是否为图片（忽略大小写） */
function isImageFile(file_name: string): boolean {
    const dot = file_name.lastIndexOf(".");
    if (dot < 0) {
        return false;
    }

    const ext = file_name.substring(dot + 1).toLowerCase();
    for (let i = 0; i < IMAGE_EXTS.length; i++) {
        if (IMAGE_EXTS[i] === ext) {
            return true;
        }
    }
    return false;
}

/** 去掉扩展名并转成合法的 JS 导出标识符 */
function toImageExportName(file_name: string): string {
    const dot = file_name.lastIndexOf(".");
    const base = dot < 0 ? file_name : file_name.substring(0, dot);
    let name = base.replace(/[^A-Za-z0-9_$]/g, "_");
    if (!name) {
        return "";
    }
    if (!/^[A-Za-z_$]/.test(name)) {
        name = "_" + name;
    }
    return name;
}

/** 文件夹名必须是合法标识符，才能直接 `import 名 from "./名"` */
function isImageExportIdentifier(name: string): boolean {
    return !!name && /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name);
}
