shader_type spatial;
varying vec3 place;
void vertex(){place=(MODEL_MATRIX*vec4(VERTEX,1.)).xyz;}
void fragment(){
 vec2 a=vec2(sin(dot(place.xz,vec2(.61,.37))+TIME*.52),cos(dot(place.xz,vec2(-.29,.73))-TIME*.43))*.065;
 a+=vec2(sin(dot(place.xz,vec2(2.1,-1.3))-TIME*.82),cos(dot(place.xz,vec2(1.7,2.3))+TIME*.71))*.026;
 ALBEDO=vec3(.018,.13,.30)*(1.+.06*sin(place.x*1.7+place.z*.9+TIME*.3));
 NORMAL_MAP=vec3(.5+a.x,.5+a.y,1.);
 NORMAL_MAP_DEPTH=1.0;
 ROUGHNESS=.19;
 METALLIC=.14;
 SPECULAR=.65;
}
