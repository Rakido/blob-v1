const vertexShader = `varying vec2 vUv;
varying float vDistort;

uniform float uTime;
uniform float uSpeed;
uniform float uNoiseStrength;
uniform float uNoiseDensity;
uniform float uFreq;
uniform float uAmp;
uniform float uOffset;

float noise(vec3 p) {
  return fract(sin(dot(p, vec3(12.9898, 78.233, 151.7182))) * 43758.5453);
}

float pnoise(vec3 p, vec3 rep) {
  vec3 fl = floor(p);
  vec3 fr = fract(p);
  fr = fr * fr * (3.0 - 2.0 * fr);

  return mix(
      mix(
          mix(noise(fl), noise(fl + vec3(1.0, 0.0, 0.0)), fr.x),
          mix(noise(fl + vec3(0.0, 1.0, 0.0)), noise(fl + vec3(1.0, 1.0, 0.0)), fr.x),
          fr.y
      ),
      mix(
          mix(noise(fl + vec3(0.0, 0.0, 1.0)), noise(fl + vec3(1.0, 0.0, 1.0)), fr.x),
          mix(noise(fl + vec3(0.0, 1.0, 1.0)), noise(fl + vec3(1.0, 1.0, 1.0)), fr.x),
          fr.y
      ),
      fr.z
  );
}

vec3 rotateY(vec3 v, float angle) {
  float s = sin(angle);
  float c = cos(angle);
  mat3 rot = mat3(c, 0, s, 0, 1, 0, -s, 0, c);
  return v * rot;
}


float map(float value, float inMin, float inMax, float outMin, float outMax) {
  return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
}

void main() {
  vUv = uv;
  
  float t = uTime * uSpeed;
  float distortion = pnoise((normal + t) * uNoiseDensity, vec3(10.0)) * uNoiseStrength;

  vec3 pos = position + (normal * distortion);
  float angle = sin(uv.y * uFreq + t) * uAmp;
  pos = rotateY(pos, angle);

  // Grow of the shape
  pos *= map(cos(uTime + uOffset), -1.0, 1.0, 1.0, 1.2);

  vDistort = distortion;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.);
}`

const fragmentShader = `varying vec2 vUv;
varying float vDistort;

uniform float uTime;
uniform float uHue;
uniform float uAlpha;

vec3 cosPalette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(6.28318 * (c * t + d));
}   

void main() {
  float distort = vDistort * 2.0;

  vec3 brightness = vec3(0,5, 0.5, 0.5);
  vec3 contrast = vec3(0.5, 0.5, 0.5);
  vec3 oscilation = vec3(1.0, 1.0, 1.0);
  vec3 phase = vec3(0.0, 0.1, 0.2);

  vec3 color = cosPalette(uHue + distort, brightness, contrast, oscilation, phase);

  gl_FragColor = vec4(color, uAlpha);
}`

// Create a scene
const scene = new THREE.Scene();

// Create a camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// Create a renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const options = {
  speed: 0.45,
  density: 1.0,
  strength: 0.3,
  offset: Math.PI * 2,
  color: 1.0
}

// Create a cube
//const geometry = new THREE.IcosahedronGeometry(2, 1);
const geometry = new THREE.SphereGeometry(2, 64, 8); 

// Define custom shader material with uniforms
const material = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    uTime: { value: 0 },
    uSpeed: { value: options.speed },
    uNoiseDensity: { value: options.density },
    uNoiseStrength: { value: options.strength },
    uFreq: { value: 3 },
    uAmp: { value: 3 },
    uHue: { value: options.color },
    uOffset: { value: options.offset },
    red: { value: 0 },
    green: { value: 0 },
    blue: { value: 0 },
    uAlpha: { value: 1.0 },
  },
  defines: {
    PI: Math.PI
  },
  // wireframe: true,
  // side: THREE.DoubleSide
  transparent: true,
});

const cube = new THREE.Mesh(geometry, material);
scene.add(cube);


const clock = new THREE.Clock()

// Create an animation function to rotate the cube
const animate = () => {
    requestAnimationFrame(animate);

    cube.rotation.y += 0.001;
    cube.rotation.z -= 0.001;
    cube.material.uniforms.uTime.value = clock.getElapsedTime();
    renderer.render(scene, camera);
};
window.addEventListener('resize', onWindowResize);
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
// Call the animation function
animate();