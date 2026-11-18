import {campRoutes,routePoints} from './camp-layout';
import {sitePoint,templeSites,type SiteId} from './sanctuary-layout';
import {roadRectangles,rectangleUnion,type RoadRectangle} from './rectangular-roads';
export function entranceLandings():RoadRectangle[]{return (Object.keys(templeSites) as SiteId[]).filter(id=>id!=='poseidon').map(id=>{const a=sitePoint(id,0,16),b=sitePoint(id,0,9.8),half=1.55;return {x0:Math.min(a.x,b.x)-half,x1:Math.max(a.x,b.x)+half,z0:Math.min(a.z,b.z)-half,z1:Math.max(a.z,b.z)+half};});}
export const streetRectangles=rectangleUnion([...campRoutes.flatMap(r=>roadRectangles(routePoints(r.points),r.width)),...entranceLandings()]);
export const causewayRectangle={x0:55,x1:84.7,z0:3.2,z1:6.8};
export function streetPlan(){const main=campRoutes.filter(r=>r.kind==='main').flatMap(r=>roadRectangles(routePoints(r.points),r.width));return {paving:[...streetRectangles,causewayRectangle].map(r=>[r.x0,r.z0,r.x1,r.z1]),main:main.map(r=>[r.x0,r.z0,r.x1,r.z1]),area:streetRectangles.reduce((sum,r)=>sum+(r.x1-r.x0)*(r.z1-r.z0),0),routes:campRoutes.length};}
