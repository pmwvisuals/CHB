shader_type sky;
render_mode disable_fog;

// Global animation leaves the cached sky lighting independent of cloud drift.
// No built-in clock/camera/light inputs or per-frame material uniform changes.
global uniform float sanctuary_weather_time;
uniform sampler2D cloud_banks : source_color, repeat_enable, filter_linear_mipmap;
uniform vec3 zenith_tint : source_color = vec3(.22,.46,.67);
uniform vec3 horizon_tint : source_color = vec3(.77,.83,.81);
uniform vec3 ground_tint : source_color = vec3(.23,.30,.24);
uniform vec3 key_direction = vec3(-.78,.40,-.48);
uniform float sun_radius : hint_range(.004,.020) = .0135;

void sky(){
 vec3 direction=normalize(EYEDIR);
 float elevation=max(direction.y,0.);
 vec3 color=mix(horizon_tint,zenith_tint,pow(elevation,.42));
 // Broad atmospheric warmth has no visible solar disc.
 float warmth=pow(max(dot(direction,normalize(key_direction)),0.),12.);
 color+=vec3(.055,.025,.008)*warmth*(1.-elevation*.35);
 if(direction.y<0.)color=mix(horizon_tint,ground_tint,pow(clamp(-direction.y*4.,0.,1.),.6));
 float phase=AT_CUBEMAP_PASS?0.:sanctuary_weather_time*.000018;
 vec2 uv=vec2(atan(direction.z,direction.x)/TAU+.5+phase,acos(clamp(direction.y,-1.,1.))/PI);
 vec4 cloud=texture(cloud_banks,uv);
 color=mix(color,cloud.rgb*.94,cloud.a*smoothstep(.015,.1,direction.y));
 float alignment=dot(direction,normalize(key_direction));
 float disc=smoothstep(cos(sun_radius*1.10),cos(sun_radius*.89),alignment);
 float halo=pow(max(alignment,0.),650.)*.055;
 color+=vec3(.70,.36,.10)*halo;
 // One modest, fixed western sun; clouds naturally occlude it.
 color=mix(color,vec3(1.,.76,.39),disc*(1.-cloud.a));
 COLOR=color;
}
