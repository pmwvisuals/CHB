shader_type spatial;
uniform vec4 stone_tint:source_color=vec4(1.);
uniform float grain=.035;
uniform bool marble=false;
varying vec3 place;
float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float noise(vec3 p){
 vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
}
void vertex(){place=(MODEL_MATRIX*vec4(VERTEX,1.)).xyz;}
void fragment(){
 float vein=sin(place.x*2.4+place.z*1.3+sin(place.y*1.8+place.z*.7)*2.1);
 float fine=noise(place*38.);
 float age=noise(place*2.5);
 ALBEDO=stone_tint.rgb*(.88+.09*age+.03*fine-(marble?grain*(vein*.5+.5):0.));
 ROUGHNESS=marble?.72:.91;SPECULAR=marble?.16:.08;
}
