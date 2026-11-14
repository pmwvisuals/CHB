shader_type spatial;
#include "res://shaders/ground_light.gdshaderinc"
uniform sampler2D stone_texture : source_color, repeat_enable, filter_linear_mipmap_anisotropic;
uniform bool textured = false;
varying vec3 place;
void vertex(){place=(MODEL_MATRIX*vec4(VERTEX,1.)).xyz;}
void fragment(){
 ALBEDO = COLOR.rgb;
 if(textured) ALBEDO *= texture(stone_texture,UV).rgb;
 ROUGHNESS = UV2.x;
 METALLIC = UV2.y;
 SPECULAR = UV2.y<.1 ? .16 : .35;
 vec3 contact=sanctuary_occlusion(place);
 AO=contact.r*contact.b;
 AO_LIGHT_AFFECT=.18;
}
