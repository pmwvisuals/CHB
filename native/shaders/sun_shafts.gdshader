shader_type spatial;
render_mode unshaded,blend_add,cull_disabled,depth_draw_never;
uniform vec4 ray_color : source_color = vec4(.95,.77,.46,.024);
void fragment(){
 float edge=pow(abs(dot(normalize(NORMAL),normalize(VIEW))),1.7);
 float ends=pow(max(sin(UV.y*PI),0.),1.6);
 float grain=.86+.14*sin(UV.y*49.+UV.x*12.);
 ALBEDO=ray_color.rgb;
 ALPHA=ray_color.a*edge*ends*grain;
}
