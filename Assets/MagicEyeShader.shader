Shader "Unlit/MagicEyeShader" {
    Properties {
        _MainTex ("Base (RGB)", 2D) = "" {}
    }

    SubShader {
        Pass {
            CGPROGRAM
            #include "UnityCG.cginc"
            #pragma vertex vert
            #pragma fragment frag

            struct v2f
            {
                float4 pos : SV_POSITION;
                half2 uv : TEXCOORD0;
                float4 scrPos : TEXCOORD1;
            };

            uniform sampler2D_float _CameraDepthTexture;
            uniform sampler2D _MainTex;

            v2f vert(appdata_img v)
            {
                v2f o;
                o.pos = mul(UNITY_MATRIX_MVP, v.vertex);
                o.uv = v.texcoord.xy;
                o.scrPos = ComputeScreenPos(o.pos);
                return o;
            }

            float4 frag(v2f i) : SV_Target
            {
                float sceneDepth = Linear01Depth(tex2Dproj(_CameraDepthTexture, UNITY_PROJ_COORD(i.scrPos)).r);
                return float4(sceneDepth, sceneDepth, sceneDepth, 1);
            }
            ENDCG
        }
    }
}
