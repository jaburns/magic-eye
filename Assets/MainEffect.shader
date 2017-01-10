Shader "MagicEye/MainEffect" {
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

            struct v2f
            {
                float4 pos : SV_POSITION;
                half2 uv : TEXCOORD0;
            };

            uniform sampler2D _MainTex;

            v2f vert(appdata_img v)
            {
                v2f o;
                o.pos = mul(UNITY_MATRIX_MVP, v.vertex);
                o.uv = v.texcoord.xy;
                return o;
            }

            float4 originalColor(float2 screenPixel) 
            {
                float col = (((511+screenPixel.x) * (571+screenPixel.y)) % 1000) / 1000;
                return float4(col, col, col, 1);
            }

            float4 frag(v2f inp) : SV_Target
            {
                float2 screenPixel = floor(_ScreenParams.xy * inp.uv);

                float ox = screenPixel.x;
                for (float i = 0; i < 20; i += 1) {
                    float sample = floor(_ScreenParams.x * tex2D(_MainTex, float2(ox / _ScreenParams.x, inp.uv.y)).r);
                    if (abs(ox - sample) < 0.1) break;
                    ox = sample;
                }

                return originalColor(float2(ox, screenPixel.y));
            }

            ENDCG
        }
    }
}
