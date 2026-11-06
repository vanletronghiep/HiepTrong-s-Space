import * as THREE from 'three';
import { INITIAL_EARTH_YAW } from './home-journey';

export async function createEarthScene(
  canvas: HTMLCanvasElement,
  phone: boolean,
  signal: AbortSignal,
) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  });
  renderer.setPixelRatio(1);
  renderer.setClearColor(0, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100_000);
  camera.position.z = 20_000;
  const loader = new THREE.TextureLoader();
  const profile = phone || renderer.capabilities.maxTextureSize < 4096 ? '2k' : '4k';
  const results = await Promise.allSettled([
    loader.loadAsync(`/earth/earth-day-${profile}.webp`),
    loader.loadAsync(`/earth/earth-night-${profile}.webp`),
    loader.loadAsync(`/earth/earth-clouds-${profile}.webp`),
  ] as const);
  const [surfaceMap, lightMap, cloudMap] = results;
  if (
    signal.aborted ||
    surfaceMap.status !== 'fulfilled' ||
    lightMap.status !== 'fulfilled' ||
    cloudMap.status !== 'fulfilled'
  ) {
    for (const result of results) if (result.status === 'fulfilled') result.value.dispose();
    renderer.dispose();
    throw new Error('Earth textures unavailable');
  }
  const { value: day } = surfaceMap;
  const { value: night } = lightMap;
  const { value: clouds } = cloudMap;
  day.colorSpace = night.colorSpace = THREE.SRGBColorSpace;
  clouds.colorSpace = THREE.NoColorSpace;
  for (const map of [day, night, clouds]) {
    map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    map.wrapS = THREE.RepeatWrapping;
  }
  const geometry = new THREE.SphereGeometry(1, phone ? 96 : 192, phone ? 64 : 128);
  const vertexShader = `
    varying vec2 vUv;
    varying vec3 vNormal;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;
  const surfaceMaterial = new THREE.ShaderMaterial({
    uniforms: { uDay: { value: day }, uNight: { value: night } },
    vertexShader,
    fragmentShader: `
      uniform sampler2D uDay;
      uniform sampler2D uNight;
      varying vec2 vUv;
      varying vec3 vNormal;
      void main() {
        vec3 normal = normalize(vNormal);
        float facing = max(dot(normal, vec3(0.0, 0.0, 1.0)), 0.0);
        float shade = 0.45 + 0.55 * max(dot(normal, normalize(vec3(-0.7, 0.7, 0.6))), 0.0);
        vec3 surface = texture2D(uDay, vUv).rgb;
        float terrain = dot(surface, vec3(0.2126, 0.7152, 0.0722));
        vec3 base = vec3(0.001, 0.0025, 0.006) + terrain * vec3(0.014, 0.028, 0.048) * shade;
        vec3 night = texture2D(uNight, vUv).rgb;
        float lights = max(dot(night, vec3(0.2126, 0.7152, 0.0722)) - 0.004, 0.0);
        vec3 cities = vec3(1.0, 0.59, 0.19) * pow(lights, 0.86) * 2.7;
        float rim = pow(1.0 - facing, 5.2);
        vec3 color = base + cities + rim * vec3(0.016, 0.07, 0.14) * 0.65;
        gl_FragColor = vec4(color, 1.0);
        #include <colorspace_fragment>
      }
    `,
  });
  const cloudMaterial = new THREE.ShaderMaterial({
    uniforms: { uClouds: { value: clouds } },
    transparent: true,
    depthWrite: false,
    vertexShader,
    fragmentShader: `
      uniform sampler2D uClouds;
      varying vec2 vUv;
      varying vec3 vNormal;
      void main() {
        vec3 n = normalize(vNormal);
        float facing = max(n.z, 0.0);
        float mask = smoothstep(0.2, 0.9, texture2D(uClouds, vUv).r);
        float light = 0.2 + 0.8 * max(dot(n, normalize(vec3(-0.65, 0.7, 0.5))), 0.0);
        gl_FragColor = vec4(vec3(0.10, 0.145, 0.21) * light, mask * 0.24 * smoothstep(0.0, 0.22, facing));
        #include <colorspace_fragment>
      }
    `,
  });
  const atmosphereMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    vertexShader,
    fragmentShader: `
      varying vec3 vNormal;
      void main() {
        float facing = abs(normalize(vNormal).z);
        float edge = pow(1.0 - facing, 3.0) * smoothstep(0.0, 0.2, facing);
        gl_FragColor = vec4(vec3(0.12, 0.43, 0.8), edge * 0.45);
        #include <colorspace_fragment>
      }
    `,
  });
  const globe = new THREE.Group();
  const surface = new THREE.Mesh(geometry, surfaceMaterial);
  const cloudLayer = new THREE.Mesh(geometry, cloudMaterial);
  cloudLayer.scale.setScalar(1.003);
  const atmosphere = new THREE.Mesh(geometry, atmosphereMaterial);
  atmosphere.scale.setScalar(1.006);
  globe.add(surface, cloudLayer, atmosphere);
  globe.rotation.y = INITIAL_EARTH_YAW;
  scene.add(globe);

  function render(width: number, height: number, diameter: number, centerY: number, yaw: number) {
    if (canvas.width !== width || canvas.height !== height || camera.right !== width / 2) {
      renderer.setSize(width, height, false);
      camera.left = -width / 2;
      camera.right = width / 2;
      camera.top = height / 2;
      camera.bottom = -height / 2;
      camera.updateProjectionMatrix();
    }
    globe.rotation.y = yaw;
    globe.position.set(0, height / 2 - centerY, 0);
    globe.scale.setScalar(diameter / 2);
    renderer.render(scene, camera);
  }
  function dispose() {
    for (const texture of [day, night, clouds]) texture.dispose();
    for (const material of [surfaceMaterial, cloudMaterial, atmosphereMaterial]) material.dispose();
    geometry.dispose();
    renderer.dispose();
    // During Strict Mode's effect replay the same canvas remains attached.
    queueMicrotask(() => {
      if (!canvas.isConnected) renderer.forceContextLoss();
    });
  }
  return { render, dispose };
}
