shader_type spatial;
render_mode unshaded, blend_mix, depth_draw_never, cull_disabled;

uniform sampler2D flame_atlas : source_color, filter_linear_mipmap, repeat_disable;
uniform float fire_time = 0.0;
varying float tongue_seed;
varying float flame_height;

float hash(vec2 p) {
    vec3 q = fract(vec3(p.xyx) * .1031);
    q += dot(q, q.yzx + 33.33);
    return fract((q.x + q.y) * q.z);
}

float flow(vec2 p) {
    vec2 cell = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(cell), hash(cell + vec2(1,0)), f.x),
               mix(hash(cell + vec2(0,1)), hash(cell + vec2(1,1)), f.x), f.y);
}

void vertex() {
    tongue_seed = hash(COLOR.rg * 91.7) * 19.0;
    flame_height = clamp(VERTEX.y / 2.8, 0.0, 1.0);
    float root_lock = smoothstep(.04,.8,flame_height);
    float phase = fire_time * 4.1 + tongue_seed;
    float curl = sin(phase - VERTEX.y * 3.4) * .17
               + sin(fire_time * 7.3 + tongue_seed * 2.0 - VERTEX.y * 5.2) * .06;
    VERTEX.x += curl * root_lock;
    VERTEX.z += cos(phase * .83 - VERTEX.y * 2.7) * .16 * root_lock;
    VERTEX.y += (sin(fire_time * 3.7 + tongue_seed) * .23
               + sin(fire_time * 6.1 + tongue_seed * 1.4) * .09) * root_lock;
}

void fragment() {
    vec2 span = max(COLOR.ba, vec2(.0001));
    vec2 local = (UV - COLOR.rg) / span;
    vec2 rising = vec2(local.x * 3.5 + tongue_seed, local.y * 5.0 + fire_time * 2.2);
    float eddy = flow(rising);
    float fine = flow(rising * 1.9 + vec2(4.2,fire_time * .65));
    vec2 distorted = local + vec2((eddy-.5)*.13, (fine-.5)*.09) * (.35 + flame_height*.65);
    vec2 atlas_uv = COLOR.rg + clamp(distorted,vec2(.003),vec2(.997)) * span;
    vec4 flame = texture(flame_atlas, atlas_uv);
    float edge = smoothstep(0.0,.025,distorted.x) * (1.0-smoothstep(.975,1.0,distorted.x));
    edge *= smoothstep(0.0,.025,distorted.y) * (1.0-smoothstep(.975,1.0,distorted.y));
    float living_tip = mix(1.0, .60 + eddy*.40, flame_height);
    ALBEDO = flame.rgb * (1.95 + fine*.25);
    ALPHA = flame.a * edge * living_tip * .92;
}
