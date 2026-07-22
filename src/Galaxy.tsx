/*!
 * Copyright © Todos los derechos reservados Cyluk
 * Repository: https://github.com/Cyluk-dev/Galaxia
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface TextSpriteData {
  sprite: THREE.Sprite;
  scene: 'galaxy' | 'starfield';
  phaseOffset: number;
  speed: number;
}

const Galaxy: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [textScale, setTextScale] = useState(2);
  const [showContinueZoom, setShowContinueZoom] = useState(false);
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  
  const ignoreClicksRef = useRef(true); 
  
  const textScaleRef = useRef(2);
  const showContinueZoomRef = useRef(false);
  const textScaleLabels = ["diminuto", "pequeño", "mediano", "grande", "gigante"];

  useEffect(() => {
    textScaleRef.current = textScale;
  }, [textScale]);

  const handleStart = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    setHasStarted(true);
    
    const audio = document.getElementById('bg-music') as HTMLAudioElement;
    if (audio) {
      audio.play().catch(error => console.log("El navegador bloqueó el audio:", error));
    }

    setTimeout(() => {
        ignoreClicksRef.current = false;
    }, 800);
  };

  useEffect(() => {
      const musicBar = document.getElementById('music-bar');
      const visibilityBtn = document.getElementById('player-visibility-btn');
      
      if (!hasStarted) {
          if (musicBar) {
              musicBar.style.opacity = "0";
              musicBar.style.pointerEvents = "none";
              musicBar.style.transform = "translateX(-50%) translateY(-70px)";
          }
          if (visibilityBtn) {
              visibilityBtn.style.opacity = "0";
              visibilityBtn.style.pointerEvents = "none";
          }
      } else {
          setTimeout(() => {
            if (musicBar) {
                musicBar.style.opacity = "1";
                musicBar.style.pointerEvents = "all";
                musicBar.style.transform = "translateX(-50%) translateY(0px)";
            }
            if (visibilityBtn) {
                visibilityBtn.style.opacity = "1";
                visibilityBtn.style.pointerEvents = "all";
            }
          }, 500);
      }
  }, [hasStarted]);

  useEffect(() => {
    if (!mountRef.current) return;

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const mobileScale = isMobile ? 0.5 : 1.0;
    const mobileRadiusScale = isMobile ? 0.707 : 1.0;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#000002');
    scene.fog = new THREE.FogExp2('#000002', 0.05);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.000001, 100);
    camera.position.set(2.0, 2, 2.0);

    const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: false, powerPreference: "high-performance" });

    const galaxyGroup = new THREE.Group();
    galaxyGroup.rotation.x = (10 * Math.PI) / 180;
    galaxyGroup.rotation.z = (-5 * Math.PI) / 180;
    scene.add(galaxyGroup);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    mountRef.current.appendChild(renderer.domElement);

    const MAX_ZOOM = 347;
    const MIN_DIST = 20 / (MAX_ZOOM * 10.13);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 20;
    controls.minDistance = MIN_DIST;

    let zoomTimeout: any;
    const handleControlsChange = () => {
      if (currentScene === 'galaxy') {
        setShowContinueZoom(false);
        showContinueZoomRef.current = false;
        clearTimeout(zoomTimeout);
        zoomTimeout = setTimeout(() => {
          if (currentScene === 'galaxy') {
            setShowContinueZoom(true);
            showContinueZoomRef.current = true;
          }
        }, 3000);
      } else {
        setShowContinueZoom(false);
        showContinueZoomRef.current = false;
      }
    };
    controls.addEventListener('change', handleControlsChange);

    const parameters = {
      count: Math.floor(90000 * mobileScale),
      radius: 4 * mobileRadiusScale,
      branches: 5,
      spin: 1.5,
      randomness: 0.4,
      randomnessPower: 3,
      coreColor: '#ff4d6d',
      armColor: '#ff9ad5',
      clusterColor: '#ffd1dc',
    };

    let geometry: THREE.BufferGeometry | null = null;
    let material: THREE.ShaderMaterial | null = null;
    let points: THREE.Points | null = null;

    const targetStarLocalPos = new THREE.Vector3(-1.75, 0.1, 0.43);

    const createMaterial = () => {
      return new THREE.ShaderMaterial({
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        uniforms: { uTime: { value: 0 }, uRadius: { value: parameters.radius } },
        vertexShader: `
          uniform float uTime; uniform float uRadius;
          attribute float aScale; attribute vec4 aJetParams; attribute float aJetAngle;
          varying vec3 vColor;
          void main() {
            vec3 pos = position; vec3 finalColor = color; float finalScale = aScale;
            if (aJetParams.y != 0.0) {
              float progress = fract(aJetParams.x + uTime * 0.3);
              float jetY = pow(progress, 1.5) * uRadius * 1.4 * aJetParams.y;
              float jetR = aJetParams.w + aJetParams.z * pow(abs(jetY), 1.4);
              pos.x = cos(aJetAngle) * jetR; pos.y = jetY; pos.z = sin(aJetAngle) * jetR;
              float fade = exp(-abs(jetY) * 0.8);
              finalColor *= (fade * 0.85); finalScale *= (fade + 0.3);
            }
            vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
            vec4 viewPosition = viewMatrix * modelPosition;
            gl_Position = projectionMatrix * viewPosition;
            float pointSize = ${isMobile ? '35.0' : '20.0'};
            gl_PointSize = pointSize * finalScale * (1.0 / - viewPosition.z);
            vColor = finalColor;
          }
        `,
        fragmentShader: `
          varying vec3 vColor;
          void main() {
            float d = distance(gl_PointCoord, vec2(0.5));
            float strength = clamp(0.05 / d - 0.05 * 2.0, 0.0, 1.0);
            vec3 finalColor = mix(vec3(0.0), vColor, strength);
            gl_FragColor = vec4(finalColor, 1.0);
          }
        `,
      });
    };

    const generateGalaxy = () => {
      if (points !== null) {
        geometry?.dispose(); material?.dispose(); galaxyGroup.remove(points);
      }

      const specialClusterCount = 5;
      const heartCount = 18000; 
      const spiralCount = Math.floor(parameters.count * 2.1); 
      const totalCount = heartCount + spiralCount + specialClusterCount;

      geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(totalCount * 3);
      const colors = new Float32Array(totalCount * 3);
      const scales = new Float32Array(totalCount);
      const jetParams = new Float32Array(totalCount * 4);
      const jetAngles = new Float32Array(totalCount);

      const targetPositions = new Float32Array(totalCount * 3);
      const baseColors = new Float32Array(totalCount * 3);
      const progress = new Float32Array(totalCount);
      const speeds = new Float32Array(totalCount);

      const mixedColor = new THREE.Color();
      let idx = 0;

      for (let i = 0; i < heartCount; i++, idx++) {
        const i3 = idx * 3;
        let hX, hY, hZ;
        while (true) {
          hX = (Math.random() - 0.5) * 3.0; hY = (Math.random() - 0.5) * 3.0; hZ = (Math.random() - 0.5) * 3.0; 
          const x2 = hX * hX, y2 = hZ * hZ, z2 = hY * hY; 
          if (x2 + (9.0 / 4.0) * y2 + z2 - 1.0 <= 0.0 || (x2 + (9.0 / 4.0) * y2 + z2 - 1.0)**3 - (x2 * (hY**3) + (9.0 / 80.0) * y2 * (hY**3)) <= 0.0) break;
        }

        let finalX = hX * 1.05; let finalY = hY < 0 ? hY * 1.4 : hY * 1.2; let finalZ = hZ;
        const heartScale = 0.30 * parameters.radius; 
        targetPositions[i3] = finalX * heartScale; targetPositions[i3 + 1] = (finalY + 1.3) * heartScale; targetPositions[i3 + 2] = finalZ * heartScale;

        progress[idx] = Math.random(); speeds[idx] = 0.002 + Math.random() * 0.004; 
        positions[i3] = targetPositions[i3] * progress[idx]; positions[i3 + 1] = targetPositions[i3 + 1] * progress[idx]; positions[i3 + 2] = targetPositions[i3 + 2] * progress[idx];

        mixedColor.copy(new THREE.Color('#ff00aa')).lerp(new THREE.Color('#ff66cc'), Math.sqrt(finalX**2 + finalY**2 + finalZ**2) / 1.5 * 0.5);
        colors[i3] = baseColors[i3] = mixedColor.r; colors[i3 + 1] = baseColors[i3 + 1] = mixedColor.g; colors[i3 + 2] = baseColors[i3 + 2] = mixedColor.b;
        scales[idx] = Math.random() * 1.5 + 0.5; 
      }

      for (let i = 0; i < spiralCount; i++, idx++) {
        const i3 = idx * 3;
        const r = Math.random() * parameters.radius, spinAngle = r * parameters.spin, branchAngle = ((i % parameters.branches) / parameters.branches) * Math.PI * 2;
        positions[i3] = Math.cos(branchAngle + spinAngle) * r + (Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * r);
        positions[i3 + 1] = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * r * 0.3;
        positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * r + (Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * r);

        mixedColor.copy(new THREE.Color('#8b5cf6')).lerp(new THREE.Color('#22d3ee'), r / parameters.radius);
        colors[i3] = baseColors[i3] = mixedColor.r; colors[i3 + 1] = baseColors[i3 + 1] = mixedColor.g; colors[i3 + 2] = baseColors[i3 + 2] = mixedColor.b;

        const rs = Math.random();
        scales[idx] = rs > 0.95 ? Math.random() * 1.7 + 0.5 : rs > 0.7 ? Math.random() * 1.2 + 0.2 : Math.random() * 0.7 + 0.1;
      }

      for (let i = 0; i < specialClusterCount; i++, idx++) {
        const i3 = idx * 3;
        const spread = Math.random() * 0.002, theta = Math.random() * Math.PI * 2, phi = Math.acos(Math.random() * 2 - 1);
        positions[i3] = targetStarLocalPos.x + Math.sin(phi) * Math.cos(theta) * spread;
        positions[i3 + 1] = targetStarLocalPos.y + Math.sin(phi) * Math.sin(theta) * spread;
        positions[i3 + 2] = targetStarLocalPos.z + Math.cos(phi) * spread;
        colors[i3] = baseColors[i3] = 1.8; colors[i3 + 1] = baseColors[i3 + 1] = 1.8; colors[i3 + 2] = baseColors[i3 + 2] = 1.8;
        scales[idx] = 5.0; 
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
      geometry.setAttribute('aJetParams', new THREE.BufferAttribute(jetParams, 4));
      geometry.setAttribute('aJetAngle', new THREE.BufferAttribute(jetAngles, 1));
      geometry.userData = { targetPositions, baseColors, progress, speeds, heartCount };

      material = createMaterial(); points = new THREE.Points(geometry, material); galaxyGroup.add(points);
    };

    const generateStarfield = () => {
      if (points !== null) { geometry?.dispose(); material?.dispose(); galaxyGroup.remove(points); }
      const count = Math.floor(150000 * mobileScale);
      geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3), colors = new Float32Array(count * 3), scales = new Float32Array(count), jetParams = new Float32Array(count * 4), jetAngles = new Float32Array(count);

      for (let i = 0; i < count; i++) {
        const i3 = i * 3, r = Math.pow(Math.random(), 1/3) * 20.0, theta = Math.random() * Math.PI * 2, phi = Math.acos(Math.random() * 2 - 1);
        positions[i3] = targetStarLocalPos.x + Math.sin(phi) * Math.cos(theta) * r;
        positions[i3 + 1] = targetStarLocalPos.y + Math.sin(phi) * Math.sin(theta) * r;
        positions[i3 + 2] = targetStarLocalPos.z + Math.cos(phi) * r;

        const colorType = Math.random();
        if (colorType < 0.6) { colors[i3] = 1.0; colors[i3 + 1] = 1.0; colors[i3 + 2] = 1.0; }
        else if (colorType < 0.8) { colors[i3] = 0.6; colors[i3 + 1] = 0.8; colors[i3 + 2] = 1.0; }
        else { colors[i3] = 1.0; colors[i3 + 1] = 0.9; colors[i3 + 2] = 0.6; }
        scales[i] = Math.random() * 3.0 + 0.5;
      }
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
      geometry.setAttribute('aJetParams', new THREE.BufferAttribute(jetParams, 4));
      geometry.setAttribute('aJetAngle', new THREE.BufferAttribute(jetAngles, 1));
      material = createMaterial(); points = new THREE.Points(geometry, material); galaxyGroup.add(points);
    };

    generateGalaxy();

    const textSprites: TextSpriteData[] = [];
    const textGroup = new THREE.Group();
    galaxyGroup.add(textGroup);

    const interactiveGroup = new THREE.Group();
    galaxyGroup.add(interactiveGroup);
    
    const interactiveStars: THREE.Sprite[] = [];
    const interactiveHitboxes: THREE.Mesh[] = []; 
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const createGlowingStarTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 128; canvas.height = 128;
      const ctx = canvas.getContext('2d')!;
      const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');      
      gradient.addColorStop(0.1, 'rgba(34, 211, 238, 1)');     
      gradient.addColorStop(0.4, 'rgba(34, 211, 238, 0.4)');   
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');            
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 128, 128);
      return new THREE.CanvasTexture(canvas);
    };
    const glowingStarTexture = createGlowingStarTexture();

    const hitGeometry = new THREE.SphereGeometry(0.7, 16, 16);
    const hitMaterial = new THREE.MeshBasicMaterial({ 
      colorWrite: false, 
      depthWrite: false,
      side: THREE.DoubleSide 
    });

    const interactiveStarData = [
      { frase: "Mientras mas te conozco más me gustas.<br><br> Contigo todo eS divertido 💖", sticker: "I1.gif", pos: [1.8, 0.05, 1.4] },
      { frase: "Gracias por haberme dejado conocerte.<br><br> Eres una chica increíble ✨", sticker: "I2.gif", pos: [-1.8, -0.05, 1.0] },
      { frase: "Me inspiras a mejorar cada dia.<br><br> Gracias por todos esos momentos. Cuídate mucho. 🌸", sticker: "I3.gif", pos: [1.2, -0.05, -1.6] },
      { frase: "Me gustó compartir parte de mi vida contigo.<br><br> ¡Esta galaxia nació gracias a los recuerdos que compartimos! 💜🌌🥰", sticker: "I4.gif", pos: [-1.5, 0.05, -1.2] }
    ];

    interactiveStarData.forEach(data => {
      const mat = new THREE.SpriteMaterial({
        map: glowingStarTexture,
        color: 0xffffff,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const sprite = new THREE.Sprite(mat);
      sprite.position.set(data.pos[0], data.pos[1], data.pos[2]);
      const starScale = isMobile ? 1.6 : 1.2;
      sprite.scale.set(starScale, starScale, 1); 
      sprite.userData = { baseScale: starScale };
      
      interactiveGroup.add(sprite); 
      interactiveStars.push(sprite);

      const hitbox = new THREE.Mesh(hitGeometry, hitMaterial);
      hitbox.position.copy(sprite.position);
      hitbox.userData = { frase: data.frase, sticker: data.sticker };
      
      interactiveGroup.add(hitbox);
      interactiveHitboxes.push(hitbox);
    });

    let isDragging = false;
    let startPos = { x: 0, y: 0 };
    let startTime = 0;

    const onPointerDown = (e: any) => {
      if (ignoreClicksRef.current) return;

      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('input') || target.closest('.z-40') || target.closest('#music-bar') || target.closest('.modal-content')) {
        return; 
      }

      isDragging = false;
      const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0]?.clientX);
      const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0]?.clientY);
      startPos = { x: clientX || 0, y: clientY || 0 };
      startTime = Date.now();
    };

    const onPointerMove = (e: any) => {
      if (ignoreClicksRef.current) return;
      const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0]?.clientX);
      const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0]?.clientY);
      if (Math.abs((clientX || 0) - startPos.x) > 15 || Math.abs((clientY || 0) - startPos.y) > 15) {
        isDragging = true;
      }
    };

    const onPointerUp = (e: any) => {
      if (ignoreClicksRef.current) return;
      if (isDragging || isTransitioning || currentScene !== 'galaxy') return;
      
      const clickDuration = Date.now() - startTime;
      if (clickDuration > 400) return; 

      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('input') || target.closest('.z-40') || target.closest('#music-bar') || target.closest('.modal-content')) {
        return; 
      }

      scene.updateMatrixWorld(true);
      camera.updateMatrixWorld(true);

      const clientX = e.clientX !== undefined ? e.clientX : (e.changedTouches && e.changedTouches[0]?.clientX);
      const clientY = e.clientY !== undefined ? e.clientY : (e.changedTouches && e.changedTouches[0]?.clientY);

      mouse.x = ((clientX || 0) / window.innerWidth) * 2 - 1;
      mouse.y = -((clientY || 0) / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObjects(interactiveHitboxes, false);
      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (typeof (window as any).mostrarFraseLarga === 'function') {
          (window as any).mostrarFraseLarga(hit.userData.frase, hit.userData.sticker);
        }
      }
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    const createTextSprite = (text: string, color: string, scaleMultiplier: number, isScene2: boolean = false) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const fontSize = isScene2 ? 96 : 72;
      ctx.font = `bold ${fontSize}px "Dancing Script", cursive`;
      const textMetrics = ctx.measureText(text);
      const width = textMetrics.width;
      const height = fontSize * 1.8;

      canvas.width = width + 120; 
      canvas.height = height + 40;

      ctx.font = `bold ${fontSize}px "Dancing Script", cursive`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      
      const centerX = canvas.width / 2, centerY = canvas.height / 2;

      ctx.lineWidth = 4; ctx.strokeStyle = '#14000a'; ctx.strokeText(text, centerX, centerY);
      ctx.fillStyle = color; ctx.fillText(text, centerX, centerY);

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      const material = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0, depthWrite: false, depthTest: false });

      const sprite = new THREE.Sprite(material);
      sprite.renderOrder = 999; 
      sprite.userData.baseScale = { x: canvas.width * scaleMultiplier, y: canvas.height * scaleMultiplier };
      sprite.scale.set(sprite.userData.baseScale.x, sprite.userData.baseScale.y, 1);
      return sprite;
    };

    document.fonts.load('10pt "Dancing Script"').then(() => {
      const scene1Texts = [
        "Gracias por cada momento compartido🌸",
        "Qué bonita coincidencia🍀",
        "Tienes una sonrisa increíble😊",
        "Hay momentos que nunca se olvidan📹",
        "Los viajes compartidos dejan grandes recuerdos✈️",
        "Me alegra haberte conocido🌙",
        "Algunas personas dejan una huella especial💫",
        "Siempre recordaré los buenos momentos🌸",
        "Con cariño 💜",
        "Eres una persona increíble😊",
        "Siempre hay motivos para sonreír☁️",
      ];

      const scene2Texts = [
        "Gracias por haberme dejado conocerte ⏳✨",
        "Cada que me mostrabas más cosas tuyas, más empezabas a gustarme 📜💖",
        "Me hubiera gustado seguir compartiendo mi vida 🏡🌸"
      ];

      scene1Texts.forEach((text, i) => {
        const scaleMultiplier = 0.0014 + (i % 3) * 0.0003; 
        const sprite = createTextSprite(text, '#ffb3d9', scaleMultiplier);
        
        const n = scene1Texts.length;
        const theta = (i / n) * Math.PI * 2; 
        const r = 2.2 + (i % 2 === 0 ? 0.6 : -0.4); 
        const y = Math.sin(i * 1.5) * 0.25; 
        
        sprite.position.set(Math.cos(theta) * r, y, Math.sin(theta) * r);
        textGroup.add(sprite);

        textSprites.push({ sprite, scene: 'galaxy', phaseOffset: 0, speed: 0 });
      });

      const goldenRatio = (1 + Math.sqrt(5)) / 2;
      scene2Texts.forEach((text, i) => {
        const scaleMultiplier = 0.000025 + Math.random() * 0.000015;
        const sprite = createTextSprite(text, '#ff99cc', scaleMultiplier, true);
        const n = scene2Texts.length;
        const theta = 2 * Math.PI * i / goldenRatio;
        const phi = Math.acos(1 - 2 * (i + 0.5) / n);
        const r = 0.02 + Math.random() * 0.02;
        
        sprite.position.set(
          targetStarLocalPos.x + Math.sin(phi) * Math.cos(theta) * r,
          targetStarLocalPos.y + Math.sin(phi) * Math.sin(theta) * r,
          targetStarLocalPos.z + Math.cos(phi) * r
        );
        textGroup.add(sprite);
        textSprites.push({ sprite, scene: 'starfield', phaseOffset: Math.random() * Math.PI * 2, speed: 0.1 + Math.random() * 0.1 });
      });
    });

    let currentScene = 'galaxy';
    let isTransitioning = false;

    const clock = new THREE.Clock();
    const previousTargetWorldPos = new THREE.Vector3();
    let isFirstFrame = true;

    const tick = () => {
      const elapsedTime = clock.getElapsedTime();

      if (points && points.geometry && points.geometry.userData.targetPositions) {
        const positions = points.geometry.attributes.position.array;
        const colorsArray = points.geometry.attributes.color.array; 
        const { targetPositions, baseColors, progress, speeds, heartCount } = points.geometry.userData;

        for (let i = 0; i < heartCount; i++) {
          const i3 = i * 3;
          progress[i] += speeds[i];
          if (progress[i] >= 1.3) progress[i] = 0.0;
          const visualProgress = Math.min(progress[i], 1.0);

          positions[i3] = targetPositions[i3] * visualProgress;
          positions[i3 + 1] = targetPositions[i3 + 1] * visualProgress;
          positions[i3 + 2] = targetPositions[i3 + 2] * visualProgress;

          const colorMix = Math.pow(visualProgress, 0.4); 
          colorsArray[i3]     = 1.0 * (1 - colorMix) + baseColors[i3] * colorMix; 
          colorsArray[i3 + 1] = 1.0 * (1 - colorMix) + baseColors[i3 + 1] * colorMix; 
          colorsArray[i3 + 2] = 1.0 * (1 - colorMix) + baseColors[i3 + 2] * colorMix; 
        }

        const totalParticles = colorsArray.length / 3;
        for (let i = heartCount; i < totalParticles; i++) {
          const i3 = i * 3;
          const twinkle = 0.6 + 0.4 * Math.sin(elapsedTime * 3.0 + i * 0.2);
          colorsArray[i3]     = baseColors[i3] * twinkle;
          colorsArray[i3 + 1] = baseColors[i3 + 1] * twinkle;
          colorsArray[i3 + 2] = baseColors[i3 + 2] * twinkle;
        }

        points.geometry.attributes.position.needsUpdate = true;
        points.geometry.attributes.color.needsUpdate = true; 
      }

      if (points && material) {
        points.rotation.y = elapsedTime * 0.05;
        textGroup.rotation.y = elapsedTime * 0.05;
        interactiveGroup.rotation.y = elapsedTime * 0.05;

        points.updateMatrixWorld(true);
        const targetWorldPos = targetStarLocalPos.clone();
        targetWorldPos.applyMatrix4(points.matrixWorld);

        if (isFirstFrame) {
          previousTargetWorldPos.copy(targetWorldPos);
          controls.target.copy(targetWorldPos);
          isFirstFrame = false;
        }

        const delta = targetWorldPos.clone().sub(previousTargetWorldPos);
        camera.position.add(delta);
        controls.target.copy(targetWorldPos);
        previousTargetWorldPos.copy(targetWorldPos);
      }

      controls.update();

      interactiveStars.forEach((star, idx) => {
        if (currentScene !== 'galaxy') {
          star.visible = false; 
        } else {
          star.visible = true;
          const baseScale = star.userData.baseScale;
          const dynamicScale = baseScale + Math.sin(elapsedTime * 3.5 + idx) * 0.25;
          star.scale.set(dynamicScale, dynamicScale, 1);
        }
      });

      const dist = camera.position.distanceTo(controls.target);
      const rawZoom = 20 / dist;
      const displayZoom = rawZoom / 10.13;

      if (!isTransitioning) {
        if (currentScene === 'galaxy') {
          controls.minDistance = MIN_DIST; 
          if (displayZoom > 346) {
            isTransitioning = true; controls.enabled = false;
            if (overlayRef.current) {
              overlayRef.current.style.transition = 'opacity 0.5s ease-in-out';
              overlayRef.current.style.opacity = '1';
            }
            setTimeout(() => {
              generateStarfield(); currentScene = 'starfield';
              controls.enabled = true; isTransitioning = false;
            }, 500);
          } else {
            if (overlayRef.current) {
              overlayRef.current.style.transition = 'none';
              let opacity = 0;
              if (displayZoom >= 343) opacity = (displayZoom - 343) / 3;
              overlayRef.current.style.opacity = opacity.toString();
            }
          }
        } else if (currentScene === 'starfield') {
          controls.minDistance = 20 / (346 * 10.13); 
          if (displayZoom < 345) {
            isTransitioning = true; controls.enabled = false;
            if (overlayRef.current) {
              overlayRef.current.style.transition = 'opacity 0.5s ease-in-out';
              overlayRef.current.style.opacity = '1';
            }
            setTimeout(() => {
              generateGalaxy(); currentScene = 'galaxy';
              controls.enabled = true; isTransitioning = false;
            }, 500);
          } else {
            if (overlayRef.current) {
              overlayRef.current.style.transition = 'none';
              let opacity = 0;
              if (displayZoom <= 346) opacity = (346 - displayZoom) / 1;
              overlayRef.current.style.opacity = opacity.toString();
            }
          }
        }
      }

      textSprites.forEach(data => {
        if (data.scene !== currentScene) {
          data.sprite.visible = false; return;
        }
        data.sprite.visible = true; 
        data.sprite.material.opacity = 1.0; 
        const scaleFactor = [0.5, 0.75, 1, 1.5, 2.5][textScaleRef.current];
        data.sprite.scale.set(
          data.sprite.userData.baseScale.x * scaleFactor,
          data.sprite.userData.baseScale.y * scaleFactor, 1
        );
      });

      renderer.render(scene, camera);
      window.requestAnimationFrame(tick);
    };

    tick();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      
      controls.removeEventListener('change', handleControlsChange);
      clearTimeout(zoomTimeout);
      glowingStarTexture.dispose();
      hitGeometry.dispose();
      hitMaterial.dispose();
      interactiveStars.forEach(s => s.material.dispose());
      textSprites.forEach(data => {
        data.sprite.material.dispose();
        data.sprite.material.map?.dispose();
      });
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      geometry?.dispose(); material?.dispose(); renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <div ref={mountRef} className="absolute inset-0" />
      
      <div className={`absolute inset-0 z-[999999] flex items-center justify-center bg-[#000002] transition-opacity duration-1000 ease-in-out ${hasStarted ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}`}>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          onClick={handleStart}
          className="px-8 py-4 text-white text-xl md:text-2xl font-serif tracking-[0.1em] border border-white/30 rounded-full hover:bg-white/10 hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all duration-500 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
        >
          Haz clic para comenzar el viaje 🌌
        </button>
      </div>

      <div 
        ref={overlayRef}
        className="absolute inset-0 bg-white pointer-events-none z-20"
        style={{ opacity: 0 }}
      />
      
      <div className={`absolute right-0 top-1/2 -translate-y-1/2 flex items-center z-40 transition-transform duration-500 ease-in-out ${isControlsOpen ? 'translate-x-0' : 'translate-x-[calc(100%-12px)]'} ${!hasStarted ? 'hidden' : ''}`}>
        <button 
          onClick={() => setIsControlsOpen(!isControlsOpen)}
          className="w-8 h-12 flex items-center justify-center bg-black/40 backdrop-blur-xl border-l border-y border-white/10 rounded-l-xl text-white/40 hover:text-white transition-all shadow-xl"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-500 ${isControlsOpen ? 'rotate-0' : 'rotate-180'}`}>
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>

        <div className="flex flex-col items-center p-4 rounded-3xl bg-black/40 backdrop-blur-2xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.6)] w-20 gap-5 mr-4 ml-1 transition-all duration-300 hover:bg-black/50">
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 7V4h16v3M9 20h6M12 4v16"/>
            </svg>
          </div>

          <div className="h-40 flex items-center justify-center py-4 relative w-full">
            <input type="range" min="0" max="4" step="1" value={textScale} onChange={(e) => setTextScale(parseInt(e.target.value))}
              className="absolute w-32 h-1.5 -rotate-90 bg-white/10 rounded-full appearance-none cursor-pointer accent-white transition-all hover:bg-white/20"
              style={{ outline: 'none', WebkitAppearance: 'none' }}
            />
          </div>

          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] text-white font-bold bg-white/10 px-2.5 py-1 rounded-lg uppercase tracking-tight min-w-[50px] text-center">
              {textScaleLabels[textScale].substring(0, 3)}
            </span>
            <span className="text-[7px] text-white/30 uppercase tracking-[0.2em] font-black mt-1">Size</span>
          </div>
        </div>
      </div>

      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 transition-all duration-1000 ${showContinueZoom ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} ${!hasStarted ? 'hidden' : ''}`}>
        <span className="text-white/30 text-2xl md:text-4xl font-serif italic tracking-[0.2em] uppercase whitespace-nowrap">
          💜 Te quiero. Gracias por todo.
        </span>
      </div>
    </div>
  );
};

export default Galaxy;