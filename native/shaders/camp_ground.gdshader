shader_type spatial;
uniform sampler2D habitat : repeat_disable, filter_linear;
uniform sampler2D cover_albedo : source_color, repeat_enable, filter_linear_mipmap;
uniform sampler2D cover_normal : hint_normal, repeat_enable, filter_linear_mipmap;
uniform sampler2D cover_roughness : repeat_enable, filter_linear_mipmap;
varying vec3 place;
vec2 atlas_uv(float tile,vec2 uv){return vec2((fract(uv).x*.996+.002)*.5+tile*.5,fract(uv).y*.996+.002);}
vec4 cover_sample(sampler2D tex,vec2 p,float forest){
 vec2 a=p*.47;
 vec2 b=mat2(vec2(.819,.574),vec2(-.574,.819))*p*.283+vec2(.37,.19);
 float blend=.34+.32*sin(p.x*.071+sin(p.y*.053));
 return mix(mix(texture(tex,atlas_uv(0.,a)),texture(tex,atlas_uv(0.,b)),blend),mix(texture(tex,atlas_uv(1.,a)),texture(tex,atlas_uv(1.,b)),blend),forest);
}
void vertex(){place=(MODEL_MATRIX*vec4(VERTEX,1.)).xyz;}
void fragment(){
 vec2 weights=texture(habitat,(place.xz+250.)/500.).rg;
 float forest=smoothstep(.25,.8,weights.y);
 vec3 grain=cover_sample(cover_albedo,place.xz,forest).rgb/mix(vec3(.25,.32,.105),vec3(.17,.25,.085),forest);
 float soil=.86+.10*sin(place.x*33.7+place.z*19.3)*sin(place.z*71.3-place.x*51.7);
 ALBEDO=COLOR.rgb*mix(vec3(soil),clamp(grain,vec3(.34),vec3(1.45)),weights.x);
 ROUGHNESS=mix(.96,cover_sample(cover_roughness,place.xz,forest).g,weights.x);
 NORMAL_MAP=mix(vec3(.5,.5,1.),cover_sample(cover_normal,place.xz,forest).rgb,weights.x);
 NORMAL_MAP_DEPTH=.55;
 SPECULAR=.12;
}
