from pathlib import Path
import zipfile
root=Path(__file__).resolve().parent.parent
asset=root/'assets-source/creatures/ash-tusk-boar/game'
destination=root/'asterion-boar-game.zip'
with zipfile.ZipFile(destination,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for name in ['ash-tusk-boar-game.blend','game-report.json','game-validation.json']:z.write(asset/name,'Game boar/'+name)
 z.write(asset/'ash-tusk-boar-game.glb','Game boar/Godot/assets/boar.glb')
 for p in sorted((asset/'textures').glob('*.png')):z.write(p,'Game boar/textures/'+p.name)
 for name in ['scripts/boar.gd','scenes/boar.tscn','tests/boar.gd','tests/boar_preview.gd']:z.write(root/'native'/name,'Game boar/Godot/'+name)
 for name in ['boar-lod0.png','boar-lod1.png','boar-lod2.png','boar-attack.png']:z.write(root/'native/builds'/name,'Game boar/previews/'+name)
 for name in ['scripts/blender/prepare_boar_game.py','scripts/check-game-boar.mjs']:z.write(root/name,'Game boar/source/'+Path(name).name)
 z.write(root/'BOAR-GAME.md','Game boar/README.md')
with zipfile.ZipFile(destination) as z:assert z.testzip() is None
print('Game boar package verified:',destination,destination.stat().st_size,'bytes')
