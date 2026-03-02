# JadeBi 项目指南

## 项目概览

JadeBi 是一个基于 Rust 和 Svelte 的块笔记桌面应用（类似 Notion），采用 pnpm monorepo 架构。项目目前处于早期阶段，核心类型系统已建立，但应用实现尚未完成。最终目标是支持用户自行开发插件。

### 技术栈
- **前端**: Svelte 5.50.1 + TypeScript
- **桌面框架**: Tauri 2.10.1
- **包管理器**: pnpm 10.29.2
- **Node.js**: >= 18.0.0
- **语言**: TypeScript、Rust（计划中）

### 当前状态
- ✅ 已建立 pnpm monorepo 基础结构
- ✅ 创建了命令和事件类型系统（@jadebi/io 包）
- ⏳ Tauri 桌面应用尚未创建（apps/ 目录为空）
- ⏳ 插件系统仅有类型基础，具体实现待完成

`★ Insight ─────────────────────────────────────`
JadeBi 采用类型优先的架构设计：先定义严格的命令和事件类型系统，再基于此构建应用。这种设计确保了插件系统的类型安全性和可扩展性。
`─────────────────────────────────────────────────`

## 项目结构说明

```
jadebi/
├── apps/                    # Tauri 桌面应用（计划存放，目前为空）
│   └── .gitkeep
├── packages/                # 共享包目录
│   ├── @jadebi/io/         # 命令和事件类型系统
│   │   ├── src/types/command.ts  # 命令类型定义
│   │   ├── src/types/emit.ts      # 事件类型定义
│   │   ├── src/types/io.ts        # 类型系统入口
│   │   └── src/invoker.svelte  # 命令调用组件（Svelte）
│   └── @jadebi/tools/      # 工具函数库（计划创建，目前为空）
├── package.json            # 根项目配置
├── pnpm-workspace.yaml     # monorepo 工作空间配置
└── CLAUDE.md              # 本项目指南
```

### 包职责

| 包名 | 版本 | 职责 | 状态 |
|------|------|------|------|
| `@jadebi/io` | 0.0.1 | 提供类型安全的命令和事件系统（通过统一入口点导出） | ✅ 已创建 |
| `@jadebi/tools` | - | 共享工具函数库 | ⏳ 计划中 |
| `jadebi-desktop` | - | Tauri 桌面应用 | ⏳ 计划中 |

## 开发命令

### 包管理
```bash
# 安装所有依赖
pnpm install

# 添加依赖到根项目
pnpm add -w <package>

# 添加依赖到特定工作空间包
pnpm add -F @jadebi/io <package>
```

### 开发脚本（建议添加到根 package.json）
```json
{
  "scripts": {
    "dev": "pnpm --filter @jadebi/io dev",
    "build": "pnpm --filter @jadebi/io build",
    "test": "pnpm run --recursive test",
    "lint": "pnpm run --recursive lint",
    "format": "pnpm run --recursive format",
    "clean": "rm -rf node_modules && pnpm store prune"
  }
}
```

`★ Insight ─────────────────────────────────────`
pnpm monorepo 的 `--filter` 标志允许精准控制包操作范围。`-w` 表示工作空间根目录，`-F` 表示特定包。这种精细控制是 monorepo 高效协作的关键。
`─────────────────────────────────────────────────`

### 常用命令示例
```bash
# 在 @jadebi/io 包中运行开发服务器
pnpm --filter @jadebi/io dev

# 构建所有包
pnpm -r build

# 运行所有包的测试
pnpm -r test

# 在特定包中执行任意命令
pnpm --filter @jadebi/io exec tsc --noEmit
```

## 架构设计说明

### 类型系统设计
项目采用泛型类型系统来确保命令和事件的安全性：

#### 命令类型 (`command.ts`)
```typescript
export type Command<
  NAME extends string,
  ARGS extends Record<string, unknown> | undefined = undefined,
  RES extends unknown = undefined,
> = {
  name: NAME
  args: ARGS
  result: RES
}
```

#### 事件类型 (`emit.ts`)
```typescript
export type Emit<
  NAME extends string,
  PAYLOAD extends unknown,
> = {
  name: NAME
  payload: PAYLOAD
}
```

#### 类型系统入口 (`io.ts`)
```typescript
export type Commands = unknown  // 将由具体应用填充
export type Emits = unknown     // 将由具体应用填充
```

`★ Insight ─────────────────────────────────────`
类型系统采用 "占位符" 设计：`Commands` 和 `Emits` 当前为 `unknown`，等待具体应用填充。这种设计允许类型系统提前定义，应用实现时再提供具体类型，实现了关注点分离。
`─────────────────────────────────────────────────`

### Tauri 集成模式
Tauri 应用预计将放置在 `apps/` 目录下，通过 `@jadebi/io` 包与前端通信：

```
前端 (Svelte) <--[命令/事件]--> @jadebi/io <--[IPC]--> Rust 后端
```

### 插件系统架构
插件将通过扩展 `Commands` 和 `Emits` 类型来添加新功能：
```typescript
// 插件示例
declare module '@jadebi/io' {
  export interface Commands {
    'plugin.specialAction': Command<'plugin.specialAction', { data: string }, { success: boolean }>
  }

  export interface Emits {
    'plugin.notification': Emit<'plugin.notification', { message: string }>
  }
}
```

## 开发工作流程

### 环境设置
1. **Node.js**: 确保安装 Node.js >= 18.0.0
2. **pnpm**: 安装 pnpm 10.29.2 或更高版本
3. **Rust**: 安装 Rust 工具链（为 Tauri 开发准备）
4. **IDE 推荐**: VS Code + TypeScript + Rust 扩展

### 开发建议
1. **类型安全优先**: 充分利用 TypeScript 的严格模式
2. **包边界清晰**: 保持包之间的职责分离
3. **插件友好设计**: 考虑扩展性，为插件系统留出接口
4. **Tauri 最佳实践**: 遵循 Tauri 的安全和性能指南

### 测试策略
- **单元测试**: 针对工具函数和业务逻辑
- **集成测试**: 测试包之间的交互
- **端到端测试**: 针对桌面应用功能

## 注意事项

### 已知问题
1. **早期开发阶段**: 许多功能尚未实现，架构可能随项目发展调整
2. **Rust 代码缺失**: Tauri 后端尚未创建，当前只有前端类型系统
3. **构建配置未完成**: 缺少完整的构建和打包脚本
4. **文档不完整**: 需要随开发进度补充

### 架构决策
1. **Monorepo 选择**: 使用 pnpm workspace 管理多包项目
2. **类型优先设计**: 先定义类型系统，再实现具体功能
3. **插件系统设计**: 通过类型扩展实现插件功能
4. **Tauri 框架**: 选择 Tauri 而非 Electron，追求更好的性能和安全性

### 兼容性要求
- Node.js >= 18.0.0
- pnpm >= 10.0.0
- TypeScript >= 5.9.3
- Svelte >= 5.50.1

## 贡献指南

### 代码规范
- **TypeScript**: 使用严格模式，避免 `any` 类型
- **命名约定**: 驼峰命名法，类型使用 PascalCase
- **文件组织**: 按功能模块组织，避免过大的文件
- **注释要求**: 公共 API 必须有 JSDoc 注释

### 提交消息格式
遵循 Conventional Commits 规范：
```
类型(范围): 描述

正文（可选）

脚注（可选）
```

**类型**:
- `feat`: 新功能
- `fix`: 错误修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或工具调整

**示例**:
```
feat(io): 添加命令调用组件

- 创建 invoker.svelte 组件
- 实现命令类型安全调用
- 添加基本测试用例

Closes #123
```

### PR 流程
1. 从 `main` 分支创建特性分支
2. 开发完成后运行测试和 lint 检查
3. 提交符合规范的 commit 消息
4. 创建 Pull Request，描述变更内容和测试计划

---

## 项目记忆

### 2026-02-12 项目分析记录
- **项目状态**: 早期阶段，仅建立了类型系统基础
- **技术栈确认**: Svelte 5.50.1 + Tauri 2.10.1 + TypeScript
- **架构特点**: 类型优先设计，为插件系统预留扩展接口
- **包结构**: `@jadebi/io` 已创建，`@jadebi/tools` 计划中
- **开发建议**: 需要创建 Tauri 应用和完整构建配置

### 代码规范记录
- **类型安全**: 优先使用 TypeScript 严格模式
- **包管理**: 使用 pnpm workspace 进行 monorepo 管理
- **提交规范**: 遵循 Conventional Commits 格式
- **文档要求**: 公共 API 必须包含 JSDoc 注释

---

*本文件由 Claude Code 基于实际代码库分析生成，将随项目发展更新。*

**最后更新**: 2026-02-12
