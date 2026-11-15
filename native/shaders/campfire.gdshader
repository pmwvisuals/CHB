shader_type spatial;
render_mode unshaded, blend_mix, depth_draw_never, cull_disabled;

uniform sampler2D flame_atlas : source_color, filter_linear_mipmap, repeat_disable;
uniform float fire_time = 0.0;

void vertex() {
    float height_weight = clamp(VERTEX.y / 2.8, 0.0, 1.0);
    VERTEX.x += sin(fire_time * 1.8 + VERTEX.y * 2.4) * .07 * height_weight;
    VERTEX.z += cos(fire_time * 1.3 + VERTEX.x * 2.0) * .05 * height_weight;
}

void fragment() {
    vec4 flame = texture(flame_atlas, UV);
    ALBEDO = flame.rgb * 2.2;
    ALPHA = flame.a * .9;
}
