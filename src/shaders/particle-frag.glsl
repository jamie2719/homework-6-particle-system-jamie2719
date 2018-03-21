#version 300 es

#define M_PI 3.1415926535897932384626433832795

precision highp float;


in vec4 fs_Col;
in vec4 fs_Pos;

uniform float u_Time;

out vec4 out_Col;

void main()
{
    float dist = 1.0 - (length(fs_Pos.xyz) * 2.0);
    vec3 a = vec3(0.5, 0.3, 0.5);
    vec3 b = vec3(0.5, 0.8, 0.5);
    vec3 c = vec3(2.0, 1.0, 0.0);
    vec3 d = vec3(0.5, 0.2, 0.25);

  
    float r =  a.x + b.x * cos(2.0f * M_PI * (c.x * 2.0 * fs_Pos.x / (.4 * cos(u_Time * .01) + d.x)));
    float g =  a.y + b.y * cos(2.0f * M_PI * (c.y * 3.0 * fs_Pos.y / (.8 * cos(u_Time * .01) + d.y)));
    float b2 = a.z + b.z * cos(2.0f * M_PI * (c.z * 6.0 * fs_Pos.z / (.6 * cos(u_Time * .01) + d.z)));
 
    

    out_Col = vec4(dist) * vec4(r, g, b2, 1.0);


}
