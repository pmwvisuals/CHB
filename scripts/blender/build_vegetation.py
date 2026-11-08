"""Build Asterion vegetation with Sapling 1.0, export editable sources, GLBs and packed runtime meshes.
Run: blender --background --python scripts/blender/build_vegetation.py -- <project-directory>
"""
import bpy, math, random, json, struct, base64, ast, sys
import numpy as np
import zlib
from pathlib import Path
from mathutils import Vector
ROOT=Path(sys.argv[sys.argv.index('--')+1]) if '--' in sys.argv else Path.cwd()
OUT=ROOT/'assets-source'/'vegetation';OUT.mkdir(parents=True,exist_ok=True)
DATA=ROOT/'lib/game/generated/vegetation.ts'
random.seed(212)
mod=__import__('bl_ext.user_default.sapling_tree_gen',fromlist=['x'])
PRESETS=Path(mod.__file__).parent/'presets'
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
all_objects=[];catalog={}
def mat(name,color):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;m.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(*color,1);m.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.88;return m
bark=mat('Furrowed bark',(.15,.105,.065));nodes=bark.node_tree.nodes;links=bark.node_tree.links
tex=nodes.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=7;tex.inputs['Detail'].default_value=4
mapping=nodes.new('ShaderNodeVectorMath');mapping.operation='MULTIPLY';mapping.inputs[1].default_value=(4,4,.25)
coord=nodes.new('ShaderNodeTexCoord');links.new(coord.outputs['Generated'],mapping.inputs[0]);links.new(mapping.outputs[0],tex.inputs['Vector'])
ramp=nodes.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].color=(.035,.025,.018,1);ramp.color_ramp.elements[1].color=(.28,.2,.13,1);links.new(tex.outputs['Fac'],ramp.inputs[0]);links.new(ramp.outputs[0],nodes.get('Principled BSDF').inputs['Base Color'])
bump=nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.6;bump.inputs['Distance'].default_value=.09;links.new(tex.outputs['Fac'],bump.inputs['Height']);links.new(bump.outputs['Normal'],nodes.get('Principled BSDF').inputs['Normal'])
materials={'bark':bark,'oak':mat('Oak - deep jade',(.075,.16,.055)),'fir':mat('Fir - black green',(.035,.105,.075)),'olive':mat('Olive - silver sage',(.32,.4,.22)),'blossom':mat('Blossom - fresh green',(.18,.31,.10)),'fern':mat('Fern - emerald',(.075,.23,.10)),'bramble':mat('Bramble - shaded green',(.095,.19,.065)),'laurel':mat('Laurel - polished green',(.12,.27,.11)),'myrtle':mat('Myrtle - blue green',(.11,.27,.20)),'pink':mat('Petal - pale blush',(.9,.47,.55)),'white':mat('Petal - ivory',(.92,.88,.65)),'gold':mat('Flower centers',(.76,.45,.06)),'grass':mat('Soft meadow',(.29,.4,.12)),'dry':mat('Forest litter',(.22,.12,.045))}
# A textured twig atlas: twenty pointed leaves and a fine stem on transparency.
SIZE=128
rgba=np.zeros((SIZE,SIZE,4),dtype=np.float32)
def stroke(a,b,width,color):
 yy,xx=np.mgrid[0:SIZE,0:SIZE];a=np.array(a);b=np.array(b);v=b-a;t=np.clip(((xx-a[0])*v[0]+(yy-a[1])*v[1])/(np.dot(v,v)+1e-5),0,1);dist=(xx-a[0]-t*v[0])**2+(yy-a[1]-t*v[1])**2;rgba[dist<width*width]=color
stroke((64,8),(64,119),1.1,(.27,.23,.09,1))
yy,xx=np.mgrid[0:SIZE,0:SIZE]
for row in range(8):
 for side in [-1,1]:
  cx=64+side*(19-row*.5);cy=22+row*12;ang=side*.63;dx=xx-cx;dy=yy-cy;u=dx*math.cos(ang)+dy*math.sin(ang);v=-dx*math.sin(ang)+dy*math.cos(ang);mask=(u/18)**2+(v/7)**2<1
  shade=.75+.18*(1-v/7)+.05*np.sin(xx*1.4+yy*.8);rgba[mask,0]=shade[mask]*.63;rgba[mask,1]=shade[mask]*.85;rgba[mask,2]=shade[mask]*.42;rgba[mask,3]=1
  stroke((64,cy-9),(cx,cy),.7,(.30,.36,.12,1));stroke((cx-12*math.cos(ang),cy-12*math.sin(ang)),(cx+12*math.cos(ang),cy+12*math.sin(ang)),.4,(.56,.63,.28,1))
leaf_image=bpy.data.images.new('Asterion leaf clusters',width=SIZE,height=SIZE,alpha=True);leaf_image.pixels.foreach_set(rgba.ravel());leaf_image.filepath_raw=str(OUT/'leaf-clusters.png');leaf_image.file_format='PNG';leaf_image.save();leaf_image.pack()
for k,m in materials.items():
 if k!='bark':m.use_backface_culling=False
 if k in ('oak','fir','olive','blossom','bramble','laurel','myrtle'):
  nt=m.node_tree;image=nt.nodes.new('ShaderNodeTexImage');image.image=leaf_image
  tint=nt.nodes.new('ShaderNodeMixRGB');tint.blend_type='MULTIPLY';tint.inputs[0].default_value=1;tint.inputs[2].default_value=(*[min(1,c*3.5) for c in m.diffuse_color[:3]],1)
  nt.links.new(image.outputs['Color'],tint.inputs[1]);nt.links.new(tint.outputs[0],nt.nodes.get('Principled BSDF').inputs['Base Color']);nt.links.new(image.outputs['Alpha'],nt.nodes.get('Principled BSDF').inputs['Alpha'])
  m.surface_render_method='DITHERED'

def leafy_cards(ob,span):
 old=ob.data;points=[v.co.copy() for v in old.vertices];centers=random.sample(points,min(len(points),5000 if span>.4 else 1600));verts=[];faces=[]
 for center in centers:
  for j in range(2):
   a=random.random()*math.tau;u=Vector((math.cos(a),math.sin(a),random.uniform(-.3,.3)))*span;v=Vector((-math.sin(a)*.35,math.cos(a)*.35,random.uniform(.5,1)))*span;n=len(verts)
   verts.extend([center-u-v,center+u-v,center+u+v,center-u+v]);faces.append((n,n+1,n+2,n+3))
 mesh=bpy.data.meshes.new('Leaf cluster cards');mesh.from_pydata(verts,[],faces);mesh.update();uv=mesh.uv_layers.new()
 for poly in mesh.polygons:
  for loop,co in zip(poly.loop_indices,[(0,0),(1,0),(1,1),(0,1)]):uv.data[loop].uv=co
 for m in old.materials:mesh.materials.append(m)
 ob.data=mesh;return ob

def convert(ob,material):
 mesh=bpy.data.meshes.new_from_object(ob.evaluated_get(bpy.context.evaluated_depsgraph_get()))
 mesh.transform(ob.matrix_world);obj=bpy.data.objects.new(ob.name+'_baked',mesh);bpy.context.collection.objects.link(obj);obj.data.materials.clear();obj.data.materials.append(material)
 for p in mesh.polygons:p.use_smooth=True
 return obj

def sapling(preset,height,seed,branches,leaves,leaf_size,**overrides):
 values=next(ast.literal_eval(l) for l in (PRESETS/(preset+'.py')).read_text().splitlines() if l.startswith('{'))
 props=bpy.ops.curve.tree_add.get_rna_type().properties;values={k:v for k,v in values.items() if k in props}
 values.update(seed=seed,scale=height,scaleV=0.,levels=3,branches=branches,segSplits=(0.,0.,0.,0.),leaves=leaves,leafScale=leaf_size,bevelRes=0,resU=3,curveRes=(6,4,2,1),showLeaves=True,makeMesh=True,useRig=False,windAnim=False,leafFlutter=False,blossomRate=0.)
 if preset=='douglas_fir':values.update(length=(1.,.25,.4,.01))
 values.update(overrides);before=set(bpy.data.objects);result=bpy.ops.curve.tree_add(**values)
 if 'FINISHED' not in result:raise RuntimeError('Sapling generation failed')
 created=set(bpy.data.objects)-before;parts=[]
 for ob in created:
  if ob.type in ('MESH','CURVE'):parts.append((ob,'leaf' if 'leav' in ob.name.lower() else 'bark'))
 return created,parts

def meshpart(name,vertices,faces,material):
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(vertices,[],faces);mesh.update();ob=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(ob);ob.data.materials.append(material);return ob

def fern(name,height=1.4):
 verts=[];faces=[]
 for f in range(9):
  a=f*2.399;reach=height*(.65+random.random()*.25)
  for j in range(2,14):
   t=j/14;center=Vector((math.cos(a)*reach*t,math.sin(a)*reach*t,height*(math.sin(t*2.3)*.65+.12)))
   width=height*.21*math.sin(t*math.pi)
   for side in [-1,1]:
    end=center+Vector((math.cos(a+side*1.1)*width,math.sin(a+side*1.1)*width,-width*.15));n=len(verts)
    across=Vector((-math.sin(a)*.025,math.cos(a)*.025,.018));verts.extend([center-across,center+across,end]);faces.append((n,n+1,n+2))
 return meshpart(name,verts,faces,materials['fern'])

def groundcover(name,style):
 verts=[];faces=[]
 if style=='fern':return fern(name,.58)
 for i in range(24 if style!='litter' else 18):
  a=random.random()*math.tau;r=random.random()*.4;x=math.cos(a)*r;y=math.sin(a)*r
  if style=='litter':
   w=.09+random.random()*.07;n=len(verts);verts.extend([(x-w,y,.015),(x-w*.3,y-w*.4,.025),(x+w*.7,y-w*.25,.025),(x+w,y,.015),(x+w*.3,y+w*.4,.025),(x-w*.7,y+w*.25,.025)]);faces.extend([(n,n+j,n+j+1) for j in range(1,5)])
  else:
   ht=.18+random.random()*.28
   for j in range(3):
    t=j/3;n=len(verts);w=.025*(1-t);bend=.15*t*t
    verts.extend([(x+math.cos(a)*(bend-w),y+math.sin(a)*(bend-w),ht*t),(x+math.cos(a)*(bend+w),y+math.sin(a)*(bend+w),ht*t),(x+math.cos(a)*(bend+.05),y+math.sin(a)*(bend+.05),ht*(t+1/3))]);faces.append((n,n+1,n+2))
 return meshpart(name,verts,faces,materials['dry' if style=='litter' else 'grass'])

def blossoms(parent,amount,size,material):
 # Small flowers distributed through the actual leaf canopy.
 verts=[];faces=[];leaf=parent.data.vertices
 for i in range(amount):
  center=random.choice(leaf).co.copy()
  for petal in range(5):
   a=petal*math.tau/5;n=len(verts);s=size*(.75+random.random()*.5)
   verts.extend([center,center+Vector((math.cos(a-.5)*s,math.sin(a-.5)*s,s*.18)),center+Vector((math.cos(a)*s*1.35,math.sin(a)*s*1.35,s*.3)),center+Vector((math.cos(a+.5)*s,math.sin(a+.5)*s,s*.18))]);faces.extend([(n,n+1,n+2),(n,n+2,n+3)])
 return meshpart('Blossoms',verts,faces,material)

def pack(ob,ratio=1):
 copy=ob.copy();copy.data=ob.data.copy();bpy.context.collection.objects.link(copy)
 if ratio<1 and ob.data.uv_layers.active:
  # Keep complete cards in distant foliage, rather than decimating each quad.
  import bmesh
  bm=bmesh.new();bm.from_mesh(copy.data);bm.faces.ensure_lookup_table();bmesh.ops.delete(bm,geom=[f for i,f in enumerate(bm.faces) if i%3!=0],context='FACES');bm.to_mesh(copy.data);bm.free()
 elif ratio<1 and len(copy.data.polygons)>3:
  dec=copy.modifiers.new('Distance simplification','DECIMATE');dec.ratio=ratio
 mesh=bpy.data.meshes.new_from_object(copy.evaluated_get(bpy.context.evaluated_depsgraph_get()));mesh.calc_loop_triangles()
 # Export Blender Z-up into Three.js Y-up, preserving meter scale.
 coords=[(v.co.x,v.co.z,-v.co.y) for v in mesh.vertices];normals=[(v.normal.x,v.normal.z,-v.normal.y) for v in mesh.vertices]
 maximum=max(max(abs(a) for a in v) for v in coords) if coords else 1;maximum=max(maximum,.001)
 raw=bytearray()
 for co,no in zip(coords,normals):raw.extend(struct.pack('<hhhbbb',*(round(v/maximum*32767) for v in co),*(max(-127,min(127,round(v*127))) for v in no)))
 uvs=[(0.,0.)]*len(coords)
 if mesh.uv_layers.active:
  for loop in mesh.loops:uvs[loop.vertex_index]=tuple(mesh.uv_layers.active.data[loop.index].uv)
 # Append UVs separately to retain the compact vertex stream.
 uvraw=struct.pack('<'+'H'*(len(uvs)*2),*[max(0,min(65535,round(a*65535))) for uv in uvs for a in uv])
 idx=[i for tri in mesh.loop_triangles for i in tri.vertices];use32=len(coords)>65535;indices=struct.pack('<'+('I' if use32 else 'H')*len(idx),*idx)
 result={'v':base64.b64encode(zlib.compress(raw,9)).decode(),'i':base64.b64encode(zlib.compress(indices,9)).decode(),'uv':base64.b64encode(zlib.compress(uvraw,9)).decode(),'scale':round(maximum,6),'wide':use32,'triangles':len(idx)//3}
 bpy.data.meshes.remove(mesh);bpy.data.objects.remove(copy,do_unlink=True);return result

def asset(identifier,name,zone,parts,created=None):
 originals=[];records=[]
 for ob,key in parts:
  if not len(ob.data.vertices) or not len(ob.data.polygons):continue
  if key=='leaf':leafy_cards(ob,.55 if identifier=='forest_oak' else .48 if identifier=='forest_fir' else .22 if identifier.startswith('camp_') and identifier in ('camp_olive','camp_blossom') else .18)
  if created is not None:ob=convert(ob,materials[key if key!='leaf' else identifier.split('_')[-1]])
  if key=='bark' and len(ob.data.polygons)>7000:
   dec=ob.modifiers.new('Game branch budget','DECIMATE');dec.ratio=7000/len(ob.data.polygons);bpy.context.view_layer.objects.active=ob;bpy.ops.object.modifier_apply(modifier=dec.name)
  ob.name=identifier+'_'+key;originals.append(ob);records.append({'material':key,'high':pack(ob),'low':pack(ob,.22 if key=='bark' else .35)})
 if created:
  for ob in created:bpy.data.objects.remove(ob,do_unlink=True)
 bpy.ops.object.select_all(action='DESELECT')
 for ob in originals:ob.select_set(True)
 bpy.context.view_layer.objects.active=originals[0]
 bpy.ops.export_scene.gltf(filepath=str(OUT/(identifier+'.glb')),export_format='GLB',use_selection=True,export_materials='EXPORT')
 bounds=[v.co for ob in originals for v in ob.data.vertices];height=max(v.z for v in bounds)-min(v.z for v in bounds)
 catalog[identifier]={'name':name,'zone':zone,'height':round(height,3),'parts':records}
 # Asset contact sheet placement; sources keep named objects, materials and both exports.
 index=len(catalog)-1;col=index%4;row=index//4
 display_scale=(20/max(height,.1)) if index<4 else (8/max(height,.1)) if index<8 else (3/max(height,.1))
 for ob in originals:ob.location=Vector(((col-1.5)*32,(1-row)*34,0));ob.scale=(display_scale,)*3
 all_objects.extend(originals)
 bpy.ops.object.text_add(location=((col-1.5)*32,(1-row)*34-11,.1));label=bpy.context.object;label.data.body=name;label.data.align_x='CENTER';label.data.size=1.3;label.data.materials.append(materials['white'])
 print('BUILT',identifier,round(height,1),sum(r['high']['triangles'] for r in records),flush=True)

for identifier,name,zone,preset,height,seed,branches,leaves,leaf_size in [
 ('forest_oak','Ancient shadow oak','forest','black_oak',23,41,(0,26,38,3),35,.24),
 ('forest_fir','Towering dusk fir','forest','douglas_fir',28,62,(0,110,12,3),35,.16),
 ('camp_olive','Silver courtyard olive','camp','black_tupelo',7,25,(0,25,15,3),35,.16),
 ('camp_blossom','Blush sanctuary tree','camp','hill_cherry',6,14,(0,25,18,3),30,.17)]:
 created,parts=sapling(preset,height,seed,branches,leaves,leaf_size)
 converted=[(convert(o,materials[identifier.split('_')[-1]] if key=='leaf' else bark),key) for o,key in parts]
 if identifier=='camp_blossom':converted.append((blossoms(next(o for o,k in converted if k=='leaf'),300,.10,materials['pink']),'pink'))
 for o in created:bpy.data.objects.remove(o,do_unlink=True)
 asset(identifier,name,zone,converted)
asset('forest_fern','Giant woodland fern','forest',[(fern('Fern',1.7),'fern')])
for identifier,name,zone,preset,height,seed in [('forest_bramble','Dark tangled bramble','forest','black_tupelo',2.1,71),('camp_laurel','Clipped laurel bush','camp','black_tupelo',1.45,45),('camp_myrtle','Flowering myrtle','camp','black_tupelo',1.6,24)]:
 created,parts=sapling(preset,height,seed,(0,18,12,2),35,.09,baseSize=.02,ratio=.025,length=(1.,.65,.5,.1),shape='3')
 converted=[(convert(o,materials[identifier.split('_')[-1]] if key=='leaf' else bark),key) for o,key in parts]
 if identifier=='camp_myrtle':converted.append((blossoms(next(o for o,k in converted if k=='leaf'),90,.075,materials['white']),'white'))
 for o in created:bpy.data.objects.remove(o,do_unlink=True)
 asset(identifier,name,zone,converted)
for identifier,name,zone,style in [('forest_bracken','Low bracken','forest','fern'),('forest_litter','Fallen leaves','forest','litter'),('camp_grass','Soft ornamental grass','camp','grass'),('camp_flowers','Ivory meadow flowers','camp','grass')]:
 ob=groundcover(name,style);parts=[(ob,'fern' if style=='fern' else 'dry' if style=='litter' else 'grass')]
 if identifier=='camp_flowers':parts.append((blossoms(ob,16,.06,materials['white']),'white'))
 asset(identifier,name,zone,parts)
payload=json.dumps(catalog,separators=(',',':'));names=[];imports=[]
for i,start in enumerate(range(0,len(payload),350000)):
 name='part'+str(i).zfill(2);names.append(name);imports.append("import "+name+" from './"+name+"';")
 (DATA.parent/(name+'.ts')).write_text('export default '+json.dumps(payload[start:start+350000])+';\n',encoding='utf8')
types='export interface PlantMesh {v:string;i:string;uv:string;scale:number;wide:boolean;triangles:number}\nexport interface PlantAsset {name:string;zone:string;height:number;parts:{material:string;high:PlantMesh;low:PlantMesh}[]}\n'
DATA.write_text('\n'.join(imports)+'\n'+types+'export const leafAtlas='+json.dumps(base64.b64encode(zlib.compress((np.clip(rgba,0,1)*255).astype(np.uint8).tobytes(),9)).decode())+';\nexport const vegetationAssets=JSON.parse(['+','.join(names)+'].join("")) as Record<'+'|'.join(json.dumps(k) for k in catalog)+',PlantAsset>;\n',encoding='utf8')
(OUT/'catalog.json').write_text(json.dumps({k:{'name':v['name'],'zone':v['zone'],'height':v['height'],'triangles':sum(p['high']['triangles'] for p in v['parts'])} for k,v in catalog.items()},indent=2))
# A studio contact sheet for checking every generated asset.
world=bpy.context.scene.world or bpy.data.worlds.new('World');bpy.context.scene.world=world;world.use_nodes=True;world.node_tree.nodes.get('Background').inputs[0].default_value=(.16,.2,.19,1);world.node_tree.nodes.get('Background').inputs[1].default_value=.6
bpy.ops.mesh.primitive_plane_add(size=250);floor=bpy.context.object;floor.name='Preview floor';floor.data.materials.append(mat('Preview floor',(.12,.16,.13)))
bpy.ops.object.light_add(type='AREA',location=(0,-25,80));bpy.context.object.data.energy=20000;bpy.context.object.data.shape='DISK';bpy.context.object.data.size=70
bpy.ops.object.light_add(type='SUN',location=(-30,-50,50));bpy.context.object.rotation_euler=(.4,-.5,-.4);bpy.context.object.data.energy=2
bpy.ops.object.camera_add(location=(0,-150,125));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,6))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=145;bpy.context.scene.camera=cam
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=16;scene.render.resolution_x=1600;scene.render.resolution_y=1200;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.filepath=str(OUT/'vegetation-contact-sheet.png')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'asterion-vegetation.blend'));bpy.ops.render.render(write_still=True)
print('FINISHED',len(catalog),'assets',DATA.stat().st_size,'bytes',flush=True)

