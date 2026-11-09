import {campRoutes,routePoints,gardenCourts} from '@/lib/game/camp-layout';
import {templeCatalog} from '@/lib/game/temple-catalog';
import {templeSites,templeTrails,sitePoint,type SiteId} from '@/lib/game/sanctuary-layout';
import {landmarks} from '@/lib/game/data';
const map=(n:number)=>320+n*1.12;
export default function SanctuaryMap({x,z,selected,onSelect,onVisit}:{x:number;z:number;selected:string;onSelect:(id:string)=>void;onVisit:(id:SiteId)=>void}){
 return <svg viewBox="0 0 640 640" role="img" aria-label="Map of twelve temples in their unique landscapes. Select a temple to visit its grounds.">
  <rect width="640" height="640" fill="#d9d2ae"/><rect x="24" y="24" width="592" height="592" fill="#bdc3a0" stroke="#82927b"/>
  <path d="M75 210Q180 95 360 80L565 105L575 310Q470 260 400 230Q180 300 75 420Z" fill="#8ea181"/>
  <ellipse cx={map(91)} cy={map(0)} rx={31*1.12} ry={47*1.12} fill="#80aaa8" stroke="#5b8583"/>
  {Object.entries(templeTrails).map(([id,points])=>{const end=sitePoint(id as SiteId,0,16);return <polyline key={id} points={[...points,[end.x,end.z]].map(([px,pz])=>`${map(px)},${map(pz)}`).join(' ')} fill="none" stroke="#ae966d" strokeWidth="3" strokeLinecap="round"/>;})}
  {gardenCourts.map((g,i)=><ellipse key={'garden'+i} cx={map(g.x)} cy={map(g.z)} rx={g.rx*1.12} ry={g.rz*1.12} fill="#7b9270"/>)}
  {campRoutes.map(r=><polyline key={r.name} points={routePoints(r.points).map(p=>`${map(p.x)},${map(p.z)}`).join(' ')} fill="none" stroke="#ae966d" strokeWidth={r.width} strokeLinecap="round"><title>{r.name}</title></polyline>)}
  {templeCatalog.map(t=>{const site=templeSites[t.id],px=map(site.x),pz=map(site.z);return <g key={t.id} role="button" tabIndex={0} className="map-marker" aria-label={`Visit ${t.name} at ${site.region}`} onClick={()=>onVisit(t.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onVisit(t.id);}}}>
   <title>{t.name} · {site.region} — visit temple grounds</title><circle cx={px} cy={pz} r="15" fill={t.accent} stroke="#efe5c6" strokeWidth="2"/>
   <path d={`M${px-8} ${pz-4}L${px} ${pz-10}L${px+8} ${pz-4}Z M${px-6} ${pz-2}v9m6-9v9m6-9v9 M${px-9} ${pz+8}h18`} stroke="#efe5c6" fill="none" strokeWidth="1.5"/>
   <text x={px} y={pz+29} textAnchor="middle" fill="#263e32" fontSize="11" fontWeight="bold">{t.name.toUpperCase()}</text>
  </g>;})}
  <rect x={map(-8)} y={map(-8)} width="18" height="18" fill="#52716c" stroke="#eee4ca" strokeWidth="2"/><text x={map(0)} y={map(0)+30} textAnchor="middle" fontSize="9" fill="#344c40">GREAT HALL</text>
  <rect x={map(-66)} y={map(43)} width="25" height="21" fill="#6c8b93" stroke="#eee4ca"/>
  {landmarks.map((l,i)=><g key={l.id} role="button" tabIndex={0} className="map-marker" aria-label={l.name} onClick={()=>onSelect(l.id)} onKeyDown={e=>{if(e.key==='Enter')onSelect(l.id);}}><circle cx={map(l.x)} cy={map(l.z)} r="8" fill={selected===l.id?'#344f45':'#f6edd3'} stroke="#344f45"/><text x={map(l.x)} y={map(l.z)+3} textAnchor="middle" fontSize="9" fill={selected===l.id?'#f6edd3':'#344f45'}>{i+1}</text></g>)}
  <circle cx={map(x)} cy={map(z)} r="5" fill="#c56942" stroke="#fff4d8" strokeWidth="2"/><circle cx={map(x)} cy={map(z)} r="10" fill="none" stroke="#c56942"/>
  <text x="565" y="57" className="map-north">N ↑</text><text x="320" y="600" textAnchor="middle" fontSize="11" fill="#344f45">SELECT A TEMPLE TO VISIT ITS GROUNDS</text>
 </svg>;
}
