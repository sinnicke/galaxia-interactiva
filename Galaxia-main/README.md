<div align="center"> 
   <img src="https://cyluk.com/logo.svg" width="150" alt="Logo de CyLuk" style="margin-bottom: 20px;"/> 
   
   <h1 style="border-bottom: none; color: #1F2937; font-family: sans-serif; font-size: 2.5em; margin-bottom: 5px;"> 
     Galaxia: Procedural Universe 
   </h1> 
   <p style="color: #6B7280; font-size: 1.2em; margin-top: 0; font-weight: normal;"> 
     Simulación de Galaxia Espiral con Shaders Custom y +300k Partículas 
   </p> 
 
   <p> 
     <img src="https://img.shields.io/badge/Versión-V1.0_Stable-2563EB?style=for-the-badge" alt="Versión 1.0"/> 
     <img src="https://img.shields.io/badge/Estado-Publicado_en_GitHub-success?style=for-the-badge&logo=github" alt="Estado GitHub"/> 
   </p> 
 </div> 
 <div align="center"> 
   <img src="https://threejs.org/files/icon.png" width="80" alt="Three.js Logo"> 
   <h1 style="color: #1d4ed8;">GALAXY GENERATOR & SHADER ENGINE</h1> 
   <p><b>Por Cyluk</b></p> 
   <p><i>"El universo no es solo matemáticas; es arte renderizado a 60 FPS."</i></p> 
   
   <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
   <img src="https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white" alt="Three.js" />
   <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
   <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
 </div> 
 
 --- 
 
 ## 📖 El Origen (Por qué existe esto) 
 
 Todo comenzó con el deseo de recrear la inmensidad del cosmos en una sola página web. Quería un sistema que no solo mostrara puntos aleatorios, sino que simulara la estructura orgánica de una galaxia espiral: brazos definidos, un núcleo denso, nubes de cúmulos estelares y, por supuesto, los violentos jets de energía de un agujero negro supermasivo.
 
 No me conformo con soluciones prefabricadas. 
 
 Este proyecto es un experimento técnico sobre cómo optimizar el renderizado de cientos de miles de partículas en tiempo real, utilizando **Custom Shaders (GLSL)** para delegar la carga matemática a la GPU y lograr una fluidez cinematográfica incluso en dispositivos móviles. 
 
 --- 
 
 ## ⚠️ DISCLAIMER LEGAL (Léelo) 
 
 <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; color: #7f1d1d;"> 
   <strong>ADVERTENCIA DE DERECHOS:</strong><br> 
   Este repositorio y su contenido son propiedad intelectual de <b>Cyluk</b>. <br><br> 
   <b>© Todos los derechos reservados.</b> El diseño de la galaxia, los algoritmos de generación procedimental y la integración de shaders son autoría original. Queda prohibida la redistribución comercial sin atribución o permiso previo. El uso del logo de CyLuk está restringido a proyectos oficiales. 
 </div> 
 
 --- 
 
 ## 🔬 La Ciencia Estelar (Cómo funciona) 
 
 La galaxia se genera dinámicamente mediante algoritmos que simulan la distribución de masa estelar. No hay modelos 3D cargados; todo es geometría generada por código.
 
 ### 1. Distribución Espiral Logarítmica
 Los brazos de la galaxia siguen una progresión angular basada en el radio, donde la posición de cada estrella se calcula como:
 
 $$ \theta = \text{branchAngle} + (r \times \text{spin}) + \text{randomness} $$
 
 Para lograr un aspecto orgánico, implementé **Ondas de Densidad** mediante una función de seno que concentra partículas en bandas específicas:
 
 $$ r_{base} = r_{base} + \sin(r_{base} \times \pi \times 8) \times 0.015 $$
 
 ### 2. Shaders de Partículas (GLSL)
 El corazón visual son los Shaders personalizados. El **Vertex Shader** no solo posiciona los puntos, sino que anima los **SMBH Jets** (Chorros del Agujero Negro) calculando trayectorias parabólicas en tiempo real:
 
 ```glsl
 float progress = fract(aJetParams.x + uTime * 0.3);
 float jetY = pow(progress, 1.5) * uRadius * 1.4 * aJetParams.y;
 float jetR = aJetParams.w + aJetParams.z * pow(abs(jetY), 1.4);
 ```
 
 ### 3. Transiciones Escénicas
 El motor detecta el nivel de zoom y realiza una interpolación logarítmica para transicionar entre la vista de **Galaxia Global** y el **Campo Estelar Local** (Escena 2), permitiendo una inmersión total sin pantallas de carga.
 
 --- 
 
 ## 🛠️ Guía de Ejecución (Paso a Paso) 
 
 Si quieres correr este universo en tu máquina local:
 
 ### 1. Clonar e Instalar
 ```bash
 git clone https://github.com/Cyluk-dev/Galaxia
 cd Galaxia
 npm install
 ```
 
 ### 2. Modo Desarrollo
 ```bash
 npm run dev
 ```
 
 ### 3. Build de un Solo Archivo (Single File)
 Este proyecto está configurado para generar un build ultra-portable:
 ```bash
 npm run build
 ```
 El resultado será un único archivo `dist/index.html` que contiene todo el JS, CSS y Assets incrustados.
 
 --- 
 
 ## 💻 Tecnologías Usadas 
 * **Three.js**: Motor principal de WebGL para el renderizado 3D.
 * **React**: Gestión del estado de la interfaz y ciclo de vida de la escena.
 * **GLSL**: Shaders personalizados para efectos de partículas y jets de energía.
 * **Tailwind CSS**: Estilizado de la UI lateral premium.
 * **Vite SingleFile**: Empaquetado de todo el universo en un solo archivo HTML de distribución.
 
 --- 
 <div align="center"> 
   <p><i>Creado por Cyluk. <br>El código es el lenguaje con el que escribimos las estrellas.</i></p> 
 </div> 
