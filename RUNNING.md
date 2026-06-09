# Running Excelsuperpower

## Web preview

Double-click:

```text
start-web-preview.cmd
```

Or run from PowerShell:

```powershell
.\run-web-preview.ps1 -InstallDependencies
```

Keep the preview terminal open, then visit:

```text
http://127.0.0.1:4173/
```

The launcher automatically:

- Finds a project virtual environment, Codex bundled Python, Python Launcher, or system Python.
- Checks and optionally installs dependencies from `requirements.txt`.
- Avoids starting a second server when port `4173` is already serving this project.
- Shows the real Python error when startup fails.

To stop the preview, close its terminal or double-click:

```text
stop-web-preview.cmd
```

## Direct Python command

After installing dependencies:

```powershell
py -3 -m pip install -r requirements.txt
py -3 run_preview.py --port 4173
```
