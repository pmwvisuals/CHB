import * as T from 'three';
export function practiceSword(){
 const root=new T.Group();root.name='Plain practice sword';const steel=new T.MeshStandardMaterial({color:'#b9c7c9',metalness:.72,roughness:.3}),bronze=new T.MeshStandardMaterial({color:'#b68c48',metalness:.6,roughness:.42}),leather=new T.MeshStandardMaterial({color:'#49382d',roughness:.94});
 const shape=new T.Shape();shape.moveTo(-.045,.03);shape.lineTo(.045,.03);shape.lineTo(.052,.72);shape.lineTo(0,.94);shape.lineTo(-.052,.72);shape.closePath();
 const blade=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:.022,bevelEnabled:true,bevelSize:.006,bevelThickness:.006,bevelSegments:1,steps:1}),steel);blade.position.z=-.011;root.add(blade);
 const grip=new T.Mesh(new T.CylinderGeometry(.031,.037,.23,12),leather);grip.position.y=-.14;root.add(grip);
 const guard=new T.Mesh(new T.BoxGeometry(.23,.045,.075),bronze);root.add(guard);const pommel=new T.Mesh(new T.SphereGeometry(.05,12,8),bronze);pommel.position.y=-.29;root.add(pommel);
 for(let i=0;i<6;i++){const wrap=new T.Mesh(new T.TorusGeometry(.034,.004,4,12),bronze);wrap.rotation.x=Math.PI/2;wrap.position.y=-.045-i*.034;root.add(wrap);}return root;
}
export function practiceArrow(){const root=new T.Group();root.name='Practice arrow';const wood=new T.MeshStandardMaterial({color:'#9d8156',roughness:.8}),iron=new T.MeshStandardMaterial({color:'#939fa3',metalness:.6,roughness:.5}),feather=new T.MeshStandardMaterial({color:'#ded5b9',side:T.DoubleSide,roughness:.9});
 const shaft=new T.Mesh(new T.CylinderGeometry(.007,.009,.85,6),wood);shaft.rotation.x=Math.PI/2;shaft.position.z=-.25;root.add(shaft);const tip=new T.Mesh(new T.ConeGeometry(.023,.12,4),iron);tip.rotation.x=-Math.PI/2;tip.position.z=-.72;root.add(tip);
 for(let i=0;i<3;i++){const fin=new T.Mesh(new T.PlaneGeometry(.055,.15).rotateX(Math.PI/2).rotateZ(i*Math.PI*2/3),feather);fin.position.z=.12;root.add(fin);}return root;
}
export function practiceBow(){const root=new T.Group();root.name='Plain ash bow';const wood=new T.MeshStandardMaterial({color:'#8c603a',roughness:.74}),wrap=new T.MeshStandardMaterial({color:'#d0bf96',roughness:.95});
 const curve=new T.CatmullRomCurve3([new T.Vector3(0,-.58,0),new T.Vector3(0,-.39,-.15),new T.Vector3(0,0,-.09),new T.Vector3(0,.39,-.15),new T.Vector3(0,.58,0)]);root.add(new T.Mesh(new T.TubeGeometry(curve,40,.025,8,false),wood));
 const grip=new T.Mesh(new T.CylinderGeometry(.032,.032,.18,12),wrap);grip.position.set(0,0,-.09);root.add(grip);
 const stringGeo=new T.BufferGeometry().setFromPoints([new T.Vector3(0,.58,0),new T.Vector3(0,0,0),new T.Vector3(0,-.58,0)]),string=new T.Line(stringGeo,new T.LineBasicMaterial({color:'#e4d9b9'}));root.add(string);const arrow=practiceArrow();arrow.position.set(.04,0,0);root.add(arrow);
 return {root,draw(amount:number){const p=stringGeo.getAttribute('position');p.setZ(1,amount*.32);p.needsUpdate=true;arrow.position.z=amount*.32;}};
}
