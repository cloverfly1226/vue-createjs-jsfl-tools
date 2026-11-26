/// <reference types="@types/jsfl"/>
/// <reference path="./publish.ts" />
/// <reference path="./declaration.ts" />
/// <reference path="./assets.ts" />
/// <reference path="./compositions.ts" />

function publishAll() {
    if (fl.documents && fl.documents.length > 0) {
        if (!confirm("即将关闭所有编辑中的fla文件，是否继续？")) {
            return;
        }

        for (let i = fl.documents.length - 1; i >= 0; i--) {
            const dom = fl.documents[i];
            fl.saveDocument(dom);
            fl.closeDocument(dom, false);
        }
    }

    const script_root = fl.scriptURI.substring(0, fl.scriptURI.lastIndexOf("/"));
    const proj_folder = script_root.substring(0, script_root.lastIndexOf("/"));
    const anims_folder = `${proj_folder}/anims`;

    if (!FLfile.exists(anims_folder)) {
        alert("未找到当前项目的 anims 目录。");
        return;
    }

    const listed_fla_names = FLfile.listFolder(`${anims_folder}/*.fla`, "files" as any);
    const fla_names: string[] = [];
    if (listed_fla_names) {
        for (let i = 0; i < listed_fla_names.length; i++) {
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

    const failed_fla_names: string[] = [];

    clearAnimDts();

    for (let i = 0; i < fla_names.length; i++) {
        const fla_name = fla_names[i];
        const fla_url = `${anims_folder}/${fla_name}`;
        const dom = fl.openDocument(fla_url);

        const config = createPublishConfig(dom);

        try {
            if (!publish(config)) {
                failed_fla_names.push(fla_name);
                continue;
            }

            declaration(config);

            parseImages(config);
        } catch (error) {
            failed_fla_names.push(fla_name);
            fl.trace(`发布失败：${fla_name}\n${error}`);
        } finally {
            dom.close(false);
        }
    }

    parseAllImages();

    parseCompositionsMap();

    parseAllAnim();

    if (failed_fla_names.length > 0) {
        alert(`以下 fla 文件发布失败：\n${failed_fla_names.join("\n")}`);
    }
}
