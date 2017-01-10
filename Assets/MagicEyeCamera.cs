using UnityEngine;
using System.Collections;

public class MagicEyeCamera : MonoBehaviour
{
    [SerializeField] Shader _shader;

    Material _material;
    Camera _camera;

    void Awake ()
    {
        _camera = GetComponent<Camera>();
        _camera.depthTextureMode = DepthTextureMode.Depth;

        _material = new Material(_shader);
    }

    void OnRenderImage(RenderTexture source, RenderTexture destination)
    {
        Graphics.Blit(source, destination, _material);
    }
}
