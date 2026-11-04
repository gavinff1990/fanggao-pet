# Changelog

All notable changes to this project are documented in this file.

## [1.0.0] - 2026-11-03

### Added

- 方糕萌宠 SVG 形象，包含三种形态：奔跑、睡觉、生气。
- 状态由当前会话的 `SessionSnapshot` 实时驱动：
  - `running === true` → 奔跑
  - `lastAgentError` / `promptError` / `openError` 非空，或 `openState === 'error'` → 生气
  - 其余 → 睡觉
- 悬浮于 `shell.overlay` 帧级浮层，始终位于最上层，不占用页面布局。
- 鼠标拖拽：按住方糕可拖到屏幕任意位置，位置写入 `localStorage`，刷新后恢复。
- 奔跑动画：整体弹跳 + 双腿交替摆动 + 速度线。
- 手臂摆动：绕肩关节前后摆，与双腿对角配合（左臂配右腿、右臂配左腿）。
- 双手统一放在身体左右两侧偏下位置（奔跑/睡觉/生气一致）。
- 睡觉动画：横躺、闭眼、头顶 `Z z z` 依次飘起。
- 生气动画：竖眉、撇嘴、红脸，额头青筋标记脉冲。
- `locale/en.json`、`locale/zh.json` 插件标题与描述。
- MIT 协议与插件图标 `icon.svg`。
