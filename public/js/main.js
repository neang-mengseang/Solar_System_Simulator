// Texture file paths
const TEXTURE_PATHS = {
  sun: "./public/textures/2k_sun.jpg",
  earth: {
    map: "./public/textures/2k_earth.jpg",
    bump: "./public/textures/2k_earth_normal_map.jpg",
    night: "./public/textures/2k_earth_nightmap.jpg",
    specular: "./public/textures/2k_earth_specular_map.jpg",
  },
  mercury: "./public/textures/2k_mercury.jpg",
  venus: "./public/textures/2k_venus.jpg",
  mars: "./public/textures/2k_mars.jpg",
  jupiter: "./public/textures/2k_jupiter.jpg",
  saturn: "./public/textures/2k_saturn.jpg",
  uranus: "./public/textures/2k_uranus.jpg",
  neptune: "./public/textures/2k_neptune.jpg",
  saturnRing: "./public/textures/2k_saturn_ring.png",
};

const defaultPlanetsData = [
  {
    name: "mercury",
    size: 0.4,
    orbitRadius: 10,
    orbitSpeed: 0.02,
    rotationSpeed: 0.01,
  },
  {
    name: "venus",
    size: 0.6,
    orbitRadius: 15,
    orbitSpeed: 0.015,
    rotationSpeed: -0.005,
  },
  {
    name: "earth",
    size: 0.6,
    orbitRadius: 20,
    orbitSpeed: 0.01,
    rotationSpeed: 0.02,
  },
  {
    name: "mars",
    size: 0.5,
    orbitRadius: 25,
    orbitSpeed: 0.008,
    rotationSpeed: 0.015,
  },
  {
    name: "jupiter",
    size: 1.2,
    orbitRadius: 35,
    orbitSpeed: 0.004,
    rotationSpeed: 0.04,
  },
  {
    name: "saturn",
    size: 1.0,
    orbitRadius: 45,
    orbitSpeed: 0.002,
    rotationSpeed: 0.03,
    hasRing: true,
  },
  {
    name: "uranus",
    size: 0.8,
    orbitRadius: 55,
    orbitSpeed: 0.0015,
    rotationSpeed: 0.02,
  },
  {
    name: "neptune",
    size: 0.8,
    orbitRadius: 65,
    orbitSpeed: 0.001,
    rotationSpeed: 0.015,
  },
];

const defaultValues = {};
defaultPlanetsData.forEach((planet) => {
  defaultValues[planet.name.toLowerCase()] = planet;
});

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Camera position
camera.position.set(0, 50, 50);

// Orbit controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 20;
controls.maxDistance = 500;

// Ambient light
scene.add(new THREE.AmbientLight(0x111111));

// Stars background
function createStars() {
  const starsGeometry = new THREE.BufferGeometry();
  const starsMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.1,
    transparent: true,
  });

  const starsVertices = [];
  for (let i = 0; i < 10000; i++) {
    starsVertices.push(
      (Math.random() - 0.5) * 2000,
      (Math.random() - 0.5) * 2000,
      (Math.random() - 0.5) * 2000
    );
  }

  starsGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(starsVertices, 3)
  );
  scene.add(new THREE.Points(starsGeometry, starsMaterial));
}
createStars();

// Texture loader with progress
const textureLoader = new THREE.TextureLoader();
let loadedTextures = 0;
let totalTextures = 0;

function updateLoading() {
  const percent = Math.round((loadedTextures / totalTextures) * 100);
  const bar = document.getElementById("loading-bar");
  const text = document.getElementById("loading-text");
  if (bar) bar.style.width = `${percent}%`;
  if (text) text.textContent = `Loading textures... ${percent}%`;
}

function loadTextureWithProgress(path) {
  totalTextures++;
  updateLoading();

  return new Promise((resolve) => {
    textureLoader.load(
      path,
      (texture) => {
        loadedTextures++;
        updateLoading();
        resolve(texture);
      },
      undefined,
      () => {
        console.warn(`Failed to load texture: ${path}`);
        loadedTextures++;
        updateLoading();

        const canvas = document.createElement("canvas");
        canvas.width = 2;
        canvas.height = 2;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = path.includes("sun")
          ? "#ffff00"
          : path.includes("earth")
          ? "#1a66ff"
          : path.includes("mars")
          ? "#ff3300"
          : "#aaaaaa";
        ctx.fillRect(0, 0, 2, 2);
        resolve(new THREE.CanvasTexture(canvas));
      }
    );
  });
}

// Sun
async function createSun() {
  const sunGeometry = new THREE.SphereGeometry(5, 64, 64);
  const sunTexture = await loadTextureWithProgress(TEXTURE_PATHS.sun);

  const sunMaterial = new THREE.MeshBasicMaterial({
    map: sunTexture,
    color: 0xffff00,
    emissive: 0xffff00,
    emissiveIntensity: 1,
  });

  const sun = new THREE.Mesh(sunGeometry, sunMaterial);
  sun.castShadow = sun.receiveShadow = true;

  const sunLight = new THREE.PointLight(0xffffaa, 1, 200);
  sunLight.shadow.mapSize.set(4096, 4096);

  const sunGroup = new THREE.Group();
  sunGroup.add(sun, sunLight);
  scene.add(sunGroup);

  return sunGroup;
}

// Orbit ring
function createOrbit(radius) {
  const orbitGeometry = new THREE.BufferGeometry();
  const orbitMaterial = new THREE.LineBasicMaterial({
    color: 0x444444,
    transparent: true,
    opacity: 0.3,
  });

  const points = [];
  const segments = 128;
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    points.push(
      new THREE.Vector3(radius * Math.cos(theta), 0, radius * Math.sin(theta))
    );
  }

  orbitGeometry.setFromPoints(points);
  const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
  scene.add(orbit);
  return orbit;
}

// Planet
async function createPlanet(
  name,
  size,
  orbitRadius,
  orbitSpeed,
  rotationSpeed,
  hasRing = false
) {
  if (name === "earth") {
    // Load Earth textures including night texture
    const dayTexture = await loadTextureWithProgress(TEXTURE_PATHS.earth.map);
    const nightTexture = await loadTextureWithProgress(
      TEXTURE_PATHS.earth.night
    );
    const bumpMap = await loadTextureWithProgress(TEXTURE_PATHS.earth.bump);

    // Earth Shader Material
    const earthMaterial = new THREE.ShaderMaterial({
      uniforms: {
        dayTexture: { value: dayTexture },
        nightTexture: { value: nightTexture },
        lightDirection: { value: new THREE.Vector3(1, 0, 0) },
      },
      vertexShader: `
                varying vec3 vNormal;
                varying vec2 vUv;
                varying vec3 vPosition;

                void main() {
                    vUv = uv;
                    vNormal = normalize(normalMatrix * normal);
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
      fragmentShader: `
                uniform sampler2D dayTexture;
                uniform sampler2D nightTexture;
                uniform vec3 lightDirection;

                varying vec3 vNormal;
                varying vec2 vUv;
                varying vec3 vPosition;

                void main() {
                    // Calculate lighting intensity (dot product of normal and light direction)
                    float intensity = max(dot(normalize(vNormal), normalize(lightDirection)), 0.0);
                    
                    // Add some ambient light to prevent complete darkness
                    float ambient = 0.3;
                    intensity = max(intensity, ambient);
                    
                    // Get texture colors
                    vec4 dayColor = texture2D(dayTexture, vUv);
                    vec4 nightColor = texture2D(nightTexture, vUv);
                    
                    // Enhance night lights only in bright areas of night texture
                    vec3 nightLights = nightColor.rgb * smoothstep(0.1, 0.3, nightColor.r);
                    
                    // Smooth transition between day and night
                    float transition = smoothstep(0.3, 0.5, intensity);
                    
                    // Final color blend
                    vec3 finalColor = mix(nightLights * 0.6, dayColor.rgb, transition);
                    
                    gl_FragColor = vec4(finalColor, 1.0);
                }
            `,
    });

    const planetGeometry = new THREE.SphereGeometry(size, 64, 64);
    const planet = new THREE.Mesh(planetGeometry, earthMaterial);
    planet.castShadow = planet.receiveShadow = true;
    planet.name = name;

    // Add ring if needed
    if (hasRing) {
      let ringTexture = await loadTextureWithProgress(TEXTURE_PATHS.saturnRing);
      const ringGeometry = new THREE.RingGeometry(size * 1.5, size * 2.5, 64);
      const ringMaterial = new THREE.MeshPhongMaterial({
        map: ringTexture,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2;
      planet.add(ring);
    }

    createOrbit(orbitRadius);
    planet.position.set(orbitRadius, 0, 0);

    // Function to update light direction uniform dynamically
    planet.material.userData.updateLight = (sunPosition) => {
      planet.material.uniforms.lightDirection.value.copy(
        sunPosition.clone().sub(planet.position).normalize()
      );
    };

    return {
      mesh: planet,
      orbitRadius,
      orbitSpeed,
      rotationSpeed,
      angle: Math.random() * Math.PI * 2,

      size,
    };
  } else {
    // For other planets, use existing method with MeshPhongMaterial
    const texturePath =
      typeof TEXTURE_PATHS[name] === "string"
        ? TEXTURE_PATHS[name]
        : TEXTURE_PATHS[name].map;
    const texture = await loadTextureWithProgress(texturePath);

    let bumpMap = null,
      specularMap = null;
    if (name === "earth") {
      bumpMap = await loadTextureWithProgress(TEXTURE_PATHS.earth.bump);
      specularMap = await loadTextureWithProgress(TEXTURE_PATHS.earth.specular);
    }

    const planetGeometry = new THREE.SphereGeometry(size, 64, 64);
    const planetMaterial = new THREE.MeshPhongMaterial({
      map: texture,
      bumpMap: bumpMap || null,
      specularMap: specularMap || null,
      specular: new THREE.Color("grey"),
    });

    const planet = new THREE.Mesh(planetGeometry, planetMaterial);
    planet.castShadow = planet.receiveShadow = true;
    planet.name = name;

    // Add rings for Saturn specifically
    if (hasRing) {
      let ringTexture = await loadTextureWithProgress(TEXTURE_PATHS.saturnRing);
      const ringGeometry = new THREE.RingGeometry(size * 1.5, size * 2.5, 64);
      const ringMaterial = new THREE.MeshPhongMaterial({
        map: ringTexture,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2;
      planet.add(ring);
    }

    createOrbit(orbitRadius);
    planet.position.set(orbitRadius, 0, 0);

    return {
      mesh: planet,
      orbitRadius,
      orbitSpeed,
      rotationSpeed,
      angle: Math.random() * Math.PI * 2,
    };
  }
}

// All planets
async function createAllPlanets() {
  const planets = [];
  for (const data of defaultPlanetsData) {
    planets.push(
      await createPlanet(
        data.name,
        data.size,
        data.orbitRadius,
        data.orbitSpeed,
        data.rotationSpeed,
        data.hasRing
      )
    );
  }
  return planets;
}

function createPlanetCard(planet, index, defaultValues) {
  const card = document.createElement("div");
  card.className =
    "opacity-50 hover:opacity-100 hover:scale-[1.01] cursor-pointer bg-indigo-900 bg-opacity-80 backdrop-blur-md p-4 rounded-2xl shadow-xl mb-4 border border-indigo-600 border-opacity-70 text-indigo-200 hover:shadow-indigo-500/50 transition-all duration-300";

  const title = document.createElement("h3");
  title.className = "text-lg font-semibold mb-2";
  title.textContent = `${
    planet.mesh.name.charAt(0).toUpperCase() + planet.mesh.name.slice(1)
  }`;
  card.appendChild(title);

  // Reset button
  const resetBtn = document.createElement("button");
  resetBtn.textContent = "Reset";
  resetBtn.className =
    "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-xs font-semibold py-1 px-3 rounded-full mb-3 shadow hover:shadow-lg transition duration-300";
  card.appendChild(resetBtn);

  const properties = [
    { key: "orbitSpeed", label: "Orbit Speed", min: 0, max: 0.1, step: 0.001 },
    {
      key: "rotationSpeed",
      label: "Rotation Speed",
      min: 0,
      max: 0.1,
      step: 0.001,
    },
    { key: "orbitRadius", label: "Orbit Radius", min: 10, max: 80, step: 1 },
    { key: "size", label: "Size", min: 0.5, max: 5, step: 0.1 },
  ];

  const inputs = {};

  properties.forEach((prop) => {
    const wrapper = document.createElement("div");
    wrapper.className = "mb-4";

    // Label + Value Row
    const labelRow = document.createElement("div");
    labelRow.className = "flex justify-between items-center mb-1";

    const label = document.createElement("label");
    label.className = "text-sm";
    label.textContent = prop.label;

    const valueDisplay = document.createElement("span");
    valueDisplay.className = "text-xs text-indigo-300 select-none";
    valueDisplay.textContent =
      planet[prop.key]?.toFixed(2) ??
      defaultValues?.[prop.key]?.toFixed(2) ??
      "";

    labelRow.appendChild(label);
    labelRow.appendChild(valueDisplay);
    wrapper.appendChild(labelRow);

    // Slider input
    const input = document.createElement("input");
    input.type = "range";
    input.step = prop.step.toString();
    input.min = prop.min;
    input.max = prop.max;
    input.value = planet[prop.key] ?? defaultValues?.[prop.key] ?? "";
    input.className = "w-full accent-indigo-500";

    input.addEventListener("input", (e) => {
      const value = parseFloat(e.target.value);
      if (isNaN(value)) return;

      planet[prop.key] = value;
      valueDisplay.textContent = value.toFixed(2);

      if (prop.key === "size") {
        planet.mesh.scale.set(value, value, value);
      } else if (prop.key === "orbitRadius") {
        planet.mesh.position.set(value, 0, 0);
        if (planet.orbit) {
          scene.remove(planet.orbit);
        }
        planet.orbit = createOrbit(value);
      }
    });

    inputs[prop.key] = input;
    wrapper.appendChild(input);
    card.appendChild(wrapper);
  });

  // ✅ Reset button works here
  resetBtn.addEventListener("click", () => {
    properties.forEach(({ key }) => {
      const value = defaultValues[key];
      planet[key] = value;

      if (key === "size") {
        planet.mesh.scale.set(value, value, value);
      } else if (key === "orbitRadius") {
        planet.mesh.position.set(value, 0, 0);
        if (planet.orbit) {
          scene.remove(planet.orbit);
        }
        planet.orbit = createOrbit(value);
      }

      // Update the input field
      inputs[key].value = value;
    });
  });

  document.getElementById("planet-cards").appendChild(card);
}

function resetPlanetProperties(planet, inputs, defaultValues) {
  Object.keys(defaultValues).forEach((key) => {
    planet[key] = defaultValues[key];

    if (key === "size") {
      planet.mesh.scale.set(planet.size, planet.size, planet.size);
    } else if (key === "orbitRadius") {
      planet.mesh.position.set(planet.orbitRadius, 0, 0);
      if (planet.orbit) {
        scene.remove(planet.orbit);
      }
      planet.orbit = createOrbit(planet.orbitRadius);
    }

    // Update the input element visually
    if (inputs[key]) {
      inputs[key].value = planet[key];
    }
  });
}



// Init
async function init() {
  const sun = await createSun();
  const planets = await createAllPlanets();
  document.getElementById("reset-button").addEventListener("click", () => {
    defaultPlanetsData.forEach((defaults, i) => {
    const p = planets[i];
    if (!p || !p.mesh) return; // skip if undefined or missing mesh

    // Reset planet properties safely
    Object.assign(p, defaults);

    // Reset mesh scale
    p.mesh.scale.set(p.size, p.size, p.size);

    // Reset position
    p.mesh.position.set(p.orbitRadius, 0, 0);

    // Remove old orbit and create a new one
    if (p.orbit) scene.remove(p.orbit);
    p.orbit = createOrbit(p.orbitRadius);
    });


    document.getElementById("planet-cards").innerHTML = "";
    planets.forEach((planet, i) => createPlanetCard(planet, i));
  });

  // Add all planets to scene and create UI cards
  planets.forEach((planet, index) => {
    scene.add(planet.mesh);
    createPlanetCard(planet, index, defaultPlanetsData[index]);
  });

  setTimeout(() => {
    document.getElementById("loading").style.display = "none";
  }, 1000); // 1-second delay

  // === Planet Selection ===
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let selectedPlanet = null;

  function onClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(planets.map((p) => p.mesh));
    if (intersects.length > 0) {
      selectedPlanet = intersects[0].object;
      planets.forEach((p) => {
        if (p.mesh.material.emissive) {
          p.mesh.material.emissive.set(0x000000);
        }
      });
      if (selectedPlanet.material.emissive) {
        selectedPlanet.material.emissive.set(0x333333);
      }
    }
  }
  window.addEventListener("click", onClick);

  // === Animation Loop ===
  function animate() {
    requestAnimationFrame(animate);

    planets.forEach((planet) => {
      planet.angle += planet.orbitSpeed;
      planet.mesh.position.x = Math.cos(planet.angle) * planet.orbitRadius;
      planet.mesh.position.z = Math.sin(planet.angle) * planet.orbitRadius;
      planet.mesh.rotation.y += planet.rotationSpeed;

      // Update lighting for Earth shader
      if (planet.mesh.name === "earth") {
        const sunWorldPos = new THREE.Vector3();
        sun.getWorldPosition(sunWorldPos);

        const earthWorldPos = new THREE.Vector3();
        planet.mesh.getWorldPosition(earthWorldPos);

        const lightDir = sunWorldPos.clone().sub(earthWorldPos).normalize();
        planet.mesh.material.uniforms.lightDirection.value.copy(lightDir);
      }
    });

    sun.rotation.y += 0.005;
    controls.update();
    renderer.render(scene, camera);
  }

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  animate();
}

init();
