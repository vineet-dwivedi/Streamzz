import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";
import { Pane } from "tweakpane";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { PATHS } from "@/app/router/routeConfig";
import "./GhostIntro.scss";

const fluorescentColors = {
  cyan: 0x00ffff,
  lime: 0x00ff00,
  magenta: 0xff00ff,
  yellow: 0xffff00,
  orange: 0xff4500,
  pink: 0xff1493,
  purple: 0x9400d3,
  blue: 0x0080ff,
  green: 0x00ff80,
  red: 0xff0040,
  teal: 0x00ffaa,
  violet: 0x8a2be2,
};

function GhostIntro() {
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const canEnterRef = useRef(false);
  const isExitingRef = useRef(false);
  const exitTimerRef = useRef(null);
  const preloaderRef = useRef(null);
  const contentRef = useRef(null);
  const progressBarRef = useRef(null);
  const canvasHostRef = useRef(null);
  const paneHostRef = useRef(null);

  const handleEnter = () => {
    if (!canEnterRef.current || isExitingRef.current) {
      return;
    }

    isExitingRef.current = true;
    if (rootRef.current) {
      rootRef.current.classList.add("is-exiting");
    }

    exitTimerRef.current = setTimeout(() => {
      navigate(PATHS.AUTH, { replace: true });
    }, 760);
  };

  useEffect(() => {
    const preloaderEl = preloaderRef.current;
    const contentEl = contentRef.current;
    const progressBarEl = progressBarRef.current;
    const canvasHost = canvasHostRef.current;
    const paneHost = paneHostRef.current;

    if (!preloaderEl || !contentEl || !progressBarEl || !canvasHost || !paneHost) {
      return undefined;
    }

    canEnterRef.current = false;
    isExitingRef.current = false;

    class PreloaderManager {
      constructor() {
        this.loadingSteps = 0;
        this.totalSteps = 5;
        this.isComplete = false;
      }

      updateProgress(step) {
        this.loadingSteps = Math.min(step, this.totalSteps);
        const percentage = (this.loadingSteps / this.totalSteps) * 100;
        progressBarEl.style.width = `${percentage}%`;
      }

      complete(canvas) {
        if (this.isComplete) {
          return;
        }
        this.isComplete = true;
        this.updateProgress(this.totalSteps);

        setTimeout(() => {
          preloaderEl.classList.add("fade-out");
          contentEl.classList.add("fade-in");
          canvas.classList.add("fade-in");

          setTimeout(() => {
            preloaderEl.style.display = "none";
            canEnterRef.current = true;
            if (rootRef.current) {
              rootRef.current.classList.add("ready-to-enter");
            }
          }, 1000);
        }, 1500);
      }
    }

    const preloader = new PreloaderManager();

    const oldBodyStyles = {
      overflow: document.body.style.overflow,
      transform: document.body.style.transform,
      backfaceVisibility: document.body.style.backfaceVisibility,
      perspective: document.body.style.perspective,
    };

    document.body.style.overflow = "hidden";
    document.body.style.transform = "translateZ(0)";
    document.body.style.backfaceVisibility = "hidden";
    document.body.style.perspective = "1000px";

    preloader.updateProgress(1);

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 20;

    preloader.updateProgress(2);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      alpha: true,
      premultipliedAlpha: false,
      stencil: false,
      depth: true,
      preserveDrawingBuffer: false,
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.classList.add("ghost-canvas");
    canvasHost.appendChild(renderer.domElement);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.3,
      1.25,
      0.0
    );
    composer.addPass(bloomPass);

    preloader.updateProgress(3);

    const analogDecayShader = {
      uniforms: {
        tDiffuse: { value: null },
        uTime: { value: 0.0 },
        uResolution: {
          value: new THREE.Vector2(window.innerWidth, window.innerHeight),
        },
        uAnalogGrain: { value: 0.4 },
        uAnalogBleeding: { value: 1.0 },
        uAnalogVSync: { value: 1.0 },
        uAnalogScanlines: { value: 1.0 },
        uAnalogVignette: { value: 1.0 },
        uAnalogJitter: { value: 0.4 },
        uAnalogIntensity: { value: 0.6 },
        uLimboMode: { value: 0.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float uTime;
        uniform vec2 uResolution;
        uniform float uAnalogGrain;
        uniform float uAnalogBleeding;
        uniform float uAnalogVSync;
        uniform float uAnalogScanlines;
        uniform float uAnalogVignette;
        uniform float uAnalogJitter;
        uniform float uAnalogIntensity;
        uniform float uLimboMode;
        
        varying vec2 vUv;
        
        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
        }
        
        float gaussian(float z, float u, float o) {
          return (1.0 / (o * sqrt(2.0 * 3.1415))) * exp(-(((z - u) * (z - u)) / (2.0 * (o * o))));
        }
        
        vec3 grain(vec2 uv, float time, float intensity) {
          float seed = dot(uv, vec2(12.9898, 78.233));
          float noise = fract(sin(seed) * 43758.5453 + time * 2.0);
          noise = gaussian(noise, 0.0, 0.5 * 0.5);
          return vec3(noise) * intensity;
        }
        
        void main() {
          vec2 uv = vUv;
          float time = uTime * 1.8;
          
          vec2 jitteredUV = uv;
          if (uAnalogJitter > 0.01) {
            float jitterAmount = (random(vec2(floor(time * 60.0))) - 0.5) * 0.003 * uAnalogJitter * uAnalogIntensity;
            jitteredUV.x += jitterAmount;
            jitteredUV.y += (random(vec2(floor(time * 30.0) + 1.0)) - 0.5) * 0.001 * uAnalogJitter * uAnalogIntensity;
          }
          
          if (uAnalogVSync > 0.01) {
            float vsyncRoll = sin(time * 2.0 + uv.y * 100.0) * 0.02 * uAnalogVSync * uAnalogIntensity;
            float vsyncChance = step(0.95, random(vec2(floor(time * 4.0))));
            jitteredUV.y += vsyncRoll * vsyncChance;
          }
          
          vec4 color = texture2D(tDiffuse, jitteredUV);
          
          if (uAnalogBleeding > 0.01) {
            float bleedAmount = 0.012 * uAnalogBleeding * uAnalogIntensity;
            float offsetPhase = time * 1.5 + uv.y * 20.0;
            
            vec2 redOffset = vec2(sin(offsetPhase) * bleedAmount, 0.0);
            vec2 blueOffset = vec2(-sin(offsetPhase * 1.1) * bleedAmount * 0.8, 0.0);
            
            float r = texture2D(tDiffuse, jitteredUV + redOffset).r;
            float g = texture2D(tDiffuse, jitteredUV).g;
            float b = texture2D(tDiffuse, jitteredUV + blueOffset).b;
            color = vec4(r, g, b, color.a);
          }
          
          if (uAnalogGrain > 0.01) {
            vec3 grainEffect = grain(uv, time, 0.075 * uAnalogGrain * uAnalogIntensity);
            grainEffect *= (1.0 - color.rgb);
            color.rgb += grainEffect;
          }
          
          if (uAnalogScanlines > 0.01) {
            float scanlineFreq = 600.0 + uAnalogScanlines * 400.0;
            float scanlinePattern = sin(uv.y * scanlineFreq) * 0.5 + 0.5;
            float scanlineIntensity = 0.1 * uAnalogScanlines * uAnalogIntensity;
            color.rgb *= (1.0 - scanlinePattern * scanlineIntensity);
          }
          
          if (uAnalogVignette > 0.01) {
            vec2 vignetteUV = (uv - 0.5) * 2.0;
            float vignette = 1.0 - dot(vignetteUV, vignetteUV) * 0.3 * uAnalogVignette * uAnalogIntensity;
            color.rgb *= vignette;
          }
          
          if (uLimboMode > 0.5) {
            float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
            color.rgb = vec3(gray);
          }
          
          gl_FragColor = color;
        }
      `,
    };

    const analogDecayPass = new ShaderPass(analogDecayShader);
    composer.addPass(analogDecayPass);
    composer.addPass(new OutputPass());

    const params = {
      bodyColor: 0x0f2027,
      glowColor: "orange",
      eyeGlowColor: "green",
      ghostOpacity: 0.88,
      ghostScale: 2.4,
      emissiveIntensity: 5.8,
      pulseSpeed: 1.6,
      pulseIntensity: 0.6,
      eyeGlowDecay: 0.95,
      eyeGlowResponse: 0.31,
      rimLightIntensity: 1.8,
      followSpeed: 0.075,
      wobbleAmount: 0.35,
      floatSpeed: 1.6,
      movementThreshold: 0.07,
      particleCount: 250,
      particleDecayRate: 0.005,
      particleColor: "orange",
      createParticlesOnlyWhenMoving: true,
      particleCreationRate: 5,
      revealRadius: 43,
      fadeStrength: 2.2,
      baseOpacity: 0.35,
      revealOpacity: 0.0,
      fireflyGlowIntensity: 2.6,
      fireflySpeed: 0.04,
      analogIntensity: 0.6,
      analogGrain: 0.4,
      analogBleeding: 1.0,
      analogVSync: 1.0,
      analogScanlines: 1.0,
      analogVignette: 1.0,
      analogJitter: 0.4,
      limboMode: false,
    };

    const atmosphereGeometry = new THREE.PlaneGeometry(300, 300);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      uniforms: {
        ghostPosition: { value: new THREE.Vector3(0, 0, 0) },
        revealRadius: { value: params.revealRadius },
        fadeStrength: { value: params.fadeStrength },
        baseOpacity: { value: params.baseOpacity },
        revealOpacity: { value: params.revealOpacity },
        time: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vWorldPosition;
        void main() {
          vUv = uv;
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 ghostPosition;
        uniform float revealRadius;
        uniform float fadeStrength;
        uniform float baseOpacity;
        uniform float revealOpacity;
        uniform float time;
        varying vec2 vUv;
        varying vec3 vWorldPosition;
        
        void main() {
          float dist = distance(vWorldPosition.xy, ghostPosition.xy);
          float dynamicRadius = revealRadius + sin(time * 2.0) * 5.0;
          float reveal = smoothstep(dynamicRadius * 0.2, dynamicRadius, dist);
          reveal = pow(reveal, fadeStrength);
          float opacity = mix(revealOpacity, baseOpacity, reveal);
          gl_FragColor = vec4(0.001, 0.001, 0.002, opacity);
        }
      `,
      transparent: true,
      depthWrite: false,
    });

    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    atmosphere.position.z = -50;
    atmosphere.renderOrder = -100;
    scene.add(atmosphere);

    scene.add(new THREE.AmbientLight(0x0a0a2e, 0.08));

    const ghostGroup = new THREE.Group();
    scene.add(ghostGroup);

    const ghostGeometry = new THREE.SphereGeometry(2, 40, 40);
    const positionAttribute = ghostGeometry.getAttribute("position");
    const positions = positionAttribute.array;

    for (let i = 0; i < positions.length; i += 3) {
      if (positions[i + 1] < -0.2) {
        const x = positions[i];
        const z = positions[i + 2];
        const noise1 = Math.sin(x * 5) * 0.35;
        const noise2 = Math.cos(z * 4) * 0.25;
        const noise3 = Math.sin((x + z) * 3) * 0.15;
        positions[i + 1] = -2.0 + noise1 + noise2 + noise3;
      }
    }
    ghostGeometry.computeVertexNormals();

    const ghostMaterial = new THREE.MeshStandardMaterial({
      color: params.bodyColor,
      transparent: true,
      opacity: params.ghostOpacity,
      emissive: fluorescentColors[params.glowColor],
      emissiveIntensity: params.emissiveIntensity,
      roughness: 0.02,
      metalness: 0.0,
      side: THREE.DoubleSide,
      alphaTest: 0.1,
    });

    const ghostBody = new THREE.Mesh(ghostGeometry, ghostMaterial);
    ghostBody.scale.setScalar(params.ghostScale);
    ghostGroup.add(ghostBody);

    const rimLight1 = new THREE.DirectionalLight(0x4a90e2, params.rimLightIntensity);
    rimLight1.position.set(-8, 6, -4);
    scene.add(rimLight1);

    const rimLight2 = new THREE.DirectionalLight(0x50e3c2, params.rimLightIntensity * 0.7);
    rimLight2.position.set(8, -4, -6);
    scene.add(rimLight2);

    preloader.updateProgress(4);

    const eyeGroup = new THREE.Group();
    ghostGroup.add(eyeGroup);

    const socketGeometry = new THREE.SphereGeometry(0.45, 16, 16);
    const socketMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const leftSocket = new THREE.Mesh(socketGeometry, socketMaterial);
    leftSocket.position.set(-0.7, 0.6, 1.9);
    leftSocket.scale.set(1.1, 1.0, 0.6);
    eyeGroup.add(leftSocket);

    const rightSocket = new THREE.Mesh(socketGeometry, socketMaterial);
    rightSocket.position.set(0.7, 0.6, 1.9);
    rightSocket.scale.set(1.1, 1.0, 0.6);
    eyeGroup.add(rightSocket);

    const eyeGeometry = new THREE.SphereGeometry(0.3, 12, 12);
    const leftEyeMaterial = new THREE.MeshBasicMaterial({
      color: fluorescentColors[params.eyeGlowColor],
      transparent: true,
      opacity: 0,
    });
    const rightEyeMaterial = leftEyeMaterial.clone();

    const leftEye = new THREE.Mesh(eyeGeometry, leftEyeMaterial);
    leftEye.position.set(-0.7, 0.6, 2.0);
    eyeGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, rightEyeMaterial);
    rightEye.position.set(0.7, 0.6, 2.0);
    eyeGroup.add(rightEye);

    const outerGlowGeometry = new THREE.SphereGeometry(0.525, 12, 12);
    const leftOuterGlowMaterial = new THREE.MeshBasicMaterial({
      color: fluorescentColors[params.eyeGlowColor],
      transparent: true,
      opacity: 0,
      side: THREE.BackSide,
    });
    const rightOuterGlowMaterial = leftOuterGlowMaterial.clone();

    const leftOuterGlow = new THREE.Mesh(outerGlowGeometry, leftOuterGlowMaterial);
    leftOuterGlow.position.set(-0.7, 0.6, 1.95);
    eyeGroup.add(leftOuterGlow);

    const rightOuterGlow = new THREE.Mesh(outerGlowGeometry, rightOuterGlowMaterial);
    rightOuterGlow.position.set(0.7, 0.6, 1.95);
    eyeGroup.add(rightOuterGlow);

    const fireflyGroup = new THREE.Group();
    scene.add(fireflyGroup);
    const fireflies = [];

    for (let i = 0; i < 20; i += 1) {
      const fireflyGeometry = new THREE.SphereGeometry(0.02, 2, 2);
      const fireflyMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff44,
        transparent: true,
        opacity: 0.9,
      });
      const firefly = new THREE.Mesh(fireflyGeometry, fireflyMaterial);
      firefly.position.set(
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 20
      );

      const glowGeometry = new THREE.SphereGeometry(0.08, 8, 8);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff88,
        transparent: true,
        opacity: 0.4,
        side: THREE.BackSide,
      });

      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      firefly.add(glow);

      const fireflyLight = new THREE.PointLight(0xffff44, 0.8, 3, 2);
      firefly.add(fireflyLight);

      firefly.userData = {
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * params.fireflySpeed,
          (Math.random() - 0.5) * params.fireflySpeed,
          (Math.random() - 0.5) * params.fireflySpeed
        ),
        phase: Math.random() * Math.PI * 2,
        pulseSpeed: 2 + Math.random() * 3,
        glowMaterial,
        fireflyMaterial,
        light: fireflyLight,
      };

      fireflyGroup.add(firefly);
      fireflies.push(firefly);
    }

    const particleGroup = new THREE.Group();
    scene.add(particleGroup);
    const particles = [];
    const particlePool = [];
    const particleGeometries = [
      new THREE.SphereGeometry(0.05, 6, 6),
      new THREE.TetrahedronGeometry(0.04, 0),
      new THREE.OctahedronGeometry(0.045, 0),
    ];

    const particleBaseMaterial = new THREE.MeshBasicMaterial({
      color: fluorescentColors[params.particleColor],
      transparent: true,
      opacity: 0,
      alphaTest: 0.1,
    });

    const initParticlePool = (count) => {
      for (let i = 0; i < count; i += 1) {
        const geometry = particleGeometries[Math.floor(Math.random() * particleGeometries.length)];
        const material = particleBaseMaterial.clone();
        const particle = new THREE.Mesh(geometry, material);
        particle.visible = false;
        particleGroup.add(particle);
        particlePool.push(particle);
      }
    };
    initParticlePool(100);

    const createParticle = () => {
      let particle;
      if (particlePool.length > 0) {
        particle = particlePool.pop();
        particle.visible = true;
      } else if (particles.length < params.particleCount) {
        const geometry = particleGeometries[Math.floor(Math.random() * particleGeometries.length)];
        const material = particleBaseMaterial.clone();
        particle = new THREE.Mesh(geometry, material);
        particleGroup.add(particle);
      } else {
        return null;
      }

      const particleColor = new THREE.Color(fluorescentColors[params.particleColor]);
      particleColor.offsetHSL(Math.random() * 0.1 - 0.05, 0, 0);
      particle.material.color = particleColor;

      particle.position.copy(ghostGroup.position);
      particle.position.z -= 0.8 + Math.random() * 0.6;
      particle.position.x += (Math.random() - 0.5) * 3.5;
      particle.position.y += (Math.random() - 0.5) * 3.5 - 0.8;

      const sizeVariation = 0.6 + Math.random() * 0.7;
      particle.scale.set(sizeVariation, sizeVariation, sizeVariation);
      particle.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);

      particle.userData.life = 1.0;
      particle.userData.decay = Math.random() * 0.003 + params.particleDecayRate;
      particle.userData.rotationSpeed = {
        x: (Math.random() - 0.5) * 0.015,
        y: (Math.random() - 0.5) * 0.015,
        z: (Math.random() - 0.5) * 0.015,
      };
      particle.userData.velocity = {
        x: (Math.random() - 0.5) * 0.012,
        y: (Math.random() - 0.5) * 0.012 - 0.002,
        z: (Math.random() - 0.5) * 0.012 - 0.006,
      };

      particle.material.opacity = Math.random() * 0.9;
      particles.push(particle);
      return particle;
    };

    const pane = new Pane({
      title: "Spectral Ghost",
      expanded: false,
      container: paneHost,
    });

    const glowFolder = pane.addFolder({ title: "Glow", expanded: true });
    glowFolder.addBinding(params, "glowColor", {
      options: {
        Cyan: "cyan",
        Lime: "lime",
        Magenta: "magenta",
        Yellow: "yellow",
        Orange: "orange",
        Pink: "pink",
        Purple: "purple",
        Blue: "blue",
        Green: "green",
        Red: "red",
        Teal: "teal",
        Violet: "violet",
      },
    }).on("change", (ev) => {
      ghostMaterial.emissive.set(fluorescentColors[ev.value]);
    });

    glowFolder.addBinding(params, "emissiveIntensity", { min: 1, max: 10, step: 0.1 }).on("change", (ev) => {
      ghostMaterial.emissiveIntensity = ev.value;
    });

    const analogFolder = pane.addFolder({ title: "Analog", expanded: false });
    analogFolder.addBinding(params, "limboMode").on("change", (ev) => {
      analogDecayPass.uniforms.uLimboMode.value = ev.value ? 1 : 0;
    });
    analogFolder.addBinding(params, "analogIntensity", { min: 0, max: 2, step: 0.1 }).on("change", (ev) => {
      analogDecayPass.uniforms.uAnalogIntensity.value = ev.value;
    });

    const mouse = new THREE.Vector2();
    const prevMouse = new THREE.Vector2();
    const mouseSpeed = new THREE.Vector2();
    let isMouseMoving = false;
    let mouseMovementTimer = null;
    let resizeTimeout = null;
    let lastMouseUpdate = 0;
    let lastParticleTime = 0;
    let time = 0;
    let currentMovement = 0;
    let lastFrameTime = 0;
    let frameCount = 0;
    let isInitialized = false;
    let animationFrameId = 0;

    const onResize = () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      resizeTimeout = setTimeout(() => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
        bloomPass.setSize(window.innerWidth, window.innerHeight);
        analogDecayPass.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
      }, 200);
    };

    const onMouseMove = (event) => {
      const now = performance.now();
      if (now - lastMouseUpdate < 16) {
        return;
      }

      prevMouse.x = mouse.x;
      prevMouse.y = mouse.y;
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      mouseSpeed.x = mouse.x - prevMouse.x;
      mouseSpeed.y = mouse.y - prevMouse.y;
      isMouseMoving = true;

      if (mouseMovementTimer) {
        clearTimeout(mouseMovementTimer);
      }
      mouseMovementTimer = setTimeout(() => {
        isMouseMoving = false;
      }, 80);

      lastMouseUpdate = now;
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMouseMove);

    const animate = (timestamp) => {
      animationFrameId = requestAnimationFrame(animate);
      if (!isInitialized) {
        return;
      }

      const deltaTime = timestamp - lastFrameTime;
      lastFrameTime = timestamp;
      if (deltaTime > 100) {
        return;
      }

      const timeIncrement = (deltaTime / 16.67) * 0.01;
      time += timeIncrement;
      frameCount += 1;

      atmosphereMaterial.uniforms.time.value = time;
      atmosphereMaterial.uniforms.ghostPosition.value.copy(ghostGroup.position);
      analogDecayPass.uniforms.uTime.value = time;

      const targetX = mouse.x * 11;
      const targetY = mouse.y * 7;
      const prevGhostPosition = ghostGroup.position.clone();

      ghostGroup.position.x += (targetX - ghostGroup.position.x) * params.followSpeed;
      ghostGroup.position.y += (targetY - ghostGroup.position.y) * params.followSpeed;

      const movementAmount = prevGhostPosition.distanceTo(ghostGroup.position);
      currentMovement = currentMovement * params.eyeGlowDecay + movementAmount * (1 - params.eyeGlowDecay);

      ghostGroup.position.y += Math.sin(time * params.floatSpeed * 1.5) * 0.03;

      const pulse1 = Math.sin(time * params.pulseSpeed) * params.pulseIntensity;
      ghostMaterial.emissiveIntensity = params.emissiveIntensity + pulse1 + Math.sin(time * 0.6) * 0.12;

      fireflies.forEach((firefly) => {
        const data = firefly.userData;
        const pulse = Math.sin((time + data.phase) * data.pulseSpeed) * 0.4 + 0.6;
        data.glowMaterial.opacity = params.fireflyGlowIntensity * 0.4 * pulse;
        data.fireflyMaterial.opacity = params.fireflyGlowIntensity * 0.9 * pulse;
        data.light.intensity = params.fireflyGlowIntensity * 0.8 * pulse;

        data.velocity.x += (Math.random() - 0.5) * 0.001;
        data.velocity.y += (Math.random() - 0.5) * 0.001;
        data.velocity.z += (Math.random() - 0.5) * 0.001;
        data.velocity.clampLength(0, params.fireflySpeed);
        firefly.position.add(data.velocity);
      });

      const eyeTarget = currentMovement > params.movementThreshold ? 1 : 0;
      const eyeSpeed =
        currentMovement > params.movementThreshold
          ? params.eyeGlowResponse * 2
          : params.eyeGlowResponse;
      const eyeOpacity = leftEyeMaterial.opacity + (eyeTarget - leftEyeMaterial.opacity) * eyeSpeed;

      leftEyeMaterial.opacity = eyeOpacity;
      rightEyeMaterial.opacity = eyeOpacity;
      leftOuterGlowMaterial.opacity = eyeOpacity * 0.3;
      rightOuterGlowMaterial.opacity = eyeOpacity * 0.3;

      const normalizedMouseSpeed = Math.sqrt(mouseSpeed.x * mouseSpeed.x + mouseSpeed.y * mouseSpeed.y) * 8;
      const shouldCreateParticles = params.createParticlesOnlyWhenMoving
        ? currentMovement > 0.005 && isMouseMoving
        : currentMovement > 0.005;

      if (shouldCreateParticles && timestamp - lastParticleTime > 100) {
        const speedRate = Math.floor(normalizedMouseSpeed * 3);
        const particleRate = Math.min(params.particleCreationRate, Math.max(1, speedRate));
        for (let i = 0; i < particleRate; i += 1) {
          createParticle();
        }
        lastParticleTime = timestamp;
      }

      const particlesToUpdate = Math.min(particles.length, 60);
      for (let i = 0; i < particlesToUpdate; i += 1) {
        const index = (frameCount + i) % particles.length;
        const particle = particles[index];
        if (!particle) {
          continue;
        }

        particle.userData.life -= particle.userData.decay;
        particle.material.opacity = particle.userData.life * 0.85;
        particle.position.x += particle.userData.velocity.x;
        particle.position.y += particle.userData.velocity.y;
        particle.position.z += particle.userData.velocity.z;

        particle.rotation.x += particle.userData.rotationSpeed.x;
        particle.rotation.y += particle.userData.rotationSpeed.y;
        particle.rotation.z += particle.userData.rotationSpeed.z;

        if (particle.userData.life <= 0) {
          particle.visible = false;
          particle.material.opacity = 0;
          particlePool.push(particle);
          particles.splice(index, 1);
        }
      }

      composer.render();
    };

    const forceInitialRender = () => {
      for (let i = 0; i < 3; i += 1) {
        composer.render();
      }
      for (let i = 0; i < 10; i += 1) {
        createParticle();
      }
      composer.render();
      isInitialized = true;
      preloader.complete(renderer.domElement);
    };

    preloader.updateProgress(5);
    const bootTimer = setTimeout(forceInitialRender, 100);

    window.dispatchEvent(
      new MouseEvent("mousemove", {
        clientX: window.innerWidth / 2,
        clientY: window.innerHeight / 2,
      })
    );

    animate(0);

    return () => {
      if (bootTimer) {
        clearTimeout(bootTimer);
      }
      if (mouseMovementTimer) {
        clearTimeout(mouseMovementTimer);
      }
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
      }
      cancelAnimationFrame(animationFrameId);

      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);

      pane.dispose();

      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }

      scene.traverse((obj) => {
        if (obj.isMesh) {
          if (obj.geometry) {
            obj.geometry.dispose();
          }
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach((material) => material.dispose());
            } else {
              obj.material.dispose();
            }
          }
        }
      });

      document.body.style.overflow = oldBodyStyles.overflow;
      document.body.style.transform = oldBodyStyles.transform;
      document.body.style.backfaceVisibility = oldBodyStyles.backfaceVisibility;
      document.body.style.perspective = oldBodyStyles.perspective;

      canEnterRef.current = false;
      if (rootRef.current) {
        rootRef.current.classList.remove("ready-to-enter");
        rootRef.current.classList.remove("is-exiting");
      }
    };
  }, []);

  return (
    <section
      ref={rootRef}
      className="ghost-intro-root"
      onClick={handleEnter}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          handleEnter();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div ref={canvasHostRef} className="ghost-canvas-host" />
      <div ref={paneHostRef} className="ghost-pane-host" />

      <div ref={preloaderRef} className="preloader">
        <div className="preloader-content">
          <div className="ghost-loader">
            <svg className="ghost-svg" height="80" viewBox="0 0 512 512" width="80" xmlns="http://www.w3.org/2000/svg">
              <path
                className="ghost-body"
                d="m508.374 432.802s-46.6-39.038-79.495-275.781c-8.833-87.68-82.856-156.139-172.879-156.139-90.015 0-164.046 68.458-172.879 156.138-32.895 236.743-79.495 275.782-79.495 275.782-15.107 25.181 20.733 28.178 38.699 27.94 35.254-.478 35.254 40.294 70.516 40.294 35.254 0 35.254-35.261 70.508-35.261s37.396 45.343 72.65 45.343 37.389-45.343 72.651-45.343c35.254 0 35.254 35.261 70.508 35.261s35.27-40.772 70.524-40.294c17.959.238 53.798-2.76 38.692-27.94z"
                fill="white"
              />
              <circle className="ghost-eye left-eye" cx="208" cy="225" r="22" fill="black" />
              <circle className="ghost-eye right-eye" cx="297" cy="225" r="22" fill="black" />
            </svg>
          </div>
          <div className="loading-text">Summoning spirits</div>
          <div className="loading-progress">
            <div ref={progressBarRef} className="progress-bar" />
          </div>
        </div>
      </div>

      <div ref={contentRef} className="content">
        <div className="quote-container">
          <h1 className="quote">
            Veil of Dust
            <br />
            Trail of Ash
            <br />
            Heart of Ice
          </h1>
          <span className="author">Whispers through memory</span>
          <button
            type="button"
            className="enter-hint"
            onClick={(event) => {
              event.stopPropagation();
              handleEnter();
            }}
          >
            Click to Enter
          </button>
        </div>
      </div>
    </section>
  );
}

export default GhostIntro;
