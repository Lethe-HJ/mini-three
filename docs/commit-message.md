# Commit Message 规范

本仓库使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范，并通过 [commitlint](https://commitlint.js.org/) 在 `commit-msg` 钩子中自动检查。不符合规范的提交会被拒绝。

## 基本格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

- **type**（必填）：提交类型，见下文。
- **scope**（可选）：影响范围，如模块/包名，例如 `engine`、`docs`。
- **subject**（必填）：简短描述，建议 50 字以内，总标题行不超过 100 字符。
- **body**（可选）：详细说明，可多行。
- **footer**（可选）：如关联 issue、BREAKING CHANGE 等。

提交时**至少需要**：`type: subject` 或 `type(scope): subject`。

## 类型（type）

| 类型       | 说明 |
|------------|------|
| `feat`     | 新功能 |
| `fix`      | 修复 bug |
| `docs`     | 仅文档变更（README、注释、规范等） |
| `style`    | 代码格式（空格、分号等，不改变逻辑） |
| `refactor` | 重构（既不是新功能也不是修 bug） |
| `perf`     | 性能优化 |
| `test`     | 测试相关（用例、mock 等） |
| `build`    | 构建、依赖、脚本、工具链 |
| `ci`       | CI 配置（GitHub Actions、husky、commitlint 等） |
| `chore`    | 杂项（不归入以上类型时使用） |

## 示例

### 合法示例

```
feat(engine): 添加点云旋转
fix: 修复矩阵求逆时的除零
docs: 更新 monorepo 管理说明
style(engine): 统一缩进为 2 空格
refactor(engine): 抽离 Mat4 工具函数
perf(engine): 减少 unnecessary re-render
test(engine): 补充 inverse 单测
build: 升级 vite 到 8.x
ci: 增加 commit message 检查
chore: 更新 .gitignore
```

### 带 body 与 footer

```
feat(engine): 支持自定义着色

- 新增 uniform 注入 API
- 文档补充示例

Closes #12
```

### 不合法示例（会被 commitlint 拒绝）

```
add new feature          # 未使用 type: subject
Fix bug                  # type 应为小写 fix
feat: add feature        # 建议写清 subject，避免过于笼统
```

## 规则摘要

- 标题行：`type(scope): subject`，**type 与 subject 必填**，scope 可选。
- type 只能使用上述表格中的值。
- 标题行总长度不超过 **100 字符**。
- subject 句末**不要**加句号。
- 若提交为破坏性变更，在 body 或 footer 中说明，可写 `BREAKING CHANGE: 描述`。

## 工具与钩子

- **commitlint**：读取本次提交的 message 文件并校验格式。
- **Husky `commit-msg`**：在 `git commit` 时自动执行 `pnpm exec commitlint --edit <msgfile>`，校验不通过则中止提交。

本地调试可用：

```bash
# 校验上一次提交的 message
pnpm exec commitlint --from HEAD~1 --to HEAD

# 从 stdin 校验（需配合 echo）
echo "feat: demo" | pnpm exec commitlint
```
