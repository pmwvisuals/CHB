shader_type spatial;
uniform sampler2D stone_texture : source_color, repeat_enable, filter_linear_mipmap_anisotropic;
uniform bool textured = false;
void fragment(){
 ALBEDO = COLOR.rgb;
 if(textured) ALBEDO *= texture(stone_texture,UV).rgb;
 ROUGHNESS = UV2.x;
 METALLIC = UV2.y;
 SPECULAR = UV2.y<.1 ? .16 : .35;
}
