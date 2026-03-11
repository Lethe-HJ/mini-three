# Monorepo 管理方式

本文档描述本仓库的 monorepo 结构与统一管理方式。

## 目录结构

```
fast-points-cloud/          # 仓库根目录
├── package.json            # 根 package：仅负责 Git 钩子等仓库级工具，含 no-op 的 check
├── pnpm-workspace.yaml     # pnpm 工作空间配置
├── .husky/                 # Git 钩子，仅此一份，在根目录
│   ├── pre-commit          # 只执行 pnpm -r run check，不依赖任何子项目具体命令
│   ├── commit-msg          # 使用 commitlint 检查提交信息格式，见 docs/commit-message.md
│   └── _/
├── commitlint.config.js    # commit message 校验规则
├── docs/
│   └── monorepo.md         # 本文档
└── points-cloud-engine/   # 子项目/包
    ├── package.json        # 提供统一 check 脚本，内部调用 scripts/check.sh
    ├── scripts/
    │   └── check.sh        # 子项目自己的检查逻辑（typecheck、lint、format:check 等）
    ├── src/
    └── ...
```

## 管理原则

### 1. 根目录（仓库级）

- **职责**：只放「整个仓库共用」的配置与工具，不写业务代码。
- **根 `package.json`**：
  - `prepare`：安装依赖时自动执行 `husky`，把 Git 的 `core.hooksPath` 指向 `.husky`。
  - `check`：无操作（`true`），仅用于满足 `pnpm -r run check` 在根包上的调用。
  - 仅安装与仓库级工具相关的依赖（如 `husky`）。
- **`.husky/`**：所有 Git 钩子统一放在根目录；**不依赖任何子项目名称或具体命令**，只调用统一的 `check`。

### 2. 子项目（包）

- **职责**：各自实现功能，并**提供统一的 `check` 脚本**，内部通过 shell 脚本执行本包所需的检查（typecheck、lint、format:check 等）。
- **不安装 Husky**：不在子项目的 `package.json` 里加 `husky` 或 `prepare` 钩子逻辑，避免重复和冲突。
- **统一入口**：子项目必须提供 `check` 脚本，且**由本包内的 shell 脚本实现具体检查逻辑**（如 `scripts/check.sh`），这样根目录的 Husky 只依赖「每个包都有 `check`」，不关心各包内部跑的是 typecheck、lint 还是别的。
- **脚本约定**（在 `scripts/check.sh` 或等价脚本内调用即可）：
  - `typecheck`：类型检查（如 `tsc --noEmit`）
  - `lint`：静态检查（如 `oxlint src`）
  - `format:check`：仅检查格式（如 `oxfmt src --check`）
  - 另可保留 `format:fix` / `lint:fix` 等供本地修复使用。

## Git 提交前检查（Husky）

- **位置**：仅根目录 `.husky/pre-commit`。
- **原则**：**顶级的 Husky 不依赖子项目的具体命令**，只执行工作区内各包的统一 `check` 脚本；各子项目在各自的 `check` 里通过 shell 脚本执行本包需要的检查。
- **行为**：在每次 `git commit` 前执行 `pnpm -r run check`，对工作区内所有包（含根包）执行其 `check` 脚本；任一包的 `check` 失败则阻止提交。

**根目录 pre-commit 实现：**

```sh
#!/usr/bin/env sh
pnpm -r run check
```

- 根包在 `package.json` 中提供 `"check": "true"`，仅作占位。
- 子项目在 `package.json` 中提供 `"check": "sh scripts/check.sh"`（或等价），`scripts/check.sh` 内按需依次执行 `pnpm run typecheck`、`pnpm run lint`、`pnpm run format:check` 等。
- 新增子项目时：在 `pnpm-workspace.yaml` 中加入新包，并在新包中实现 `check` 脚本（通常为执行本包内的 `scripts/check.sh`）即可，**无需修改根目录的 pre-commit**。

## 常用命令

| 场景           | 建议命令 |
|----------------|----------|
| 根目录安装依赖 | 在根目录执行 `pnpm install`（会执行 `prepare`，配置 Husky） |
| 子项目开发     | `cd points-cloud-engine && pnpm run dev` |
| 子项目构建     | `cd points-cloud-engine && pnpm run build` |
| 修复格式       | `cd points-cloud-engine && pnpm run format:fix` |
| 修复部分 Lint  | `cd points-cloud-engine && pnpm run lint:fix` |

## 新增子项目时

1. 在仓库根下新建子目录，并添加该子项目的 `package.json`。
2. 在根目录 `pnpm-workspace.yaml` 的 `packages` 中加入新包路径。
3. 子项目内实现**统一的 `check` 脚本**，指向本包内的 shell 脚本（如 `"check": "sh scripts/check.sh"`）。
4. 在子项目内编写 `scripts/check.sh`（或等价），在其中按需执行本包的 `typecheck`、`lint`、`format:check` 等（通过 `pnpm run ...` 调用）。
5. **无需修改根目录 `.husky/pre-commit`**：根目录只执行 `pnpm -r run check`，新包只要提供 `check` 就会自动被纳入提交前检查。
