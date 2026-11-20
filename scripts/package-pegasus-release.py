"""Assemble and verify the self-contained Dawnwing buyer download."""
from pathlib import Path
import hashlib
import json
import shutil
import zipfile

ROOT = Path(__file__).resolve().parents[1]
RELEASE = ROOT / "assets-source/creatures/dawnwing-pegasus/release"
TEMPLATE = ROOT / "scripts/pegasus-buyer"
ARCHIVE = ROOT / "dawnwing-pegasus-buyer.zip"


def copy_templates():
    for source in sorted(TEMPLATE.rglob("*")):
        if source.is_file():
            destination = RELEASE / source.relative_to(TEMPLATE)
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, destination)


if __name__ == "__main__":
    import sys
    copy_templates()
    if "--templates-only" in sys.argv:
        print("Copied standalone preview and guide templates")
        raise SystemExit(0)
    for required in ("Reports/source-validation.json", "Reports/gltf-validation.json",
                     "Reports/godot-validation.txt", "Previews/Walking.gif", "Previews/Flight.gif"):
        assert (RELEASE / required).is_file(), required
    assert json.loads((RELEASE / "Reports/source-validation.json").read_text())["passed"]
    assert json.loads((RELEASE / "Reports/gltf-validation.json").read_text())["passed"]
    assert "BUYER PREVIEW FAILURES 0" in (RELEASE / "Reports/godot-validation.txt").read_text()
    files = sorted(file for file in RELEASE.rglob("*") if file.is_file()
                   and not any(part.startswith(".") and part != ".gdignore"
                               for part in file.relative_to(RELEASE).parts)
                   and file.suffix not in (".import", ".uid", ".blend1", ".log")
                   and (file.parent.name != "Models" or file.suffix == ".glb")
                   and file.name != "SHA256SUMS.txt")
    hashes = {file.relative_to(RELEASE).as_posix(): hashlib.sha256(file.read_bytes()).hexdigest()
              for file in files}
    checksum_file = RELEASE / "SHA256SUMS.txt"
    checksum_file.write_text("".join(f"{digest}  {name}\n" for name, digest in hashes.items()), encoding="utf-8")
    files.append(checksum_file)
    with zipfile.ZipFile(ARCHIVE, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
        for file in files:
            archive.write(file, "DawnwingPegasus/" + file.relative_to(RELEASE).as_posix())
    with zipfile.ZipFile(ARCHIVE) as archive:
        assert archive.testzip() is None
        assert len(archive.namelist()) == len(set(archive.namelist()))
        for name, digest in hashes.items():
            assert hashlib.sha256(archive.read("DawnwingPegasus/" + name)).hexdigest() == digest
    print(json.dumps({"archive": str(ARCHIVE), "files": len(files), "bytes": ARCHIVE.stat().st_size,
                      "sha256": hashlib.sha256(ARCHIVE.read_bytes()).hexdigest()}))
