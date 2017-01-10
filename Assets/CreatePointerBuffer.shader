Shader "MagicEye/CreatePointerBuffer" {
    Properties {
        _MainTex ("Base (RGB)", 2D) = "" {}
    }

    SubShader {
        Pass {
            ZWrite Off
            ZTest Always
            Cull Off
            Fog { Mode Off }

            CGPROGRAM

            #include "UnityCG.cginc"
            #pragma vertex vert
            #pragma fragment frag

            #define DPI      72  // assuming output of 72 dots per inch
            #define EYE_SEP 180  // round(2.5 * DPI); // eye separation assumed to be 2.5 inches
            #define MU      0.5  // (1 / 2) depth of field

            struct v2f
            {
                float4 pos : SV_POSITION;
                half2 uv : TEXCOORD0;
            };

            uniform sampler2D_float _CameraDepthTexture;
            uniform sampler2D _MainTex;

            v2f vert(appdata_img v)
            {
                v2f o;
                o.pos = mul(UNITY_MATRIX_MVP, v.vertex);
                o.uv = v.texcoord.xy;
                
                return o;
            }

            // screenPos range is [0,1] on both axes
            float getDepth(float2 screenPos) 
            {
                return 1 - Linear01Depth(tex2Dproj(_CameraDepthTexture, UNITY_PROJ_COORD(
                    float4(screenPos.x, screenPos.y, 0, 1)
                )).r);
            }

            float4 frag(v2f inp) : SV_Target
            {
                float2 screenPixel = floor(_ScreenParams.xy * inp.uv);
                float ret = inp.uv.x;
                float xxx = 0;

                for (float it = -EYE_SEP / 4; it <= 0; it += 1) {
                    float i = screenPixel.x + it;
                    if (i < 0) continue;

                    float z = getDepth(float2(i / _ScreenParams.x, inp.uv.y));
                    float sep = round((1 - (MU * z)) * EYE_SEP / (2 - (MU * z)));
                    float left = round(i - sep / 2);
                    float right = left + sep;

                    if (left < 0) continue;
                    if (abs(right - screenPixel.x) > 0.00001) continue;

                    ret = left / _ScreenParams.x;
                    break;
                }

                return float4(ret, ret, ret, 1);
            }

            ENDCG
        }
    }
}
