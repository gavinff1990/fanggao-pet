# 贡献指南

## 本地开发

```bash
git clone https://github.com/gavinff1990/fanggao-pet.git
cd fanggao-pet
node scripts/validate.mjs   # 校验清单与语法
```

插件本身是一个 DeepSeek Harness 本地 bundle（`@local/fanggao-pet`），修改后重新安装即可热加载：

```
plugin_manager  action: install_bundle  target: <本仓库绝对路径>
```

> 若已安装同版本，需先 `remove_bundle` 再 `install_bundle`。

## 提交前校验

```bash
npm run check
```

校验内容：`package.json` 的 `dsh.bundle` / `dsh.client`、`cordis.patch.yml` 存在性、`locale/*.json` 可解析且含 `meta.title` / `meta.description`、`index.js` 与 `client.js` 的语法。

## 目录约定

- `client.js` 是唯一的前端实现：SVG 造型、状态选择、拖拽、CSS 动画都在这里。
- `index.js` 是 Host 半，插件无服务端逻辑，保持为空 `apply()`。
- 新增可见文案请放进 `locale/`，不要硬编码在组件里。
