"""Package the editable Godot project without caches or machine-local tools."""
from pathlib import Path
import hashlib
import json
import zipfile

root = Path(__file__).resolve().parent.parent
native = root / "native"
archive = root / "asterion-native-project.zip"
manifest = json.loads((native / "assets-manifest.json").read_text(encoding="utf-8"))
files = [native / name for name in (
    "project.godot", "export_presets.cfg", "README.md", "VALIDATION.md", "assets-manifest.json"
)]
for folder in ("scenes", "scripts", "tests", "shaders"):
    files += sorted(p for p in (native / folder).rglob("*")
                    if p.is_file() and p.suffix in (".tscn", ".gd", ".uid", ".gdshader"))
for item in manifest["assets"]:
    asset = native / item["file"]
    content = asset.read_bytes()
    assert len(content) == item["bytes"], f"Asset size mismatch: {asset}"
    assert hashlib.sha256(content).hexdigest() == item["sha256"], f"Asset hash mismatch: {asset}"
    files.append(asset)

with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as package:
    for source in files:
        package.write(source, "asterion-native/" + source.relative_to(native).as_posix())
with zipfile.ZipFile(archive) as package:
    assert package.testzip() is None, "Archive checksum validation failed"
    assert "asterion-native/project.godot" in package.namelist()
    assert len([name for name in package.namelist() if name.endswith(".glb")]) == len([a for a in manifest["assets"] if a["file"].endswith(".glb")])
    assert not any("/.godot/" in name or "/.tools/" in name for name in package.namelist())
print(f"Packaged {len(files)} files: {archive} ({archive.stat().st_size:,} bytes)")
