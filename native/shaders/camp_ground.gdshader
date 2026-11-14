shader_type spatial;
#include "res://shaders/ground_light.gdshaderinc"
uniform sampler2D habitat : repeat_disable, filter_linear;
uniform sampler2D cover_albedo : source_color, repeat_enable, filter_linear_mipmap;
uniform sampler2D cover_normal : hint_normal, repeat_enable, filter_linear_mipmap;
uniform sampler2D cover_roughness : repeat_enable, filter_linear_mipmap;
varying vec3 place;
vec2 atlas_uv(float tile,vec2 uv){return vec2((fract(uv).x*.996+.002)*.5+tile*.5,fract(uv).y*.996+.002);}
vec4 cover_sample(sampler2D tex,vec2 a,vec2 b,float blend,float forest){
 // Most pixels belong wholly to one habitat. Avoid fetching the unused half
 // of every atlas; retain both samples across the actual habitat transition.
 vec2 da=dFdx(a)*vec2(.498,.996), ea=dFdy(a)*vec2(.498,.996);
 vec2 db=dFdx(b)*vec2(.498,.996), eb=dFdy(b)*vec2(.498,.996);
 if(forest<=0.) return mix(textureGrad(tex,atlas_uv(0.,a),da,ea),textureGrad(tex,atlas_uv(0.,b),db,eb),blend);
 if(forest>=1.) return mix(textureGrad(tex,atlas_uv(1.,a),da,ea),textureGrad(tex,atlas_uv(1.,b),db,eb),blend);
 return mix(mix(textureGrad(tex,atlas_uv(0.,a),da,ea),textureGrad(tex,atlas_uv(0.,b),db,eb),blend),mix(textureGrad(tex,atlas_uv(1.,a),da,ea),textureGrad(tex,atlas_uv(1.,b),db,eb),blend),forest);
}
void vertex(){place=(MODEL_MATRIX*vec4(VERTEX,1.)).xyz;}
void fragment(){
 vec2 weights=texture(habitat,(place.xz+250.)/500.).rg;
 float forest=smoothstep(.25,.8,weights.y);
 vec2 a=place.xz*.47;
 vec2 b=mat2(vec2(.819,.574),vec2(-.574,.819))*place.xz*.283+vec2(.37,.19);
 float blend=.34+.32*sin(place.x*.071+sin(place.z*.053));
 vec3 grain=cover_sample(cover_albedo,a,b,blend,forest).rgb/mix(vec3(.25,.32,.105),vec3(.17,.25,.085),forest);
 float soil=.86+.10*sin(place.x*33.7+place.z*19.3)*sin(place.z*71.3-place.x*51.7);
 ALBEDO=COLOR.rgb*mix(vec3(soil),clamp(grain,vec3(.34),vec3(1.45)),weights.x);
 // Lift living turf itself, without increasing exposure or whitening paths.
 vec3 fresh=min(ALBEDO*mix(1.75,1.20,forest)+vec3(.009,.024,.006)*(1.-forest*.7),vec3(.30,.42,.19));
 ALBEDO=mix(ALBEDO,fresh,weights.x);
 ROUGHNESS=mix(.96,cover_sample(cover_roughness,a,b,blend,forest).g,weights.x);
 NORMAL_MAP=mix(vec3(.5,.5,1.),cover_sample(cover_normal,a,b,blend,forest).rgb,weights.x);
 NORMAL_MAP_DEPTH=.55;
 SPECULAR=.12;
 vec3 contact=sanctuary_occlusion(place);
 AO=contact.r*contact.b*contact.g;
 AO_LIGHT_AFFECT=.45;
 // A restrained material fill approximates broad sky bounce in the meadow.
 // Texture variation and baked root/canopy shade remain visible in this term.
 EMISSION=ALBEDO*.16*weights.x*(1.-forest*.8)*contact.r*contact.b*contact.g;
}
