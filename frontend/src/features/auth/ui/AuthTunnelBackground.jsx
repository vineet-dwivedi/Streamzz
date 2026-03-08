import { useEffect, useRef } from "react";
import * as THREE from "three";

const fragmentShader = `
vec4 abyssColor = vec4(0.0, 0.0, 0.0, 0.0);
vec4 tunnelColor = vec4(1.5, 1.2, 1.1, 1.0);

uniform float time;
uniform vec2 resolution;

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * resolution.xy) / resolution.y * 0.6;

  float r = length(uv);
  float y = fract(r / 0.005 / (r - 0.01) + time * 1.0);
  y = smoothstep(0.01, 4.0, y);

  float x = length(uv);
  x = smoothstep(0.5, 0.01, x);

  gl_FragColor = mix(tunnelColor, abyssColor, x) * y;
}
`;

const vertexShader = `
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

function AuthTunnelBackground() {
  const hostRef = useRef(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(75, 1, 1, 2);
    camera.position.z = 1;

    const geometry = new THREE.PlaneGeometry(10, 10);
    const uniforms = {
      time: { value: 1.0 },
      resolution: { value: new THREE.Vector2(1, 1) },
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.domElement.className = "auth-intro-canvas";
    host.appendChild(renderer.domElement);

    const startTime = performance.now();

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      uniforms.resolution.value.set(width, height);
      renderer.setSize(width, height, false);
    };

    const animate = (now) => {
      frameRef.current = requestAnimationFrame(animate);
      uniforms.time.value = (now - startTime) / 1000;
      renderer.render(scene, camera);
    };

    resize();
    frameRef.current = requestAnimationFrame(animate);
    window.addEventListener("resize", resize);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
      resizeObserver.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();

      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div className="auth-intro-bg" ref={hostRef} aria-hidden="true" />;
}

export default AuthTunnelBackground;
