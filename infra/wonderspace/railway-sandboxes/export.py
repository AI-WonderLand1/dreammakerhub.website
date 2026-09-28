#!/usr/bin/env python3
"""Pack only regular project files into a bounded gzip archive; never follow symlinks."""
import os
import stat
import sys
import tarfile
from pathlib import Path

ROOT = Path("/home/coder/project")
OUTPUT = Path("/tmp/wonderspace-save.tar.gz")
MAX_FILES = 10000
MAX_BYTES = 64 * 1024 * 1024
MAX_ARCHIVE = 16 * 1024 * 1024
if len(sys.argv) != 1 or not ROOT.is_dir() or OUTPUT.is_symlink():
    raise SystemExit("Invalid workspace export")
files = 0
total = 0
with tarfile.open(OUTPUT, mode="w:gz", format=tarfile.PAX_FORMAT, compresslevel=5) as archive:
    for root, dirs, filenames in os.walk(ROOT, topdown=True, followlinks=False):
        dirs[:] = sorted(d for d in dirs if not (Path(root) / d).is_symlink())
        for filename in sorted(filenames):
            path = Path(root) / filename
            metadata = path.lstat()
            if not stat.S_ISREG(metadata.st_mode):
                continue
            files += 1
            total += metadata.st_size
            if files > MAX_FILES or total > MAX_BYTES or metadata.st_size > MAX_BYTES:
                raise SystemExit("Workspace exceeds gzip archive safety limit")
            archive.add(path, arcname="project/" + str(path.relative_to(ROOT)), recursive=False)
if OUTPUT.stat().st_size > MAX_ARCHIVE:
    OUTPUT.unlink(missing_ok=True)
    raise SystemExit("Compressed workspace exceeds 16 MiB limit")
print("Workspace gzip export complete")
