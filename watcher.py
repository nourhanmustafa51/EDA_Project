"""watcher.py - Automatic execution.

Two ways to start the pipeline without typing the file name:

1) Folder watcher (watchdog):
       python watcher.py
   Drop a CSV/Excel file into data/incoming and the report is created (and emailed).

2) Upload API (FastAPI):
       uvicorn watcher:app --reload
   Open http://127.0.0.1:8000/docs and use POST /upload to send a file.

Set SEND_EMAIL=true in the .env file to email each report automatically.
"""
import os
import time
import shutil
import threading

from dotenv import load_dotenv
from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer
from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException

from main import run_pipeline

load_dotenv()

BASE = os.path.dirname(os.path.abspath(__file__))
INCOMING = os.path.join(BASE, "data", "incoming")
UPLOADS = os.path.join(BASE, "data", "uploads")   # API uploads (not watched, avoids double runs)
ALLOWED = (".csv", ".xlsx", ".xls")
SEND_EMAIL = os.getenv("SEND_EMAIL", "false").strip().lower() == "true"

_lock = threading.Lock()  # one pipeline at a time (Matplotlib is not thread-safe)


def process_file(path):
    """Run the pipeline for one file; never crash the watcher."""
    with _lock:
        try:
            run_pipeline(path, send_email=SEND_EMAIL)
        except Exception as exc:  # noqa: BLE001
            print(f"[watcher] FAILED for {os.path.basename(path)}: {exc}")


def wait_until_stable(path, checks=3, delay=1.0):
    """Wait until the file stops growing (the copy/download has finished)."""
    last = -1
    stable = 0
    while stable < checks:
        try:
            size = os.path.getsize(path)
        except OSError:
            return False
        stable = stable + 1 if size == last and size > 0 else 0
        last = size
        time.sleep(delay)
    return True


# ------------------------------------------------------------ folder watcher
class NewFileHandler(FileSystemEventHandler):
    def __init__(self):
        self._seen = set()

    def on_created(self, event):
        path = event.src_path
        if event.is_directory or not path.lower().endswith(ALLOWED):
            return
        if os.path.basename(path).startswith(("~", ".")):
            return  # temporary files (e.g. Excel lock files)
        if path in self._seen:
            return
        self._seen.add(path)
        print(f"[watcher] New file detected: {os.path.basename(path)}")
        if wait_until_stable(path):
            process_file(path)
        self._seen.discard(path)


def start_watcher():
    os.makedirs(INCOMING, exist_ok=True)
    observer = Observer()
    observer.schedule(NewFileHandler(), INCOMING, recursive=False)
    observer.start()
    print(f"[watcher] Watching {INCOMING}\n[watcher] Email on completion: {SEND_EMAIL}\n"
          f"[watcher] Press Ctrl+C to stop.")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()


# ------------------------------------------------------------ FastAPI upload
app = FastAPI(title="Automated EDA Report Generator")


@app.get("/")
def home():
    return {"message": "POST a CSV or Excel file to /upload", "email_enabled": SEND_EMAIL}


@app.post("/upload")
async def upload(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    name = os.path.basename(file.filename or "")
    if not name.lower().endswith(ALLOWED):
        raise HTTPException(status_code=400, detail="Only .csv, .xlsx and .xls files are accepted.")
    os.makedirs(UPLOADS, exist_ok=True)
    path = os.path.join(UPLOADS, name)
    with open(path, "wb") as out:
        shutil.copyfileobj(file.file, out)
    background_tasks.add_task(process_file, path)  # runs after the response is sent
    stem = os.path.splitext(name)[0]
    return {"status": "processing", "file": name,
            "report_will_be_at": f"outputs/reports/{stem}_report.pdf"}


if __name__ == "__main__":
    start_watcher()
