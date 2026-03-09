import { useEffect, useRef } from "react";
import gsap from "gsap";
import * as THREE from "three";
import "./CinematicIntro.scss";

function CinematicIntro({ onEnter, onAuth }) {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const mountNode = canvasRef.current;

    if (!root || !mountNode) {
      return undefined;
    }

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    mountNode.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x090806, 0.036);

    const camera = new THREE.PerspectiveCamera(
      42,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 0.2, 12.5);

    const pointer = { x: 0, y: 0 };

    const backdropMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uPointer: { value: new THREE.Vector2(0, 0) },
      },
      vertexShader: `
        varying vec2 vUv;

        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec2 uPointer;
        varying vec2 vUv;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);

          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));

          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }

        void main() {
          vec2 uv = vUv * 2.0 - 1.0;
          vec2 driftUv = uv;
          driftUv.x += uPointer.x * 0.08;
          driftUv.y += uPointer.y * 0.04;

          float radial = 1.0 - smoothstep(0.05, 1.15, length(driftUv));
          float flow = sin(driftUv.y * 7.0 + uTime * 0.7 + driftUv.x * 3.5) * 0.5 + 0.5;
          float veil = noise(driftUv * 2.8 + vec2(0.0, uTime * 0.08));
          float halo = smoothstep(0.92, 0.16, abs(length(uv * vec2(0.86, 1.16)) - 0.52));
          float pulse = sin(uTime * 0.8) * 0.5 + 0.5;

          vec3 base = vec3(0.03, 0.025, 0.02);
          vec3 gold = vec3(0.82, 0.67, 0.34);
          vec3 frost = vec3(0.97, 0.94, 0.88);

          vec3 color = base;
          color += gold * radial * 0.18;
          color += gold * flow * veil * 0.08;
          color += frost * halo * (0.08 + pulse * 0.05);

          float vignette = smoothstep(1.35, 0.25, length(uv));
          color *= vignette;

          gl_FragColor = vec4(color, 0.96);
        }
      `,
    });

    const backdropMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(34, 22),
      backdropMaterial
    );
    backdropMesh.position.z = -11;
    scene.add(backdropMesh);

    const heroGroup = new THREE.Group();
    scene.add(heroGroup);

    const ambientLight = new THREE.AmbientLight(0xf5ead1, 0.46);
    const keyLight = new THREE.PointLight(0xe3bb61, 30, 28, 2);
    keyLight.position.set(3.6, 2.6, 8);
    const fillLight = new THREE.PointLight(0xffffff, 8, 26, 2);
    fillLight.position.set(-4.6, -1.8, 6);
    const baseLight = new THREE.PointLight(0xa67d34, 10, 22, 2);
    baseLight.position.set(0, -3.8, 2.8);
    scene.add(ambientLight, keyLight, fillLight, baseLight);

    const eclipseGroup = new THREE.Group();
    heroGroup.add(eclipseGroup);

    const eclipseCore = new THREE.Mesh(
      new THREE.SphereGeometry(1.92, 64, 64),
      new THREE.MeshPhysicalMaterial({
        color: 0x090807,
        roughness: 0.22,
        metalness: 0.18,
        clearcoat: 0.65,
        clearcoatRoughness: 0.22,
      })
    );
    eclipseGroup.add(eclipseCore);

    const shellMesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2.18, 6),
      new THREE.MeshPhysicalMaterial({
        color: 0xc9a84c,
        emissive: 0x5c4318,
        emissiveIntensity: 0.26,
        roughness: 0.28,
        metalness: 0.36,
        wireframe: true,
        transparent: true,
        opacity: 0.22,
      })
    );
    eclipseGroup.add(shellMesh);

    const haloRing = new THREE.Mesh(
      new THREE.TorusGeometry(2.56, 0.05, 20, 220),
      new THREE.MeshBasicMaterial({
        color: 0xf4e8c3,
        transparent: true,
        opacity: 0.82,
      })
    );
    haloRing.rotation.x = 1.08;
    haloRing.rotation.y = 0.32;
    eclipseGroup.add(haloRing);

    const innerRing = new THREE.Mesh(
      new THREE.TorusGeometry(2.12, 0.022, 18, 180),
      new THREE.MeshBasicMaterial({
        color: 0xdab76b,
        transparent: true,
        opacity: 0.74,
      })
    );
    innerRing.rotation.x = 0.22;
    innerRing.rotation.y = 0.98;
    eclipseGroup.add(innerRing);

    const pulseHalo = new THREE.Mesh(
      new THREE.SphereGeometry(2.9, 48, 48),
      new THREE.MeshBasicMaterial({
        color: 0xc9a84c,
        transparent: true,
        opacity: 0.05,
        side: THREE.BackSide,
      })
    );
    eclipseGroup.add(pulseHalo);

    const createSignalLoop = (radiusX, radiusY, tiltX, tiltY, opacity) => {
      const points = [];
      const total = 180;

      for (let index = 0; index <= total; index += 1) {
        const angle = (index / total) * Math.PI * 2;
        points.push(
          new THREE.Vector3(
            Math.cos(angle) * radiusX,
            Math.sin(angle) * radiusY,
            Math.sin(angle * 2.0) * 0.18
          )
        );
      }

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: 0xf2e5c0,
        transparent: true,
        opacity,
      });
      const line = new THREE.Line(geometry, material);
      line.rotation.x = tiltX;
      line.rotation.y = tiltY;
      return line;
    };

    const signalLoopA = createSignalLoop(3.5, 1.42, 1.16, 0.22, 0.62);
    const signalLoopB = createSignalLoop(3.15, 1.86, 0.34, 0.94, 0.28);
    const signalLoopC = createSignalLoop(2.7, 2.25, 0.82, -0.42, 0.18);
    heroGroup.add(signalLoopA, signalLoopB, signalLoopC);

    const shardGeometry = new THREE.PlaneGeometry(0.28, 0.86);
    const shardObjects = [];
    const shardCount = 12;

    for (let index = 0; index < shardCount; index += 1) {
      const pivot = new THREE.Group();
      const holder = new THREE.Group();
      const angle = (index / shardCount) * Math.PI * 2;
      const radius = 4.1 + (index % 3) * 0.42;

      pivot.rotation.x = (Math.random() - 0.5) * 1.2;
      pivot.rotation.y = angle;
      pivot.rotation.z = (Math.random() - 0.5) * 0.7;

      holder.position.x = radius;
      holder.position.y = (Math.random() - 0.5) * 0.6;

      const shard = new THREE.Mesh(
        shardGeometry,
        new THREE.MeshBasicMaterial({
          color: index % 2 === 0 ? 0xf8eecf : 0xcaa552,
          transparent: true,
          opacity: index % 2 === 0 ? 0.5 : 0.24,
          side: THREE.DoubleSide,
        })
      );
      shard.rotation.y = Math.PI / 2;
      shard.rotation.z = (Math.random() - 0.5) * 0.34;

      const shardEdge = new THREE.LineSegments(
        new THREE.EdgesGeometry(shardGeometry),
        new THREE.LineBasicMaterial({
          color: 0xfbf5e6,
          transparent: true,
          opacity: 0.32,
        })
      );

      holder.add(shard, shardEdge);
      pivot.add(holder);
      heroGroup.add(pivot);

      shardObjects.push({
        pivot,
        holder,
        speed: 0.002 + Math.random() * 0.0024,
        drift: Math.random() * Math.PI * 2,
      });
    }

    const nodeGeometry = new THREE.SphereGeometry(0.09, 16, 16);
    const nodeMaterial = new THREE.MeshBasicMaterial({
      color: 0xf8f1db,
      transparent: true,
      opacity: 0.86,
    });
    const nodes = [];

    for (let index = 0; index < 7; index += 1) {
      const node = new THREE.Mesh(nodeGeometry, nodeMaterial.clone());
      const angle = (index / 7) * Math.PI * 2;
      const radius = 3.1 + (index % 2) * 0.55;
      node.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle * 1.4) * 1.2,
        Math.sin(angle) * 1.2
      );
      heroGroup.add(node);
      nodes.push({
        node,
        angle,
        radius,
        speed: 0.006 + index * 0.0006,
      });
    }

    const particleCount = 1400;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleScales = new Float32Array(particleCount);

    for (let index = 0; index < particleCount; index += 1) {
      const radius = 4.8 + Math.random() * 4.8;
      const angle = Math.random() * Math.PI * 2;
      const height = (Math.random() - 0.5) * 7.6;
      particlePositions[index * 3] = Math.cos(angle) * radius;
      particlePositions[index * 3 + 1] = height * 0.38;
      particlePositions[index * 3 + 2] = Math.sin(angle) * radius;
      particleScales[index] = 0.55 + Math.random() * 1.45;
    }

    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(particlePositions, 3)
    );
    particleGeometry.setAttribute(
      "aScale",
      new THREE.BufferAttribute(particleScales, 1)
    );

    const particleMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        attribute float aScale;
        uniform float uTime;
        varying float vScale;

        void main() {
          vec3 pos = position;
          float swirl = atan(pos.z, pos.x) + uTime * (0.08 + aScale * 0.01);
          float radius = length(pos.xz);
          pos.x = cos(swirl) * radius;
          pos.z = sin(swirl) * radius;
          pos.y += sin(uTime * 0.8 + radius * 0.35 + aScale) * 0.08;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = (aScale * 3.8) * (18.0 / -mvPosition.z);
          vScale = aScale;
        }
      `,
      fragmentShader: `
        varying float vScale;

        void main() {
          vec2 p = gl_PointCoord - 0.5;
          float dist = length(p);
          float alpha = smoothstep(0.52, 0.0, dist) * 0.82;
          vec3 color = mix(vec3(0.79, 0.63, 0.32), vec3(0.98, 0.95, 0.88), vScale * 0.26);
          gl_FragColor = vec4(color, alpha);
        }
      `,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    particles.rotation.x = 0.12;
    scene.add(particles);

    let frameId = 0;
    let time = 0;

    const animate = () => {
      frameId = window.requestAnimationFrame(animate);
      time += 0.01;

      backdropMaterial.uniforms.uTime.value = time;
      backdropMaterial.uniforms.uPointer.value.set(pointer.x, pointer.y);
      particleMaterial.uniforms.uTime.value = time;

      heroGroup.rotation.y += 0.0012;
      heroGroup.rotation.x += 0.0005;

      eclipseGroup.rotation.y += 0.0032;
      shellMesh.rotation.x -= 0.0014;
      shellMesh.rotation.y += 0.0022;
      haloRing.rotation.z += 0.003;
      innerRing.rotation.z -= 0.0024;
      signalLoopA.rotation.z += 0.0018;
      signalLoopB.rotation.z -= 0.0013;
      signalLoopC.rotation.y += 0.001;

      pulseHalo.scale.setScalar(1 + Math.sin(time * 1.4) * 0.03);
      pulseHalo.material.opacity = 0.04 + (Math.sin(time * 1.2) * 0.5 + 0.5) * 0.02;

      shardObjects.forEach((item, index) => {
        item.pivot.rotation.y += item.speed;
        item.holder.rotation.z = Math.sin(time * 1.4 + item.drift) * 0.4;
        item.holder.position.y = Math.sin(time * 1.6 + index * 0.8) * 0.28;
      });

      nodes.forEach((item, index) => {
        item.angle += item.speed;
        item.node.position.x = Math.cos(item.angle) * item.radius;
        item.node.position.z = Math.sin(item.angle) * item.radius;
        item.node.position.y = Math.sin(time * 1.5 + index) * 0.8;
      });

      particles.rotation.y -= 0.0007;
      particles.rotation.z += 0.0002;

      heroGroup.position.x += (pointer.x * 1.15 - heroGroup.position.x) * 0.035;
      heroGroup.position.y += (pointer.y * 0.72 - heroGroup.position.y) * 0.035;
      camera.position.x += (pointer.x * 0.75 - camera.position.x) * 0.028;
      camera.position.y += (pointer.y * 0.38 + 0.2 - camera.position.y) * 0.028;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    const handlePointerMove = (event) => {
      pointer.x = (event.clientX / window.innerWidth - 0.5) * 2.0;
      pointer.y = -((event.clientY / window.innerHeight - 0.5) * 2.0);
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    };

    const timeline = gsap.timeline({ defaults: { ease: "expo.out" } });
    timeline
      .fromTo(
        ".cinematic-intro__eyebrow",
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.55 }
      )
      .fromTo(
        ".cinematic-intro__title-line",
        { opacity: 0, yPercent: 115, rotateX: 28 },
        { opacity: 1, yPercent: 0, rotateX: 0, duration: 1, stagger: 0.08 },
        "-=0.18"
      )
      .fromTo(
        ".cinematic-intro__copy",
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.7 },
        "-=0.45"
      )
      .fromTo(
        ".cinematic-intro__rail",
        { opacity: 0, x: 30 },
        { opacity: 1, x: 0, duration: 0.65 },
        "-=0.5"
      )
      .fromTo(
        ".cinematic-intro__metric",
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.08 },
        "-=0.35"
      )
      .fromTo(
        ".cinematic-intro__actions > *",
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.55, stagger: 0.08 },
        "-=0.26"
      )
      .fromTo(
        heroGroup.scale,
        { x: 0.82, y: 0.82, z: 0.82 },
        { x: 1, y: 1, z: 1, duration: 1.2 },
        0.08
      )
      .fromTo(
        ".cinematic-intro__signal",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.55 },
        "-=0.45"
      );

    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    window.addEventListener("resize", handleResize);
    animate();

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("resize", handleResize);
      timeline.kill();

      scene.traverse((object) => {
        if (object.geometry) {
          object.geometry.dispose();
        }

        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });

      renderer.dispose();

      if (renderer.domElement.parentNode === mountNode) {
        mountNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <section ref={rootRef} className="cinematic-intro">
      <div className="cinematic-intro__canvas" ref={canvasRef} aria-hidden="true" />
      <div className="cinematic-intro__noise" aria-hidden="true" />
      <div className="cinematic-intro__veil cinematic-intro__veil--top" aria-hidden="true" />
      <div className="cinematic-intro__veil cinematic-intro__veil--side" aria-hidden="true" />

      <div className="cinematic-intro__layout">
        <div className="cinematic-intro__panel">
          <p className="cinematic-intro__eyebrow">Signal Archive 01</p>

          <h1 className="cinematic-intro__title" aria-label="Streamzz portal">
            <span className="cinematic-intro__title-line">Streamzz</span>
            <span className="cinematic-intro__title-line">Portal</span>
          </h1>

          <p className="cinematic-intro__copy">
            A cinematic workspace for discovery, history, favorites, and studio control. Built as a living archive, not a dashboard.
          </p>

          <div className="cinematic-intro__actions">
            <button type="button" className="cinematic-intro__primary" onClick={onEnter}>
              Enter Platform
            </button>
            <button type="button" className="cinematic-intro__secondary" onClick={onAuth}>
              Open Auth
            </button>
          </div>
        </div>

        <aside className="cinematic-intro__rail">
          <div className="cinematic-intro__signal">
            <span>Live Visual</span>
            <strong>Eclipse Engine</strong>
            <p>Multi-ring field with film shards and reactive signal loops.</p>
          </div>

          <div className="cinematic-intro__metrics" aria-label="Platform highlights">
            <div className="cinematic-intro__metric">
              <strong>Movies</strong>
              <span>Live discovery feed</span>
            </div>
            <div className="cinematic-intro__metric">
              <strong>History</strong>
              <span>Tracked across sessions</span>
            </div>
            <div className="cinematic-intro__metric">
              <strong>Studio</strong>
              <span>Admin-ready catalog panel</span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default CinematicIntro;
