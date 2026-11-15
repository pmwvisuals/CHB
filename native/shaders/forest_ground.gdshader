shader_type spatial;

uniform sampler2D habitat : filter_linear, repeat_disable;
uniform sampler2D soil_noise : filter_linear_mipmap, repeat_enable;
varying vec3 place;

void vertex() {
    place = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
}

void fragment() {
    vec4 field = texture(habitat, (place.xz + 360.0) / 720.0);
    float grain = texture(soil_noise, place.xz * .43).r;
    float fine = texture(soil_noise, place.xz * 2.3).r;
    vec3 soil = mix(vec3(.24,.19,.12), vec3(.19,.23,.11), field.b * .65);
    soil *= .83 + grain * .26 + fine * .12;
    ALBEDO = mix(soil, vec3(.36,.27,.16) * (.9 + grain * .16), field.r * .85);
    ROUGHNESS = .98;
    SPECULAR = .06;
    AO = mix(.72,1.0,field.g);
    AO_LIGHT_AFFECT = .25;
}
