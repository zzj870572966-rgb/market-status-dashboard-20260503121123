# 市场状态 Dashboard

一个适合长期免费部署的市场状态面板。项目使用 Next.js App Router、TypeScript、Tailwind CSS 和静态 JSON 数据文件，不依赖数据库，不使用付费 API，也不使用实时行情。

数据基于上一交易日收盘或日频数据生成。GitHub Actions 每天日本时间早上约 8:00 自动运行更新脚本，成功后提交 `public/data` 下的 JSON 文件，Vercel 会因 GitHub commit 自动重新部署。

## 本地运行

```bash
npm install
npm run dev
```

默认访问地址是 `http://localhost:3000`。

## 手动更新数据

```bash
npm run update:data
```

脚本会更新：

- `public/data/market-latest.json`
- `public/data/history/YYYY-MM-DD.json`
- `public/data/history/index.json`

如果 Stooq、FRED 或 Alternative.me 某个数据源失败，脚本不会把该数据覆盖为空值，而是保留最近一次成功数据，并在 JSON 的 `status.sources` 中记录成功和失败项目。页面会显示“部分数据暂未更新”。

## 数据来源

- S&P 500：Stooq，symbol `^SPX`
- Nasdaq 100：Stooq，symbol `^NDX`
- VIX：FRED `VIXCLS`
- VXN：FRED `VXNCLS`
- 10Y 美债收益率：FRED `DGS10`
- 2Y 美债收益率：FRED `DGS2`
- Crypto Fear & Greed：Alternative.me API
- CNN Fear & Greed：手动 JSON
- S&P 500 P/E 和 CAPE：手动 JSON
- 期权结构：手动 JSON

## 部署到 Vercel Free / Hobby

1. 在 GitHub 创建仓库并推送本项目。
2. 打开 Vercel，选择 Import Project。
3. 连接 GitHub 仓库。
4. 保持默认 Next.js 构建设置即可：
   - Install Command: `npm install`
   - Build Command: `npm run build`
   - Output: Next.js 默认输出
5. Vercel 会在每次 GitHub commit 后自动部署。

## 开启 GitHub Actions 自动更新

1. 推送 `.github/workflows/update-market-data.yml` 到 GitHub。
2. 在 GitHub 仓库的 Actions 页面确认 `Update market data` workflow 存在。
3. 可以等待定时运行，也可以点击 `Run workflow` 手动触发。
4. workflow 日志会显示每个数据源的成功项和失败项。

定时任务使用 UTC：

```yaml
0 23 * * 1-5
```

这大约对应日本时间次日早上 8:00。

## 手动修改数据

CNN Fear & Greed：

```text
src/data/manual/cnn-fear-greed.json
```

S&P 500 P/E 和 CAPE：

```text
src/data/manual/valuation.json
```

期权结构：

```text
src/data/manual/options-structure.json
```

修改手动 JSON 后，运行：

```bash
npm run update:data
```

这样手动数据会被合并到 `public/data/market-latest.json` 和历史快照中。

## 数据持久化

第一版不使用 Supabase、PostgreSQL 或其它数据库。所有历史快照保存在 GitHub 仓库：

```text
public/data/history/
```

`public/data/history/index.json` 会保留最近约 750 条快照索引，方便以后扩展历史图表和回测。

## 项目声明

本项目基于上一交易日收盘数据生成，仅用于市场状态观察与定投参考，不构成投资建议，也不是实时交易信号。
