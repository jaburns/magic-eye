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

            float4 frag(v2f inp) : SV_Target
            {
                float4 col = tex2D(_MainTex, inp.uv);
                return float4(col.r, 0, 0, 1);
            }
            ENDCG
        }
    }
}
