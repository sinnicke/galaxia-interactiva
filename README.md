<div align="center"> 
  <img src="https://cyluk.com/logo.svg" width="150" alt="Logo" style="margin-bottom: 20px;"/> 
  
  <h1 style="border-bottom: none; color: #1F2937; font-family: sans-serif; font-size: 2.5em; margin-bottom: 5px;"> 
    Galaxia: Procedural Universe 🌌
  </h1> 
  <p style="color: #6B7280; font-size: 1.2em; margin-top: 0; font-weight: normal;"> 
    Generador Procedimental en WebGL con Custom Shaders y Matemáticas 3D
  </p> 

  <p> 
    <img src="https://img.shields.io/badge/Versión-V1.0_Stable-2563EB?style=for-the-badge" alt="Versión 1.0"/> 
    <img src="https://img.shields.io/badge/Estado-Publicado_en_GitHub-success?style=for-the-badge&logo=github" alt="Estado GitHub"/> 
  </p> 
</div> 

<div align="center"> 
  <img src="https://threejs.org/files/icon.png" width="80" alt="Three.js Logo"> 
  <h2 style="color: #1d4ed8; margin-top: 10px;">GALAXY GENERATOR & SHADER ENGINE</h2> 
  <p><b>Por sinnicke</b></p> 
  <p><i>"El universo es increible"</i></p> 
  
  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white" alt="Three.js" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
</div> 

--- 

## 📖 Acerca del Proyecto

Todo comenzó con el deseo de recrear la inmensidad del cosmos en una sola página web. Este proyecto no es una simple web estática; es una **experiencia interactiva renderizada a 60 FPS** directamente en la tarjeta gráfica (GPU) del navegador. 

El objetivo principal fue construir un universo tridimensional sin utilizar ni un solo modelo 3D prefabricado, confiando el 100% de la arquitectura visual a fórmulas matemáticas puras, algoritmos de generación procedimental y shaders personalizados.

--- 

## 🔬 El Motor Matemático (Generación Procedimental)

La estructura estelar que ves en pantalla se calcula en tiempo real. Cientos de miles de partículas son distribuidas espacialmente utilizando dos conceptos matemáticos clave:

### 1. El Núcleo: La Superficie de Corazón de Taubin
Para el núcleo de la galaxia, se implementó un cúmulo estelar que forma un corazón tridimensional perfecto. Esto se logra mediante el método de **Rechazo de Monte Carlo** aplicado a la famosa ecuación algebraica de Taubin:

$$(x^2 + \frac{9}{4}y^2 + z^2 - 1)^3 - x^2 z^3 - \frac{9}{80} y^2 z^3 \le 0$$

El algoritmo genera coordenadas vectoriales `(x, y, z)` aleatorias y las evalúa contra esta inecuación. Si el punto cae dentro del volumen matemático, la partícula se dibuja; de lo contrario, se descarta para generar uno nuevo.

### 2. Los Brazos Espirales: Curvas de Arquímedes
Las estrellas exteriores (polvo estelar) siguen la lógica de una espiral arquimediana. La posición final de cada estrella se calcula derivando su ángulo en función de su distancia al centro:

* **Ángulo Base ($\theta$):** Se divide el círculo total ($2\pi$) en brazos matemáticamente idénticos.
* **Torvada Espiral (`spinAngle`):** El ángulo de giro crece exponencialmente según su radio ($r \times \text{spin}$).
* **Dispersión Estelar (`Randomness`):** Se aplica una función de potencia (`Math.pow(Math.random(), 3)`) para concentrar la mayoría de las estrellas en el núcleo del brazo espiral y dispersar el resto a los costados, simulando la atracción de gravedad real.

--- 

## 🚀 Arquitectura Técnica y Optimización

* **GLSL Custom Shaders:** La animación de "latido" mágico de las estrellas y el difuminado no sobrecargan la CPU. Se programaron `vertexShader` y `fragmentShader` personalizados para inyectar estas reglas matemáticas directo en la Tarjeta Gráfica (GPU), logrando fluidez extrema en dispositivos móviles.
* **Proyección 2D para Raycasting Avanzado:** Para solucionar el clásico problema de los "clics fantasma" del motor 3D, se desecharon los eventos globales. El sistema incluye un escudo lógico invisible (`Hitboxes`) emparejado a un `Raycaster` calibrado al milímetro que evita colisiones con la interfaz HTML superpuesta.
* **Transiciones Topológicas (Zoom Loop):** El sistema rastrea matemáticamente la distancia de la cámara (`OrbitControls`). Al cruzar un umbral crítico de acercamiento, el motor destruye el renderizado general de la galaxia e instancia un "Campo Estelar Local", creando la inmersión de un viaje hiperespacial sin un solo segundo de pantalla de carga.

--- 

## 🛠️ Guía de Ejecución (Local)

Si deseas correr esta simulación en tu propio entorno:

### 1. Clonar e Instalar
```bash
git clone [https://github.com/sinnicke/galaxia-interactiva.git](https://github.com/sinnicke/galaxia-interactiva.git)
cd galaxia-interactiva
npm install
```

### 2. Modo Desarrollo
```bash
npm run dev

