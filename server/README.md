# Server

后端暂为接口和引擎占位，建议后续拆成三个模块：

- `api`：上传、任务、下载接口。
- `excel-engine`：Excel 解析和打印规则执行。
- `worker`：异步生成 PDF / Excel / XLSM 文件。

MVP推荐 Python 实现文件处理，Node.js 或 Python 实现 API 均可。

关键原则：

- AI 只生成诊断和推荐，不直接改文件。
- Excel 修改必须由规则引擎确定性执行。
- PDF 生成优先使用 LibreOffice headless 或 OnlyOffice 服务。
