// --- THREE.JS CONFIGURATION ---
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x111111, 0.02);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap pixel ratio for performance
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('canvas-container').appendChild(renderer.domElement);

// --- LIGHTING ---
const ambientLight = new THREE.AmbientLight(0x404040, 2);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(-20, 50, 20);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 500;
dirLight.shadow.camera.left = -50;
dirLight.shadow.camera.right = 50;
dirLight.shadow.camera.top = 50;
dirLight.shadow.camera.bottom = -50;
scene.add(dirLight);

// Street Lights (Yellowish glow)
for (let z = -150; z < 50; z += 40) {
    const pl = new THREE.PointLight(0xffaa00, 0.6, 40);
    pl.position.set(0, 10, z);
    scene.add(pl);
}

// --- ENVIRONMENT ---
const roadGroup = new THREE.Group();
scene.add(roadGroup);

// Road Surface
const roadGeo = new THREE.PlaneGeometry(40, 400); // Widened road
const roadMat = new THREE.MeshPhongMaterial({ color: 0x222222, shininess: 10 });
const road = new THREE.Mesh(roadGeo, roadMat);
road.rotation.x = -Math.PI / 2;
road.position.z = -100;
road.receiveShadow = true;
roadGroup.add(road);

// Double Yellow Line
const yellowLineGeo = new THREE.PlaneGeometry(0.2, 400);
const yellowLineMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
const yellowLine1 = new THREE.Mesh(yellowLineGeo, yellowLineMat);
const yellowLine2 = new THREE.Mesh(yellowLineGeo, yellowLineMat);
yellowLine1.rotation.x = -Math.PI / 2; yellowLine1.position.set(-0.15, 0.02, -100);
yellowLine2.rotation.x = -Math.PI / 2; yellowLine2.position.set(0.15, 0.02, -100);
roadGroup.add(yellowLine1);
roadGroup.add(yellowLine2);

// Sidewalks (Left and Right)
const sidewalkGeo = new THREE.BoxGeometry(8, 0.4, 400);
const sidewalkMat = new THREE.MeshLambertMaterial({ color: 0x555555 });

const sidewalkL = new THREE.Mesh(sidewalkGeo, sidewalkMat);
sidewalkL.position.set(-18, 0.2, -100);
roadGroup.add(sidewalkL);

const sidewalkR = new THREE.Mesh(sidewalkGeo, sidewalkMat);
sidewalkR.position.set(18, 0.2, -100);
roadGroup.add(sidewalkR);

// Buildings (Randomized for variety)
const bGeo = new THREE.BoxGeometry(1, 1, 1);
const bMat = new THREE.MeshLambertMaterial({ color: 0x151515 });
for (let i = 0; i < 50; i++) {
    const h = 10 + Math.random() * 30;
    const w = 6 + Math.random() * 8;
    const b = new THREE.Mesh(bGeo, bMat);
    b.scale.set(w, h, w);

    const side = Math.random() > 0.5 ? 1 : -1;
    b.position.set(
        side * (24 + Math.random() * 5),
        h / 2,
        -50 - (i * 10) + (Math.random() * 10)
    );
    roadGroup.add(b);

    // Windows
    if (Math.random() > 0.3) {
        const winGeo = new THREE.PlaneGeometry(0.4, 0.6);
        const winMat = new THREE.MeshBasicMaterial({ color: 0xffffee, transparent: true, opacity: 0.6 });
        const rows = Math.floor(h / 2);
        const cols = Math.floor(w / 2);

        for (let r = 0; r < rows; r++) {
            if (Math.random() > 0.7) continue; // Randomly skip windows
            const win = new THREE.Mesh(winGeo, winMat);
            // Position window on the face pointing towards the road
            win.position.copy(b.position);
            win.position.y = (r * 1.5) + 2;
            win.position.x += (side === 1 ? -w / 2 - 0.1 : w / 2 + 0.1);
            win.rotation.y = (side === 1 ? -Math.PI / 2 : Math.PI / 2);
            roadGroup.add(win);
        }
    }
}

// --- BIKE LANE INFRASTRUCTURE ---
let bikeLaneMeshes = [];
let bollards = [];

function createInfrastructure(xPos) {
    // White Stripe separator
    const stripeGeo = new THREE.PlaneGeometry(0.3, 400);
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.rotation.x = -Math.PI / 2;
    // Place stripe between car lane and bike lane
    const offset = xPos > 0 ? -2 : 2;
    stripe.position.set(xPos + offset, 0.03, -100);
    roadGroup.add(stripe);

    // Bike Lane Surface
    const laneGeo = new THREE.PlaneGeometry(3.5, 400);
    const laneMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const lane = new THREE.Mesh(laneGeo, laneMat);
    lane.rotation.x = -Math.PI / 2;
    lane.position.set(xPos, 0.02, -100);
    roadGroup.add(lane);
    bikeLaneMeshes.push(lane);

    // Bollards (Start underground)
    const bolGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.2, 8);
    const bolMat = new THREE.MeshLambertMaterial({ color: 0xeeeeee });

    // Place bollards along the white stripe line
    for (let z = 50; z > -250; z -= 10) {
        const b = new THREE.Mesh(bolGeo, bolMat);
        b.position.set(xPos + offset, -2, z); // Start hidden (-2 y)
        roadGroup.add(b);
        bollards.push(b);
    }
}

// Create lanes on Right (+9.5) and Left (-9.5)
createInfrastructure(11); // Right side
createInfrastructure(-11); // Left side

// --- VEHICLE MODELS ---

function createCarModel(color) {
    const group = new THREE.Group();

    // Chassis
    const bodyGeo = new THREE.BoxGeometry(2, 0.6, 4.2);
    const bodyMat = new THREE.MeshPhongMaterial({ color: color });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.6;
    body.castShadow = true;
    group.add(body);

    // Cabin
    const cabinGeo = new THREE.BoxGeometry(1.8, 0.5, 2.2);
    const cabinMat = new THREE.MeshPhongMaterial({ color: 0x222222 });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.y = 1.15;
    group.add(cabin);

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.2, 12);
    const wheelMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    wheelGeo.rotateZ(Math.PI / 2);

    const w1 = new THREE.Mesh(wheelGeo, wheelMat); w1.position.set(0.9, 0.35, 1.2); group.add(w1);
    const w2 = new THREE.Mesh(wheelGeo, wheelMat); w2.position.set(-0.9, 0.35, 1.2); group.add(w2);
    const w3 = new THREE.Mesh(wheelGeo, wheelMat); w3.position.set(0.9, 0.35, -1.2); group.add(w3);
    const w4 = new THREE.Mesh(wheelGeo, wheelMat); w4.position.set(-0.9, 0.35, -1.2); group.add(w4);

    // Headlights
    const lightGeo = new THREE.BoxGeometry(0.4, 0.2, 0.1);
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffcc });
    const hl1 = new THREE.Mesh(lightGeo, lightMat); hl1.position.set(0.6, 0.6, -2.11); group.add(hl1);
    const hl2 = new THREE.Mesh(lightGeo, lightMat); hl2.position.set(-0.6, 0.6, -2.11); group.add(hl2);

    // Taillights
    const tlMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const tl1 = new THREE.Mesh(lightGeo, tlMat); tl1.position.set(0.6, 0.6, 2.11); group.add(tl1);
    const tl2 = new THREE.Mesh(lightGeo, tlMat); tl2.position.set(-0.6, 0.6, 2.11); group.add(tl2);

    return group;
}

function createBikeModel() {
    const group = new THREE.Group();

    // Frame
    const frameMat = new THREE.MeshLambertMaterial({ color: 0x33ff33 });
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 1.2), frameMat);
    bar.position.y = 0.6;
    group.add(bar);

    // Handlebars
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.1), frameMat);
    handle.position.set(0, 1.0, -0.4);
    group.add(handle);

    // Wheels - FIXED ROTATION
    // Torus is naturally flat on XY plane. We rotate Y 90deg so it faces Z.
    const wheelGeo = new THREE.TorusGeometry(0.35, 0.05, 8, 16);
    const wheelMat = new THREE.MeshLambertMaterial({ color: 0x111111 });

    const w1 = new THREE.Mesh(wheelGeo, wheelMat);
    w1.rotation.y = Math.PI / 2; // FIX: Rotate wheel to face forward
    w1.position.set(0, 0.35, 0.6);
    group.add(w1);

    const w2 = new THREE.Mesh(wheelGeo, wheelMat);
    w2.rotation.y = Math.PI / 2; // FIX: Rotate wheel to face forward
    w2.position.set(0, 0.35, -0.6);
    group.add(w2);

    // Rider
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.7, 0.2), new THREE.MeshLambertMaterial({ color: 0xffffff }));
    torso.position.set(0, 1.1, 0);
    group.add(torso);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.25), new THREE.MeshLambertMaterial({ color: 0xffccaa }));
    head.position.set(0, 1.55, 0);
    group.add(head);

    return group;
}

// --- TRAFFIC SYSTEM ---
const vehicles = [];
const parkedCars = [];

function initTraffic() {
    // 1. PARKED CARS (Problem Mode) - Both Sides
    // Right Side Parked
    for (let i = 0; i < 5; i++) {
        const mesh = createCarModel(0x555555);
        mesh.position.set(11, 0, -20 - (i * 35));
        mesh.rotation.y = Math.random() * 0.2 - 0.1;
        roadGroup.add(mesh);
        parkedCars.push({ mesh: mesh, baseZ: mesh.position.z });
    }
    // Left Side Parked (Rotated 180 to face oncoming traffic flow visually)
    for (let i = 0; i < 5; i++) {
        const mesh = createCarModel(0x555555);
        mesh.position.set(-11, 0, -20 - (i * 35));
        mesh.rotation.y = Math.PI + (Math.random() * 0.2 - 0.1);
        roadGroup.add(mesh);
        parkedCars.push({ mesh: mesh, baseZ: mesh.position.z });
    }

    // 2. MOVING CARS
    // Right Lane (Forward / away from camera)
    for (let i = 0; i < 5; i++) {
        const mesh = createCarModel(0xcc3333);
        mesh.rotation.y = Math.PI; // Face away
        mesh.position.set(4, 0, -10 - (i * 45));
        roadGroup.add(mesh);
        vehicles.push({ mesh, type: 'car', speed: -0.4 - Math.random() * 0.1, laneX: 4 });
    }

    // Left Lane (Oncoming / towards camera)
    for (let i = 0; i < 5; i++) {
        const mesh = createCarModel(0xcccc33);
        mesh.position.set(-4, 0, -100 - (i * 45));
        roadGroup.add(mesh);
        vehicles.push({ mesh, type: 'car', speed: 0.4 + Math.random() * 0.1, laneX: -4 });
    }

    // 3. MOVING BIKES
    // Right Lane Bikes (Forward)
    for (let i = 0; i < 5; i++) {
        const mesh = createBikeModel();
        mesh.position.set(11, 0, 10 - (i * 30));
        roadGroup.add(mesh);
        vehicles.push({ mesh, type: 'bike', speed: -0.2 - Math.random() * 0.05, laneX: 11 });
    }

    // Left Lane Bikes (Backward/Oncoming)
    for (let i = 0; i < 5; i++) {
        const mesh = createBikeModel();
        mesh.rotation.y = Math.PI; // Face oncoming
        mesh.position.set(-11, 0, -100 - (i * 30));
        roadGroup.add(mesh);
        vehicles.push({ mesh, type: 'bike', speed: 0.2 + Math.random() * 0.05, laneX: -11 });
    }
}
initTraffic();

// --- ANIMATION LOOP & LOGIC ---
let mode = 'home';

// Camera smooth state
const camTargetPos = new THREE.Vector3(0, 8, 20);
const camTargetLook = new THREE.Vector3(0, 0, -50);

function animate() {
    requestAnimationFrame(animate);

    // 1. Smooth Camera Movement (Lerp)
    // 0.05 is the "smoothness" factor. Lower = heavier/slower, Higher = snappier.
    camera.position.lerp(camTargetPos, 0.05);

    // Calculate current lookAt vector and lerp it for smooth rotation
    const currentLook = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).add(camera.position);
    const smoothLook = currentLook.lerp(camTargetLook, 0.05);
    camera.lookAt(smoothLook);

    // 2. Logic: Parked Cars Visibility
    const parkedVisible = (mode === 'home' || mode === 'problem');
    parkedCars.forEach(p => {
        const targetY = parkedVisible ? 0 : -5;
        p.mesh.position.y = THREE.MathUtils.lerp(p.mesh.position.y, targetY, 0.1);
        p.mesh.visible = p.mesh.position.y > -4;
    });

    // 3. Logic: Bollards & Lane Color
    const solutionActive = (mode === 'solution' || mode === 'success' || mode === 'benefits' || mode === 'action');
    const targetBollardY = solutionActive ? 0.6 : -2;
    const targetLaneColor = solutionActive ? new THREE.Color(0x006600) : new THREE.Color(0x333333);

    bollards.forEach(b => {
        b.position.y = THREE.MathUtils.lerp(b.position.y, targetBollardY, 0.1);
    });
    bikeLaneMeshes.forEach(lane => {
        lane.material.color.lerp(targetLaneColor, 0.05);
    });

    // 4. Traffic Animation
    vehicles.forEach(v => {
        v.mesh.position.z += v.speed;

        // Loop vehicles when they go out of bounds
        if (v.speed < 0 && v.mesh.position.z < -250) v.mesh.position.z = 50;
        if (v.speed > 0 && v.mesh.position.z > 50) v.mesh.position.z = -250;

        // Bike Swerve Logic (Problem Mode)
        if (v.type === 'bike') {
            let targetX = v.laneX; // Default to lane center

            if (mode === 'problem' || mode === 'home') {
                let blocked = false;
                // Check against parked cars
                for (let p of parkedCars) {
                    // Simple distance check on Z axis
                    if (Math.abs(v.mesh.position.z - p.mesh.position.z) < 12) {
                        // Also check we are on the same side of the road
                        if (Math.sign(p.mesh.position.x) === Math.sign(v.laneX)) {
                            blocked = true;
                            break;
                        }
                    }
                }

                if (blocked) {
                    // Swerve towards center road (0). 
                    // If lane is 11, swerve to 6. If lane is -11, swerve to -6.
                    targetX = v.laneX > 0 ? 6 : -6;
                }
            }

            // Smoothly move X
            v.mesh.position.x = THREE.MathUtils.lerp(v.mesh.position.x, targetX, 0.1);

            // Tilt bike based on X movement
            const tilt = (targetX - v.mesh.position.x) * 0.5;
            // Note: Rotation direction depends on if bike is facing forward or back
            const dir = v.speed < 0 ? 1 : -1;
            v.mesh.rotation.z = -tilt * dir;
        }
    });

    renderer.render(scene, camera);
}
animate();

// --- SCROLL HANDLER ---
const sections = document.querySelectorAll('.section');

function handleScroll() {
    const height = window.innerHeight;
    let activeId = 'sec-home';

    // Determine active section based on center of screen
    // We use a slightly larger threshold to catch sections earlier for smoothness
    sections.forEach(sec => {
        const rect = sec.getBoundingClientRect();
        if (rect.top < height * 0.6 && rect.bottom > height * 0.4) {
            activeId = sec.id;
        }
    });

    // Update State Machine
    switch (activeId) {
        case 'sec-home':
            mode = 'home';
            // Intro view
            setCam(0, 15, 30, 0, 5, -50);
            break;
        case 'sec-problem':
            mode = 'problem';
            // Angle to show car blocking bike
            setCam(15, 6, -10, 0, 2, -40);
            break;
        case 'sec-research':
            mode = 'problem';
            // High birdseye view to show data overlay context
            setCam(0, 40, -40, 0, 0, -80);
            break;
        case 'sec-success':
            mode = 'success';
            // Low angle, looking down the safe green lane
            setCam(11, 3, 5, 11, 1, -50);
            break;
        case 'sec-solution':
            mode = 'solution';
            // Isometric-style view of infrastructure
            setCam(-20, 20, -20, 0, 0, -50);
            break;
        case 'sec-benefits':
            mode = 'benefits';
            // Reverse angle
            setCam(0, 10, -80, 0, 0, 0);
            break;
        case 'sec-action':
            mode = 'action';
            // Epic wide shot
            setCam(0, 2, 40, 0, 15, -50);
            break;
        default:
            mode = 'solution';
    }
}

function setCam(x, y, z, lx, ly, lz) {
    camTargetPos.set(x, y, z);
    camTargetLook.set(lx, ly, lz);
}

window.addEventListener('scroll', handleScroll, { passive: true });
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Initial call
handleScroll();
