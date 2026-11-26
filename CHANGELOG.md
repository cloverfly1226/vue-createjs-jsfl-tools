# 更新日志

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。版本号暂按功能阶段记录，尚未打 Git tag。

## [未发布]

## [0.2.0] - 2026-11-26

### 新增

- 发布前检查同一时间轴（含不同图层）上的重复实例名。发现后弹窗说明元件、名字和图层，并取消该 FLA 的发布，避免 Animate 把第二个静默改成 `name_1`。
- 发布临时 FLA 时，把同一图层、同一库元件的实例名补到后续未命名关键帧上，避免 Animate 2024 把补间后半段发布成 `this.instance`。影片剪辑、按钮、图形都会处理；写入前会选中图层并跳到对应帧。
- `PublishAll`：已有打开文档时用官方 `confirm()` 询问是否保存并关闭全部；没有任何 FLA 打开时不弹窗。
- `PublishAll` 跳过 `lib.fla`（大小写不敏感）。
- 按 FLA 时间轴生成 `src/types/anims/{Fla名}.d.ts`：主舞台 `_default`、linkage 导出类、`Lib` 接口。具名影片剪辑会递归收集子实例。
- 批量发布开始前清空 `src/types/anims/*.d.ts`。
- 扫描发布出的图片，生成 Vite `?url` 模块 `src/assets/images/{Fla名}/index.ts`，以及父级 `src/assets/images/index.ts`。导出名只去掉扩展名，不做其它清理。
- 扫描 `src/assets/anims/*.js`，生成 `src/assets/anims/index.ts`。
- 从导出 JS 的 `an.compositions['…']` 生成 `src/plugins/flash/CompositionsMap.ts`。

### 修复

- 关闭多个已打开 FLA 时改为从后往前 `saveDocument` / `closeDocument`，避免正向遍历时文档列表被改掉、只关一部分。
- 声明生成会进入所有具名影片剪辑（不再用「是否递归」开关），避免像 `SunItem.sunMC` 这类子节点漏出 `.d.ts`。

### 变更

- 发布配置在临时 FLA 上改：图片目录为 `../images/{Fla名}`、导出图片、不覆盖 HTML、按「图像资源」而不是 Sprite 表。
- `PublishOne.ts` / `PublishAll.ts` 只负责 `fl.runScript` 调用 `lib.jsfl` 里的 `publishOne` / `publishAll`。

## [0.1.0] - 2026-11

### 新增

- 用 TypeScript（ES3）编写 JSFL，编译到 `dist/lib.jsfl`、`PublishOne.jsfl`、`PublishAll.jsfl`。
- 约定 FLA 放在项目 `anims/`，产物写到 `src/assets`。
- 初始化仓库并推送到 GitHub。
