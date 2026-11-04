# 架构说明

## 数据流

```
sessions.list            (会话目录: ids / byId / phase)
   │  找 retainedBy.mainView > 0 的主视图会话
   ▼
sessions.binding(id).session   (SessionFace = ISession & ObservableSnapshot<SessionSnapshot>)
   │  useSyncExternalStore 订阅 getSnapshot/subscribe
   ▼
SessionSnapshot { running, lastAgentError, promptError, openError, openState }
   ▼
pose = hasError ? 'angry' : running ? 'running' : 'sleeping'
   ▼
SVG 造型 + CSS 关键帧（.fgp-anim--<pose>）
```

## 三态判定

| 条件 | 形态 |
|------|------|
| `lastAgentError` / `promptError` / `openError` 非空，或 `openState === 'error'` | `angry` |
| 否则 `running === true` | `running` |
| 否则 | `sleeping` |

错误优先于运行：一旦出错，Agent 通常已停止运行，因此先判 `angry`。

## 渲染与交互

- **槽位**：`shell.overlay`（root 级浮层，click-through 基座，条目自行 `pointer-events: auto`）。
- **定位**：`position: fixed` + `left/top` 状态，拖拽用 Pointer Events + `setPointerCapture`，越界 clamp 到视口。
- **记忆**：位置序列化到 `localStorage`（键 `fanggao-pet.position`）。
- **动画**：纯 CSS keyframes，作用于 `.fgp-anim` 与腿/臂分组；SVG 分组不带 `transform` 属性，避免与 CSS `transform` 冲突。

## 为什么用 SVG + CSS 而不是 GIF

- 矢量：任意分辨率清晰，88px 显示不糊。
- 体积：几 KB 源码，远小于 GIF。
- 主题：描边与配色独立于宿主主题，不会出现两套渲染。
- 可维护：改颜色/幅度只需改常量与 keyframes。
