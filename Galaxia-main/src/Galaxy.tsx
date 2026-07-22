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
  const [textScale, setTextScale] = useState(2); // 0: diminuto, 1: pequeño, 2: mediano, 3: grande, 4: gigante
  const [showContinueZoom, setShowContinueZoom] = useState(false);
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const textScaleRef = useRef(2);
  const showContinueZoomRef = useRef(false);
  const textScaleLabels = ["diminuto", "pequeño", "mediano", "grande", "gigante"];

  useEffect(() => {
    textScaleRef.current = textScale;
  }, [textScale]);

  useEffect(() => {
    if (!mountRef.current) return;

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const mobileScale = isMobile ? 0.5 : 1.0;
    const mobileRadiusScale = isMobile ? 0.707 : 1.0; // sqrt(0.5) to maintain density

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#000002'); // Very dark space background
    // Add a subtle fog to fade distant stars
    scene.fog = new THREE.FogExp2('#000002', 0.05);

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.000001,
      100
    );
    // Position camera to look down at the galaxy at an angle
    camera.position.set(2.0, 2, 2.0);

    const renderer = new THREE.WebGLRenderer({ 
      antialias: !isMobile, 
      alpha: false,
      powerPreference: "high-performance"
    });

    // Group to hold and tilt the galaxy
    const galaxyGroup = new THREE.Group();
    // Tilt by 10 degrees for a better viewing angle (180 - 10)
    galaxyGroup.rotation.x = (10 * Math.PI) / 180;
    galaxyGroup.rotation.z = (-5 * Math.PI) / 180; // Slight Z tilt for aesthetics
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

    // --- Galaxy Generation ---
    const parameters = {
      count: Math.floor(300000 * mobileScale),
      radius: 4 * mobileRadiusScale,
      branches: 5,
      spin: 1.5,
      randomness: 0.4,
      randomnessPower: 3,
      coreColor: '#ffddaa', // Warm, bright yellow-white core
      armColor: '#99bbff',  // Light bluish-white arms (realistic young stars)
      clusterColor: '#ffffff', // Bright white/blue clusters
    };

    let geometry: THREE.BufferGeometry | null = null;
    let material: THREE.ShaderMaterial | null = null;
    let points: THREE.Points | null = null;

    // The target star/cluster we want to zoom into
    // r = 1.8 (10% closer), next to a spiral arm (theta = 2.9)
    const targetStarLocalPos = new THREE.Vector3(-1.75, 0.1, 0.43);

    const createMaterial = () => {
      return new THREE.ShaderMaterial({
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        uniforms: {
          uTime: { value: 0 },
          uRadius: { value: parameters.radius }
        },
        vertexShader: `
          uniform float uTime;
          uniform float uRadius;
          attribute float aScale;
          attribute vec4 aJetParams;
          attribute float aJetAngle;
          varying vec3 vColor;

          void main() {
            vec3 pos = position;
            vec3 finalColor = color;
            float finalScale = aScale;

            // If this is a jet particle (sign != 0)
            if (aJetParams.y != 0.0) {
              // Calculate animation progress (loops from 0 to 1)
              float progress = fract(aJetParams.x + uTime * 0.3);
              
              // Calculate Y position: shoots out to 1.4 * radius
              float jetY = pow(progress, 1.5) * uRadius * 1.4 * aJetParams.y;
              
              // Calculate radius dispersion
              float jetR = aJetParams.w + aJetParams.z * pow(abs(jetY), 1.4);
              
              pos.x = cos(aJetAngle) * jetR;
              pos.y = jetY;
              pos.z = sin(aJetAngle) * jetR;
              
              // Fade out and shrink as it gets further
              float fade = exp(-abs(jetY) * 0.8);
              finalColor *= (fade * 0.85);
              finalScale *= (fade + 0.3);
            }

            vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
            vec4 viewPosition = viewMatrix * modelPosition;
            vec4 projectedPosition = projectionMatrix * viewPosition;

            gl_Position = projectedPosition;

            // Size attenuation
            float pointSize = ${isMobile ? '35.0' : '20.0'};
            gl_PointSize = pointSize * finalScale * (1.0 / - viewPosition.z);
            vColor = finalColor;
          }
        `,
        fragmentShader: `
          varying vec3 vColor;

          void main() {
            // Distance to center of point
            float d = distance(gl_PointCoord, vec2(0.5));

            // Soft circle with glow
            float strength = 0.05 / d - 0.05 * 2.0;
            strength = clamp(strength, 0.0, 1.0);

            // Apparent Density: Increase brightness slightly on mobile
            vec3 finalColor = mix(vec3(0.0), vColor, strength);
            gl_FragColor = vec4(finalColor, 1.0);
          }
        `,
      });
    };

    const generateGalaxy = () => {
      if (points !== null) {
        geometry?.dispose();
        material?.dispose();
        galaxyGroup.remove(points);
      }

      // We add 5 stars for our special target
      const specialClusterCount = 5;
      const totalCount = parameters.count + specialClusterCount;

      geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(totalCount * 3);
      const colors = new Float32Array(totalCount * 3);
      const scales = new Float32Array(totalCount);
      const jetParams = new Float32Array(totalCount * 4);
      const jetAngles = new Float32Array(totalCount);

      const colorCore = new THREE.Color(parameters.coreColor);
      const colorArms = new THREE.Color(parameters.armColor);
      const colorCluster = new THREE.Color(parameters.clusterColor);
      const mixedColor = new THREE.Color();

      let i = 0;

      // Calculate distributions
      const dispersedCount = Math.floor(parameters.count * 0.90); // 90% dispersed
      const remainingCount = parameters.count - dispersedCount;
      const totalRatio = 110; // 25 + 40 + 15 + 30 = 110
      const normalArmsCount = Math.floor(remainingCount * (25 / totalRatio));
      const thinArmsCount = Math.floor(remainingCount * (40 / totalRatio));
      const clustersCount = Math.floor(remainingCount * (15 / totalRatio));
      const brokenArmsCount = remainingCount - normalArmsCount - thinArmsCount - clustersCount;

      // 1. Dispersed (90%)
      for (; i < dispersedCount; i++) {
        const i3 = i * 3;
        
        // Organic concentration: slight clustering in radius to create density waves
        let rBase = Math.random();
        // Increased slightly from 0.01 to 0.015 for a bit more thickness in the waves
        rBase = rBase + Math.sin(rBase * Math.PI * 8) * 0.015; 
        rBase = Math.max(0, Math.min(1, rBase));
        
        const r = Math.pow(rBase, 1.8) * parameters.radius;
        
        let theta = Math.random() * Math.PI * 2;
        
        // --- NEW: Supermassive Black Hole Jets (60% of core stars) ---
        if (r < parameters.radius * 0.15 && Math.random() < 0.60) {
          // Jet parameters for the vertex shader animation
          jetParams[i * 4] = Math.random(); // offset (0 to 1)
          jetParams[i * 4 + 1] = Math.random() < 0.5 ? 1 : -1; // sign
          jetParams[i * 4 + 2] = Math.random() * 0.15; // spread
          jetParams[i * 4 + 3] = Math.random() * 0.05; // baseR
          
          jetAngles[i] = theta;
          
          // High energy color for jets (bright blue/purple/white)
          mixedColor.set('#88bbff').lerp(new THREE.Color('#ffffff'), Math.random());
          
          colors[i3] = mixedColor.r;
          colors[i3 + 1] = mixedColor.g;
          colors[i3 + 2] = mixedColor.b;
          
          scales[i] = Math.random() * 1.5; // Base scale
          
          // Positions will be calculated in the vertex shader, but we set them to 0 for the bounding box
          positions[i3] = 0;
          positions[i3 + 1] = 0;
          positions[i3 + 2] = 0;
          
          continue; // Skip the standard disk placement
        }
        
        if (r > parameters.radius * 0.85) {
          // Outer 15%: Gather into arms
          const branchAngle = (Math.floor(Math.random() * parameters.branches) / parameters.branches) * Math.PI * 2;
          const spinAngle = r * parameters.spin;
          
          // Calculate how far into the outer 15% we are (0.0 to 1.0)
          const outerFactor = (r - parameters.radius * 0.85) / (parameters.radius * 0.15);
          
          // Spread decreases as we go further out, forcing them to join the arms
          const spread = (1.0 - outerFactor) * Math.PI + 0.3;
          theta = branchAngle + spinAngle + (Math.random() - 0.5) * spread;
        } else {
          // Inner 85%: Organic concentration
          // 50% of inner stars loosely follow arms to create organic density bridges
          if (Math.random() < 0.5) { 
            const branchAngle = (Math.floor(Math.random() * parameters.branches) / parameters.branches) * Math.PI * 2;
            const spinAngle = r * parameters.spin;
            // Very wide spread for an organic, cloudy look
            theta = branchAngle + spinAngle + (Math.random() - 0.5) * Math.PI * 1.5;
          }
        }
        
        // Much flatter, more natural bulge in the middle
        let ySpread = Math.max(0.15, 1.2 * Math.exp(-r * 0.8)); 
        
        // 20% chance to have a different, logarithmically increasing thickness
        if (Math.random() < 0.20) {
          // Logarithmic growth as it moves away from the center
          // Reduced multiplier from 0.4 to 0.15 to prevent them from dispersing too much
          const logGrowth = Math.log2(r + 1) * 0.15;
          ySpread += logGrowth * Math.random();
        }
        
        const y = (Math.random() - 0.5) * ySpread;

        positions[i3] = Math.cos(theta) * r;
        positions[i3 + 1] = y;
        positions[i3 + 2] = Math.sin(theta) * r;

        mixedColor.copy(colorCore).lerp(colorArms, r / parameters.radius);
        colors[i3] = mixedColor.r;
        colors[i3 + 1] = mixedColor.g;
        colors[i3 + 2] = mixedColor.b;

        scales[i] = Math.random() * 1.2;
      }

      // 2. Normal Arms (25% of remaining = 11,250)
      const normalArmsEnd = i + normalArmsCount;
      for (; i < normalArmsEnd; i++) {
        const i3 = i * 3;
        const r = Math.random() * parameters.radius;
        const spinAngle = r * parameters.spin;
        const branchAngle = (Math.floor(Math.random() * parameters.branches) / parameters.branches) * Math.PI * 2;

        const randomX = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * r;
        const randomY = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * r * 0.4;
        const randomZ = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * r;

        positions[i3] = Math.cos(branchAngle + spinAngle) * r + randomX;
        positions[i3 + 1] = randomY;
        positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * r + randomZ;

        mixedColor.copy(colorCore).lerp(colorArms, r / parameters.radius);
        colors[i3] = mixedColor.r;
        colors[i3 + 1] = mixedColor.g;
        colors[i3 + 2] = mixedColor.b;
        scales[i] = Math.random();
      }

      // 3. Thin Arm Lines (30% of remaining = 13,500)
      const thinArmsEnd = i + thinArmsCount;
      for (; i < thinArmsEnd; i++) {
        const i3 = i * 3;
        const r = Math.random() * parameters.radius;
        const spinAngle = r * parameters.spin;
        const branchAngle = (Math.floor(Math.random() * parameters.branches) / parameters.branches) * Math.PI * 2;

        // Very little randomness for thin lines
        const randomX = (Math.random() - 0.5) * 0.08 * r;
        const randomY = (Math.random() - 0.5) * 0.08 * r;
        const randomZ = (Math.random() - 0.5) * 0.08 * r;

        positions[i3] = Math.cos(branchAngle + spinAngle) * r + randomX;
        positions[i3 + 1] = randomY;
        positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * r + randomZ;

        // Make them slightly brighter/bluer
        mixedColor.copy(colorArms).lerp(colorCluster, 0.4);
        colors[i3] = mixedColor.r;
        colors[i3 + 1] = mixedColor.g;
        colors[i3 + 2] = mixedColor.b;
        scales[i] = Math.random() * 1.5;
      }

      // 4. Clusters (15% of remaining = 6,750)
      const numClouds = 200;
      const clouds = [];
      for (let c = 0; c < numClouds; c++) {
        const r = Math.pow(Math.random(), 1.2) * (parameters.radius * 0.9);
        const spinAngle = r * parameters.spin;
        const branchAngle = (Math.floor(Math.random() * parameters.branches) / parameters.branches) * Math.PI * 2;
        clouds.push({
          x: Math.cos(branchAngle + spinAngle) * r,
          y: (Math.random() - 0.5) * 0.3,
          z: Math.sin(branchAngle + spinAngle) * r,
          r: r,
        });
      }

      const clustersEnd = i + clustersCount;
      for (; i < clustersEnd; i++) {
        const i3 = i * 3;
        const cloud = clouds[Math.floor(Math.random() * clouds.length)];
        const spread = Math.random() * 0.4;

        positions[i3] = cloud.x + (Math.random() - 0.5) * spread;
        positions[i3 + 1] = cloud.y + (Math.random() - 0.5) * spread * 1.5;
        positions[i3 + 2] = cloud.z + (Math.random() - 0.5) * spread;

        mixedColor.copy(colorCore).lerp(colorArms, cloud.r / parameters.radius).lerp(colorCluster, 0.8);
        colors[i3] = mixedColor.r;
        colors[i3 + 1] = mixedColor.g;
        colors[i3 + 2] = mixedColor.b;
        scales[i] = Math.random() * 2.5 + 0.5;
      }

      // 5. Broken Arms (30% of remaining = 13,500)
      // Generate random broken branch segments
      const numBrokenBranches = 25;
      const brokenBranches = [];
      for(let b = 0; b < numBrokenBranches; b++) {
         brokenBranches.push({
            angle: Math.random() * Math.PI * 2,
            spinMod: 1 + (Math.random() * 1.5 - 0.75), // varies spin significantly to break pattern
            rStart: Math.random() * parameters.radius * 0.3,
            rLength: Math.random() * parameters.radius * 0.7
         });
      }

      for (; i < parameters.count; i++) {
        const i3 = i * 3;
        const bb = brokenBranches[Math.floor(Math.random() * brokenBranches.length)];
        
        // Distribute along this broken branch segment
        const r = bb.rStart + Math.random() * bb.rLength;
        const spinAngle = r * parameters.spin * bb.spinMod;
        const branchAngle = bb.angle;

        const randomX = (Math.random() - 0.5) * 0.3 * r;
        const randomY = (Math.random() - 0.5) * 0.2 * r;
        const randomZ = (Math.random() - 0.5) * 0.3 * r;

        positions[i3] = Math.cos(branchAngle + spinAngle) * r + randomX;
        positions[i3 + 1] = randomY;
        positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * r + randomZ;

        mixedColor.copy(colorCore).lerp(colorArms, r / parameters.radius);
        colors[i3] = mixedColor.r;
        colors[i3 + 1] = mixedColor.g;
        colors[i3 + 2] = mixedColor.b;
        scales[i] = Math.random();
      }

      // 6. Special Target Star (5 stars for bright transition)
      for (; i < totalCount; i++) {
        const i3 = i * 3;
        
        // Very tight cluster to create a solid white point
        const spread = Math.random() * 0.002;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        
        positions[i3] = targetStarLocalPos.x + Math.sin(phi) * Math.cos(theta) * spread;
        positions[i3 + 1] = targetStarLocalPos.y + Math.sin(phi) * Math.sin(theta) * spread;
        positions[i3 + 2] = targetStarLocalPos.z + Math.cos(phi) * spread;

        // Extremely bright to ensure transition to white
        colors[i3] = 1.8; 
        colors[i3 + 1] = 1.8;
        colors[i3 + 2] = 1.8;
        
        // Medium size (5.0) to fill the screen on zoom
        scales[i] = 5.0; 
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
      geometry.setAttribute('aJetParams', new THREE.BufferAttribute(jetParams, 4));
      geometry.setAttribute('aJetAngle', new THREE.BufferAttribute(jetAngles, 1));

      material = createMaterial();

      points = new THREE.Points(geometry, material);
      galaxyGroup.add(points);
    };

    const generateStarfield = () => {
      if (points !== null) {
        geometry?.dispose();
        material?.dispose();
        galaxyGroup.remove(points);
      }

      const count = Math.floor(150000 * mobileScale);
      geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const scales = new Float32Array(count);
      const jetParams = new Float32Array(count * 4); // Unused but required by shader
      const jetAngles = new Float32Array(count); // Unused but required by shader

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        
        // Random position in a sphere around targetStarLocalPos
        // Spread out to fill the camera view when zoomed in
        const r = Math.pow(Math.random(), 1/3) * 20.0; 
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);

        positions[i3] = targetStarLocalPos.x + Math.sin(phi) * Math.cos(theta) * r;
        positions[i3 + 1] = targetStarLocalPos.y + Math.sin(phi) * Math.sin(theta) * r;
        positions[i3 + 2] = targetStarLocalPos.z + Math.cos(phi) * r;

        // Colors: mostly white/blue/yellow
        const colorType = Math.random();
        if (colorType < 0.6) {
          colors[i3] = 1.0; colors[i3 + 1] = 1.0; colors[i3 + 2] = 1.0; // White
        } else if (colorType < 0.8) {
          colors[i3] = 0.6; colors[i3 + 1] = 0.8; colors[i3 + 2] = 1.0; // Blueish
        } else {
          colors[i3] = 1.0; colors[i3 + 1] = 0.9; colors[i3 + 2] = 0.6; // Yellowish
        }

        scales[i] = Math.random() * 3.0 + 0.5;
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
      geometry.setAttribute('aJetParams', new THREE.BufferAttribute(jetParams, 4));
      geometry.setAttribute('aJetAngle', new THREE.BufferAttribute(jetAngles, 1));

      material = createMaterial();

      points = new THREE.Points(geometry, material);
      galaxyGroup.add(points);
    };

    generateGalaxy();

    // --- Floating Texts (3D Sprites) ---
    const textSprites: TextSpriteData[] = [];
    const textGroup = new THREE.Group();
    galaxyGroup.add(textGroup);

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
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Subtle solid outline
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#14000a';
      ctx.strokeText(text, centerX, centerY);

      // Main solid text
      ctx.fillStyle = color;
      ctx.fillText(text, centerX, centerY);

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: false, // Ensure text is always visible but integrated
      });

      const sprite = new THREE.Sprite(material);
      sprite.renderOrder = 999; // Ensure text is rendered on top
      // Store base scale
      sprite.userData.baseScale = { x: canvas.width * scaleMultiplier, y: canvas.height * scaleMultiplier };
      sprite.scale.set(sprite.userData.baseScale.x, sprite.userData.baseScale.y, 1);
      return sprite;
    };

    document.fonts.load('10pt "Dancing Script"').then(() => {
      const scene1Texts = [
        "Amor inmarcesible 🌸", "Mi paz eterna ✨", "Más allá del tiempo ⏳", 
        "Mi única certeza 💖", "Refugio de mi alma 🏡", "Destino ineludible 🌌", 
        "Mi arte vivo 🎨", "Luz inagotable ☀️", "Eterna devoción 🙏", 
        "El eco de mi ser 🎶", "Dueña de mis instantes ⏱️", "Mi coincidencia perfecta 🧩", 
        "Siempre nosotros 👫", "Sublime conexión 💫", "Mi santuario 🕊️", 
        "Te amo infinitamente ❤️", "Amor de mi vida 💍", "Mi universo entero 🌍",
        "Magia en tu mirada 👁️", "Latidos sincronizados 💓"
      ];

      const scene2Texts = [
        "Eres la poesía que mi alma anhelaba escribir 📜💖",
        "Si el tiempo se detuviera, te elegiría en cada instante ⏳✨",
        "En tu mirada encuentro la paz que el mundo me niega 🌌🕊️",
        "Mi alma te reconoce como si te hubiera amado en mil vidas antes 💫❤️",
        "Eres el refugio donde mi corazón por fin descansa 🏡🌸"
      ];

      scene1Texts.forEach((text, i) => {
        // Different sizes, made smaller
        const scaleMultiplier = 0.001 + Math.random() * 0.001;
        const sprite = createTextSprite(text, '#ffb3d9', scaleMultiplier);
        
        // Evenly spaced in a circle to prevent overlapping
        const n = scene1Texts.length;
        const theta = (i / n) * Math.PI * 2; 
        const r = 1.5 + Math.random() * 2.0;
        const y = (Math.random() - 0.5) * 0.8;
        
        sprite.position.set(Math.cos(theta) * r, y, Math.sin(theta) * r);
        textGroup.add(sprite);

        textSprites.push({
          sprite,
          scene: 'galaxy',
          phaseOffset: Math.random() * Math.PI * 2,
          speed: 0.1 + Math.random() * 0.1, // Slower, ~15s duration
        });
      });

      const goldenRatio = (1 + Math.sqrt(5)) / 2;
      scene2Texts.forEach((text, i) => {
        // Significantly increased size for Scene 2
        const scaleMultiplier = 0.000025 + Math.random() * 0.000015;
        const sprite = createTextSprite(text, '#ff99cc', scaleMultiplier, true);
        
        // Fibonacci sphere distribution to prevent overlapping
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

        textSprites.push({
          sprite,
          scene: 'starfield',
          phaseOffset: Math.random() * Math.PI * 2,
          speed: 0.1 + Math.random() * 0.1, // Slower, ~15s duration
        });
      });
    });

    // --- Animation Loop ---
    const clock = new THREE.Clock();
    const previousTargetWorldPos = new THREE.Vector3();
    let isFirstFrame = true;

    let currentScene = 'galaxy';
    let isTransitioning = false;

    const tick = () => {
      const elapsedTime = clock.getElapsedTime();

      // Slowly rotate the galaxy and update uniforms
      if (points && material) {
        points.rotation.y = elapsedTime * 0.05;
        textGroup.rotation.y = elapsedTime * 0.05;
        material.uniforms.uTime.value = elapsedTime;

        // Update matrix world so we get the correct position this frame
        points.updateMatrixWorld(true);

        // Calculate the star's current world position
        const targetWorldPos = targetStarLocalPos.clone();
        targetWorldPos.applyMatrix4(points.matrixWorld);

        if (isFirstFrame) {
          previousTargetWorldPos.copy(targetWorldPos);
          controls.target.copy(targetWorldPos);
          isFirstFrame = false;
        }

        // Find how much the target moved this frame
        const delta = targetWorldPos.clone().sub(previousTargetWorldPos);

        // Move the camera by the same amount so it stays relative to the star
        camera.position.add(delta);

        // Update the controls target to the star
        controls.target.copy(targetWorldPos);

        previousTargetWorldPos.copy(targetWorldPos);
      }

      controls.update();

      const dist = camera.position.distanceTo(controls.target);
      const rawZoom = 20 / dist;
      const displayZoom = rawZoom / 10.13;

      if (!isTransitioning) {
        if (currentScene === 'galaxy') {
          controls.minDistance = MIN_DIST; // Allow zooming in to trigger transition
          if (displayZoom > 346) {
            isTransitioning = true;
            controls.enabled = false;
            if (overlayRef.current) {
              overlayRef.current.style.transition = 'opacity 0.5s ease-in-out';
              overlayRef.current.style.opacity = '1';
            }
            setTimeout(() => {
              generateStarfield();
              currentScene = 'starfield';
              controls.enabled = true;
              isTransitioning = false;
            }, 500);
          } else {
            if (overlayRef.current) {
              overlayRef.current.style.transition = 'none';
              let opacity = 0;
              if (displayZoom >= 343) {
                opacity = (displayZoom - 343) / 3;
              }
              overlayRef.current.style.opacity = opacity.toString();
            }
          }
        } else if (currentScene === 'starfield') {
          controls.minDistance = 20 / (346 * 10.13); // Prevent zooming in further than transition point
          if (displayZoom < 345) {
            isTransitioning = true;
            controls.enabled = false;
            if (overlayRef.current) {
              overlayRef.current.style.transition = 'opacity 0.5s ease-in-out';
              overlayRef.current.style.opacity = '1';
            }
            setTimeout(() => {
              generateGalaxy();
              currentScene = 'galaxy';
              controls.enabled = true;
              isTransitioning = false;
            }, 500);
          } else {
            if (overlayRef.current) {
              overlayRef.current.style.transition = 'none';
              let opacity = 0;
              if (displayZoom <= 346) {
                opacity = (346 - displayZoom) / 1;
              }
              overlayRef.current.style.opacity = opacity.toString();
            }
          }
        }
      }

      const logMin = Math.log(MIN_DIST);
      const logMax = Math.log(20);
      const clampedDist = Math.max(MIN_DIST, Math.min(20, dist));
      const logDist = Math.log(clampedDist);
      const percentage = ((logMax - logDist) / (logMax - logMin)) * 100;

      // Update floating texts
      textSprites.forEach(data => {
        // 1. Optimizamos: Si no es la escena, apagamos completamente (0% GPU)
        if (data.scene !== currentScene) {
          data.sprite.visible = false; 
          return;
        }
        
        // 2. Encendemos el objeto
        data.sprite.visible = true; 
        
        // 3. FIJAMOS OPACIDAD AL MÁXIMO (Sólido y Claro)
        // Eliminamos la animación matemática (sin, elapsedTime, phaseOffset, speed).
        data.sprite.material.opacity = 1.0; 

        // Update scale based on textScale state (mantenemos esto para que el control funcione)
        const scaleFactor = [0.5, 0.75, 1, 1.5, 2.5][textScaleRef.current];
        data.sprite.scale.set(
          data.sprite.userData.baseScale.x * scaleFactor,
          data.sprite.userData.baseScale.y * scaleFactor,
          1
        );
      });

      renderer.render(scene, camera);
      window.requestAnimationFrame(tick);
    };

    tick();

    // --- Resize Handler ---
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener('resize', handleResize);

    // --- Cleanup ---
    return () => {
      window.removeEventListener('resize', handleResize);
      controls.removeEventListener('change', handleControlsChange);
      clearTimeout(zoomTimeout);
      textSprites.forEach(data => {
        data.sprite.material.dispose();
        data.sprite.material.map?.dispose();
      });
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      geometry?.dispose();
      material?.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <div ref={mountRef} className="absolute inset-0" />
      <div 
        ref={overlayRef}
        className="absolute inset-0 bg-white pointer-events-none z-20"
        style={{ opacity: 0 }}
      />
      
      {/* Controles de Texto Flotantes (Diseño Premium lateral plegable) */}
      <div className={`absolute right-0 top-1/2 -translate-y-1/2 flex items-center z-40 transition-transform duration-500 ease-in-out ${isControlsOpen ? 'translate-x-0' : 'translate-x-[calc(100%-12px)]'}`}>
        
        {/* Flecha Sutil (Trigger) */}
        <button 
          onClick={() => setIsControlsOpen(!isControlsOpen)}
          className="w-8 h-12 flex items-center justify-center bg-black/40 backdrop-blur-xl border-l border-y border-white/10 rounded-l-xl text-white/40 hover:text-white transition-all shadow-xl"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={`transition-transform duration-500 ${isControlsOpen ? 'rotate-0' : 'rotate-180'}`}
          >
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>

        {/* Píldora de Control */}
        <div className="flex flex-col items-center p-4 rounded-3xl bg-black/40 backdrop-blur-2xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.6)] w-20 gap-5 mr-4 ml-1 transition-all duration-300 hover:bg-black/50">
          
          {/* Icono de Texto */}
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 7V4h16v3M9 20h6M12 4v16"/>
            </svg>
          </div>

          {/* Slider Vertical */}
          <div className="h-40 flex items-center justify-center py-4 relative w-full">
            <input 
              type="range" 
              min="0" 
              max="4" 
              step="1" 
              value={textScale} 
              onChange={(e) => setTextScale(parseInt(e.target.value))}
              className="absolute w-32 h-1.5 -rotate-90 bg-white/10 rounded-full appearance-none cursor-pointer accent-white transition-all hover:bg-white/20"
              style={{
                outline: 'none',
                WebkitAppearance: 'none'
              }}
            />
          </div>

          {/* Etiqueta de valor */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] text-white font-bold bg-white/10 px-2.5 py-1 rounded-lg uppercase tracking-tight min-w-[50px] text-center">
              {textScaleLabels[textScale].substring(0, 3)}
            </span>
            <span className="text-[7px] text-white/30 uppercase tracking-[0.2em] font-black mt-1">Size</span>
          </div>
        </div>
      </div>

      {/* Mensaje de Continuar Zoom */}
      <div 
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 transition-all duration-1000 ${showContinueZoom ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      >
        <span className="text-white/30 text-2xl md:text-4xl font-serif italic tracking-[0.2em] uppercase whitespace-nowrap">
          Continúa haciendo zoom
        </span>
      </div>
    </div>
  );
};

export default Galaxy;
