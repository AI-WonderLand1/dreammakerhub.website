#!/usr/bin/env python3
"""Restore only ordinary project files from a private, integrity-checked gzip archive."""
import os
import shutil
import sys
import tarfile
from pathlib import Path, PurePosixPath

ROOT = Path("/home/coder/project")
ARCHIVE = Path("/tmp/wonderspace-restore.tar.gz")
MAX_FILES = 10000
MAX_BYTES = 64 * 1024 * 1024
MAX_COMPRESSED = 16 * 1024 * 1024
if len(sys.argv) != 1 or ARCHIVE.is_symlink() or not ARCHIVE.is_file():
    raise SystemExit("Missing or invalid snapshot")
if ARCHIVE.stat().st_size > MAX_COMPRESSED:
    raise SystemExit("Snapshot compressed bytes exceed limit")
if ROOT.is_symlink() or not ROOT.is_dir() or any(ROOT.iterdir()):
    raise SystemExit("Workspace is not empty; refusing to overwrite files")
total = 0
files = 0
with tarfile.open(ARCHIVE, mode="r:gz") as archive:
    members = archive.getmembers()
    if len(members) > MAX_FILES + 10000:
        raise SystemExit("Too many snapshot archive entries")
    for member in members:
        path = PurePosixPath(member.name)
        if (path.is_absolute() or not path.parts or path.parts[0] != "project" or
                any(part in ("", ".", "..") for part in path.parts) or
                not (member.isfile() or member.isdir())):
            raise SystemExit("Unsafe snapshot member")
        if member.name == "project":
            if not member.isdir():
                raise SystemExit("Invalid snapshot directory")
            continue
        if len(path.parts) < 2:
            raise SystemExit("Invalid snapshot entry")
        # No symlinks or hardlinks are extracted, even if their target appears safe.
        target = ROOT.joinpath(*path.parts[1:])
        if member.isdir():
            target.mkdir(parents=True, exist_ok=True)
            continue
        files += 1
        total += member.size
        if files > MAX_FILES or member.size > MAX_BYTES or total > MAX_BYTES:
            raise SystemExit("Snapshot exceeds unpacked size cap")
        target.parent.mkdir(parents=True, exist_ok=True)
        if target.is_symlink() or target.exists():
            raise SystemExit("Duplicate or unsafe archive member")
        source = archive.extractfile(member)
        if source is None:
            raise SystemExit("Missing snapshot file")
        fd = os.open(str(target), os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
        try:
            with os.fdopen(fd, "wb") as output:
                shutil.copyfileobj(source, output, length=64 * 1024)
        finally:
            source.close()
print("Private workspace gzip restored")
