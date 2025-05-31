import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { RGBShiftShader } from 'three/addons/shaders/RGBShiftShader.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import gsap from 'gsap';
import LocomotiveScroll from 'locomotive-scroll';

const locomotiveScroll = new LocomotiveScroll();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 4;

// Load HDRI environment map
new RGBELoader()
    .load('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/qwantani_dusk_1_1k.hdr', function (texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = texture;
    });

let model;
const loader = new GLTFLoader();
loader.load(
    'textures/DamagedHelmet.gltf',
    function (gltf) {
        model = gltf.scene;

        // Get the bounding box of the model
        const bbox = new THREE.Box3().setFromObject(model);
        const size = bbox.getSize(new THREE.Vector3());

        // Get the largest dimension
        const maxDim = Math.max(size.x, size.y, size.z);

        // Calculate scale to make model fit in view
        const targetSize = 2; // Desired size in world units
        const scale = targetSize / maxDim;

        // Apply uniform scaling
        model.scale.setScalar(scale);

        // Center the model
        const center = bbox.getCenter(new THREE.Vector3());
        model.position.sub(center.multiplyScalar(scale));

        scene.add(model);
    },
    function (xhr) {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    function (error) {
        console.error('An error happened:', error);
    }
);

const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('canvas'), antialias: true,
    alpha: true
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;

window.addEventListener("mousemove", (ele) => {
    let x = ele.clientX / window.innerWidth;
    let y = ele.clientY / window.innerHeight;

    gsap.to(model.rotation, {
        y: x - 0.5,
        x: y - 0.5,
        duration: 0.5,
        ease: "power2.out"
    });
})

// Post processing setup
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const rgbShiftPass = new ShaderPass(RGBShiftShader);
rgbShiftPass.uniforms['amount'].value = 0.0025;
composer.addPass(rgbShiftPass);


window.addEventListener("resize", (ele) => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);

    // Adjust camera position based on aspect ratio to maintain model size
    if (window.innerWidth < window.innerHeight) {
        camera.position.z = 5; // Move camera back for portrait orientation
    } else {
        camera.position.z = 4; // Default position for landscape
    }
});

function animate() {
    window.requestAnimationFrame(animate);
    composer.render();
}
animate();