shader_type spatial;
render_mode cull_disabled;

global uniform float sanctuary_weather_time;
uniform vec4 tint : source_color = vec4(1.0);
uniform vec3 woodland_tone = vec3(1.0);
uniform bool leaf = false;
uniform bool bark = false;
uniform sampler2D bark_noise : repeat_enable, filter_linear_mipmap;
varying vec3 place;

void vertex() {
    place = (MODEL_MATRIX * vec4(VERTEX,1.0)).xyz;
    if (leaf) {
        float weight = smoothstep(.7,4.5,VERTEX.y);
        vec3 root = MODEL_MATRIX[3].xyz;
        VERTEX.x += sin(sanctuary_weather_time * .65 + root.x * .11 + root.z * .07) * .035 * weight;
    }
}

void fragment() {
    ALBEDO = tint.rgb * COLOR.rgb * woodland_tone;
    if (bark) {
        vec2 grain_uv = place.xz * .4 + vec2(place.y*.28,place.y*.31);
        float grain = texture(bark_noise,grain_uv).r;
        ALBEDO *= .65 + grain * .65;
    }
    ROUGHNESS = .93;
    SPECULAR = .1;
    if (leaf) {
        BACKLIGHT = ALBEDO * .22;
        RIM = .06;
        RIM_TINT = .8;
    }
}
