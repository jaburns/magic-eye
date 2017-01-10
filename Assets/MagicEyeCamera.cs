using UnityEngine;

public class MagicEyeCamera : MonoBehaviour
{
    [SerializeField] Shader _createPointerBuffer;
    [SerializeField] Shader _mainEffect;

    Material _createPointerBufferMat;
    Material _mainEffectMat;

    Camera _camera;

    void Awake ()
    {
        _camera = GetComponent<Camera>();
        _camera.depthTextureMode = DepthTextureMode.Depth;

        _createPointerBufferMat = new Material(_createPointerBuffer);
        _mainEffectMat = new Material(_mainEffect);
    }

    void OnRenderImage(RenderTexture source, RenderTexture destination)
    {
        var temp = RenderTexture.GetTemporary(source.width, source.height, 24, RenderTextureFormat.ARGBFloat);
        Graphics.Blit(source, temp, _createPointerBufferMat);
        Graphics.Blit(temp, destination, _mainEffectMat);
        RenderTexture.ReleaseTemporary(temp);
    }
}
