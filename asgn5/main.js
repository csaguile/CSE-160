import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

// SCENE + CAMERA + RENDERER
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(10, 7, 14);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// MOUSE CONTROLS
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1, 0);

// TEXTURED SKYBOX
const cubeLoader = new THREE.CubeTextureLoader();
scene.background = cubeLoader.load([
  './textures/Tantolunden4/posx.jpg',
  './textures/Tantolunden4/negx.jpg',
  './textures/Tantolunden4/posy.jpg',
  './textures/Tantolunden4/negy.jpg',
  './textures/Tantolunden4/posz.jpg',
  './textures/Tantolunden4/negz.jpg'
]);

// LIGHTS: ambient + directional + point + spot = at least 3 different kinds
const ambient = new THREE.AmbientLight(0xffffff, 0.35);
scene.add(ambient);

const moonLight = new THREE.DirectionalLight(0xddeeff, 1.2);
moonLight.position.set(-5, 12, 8);
moonLight.castShadow = true;
scene.add(moonLight);

const fireLight = new THREE.PointLight(0xff8b2c, 3, 18);
fireLight.position.set(0, 1.6, 0);
fireLight.castShadow = true;
scene.add(fireLight);

const spotlight = new THREE.SpotLight(0xfff4cf, 1.3, 18, Math.PI / 7, 0.45, 1.2);
spotlight.position.set(5, 8, 5);
spotlight.target.position.set(0, 0, 0);
spotlight.castShadow = true;
scene.add(spotlight, spotlight.target);

// TEXTURES
const textureLoader = new THREE.TextureLoader();
const grassTexture = textureLoader.load('https://threejs.org/examples/textures/terrain/grasslight-big.jpg');
grassTexture.wrapS = THREE.RepeatWrapping;
grassTexture.wrapT = THREE.RepeatWrapping;
grassTexture.repeat.set(8, 8);

const woodTexture = textureLoader.load('https://threejs.org/examples/textures/hardwood2_diffuse.jpg');
woodTexture.wrapS = THREE.RepeatWrapping;
woodTexture.wrapT = THREE.RepeatWrapping;

// PRIMARY SHAPE 1: textured ground cylinder
const ground = new THREE.Mesh(
  new THREE.CylinderGeometry(12, 12, 0.3, 72),
  new THREE.MeshStandardMaterial({ map: grassTexture, roughness: 0.9 })
);
ground.position.y = -0.15;
ground.receiveShadow = true;
scene.add(ground);

// PRIMARY SHAPE 2: campfire stones, 12 torus shapes
const stoneMaterial = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.8 });
const stones = [];
for (let i = 0; i < 12; i++) {
  const angle = (i / 12) * Math.PI * 2;
  const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.42), stoneMaterial);
  stone.position.set(Math.cos(angle) * 1.55, 0.28, Math.sin(angle) * 1.55);
  stone.scale.set(1.2, 0.45, 0.8);
  stone.rotation.set(Math.random(), Math.random(), Math.random());
  stone.castShadow = true;
  stone.receiveShadow = true;
  scene.add(stone);
  stones.push(stone);
}

// PRIMARY SHAPE 3: textured wooden logs, 5 cylinders
const logMaterial = new THREE.MeshStandardMaterial({ map: woodTexture, roughness: 0.7 });
const logs = [];
for (let i = 0; i < 5; i++) {
  const log = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 3.1, 24), logMaterial);
  log.position.set(0, 0.45 + i * 0.02, 0);
  log.rotation.z = Math.PI / 2;
  log.rotation.y = (i / 5) * Math.PI;
  log.castShadow = true;
  scene.add(log);
  logs.push(log);
}

// ANIMATED FLAMES: cone shapes
const flames = [];
const flameColors = [0xff3b00, 0xff8b00, 0xffe066];
for (let i = 0; i < 3; i++) {
  const flame = new THREE.Mesh(
    new THREE.ConeGeometry(0.65 - i * 0.14, 2.0 - i * 0.28, 32),
    new THREE.MeshStandardMaterial({ color: flameColors[i], emissive: flameColors[i], emissiveIntensity: 0.7, transparent: true, opacity: 0.75 })
  );
  flame.position.y = 1.05 + i * 0.18;
  flame.rotation.y = i * 0.7;
  scene.add(flame);
  flames.push(flame);
}

// Trees: cylinders + cones. This adds many primary shapes and makes the world feel complete.
const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x6b3f25, roughness: 0.8 });
const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x1f6b35, roughness: 0.9 });
const treeGroup = new THREE.Group();
const treePositions = [
  [-7, -5], [-5, 5], [-2, 8], [4, 7], [7, 2], [6, -6], [-8, 1], [0, -8]
];
for (const [x, z] of treePositions) {
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 2.2, 16), trunkMaterial);
  trunk.position.set(x, 1.1, z);
  trunk.castShadow = true;
  trunk.receiveShadow = true;

  const leaves = new THREE.Mesh(new THREE.ConeGeometry(1.2, 3, 24), leafMaterial);
  leaves.position.set(x, 3.1, z);
  leaves.castShadow = true;
  leaves.receiveShadow = true;

  treeGroup.add(trunk, leaves);
}
scene.add(treeGroup);

// Moon: sphere shape, animated
const moonTexture = textureLoader.load('./textures/moon.jpg');
const moon = new THREE.Mesh(
  new THREE.SphereGeometry(1, 32, 32),
  new THREE.MeshStandardMaterial({
    map: moonTexture,
    emissive: 0xffffbb,
    emissiveIntensity: 0.15
  })
);
moon.position.set(-7, 9, -8);
scene.add(moon);

// Fireflies: small glowing animated spheres
const fireflies = [];
for (let i = 0; i < 14; i++) {
  const bug = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xfff27a, emissive: 0xfff27a, emissiveIntensity: 1.6 })
  );
  bug.userData = {
    baseX: THREE.MathUtils.randFloatSpread(10),
    baseY: THREE.MathUtils.randFloat(1.2, 4.5),
    baseZ: THREE.MathUtils.randFloatSpread(10),
    speed: THREE.MathUtils.randFloat(0.6, 1.4),
    offset: Math.random() * Math.PI * 2
  };
  scene.add(bug);
  fireflies.push(bug);
}

// CUSTOM TEXTURED 3D MODEL loaded with GLTFLoader
// This satisfies the required textured 3D model. Replace this URL with your own .glb/.gltf if desired.
const mtlLoader = new MTLLoader();
mtlLoader.load('./models/12973_anemone_flower_v1_l2.mtl', (materials) => {
  materials.preload();

  const objLoader = new OBJLoader();
  objLoader.setMaterials(materials);

  objLoader.load(
    './models/12973_anemone_flower_v1_l2.obj',
    (object) => {
      
      object.position.set(3.8, 0.001, -2.2);
      //object.rotation.z = 50;
      object.scale.set(0.07, 0.07, 0.07);
      object.rotation.x = -Math.PI / 2;
      object.rotation.y = 0;

      object.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      scene.add(object);
    },
    undefined,
    (error) => console.error('OBJ model failed to load:', error)
  );
});

// Extra simple bench made out of cubes
const benchMaterial = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.75 });
for (let i = -1; i <= 1; i += 2) {
  const leg = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.7, 0.25), benchMaterial);
  leg.position.set(-3 + i * 0.7, 0.35, 2.8);
  leg.castShadow = true;
  scene.add(leg);
}
const benchSeat = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.25, 0.75), benchMaterial);
benchSeat.position.set(-3, 0.85, 2.8);
benchSeat.castShadow = true;
scene.add(benchSeat);

// ANIMATION LOOP
const clock = new THREE.Clock();
function animate() {
  const t = clock.getElapsedTime();

  flames.forEach((flame, i) => {
    flame.scale.setScalar(1 + Math.sin(t * 5 + i) * 0.08);
    flame.rotation.y += 0.02 + i * 0.006;
  });

  fireLight.intensity = 2.4 + Math.sin(t * 8) * 0.45;
  moon.rotation.y += 0.003;

  fireflies.forEach((bug) => {
    const d = bug.userData;
    bug.position.set(
      d.baseX + Math.sin(t * d.speed + d.offset) * 0.8,
      d.baseY + Math.sin(t * 1.8 + d.offset) * 0.35,
      d.baseZ + Math.cos(t * d.speed + d.offset) * 0.8
    );
  });

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

// Responsive canvas
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
