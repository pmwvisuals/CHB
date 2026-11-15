"""Prepare the supplied flame cards in stable visible poses for the camp fire."""
from pathlib import Path
import bpy, json, hashlib, shutil
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'assets-source/campfire'
OUT = ROOT / 'native/assets/campfire'
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(SOURCE/'Blender/Campfire.blend'), load_ui=False, use_scripts=False)
image = bpy.data.images.load(str(SOURCE/'Textures/Optimized/Campfire_fire_MAT_BaseColor_Alpha.png'), check_existing=False)
pixels = list(image.pixels)
w, h = image.size
cards = []
for obj in list(bpy.data.objects):
    if not obj.name.startswith('fire_part'):
        continue
    # Smoke cards share the atlas. Retain the orange flame regions only.
    samples = []
    for polygon in obj.data.polygons:
        uv = sum((obj.data.uv_layers.active.data[i].uv for i in polygon.loop_indices), Vector((0, 0))) / len(polygon.loop_indices)
        index = (min(h-1, max(0, int(uv.y*h)))*w+min(w-1, max(0, int(uv.x*w))))*4
        samples.append(pixels[index:index+3])
    red = sum(c[0] for c in samples)
    blue = sum(c[2] for c in samples)
    if red < blue*1.4 or red < .1:
        continue
    best = None
    for frame in range(1, 91, 3):
        bpy.context.scene.frame_set(frame)
        vertices = [obj.matrix_world@v.co for v in obj.data.vertices]
        centre = sum(vertices, Vector())/len(vertices)
        size = obj.dimensions
        area = size.z*(size.x+size.y)
        if .2 < centre.z < 2.8 and (best is None or area > best[0]):
            best = (area, frame)
    if best is None:
        continue
    bpy.context.scene.frame_set(best[1])
    mesh = bpy.data.meshes.new_from_object(obj.evaluated_get(bpy.context.evaluated_depsgraph_get()))
    mesh.transform(obj.matrix_world)
    card = bpy.data.objects.new('StableFlame', mesh)
    bpy.context.collection.objects.link(card)
    cards.append(card)
assert len(cards) >= 3, 'No usable flame cards found'
for obj in bpy.context.selected_objects:
    obj.select_set(False)
for obj in cards:
    obj.select_set(True)
bpy.context.view_layer.objects.active = cards[0]
bpy.ops.object.join()
flame = bpy.context.object
flame.name = 'CampfireFlames'
points = [v.co for v in flame.data.vertices]
low = Vector(tuple(min(v[i] for v in points) for i in range(3)))
high = Vector(tuple(max(v[i] for v in points) for i in range(3)))
centre = (low+high)*.5
for vertex in flame.data.vertices:
    vertex.co.x = (vertex.co.x-centre.x)*3.0/(high.x-low.x)
    vertex.co.y = (vertex.co.y-centre.y)*2.7/(high.y-low.y)
    vertex.co.z = (vertex.co.z-low.z)*2.8/(high.z-low.z)
mat = bpy.data.materials.new('SteadyCampfire')
mat.use_nodes = True
nodes = mat.node_tree.nodes
shader = nodes.get('Principled BSDF')
texture = nodes.new('ShaderNodeTexImage')
texture.image = image
mat.node_tree.links.new(texture.outputs['Color'], shader.inputs['Base Color'])
mat.node_tree.links.new(texture.outputs['Alpha'], shader.inputs['Alpha'])
flame.data.materials.clear()
flame.data.materials.append(mat)
for polygon in flame.data.polygons:
    polygon.material_index = 0
bpy.ops.export_scene.gltf(filepath=str(OUT/'campfire-flames.glb'), export_format='GLB', use_selection=True, export_animations=False)
shutil.copyfile(SOURCE/'Textures/Optimized/Campfire_fire_MAT_BaseColor_Alpha.png', OUT/'flames.png')
manifest_path = ROOT/'native/assets-manifest.json'
manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
manifest['assets'] = [a for a in manifest['assets'] if not a['file'].startswith('assets/campfire/')]
for path in [OUT/'campfire-flames.glb', OUT/'flames.png']:
    data = path.read_bytes()
    manifest['assets'].append({'file':path.relative_to(ROOT/'native').as_posix(), 'bytes':len(data), 'sha256':hashlib.sha256(data).hexdigest(), 'source':'User-supplied campfire/Blender.zip and Textures.zip; stable flame poses'})
manifest_path.write_text(json.dumps(manifest, indent=2)+'\n', encoding='utf-8')
print('PREPARED', len(cards), 'flame cards in one mesh')
