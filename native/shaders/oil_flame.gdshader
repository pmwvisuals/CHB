shader_type spatial;
render_mode unshaded, shadows_disabled;
global uniform float sanctuary_weather_time;
varying float height;
void vertex(){
 height=UV.y;
 float tip=1.-UV.y;
 VERTEX.x+=sin(sanctuary_weather_time*5.+VERTEX.y*12.)*.014*tip;
 VERTEX.z+=cos(sanctuary_weather_time*3.7+VERTEX.y*9.)*.01*tip;
}
void fragment(){
 vec3 fire=mix(vec3(1.,.28,.025),vec3(1.,.91,.55),smoothstep(.12,.75,height));
 ALBEDO=fire;
 EMISSION=fire*1.8;
}
