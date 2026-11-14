shader_type spatial;
render_mode cull_disabled;
#include "res://shaders/ground_light.gdshaderinc"
uniform sampler2D albedo_map : source_color,repeat_enable,filter_linear_mipmap;
uniform vec4 albedo_tint : source_color = vec4(1.);
uniform bool textured=false;
uniform bool vertex_tint=false;
uniform bool leaf=false;
uniform bool fresh_grass=false;
uniform float roughness=.9;
varying vec3 place;
void vertex(){place=(MODEL_MATRIX*vec4(VERTEX,1.)).xyz;}
void fragment(){
 vec3 tint=albedo_tint.rgb;
 if(textured)tint*=texture(albedo_map,UV).rgb;
 if(vertex_tint)tint*=COLOR.rgb;
 if(fresh_grass)tint=min(tint*1.55+vec3(.008,.018,.005),vec3(.30,.42,.19));
 vec3 occlusion=sanctuary_occlusion(place);
 ALBEDO=tint;
 ROUGHNESS=roughness;
 SPECULAR=.14;
 AO=occlusion.r*occlusion.b*mix(1.,occlusion.g,.6);
 AO_LIGHT_AFFECT=.35;
 if(fresh_grass)EMISSION=tint*.10*occlusion.r*occlusion.b*occlusion.g;
 if(leaf){BACKLIGHT=tint*.22;RIM=.08;RIM_TINT=.75;}
}
