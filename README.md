# vue-createjs-jsfl-tools

用 Adobe Animate 的 JSFL 脚本，把 `anims/*.fla` 发布成 Vue + Vite + CreateJS（HTML5 Canvas）能直接用的资源。

TypeScript 写在 `jsfl-src/`，编译后得到 `dist/*.jsfl`。在 Animate 里运行这些脚本即可：发布 JS / 图片、生成 `.d.ts`、生成 Vite `?url` 模块表、生成 `CompositionsMap`。

仓库：https://github.com/cloverfly1226/vue-createjs-jsfl-tools

## 目录约定

脚本按「脚本所在目录的上一级就是项目根」来找文件。请把编译好的 `dist/*.jsfl` 放在项目的 `dist/` 下，FLA 放在 `anims/`：

```
项目根/
  anims/                  # 源 FLA（lib.fla 会被批量发布跳过）
    HomePanel.fla
    TestPanel.fla
  dist/                   # 编译产物，Animate 里运行这里的脚本
    lib.jsfl
    PublishOne.jsfl
    PublishAll.jsfl
  jsfl-src/               # JSFL 的 TypeScript 源码
  src/
    assets/
      anims/              # 发布出的 CreateJS JS + index.ts
      images/{Fla名}/     # 发布出的位图 + index.ts
    plugins/flash/
      CompositionsMap.ts  # an.compositions 的 id 表
    types/anims/          # 按 FLA 结构生成的 .d.ts
```

当前打开的 FLA 路径必须是 `{项目根}/anims/{名字}.fla`，`PublishOne` 才找得到输出目录。

## 在 Animate 里怎么用

1. 安装依赖并编译（见下方「编译」）。
2. 用 Adobe Animate 打开项目里的 FLA（建议 2024）。
3. 命令 → 运行命令，选中：
   - `dist/PublishOne.jsfl`：发布**当前打开**的这一个 FLA。
   - `dist/PublishAll.jsfl`：发布 `anims/` 下全部 FLA（不含 `lib.fla`）。

也可以把这两个脚本加到 Animate 的命令菜单，方便反复跑。

### 发布一个

1. 必须先打开目标 FLA，否则会提示「请先打开…」。
2. 先保存当前文档。
3. 复制一份临时 FLA 再发布，不改你正在编辑的源文件。
4. 接着写声明、图片模块、总表、`CompositionsMap`、动画模块表。

### 发布全部

1. 如果 Animate 里已经打开了文档，会 `confirm` 询问是否保存并关闭全部。取消则中止。
2. 没有打开任何 FLA 时不弹窗，直接扫 `anims/`。
3. 不处理 `lib.fla`（大小写不敏感）。
4. 开始前清空 `src/types/anims/*.d.ts`，再逐个发布。
5. 某个 FLA 失败会记下来，其余继续；全部结束后若有失败会再弹一次列表。

## 一次发布会写出什么

| 产物 | 路径 |
| --- | --- |
| CreateJS 动画 JS | `src/assets/anims/{Fla名}.js` |
| 位图 | `src/assets/images/{Fla名}/` |
| 该 FLA 的图片 Vite 模块 | `src/assets/images/{Fla名}/index.ts` |
| 全部图片总表 | `src/assets/images/index.ts` |
| 全部动画 JS 的 Vite 模块 | `src/assets/anims/index.ts` |
| composition id | `src/plugins/flash/CompositionsMap.ts` |
| 类型声明 | `src/types/anims/{Fla名}.d.ts` |

图片模块示例（文件名去掉扩展名后原样作为导出名，中文也会保留）：

```ts
import 坐着举杯擦汗的绿小人1 from "./坐着举杯擦汗的绿小人1.png?url";

export default {
  坐着举杯擦汗的绿小人1,
};
```

声明文件会收集舞台和 linkage 导出元件上的**具名**实例（影片剪辑 / 按钮 / 图形 / 动态文本），并递归进入子元件。没有实例名的对象不会进 `.d.ts`。

## 发布前对时间轴做的处理

Animate 2024 的 HTML5 Canvas 发布有两个坑，脚本会在临时 FLA 上处理：

1. **补实例名**  
   同一图层多个关键帧里都是同一个库元件、且只有一个实例时，如果只有前面的关键帧写了名字（例如 `topMC`），后面未命名的帧会被发布成另一个 `this.instance`。脚本会把已有名字写到后续未命名关键帧上。影片剪辑、按钮、图形都按这个规则处理。

2. **重名检查**  
   同一个场景或同一个元件时间轴里，不同图层也不能出现相同的实例名。Animate 不会报错，会把第二个改成 `topMC_1`。脚本发现后会弹出具体图层，并**取消该 FLA 的发布**。同一图层上补齐后的同名关键帧不算重名。

## 编译

需要 Node.js。包管理器用 npm / pnpm 都可以。

```bash
npm install

# 编全部
npm run jsfl:build

# 只编库（publish / declaration / assets 等）
npm run jsfl:build:lib

# 只编入口（PublishOne / PublishAll）
npm run jsfl:build:main

# 开发时监听
npm run jsfl:watch:lib
npm run jsfl:watch:main
```

`tsc` 目标是 ES3（JSFL 运行环境很老），输出 `.js` 后再由 `rename.mjs` 改成 `.jsfl`。

源码入口：

- `jsfl-src/PublishOne.ts` / `PublishAll.ts`：IIFE，用 `fl.runScript` 调 `lib.jsfl`
- `jsfl-src/lib/publish.ts`：复制临时 FLA、补名字、查重名、改发布配置、调用 `publish()`
- `jsfl-src/lib/publish-one.ts` / `publish-all.ts`：两条命令的流程
- `jsfl-src/lib/declaration.ts`：生成 `.d.ts`
- `jsfl-src/lib/assets.ts`：图片 / 动画的 Vite 模块
- `jsfl-src/lib/compositions.ts`：从导出 JS 里读 `an.compositions['…']`

## 更新日志

完整条目见 [CHANGELOG.md](./CHANGELOG.md)。
