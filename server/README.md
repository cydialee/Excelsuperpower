# Server

后端 Demo 现已提供本地 Excel 处理 API：

- `POST /api/upload`：上传 `.xlsx` / `.xlsm`，返回真实 Sheet、使用区域和预览数据。
- `POST /api/preview-plan`：按所选 Sheet 和方案返回生成前分页模拟。
- `POST /api/optimize`：选择 Sheet 和方案后输出优化 `.xlsx` 与可打印 `.pdf`。
- `GET /outputs/...`：下载生成文件。

## 本地启动

在仓库根目录运行：

```powershell
& "C:\Users\zsgjl\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" -m server.api
```

服务默认监听 `http://127.0.0.1:4173/`，同时托管浏览器 Demo 和 API。

当前 PDF 由后端根据工作表数据渲染，适合 Demo 打印验证；若后续需要与 Excel/WPS 打印视觉完全一致，可把 PDF 适配器替换为 LibreOffice / OnlyOffice 转换服务。
