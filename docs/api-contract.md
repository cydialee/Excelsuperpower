# API契约草案

## POST /api/files

上传 Excel 文件。

响应：

```json
{
  "fileId": "file_001",
  "filename": "demo.xlsx",
  "sheets": [
    {
      "sheetId": "sheet_001",
      "name": "销售明细",
      "rowCount": 240,
      "columnCount": 18,
      "hidden": false,
      "empty": false,
      "recommendedOrientation": "landscape"
    }
  ]
}
```

## POST /api/print-plans

请求推荐方案。

请求：

```json
{
  "fileId": "file_001",
  "sheetIds": ["sheet_001"]
}
```

响应：

```json
{
  "plans": [
    {
      "planId": "standard",
      "name": "标准清晰版",
      "summary": "适合正式打印，保留可读字号并重复表头。",
      "rules": {
        "fitToWidth": 1,
        "repeatHeaderRows": true,
        "orientation": "landscape"
      }
    }
  ]
}
```

## POST /api/jobs

创建生成任务。

请求：

```json
{
  "fileId": "file_001",
  "sheetIds": ["sheet_001"],
  "planId": "standard",
  "outputs": ["pdf", "xlsx"]
}
```

响应：

```json
{
  "jobId": "job_001",
  "status": "queued"
}
```

## GET /api/jobs/:jobId

查询任务状态。

响应：

```json
{
  "jobId": "job_001",
  "status": "done",
  "downloads": [
    {
      "type": "pdf",
      "url": "https://example.com/files/job_001.pdf"
    },
    {
      "type": "xlsx",
      "url": "https://example.com/files/job_001.xlsx"
    }
  ]
}
```
