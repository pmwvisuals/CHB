"""Bake original cloud lighting and terrain contact shading; no runtime raymarch.

Run through Blender --background --factory-startup --python after the camp export.
The volume shapes share the browser's four cloud banks. No third-party art.
"""
from pathlib import Path
import hashlib, json, math, struct, zlib
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT/'native/assets/atmosphere'
OUT.mkdir(parents=True, exist_ok=True)
KEY = np.array([-.78,.40,-.48], dtype=np.float32)
KEY /= np.linalg.norm(KEY)

def png(path, pixels):
    a = np.uint8(np.clip(pixels,0,1)*255+.5)
    h,w,_ = a.shape
    def chunk(kind, content):
        return struct.pack('>I',len(content))+kind+content+struct.pack('>I',zlib.crc32(kind+content)&0xffffffff)
    raw=b''.join(b'\0'+row.tobytes() for row in a)
    path.write_bytes(b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',w,h,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(raw,8))+chunk(b'IEND',b''))

def smooth(a,b,v):
    t=np.clip((v-a)/(b-a),0,1)
    return t*t*(3-2*t)

def noise(p):
    i=np.floor(p); f=p-i; f=f*f*(3-2*f)
    result=np.zeros(p.shape[:-1],dtype=np.float32)
    for x in [0,1]:
        for y in [0,1]:
            for z in [0,1]:
                n=np.sin((i[...,0]+x)*127.1+(i[...,1]+y)*311.7+(i[...,2]+z)*74.7)*43758.5453
                result+=(n-np.floor(n))*(f[...,0] if x else 1-f[...,0])*(f[...,1] if y else 1-f[...,1])*(f[...,2] if z else 1-f[...,2])
    return result

lobes=[([-.24,-.06,.02],[.26,.27,.38]),([.02,.08,-.06],[.25,.39,.36]),([.28,-.01,.03],[.23,.27,.36]),([-.08,-.08,.22],[.34,.24,.22]),([.13,-.12,-.22],[.31,.24,.22])]
def shape(q):
    value=np.full(q.shape[:-1],-10,dtype=np.float32)
    for c,r in lobes:
        value=np.maximum(value,1-np.linalg.norm((q-np.array(c,dtype=np.float32))/np.array(r,dtype=np.float32),axis=-1))
    return value

def density(q):
    n=noise(q*10+17)*.64+noise(q*22-9)*.36
    return smooth(-.08,.19,shape(q)+(n-.5)*.31)*smooth(-.44,-.23,q[...,1])*(1-smooth(.37,.49,q[...,1]))

def bake_clouds():
    w,h=2048,1024
    # Equirectangular, aligned with sky shader's atan(z,x), acos(y).
    u=(np.arange(w,dtype=np.float32)+.5)/w*math.tau-math.pi
    v=(np.arange(h,dtype=np.float32)+.5)/h*math.pi
    az,polar=np.meshgrid(u,v)
    rays=np.stack([np.sin(polar)*np.cos(az),np.cos(polar),np.sin(polar)*np.sin(az)],-1)
    result=np.zeros((h,w,4),dtype=np.float32)
    for centre,size in [([120,118,-155],[108,35,70]),([205,135,70],[120,44,80]),([60,112,155],[98,31,65]),([310,150,-55],[100,34,72])]:
        c=np.array(centre,dtype=np.float32); extent=np.array(size,dtype=np.float32)
        inv=1/np.where(np.abs(rays)<1e-6,1e-6,rays)
        a=(c-extent*.56)*inv; b=(c+extent*.56)*inv
        near=np.maximum(np.min([a,b],axis=0).max(-1),0); far=np.max([a,b],axis=0).min(-1)
        mask=(far>near)&(rays[...,1]>.02)
        direction=rays[mask]; start=near[mask]; step=(far[mask]-start)/56
        transmission=np.ones(start.size,dtype=np.float32); color=np.zeros((start.size,3),dtype=np.float32)
        for i in range(56):
            p=direction*(start+(i+.5)*step)[:,None]
            q=(p-c)/extent; d=density(q)
            lit=np.zeros_like(d)
            for length,weight in [(4,.65),(10,.85),(19,.9)]:
                lit+=np.maximum(shape((p+KEY*length-c)/extent),0)*weight
            direct=np.exp(-lit*2.1)
            height=np.clip(q[:,1]+.5,0,1)
            shade=np.array([.40,.48,.58])[None,:]+direct[:,None]*np.array([.56,.39,.20])[None,:]
            shade*=.9+.1*height[:,None]
            alpha=1-np.exp(-d*step*.15)
            color+=transmission[:,None]*alpha[:,None]*shade
            transmission*=1-alpha
        alpha=1-transmission
        rgba=np.concatenate([color/np.maximum(alpha[:,None],1e-6),alpha[:,None]],-1)
        previous=result[mask]
        out_a=rgba[:,3]+previous[:,3]*(1-rgba[:,3])
        rgb=(rgba[:,:3]*rgba[:,3,None]+previous[:,:3]*previous[:,3,None]*(1-rgba[:,3,None]))/np.maximum(out_a[:,None],1e-6)
        result[mask]=np.concatenate([rgb,out_a[:,None]],-1)
        print('Baked cloud',centre,'pixels',int(mask.sum()),flush=True)
    png(OUT/'cloud-banks.png',result)

def bake_ground():
    layout=json.loads((ROOT/'native/assets/camp/camp-layout.json').read_text())
    n=1536; origin=-224; span=448
    coordinates=(np.arange(n,dtype=np.float32)+.5)/n*span+origin
    x,z=np.meshgrid(coordinates,coordinates)
    contact=np.ones((n,n),np.float32); shade=contact.copy(); ambient=contact.copy()
    def stamp(field,px,pz,radius,strength):
        ix=int((px-origin)/span*n); iz=int((pz-origin)/span*n); extent=math.ceil(radius*2/span*n)
        x0=max(0,ix-extent); x1=min(n,ix+extent+1); z0=max(0,iz-extent); z1=min(n,iz+extent+1)
        if x1<=x0 or z1<=z0:return
        r2=((x[z0:z1,x0:x1]-px)**2+(z[z0:z1,x0:x1]-pz)**2)/(radius*radius)
        field[z0:z1,x0:x1]*=1-strength*np.exp(-r2*1.8)
    trees=[]
    for batch in layout['batches']:
        if 'bark high' not in batch['kind']:continue
        for m in batch['instances']:
            px=batch['center'][0]+m[9]; pz=batch['center'][2]+m[11]
            scale=math.sqrt(m[0]**2+m[1]**2+m[2]**2)
            trees.append((px,pz,scale))
            stamp(contact,px,pz,.58*scale,.62)
            stamp(ambient,px,pz,2.5*scale,.22)
            stamp(shade,px-KEY[0]/KEY[1]*4.5*scale,pz-KEY[2]/KEY[1]*4.5*scale,2.2*scale,.42)
    # A narrow contact falloff around foundation edges, not a dark building-sized disk.
    for site in layout['temples']+[{'x':0,'z':0,'rotation':0}]:
        dx=x-site['x']; dz=z-site['z']; a=site['rotation']
        lx=dx*math.cos(a)-dz*math.sin(a); lz=dx*math.sin(a)+dz*math.cos(a)
        distance=np.maximum(np.abs(lx)-7.4,np.abs(lz)-9.5)
        contact*=1-.22*np.exp(-np.maximum(distance,0)**2/1.1)*(distance>-.2)
    grid=layout['heightfield']; values=np.array(grid['values'],np.float32).reshape(grid['size'],grid['size'])
    gx=np.clip((x-grid['origin'])/grid['spacing'],0,grid['size']-1.001); gz=np.clip((z-grid['origin'])/grid['spacing'],0,grid['size']-1.001)
    ix=gx.astype(int); iz=gz.astype(int); fx=gx-ix; fz=gz-iz
    height=(values[iz,ix]*(1-fx)+values[iz,ix+1]*fx)*(1-fz)+(values[iz+1,ix]*(1-fx)+values[iz+1,ix+1]*fx)*fz
    # Fine breaks make distant tree shade dappled rather than a smooth dark carpet.
    flecks=.91+.09*np.sin(x*2.7+np.sin(z*1.9))*np.sin(z*3.1)
    shade=1-(1-shade)*flecks
    packed=np.stack([np.maximum(contact,.40),np.maximum(shade,.45),np.maximum(ambient,.55),(height+4)/32],-1)
    png(OUT/'ground-light.png',packed)
    (OUT/'bake-report.json').write_text(json.dumps({'cloud_resolution':[2048,1024],'cloud_banks':4,'volume_steps':56,'ground_resolution':[n,n],'origin':origin,'span':span,'trees':len(trees),'light_direction':KEY.tolist(),'layout_sha256':hashlib.sha256((ROOT/'native/assets/camp/camp-layout.json').read_bytes()).hexdigest(),'channels':['root/foundation contact visibility','canopy sunlight visibility','canopy ambient visibility','(terrain height+4)/32']},indent=2))
    print('Baked grounded contact/canopy field for',len(trees),'trees',flush=True)

if __name__=='__main__':
    bake_clouds(); bake_ground()
    manifest_path=ROOT/'native/assets-manifest.json'
    manifest=json.loads(manifest_path.read_text())
    manifest['assets']=[a for a in manifest['assets'] if not a['file'].startswith('assets/atmosphere/')]
    for path in sorted(OUT.glob('*')):
        if path.suffix not in ['.png','.json']:continue
        data=path.read_bytes()
        manifest['assets'].append({'file':path.relative_to(ROOT/'native').as_posix(),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'source':'scripts/bake-native-atmosphere.py; original cloud shapes and retained tree placements'})
    manifest_path.write_text(json.dumps(manifest,indent=2)+'\n')
