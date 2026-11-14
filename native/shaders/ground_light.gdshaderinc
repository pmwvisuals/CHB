uniform sampler2D ground_light : repeat_disable, filter_linear;
vec3 sanctuary_occlusion(vec3 p){
 vec4 field=texture(ground_light,(p.xz+224.)/448.);
 float height=field.a*32.-4.;
 float near_ground=1.-smoothstep(.2,1.8,p.y-height);
 float under_canopy=1.-smoothstep(2.,7.,p.y-height);
 return vec3(mix(1.,field.r,near_ground),mix(1.,field.g,under_canopy),mix(1.,field.b,under_canopy));
}
