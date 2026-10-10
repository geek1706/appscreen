// Original, lightweight iPhone 17 Pro Max mockup (not an Apple CAD asset).
// Body dimensions and display resolution: https://support.apple.com/en-us/125091
// All geometry is generated locally; 2D and 3D share the same proportions.
var iPhone17ProMax = {
    name: 'iPhone 17 Pro Max',
    width: 78,
    height: 163.4,
    depth: 8.75,
    bodyRadius: 11,
    screenWidth: 73.2,
    screenHeight: 73.2 * 2868 / 1320,
    screenRadius: 9,
    pixelWidth: 1320,
    pixelHeight: 2868,
    islandWidth: 21.5,
    islandHeight: 6.3,
    islandTop: 3.6,
    colors: [
        { id: 'silver', label: 'Silver', swatch: '#d9d9d7',
          materials: { metalframe: '#d9d9d7', backpanel: '#e8e8e6', camera_plateau: '#d9d9d7', buttons: '#c4c4c2' } },
        { id: 'cosmic-orange', label: 'Cosmic Orange', swatch: '#e87538',
          materials: { metalframe: '#e87538', backpanel: '#ed8c55', camera_plateau: '#e87538', buttons: '#c45e2c' } },
        { id: 'deep-blue', label: 'Deep Blue', swatch: '#313e54',
          materials: { metalframe: '#313e54', backpanel: '#46546c', camera_plateau: '#313e54', buttons: '#253044' } }
    ]
};

function getIPhone17FrameColor(colorId) {
    // Map older iPhone finishes to the closest current finish without rewriting saved projects.
    const aliases = {
        natural: 'silver', white: 'silver', blue: 'deep-blue', black: 'deep-blue',
        'deep-purple': 'deep-blue', desert: 'cosmic-orange', gold: 'cosmic-orange', red: 'cosmic-orange'
    };
    const id = aliases[colorId] || colorId;
    return iPhone17ProMax.colors.find(color => color.id === id) || iPhone17ProMax.colors[0];
}

// Cover-crop rather than stretch older captures into the new display aspect ratio.
// The same screen treatment is used by the 2D frame and the 3D screen texture.
function drawIPhone17Screen(context, image, x, y, width, height) {
    const spec = iPhone17ProMax;
    const unit = width / spec.screenWidth;
    context.save();
    context.beginPath();
    context.roundRect(x, y, width, height, spec.screenRadius * unit);
    context.clip();
    context.fillStyle = '#050505';
    context.fillRect(x, y, width, height);
    if (image) {
        const scale = Math.max(width / image.width, height / image.height);
        const sourceWidth = width / scale;
        const sourceHeight = height / scale;
        context.drawImage(image, (image.width - sourceWidth) / 2, (image.height - sourceHeight) / 2,
            sourceWidth, sourceHeight, x, y, width, height);
    }

    const islandWidth = spec.islandWidth * unit;
    const islandHeight = spec.islandHeight * unit;
    const islandX = x + (width - islandWidth) / 2;
    const islandY = y + spec.islandTop * unit;
    context.fillStyle = '#000000';
    context.beginPath();
    context.roundRect(islandX, islandY, islandWidth, islandHeight, islandHeight / 2);
    context.fill();
    context.fillStyle = '#10141d';
    context.beginPath();
    context.arc(islandX + islandWidth - islandHeight / 2, islandY + islandHeight / 2, unit * 1.15, 0, Math.PI * 2);
    context.fill();
    context.restore();
}

function drawIPhone17FrameToContext(context, dims, image, settings) {
    const spec = iPhone17ProMax;
    const scale = settings.scale / 100;
    const width = Math.min(dims.width * scale, dims.height * scale * spec.width / spec.height);
    const height = width * spec.height / spec.width;
    const unit = width / spec.width;
    const moveX = Math.max(dims.width - width, dims.width * 0.15);
    const moveY = Math.max(dims.height - height, dims.height * 0.15);
    const x = (dims.width - width) / 2 + (settings.x / 100 - 0.5) * moveX;
    const y = (dims.height - height) / 2 + (settings.y / 100 - 0.5) * moveY;
    const color = getIPhone17FrameColor(settings.frameColor);

    context.save();
    context.translate(x + width / 2, y + height / 2);
    context.rotate((settings.rotation || 0) * Math.PI / 180);
    context.transform(1, (settings.perspective || 0) * 0.01, 0, 1, 0, 0);
    context.translate(-width / 2, -height / 2);

    if (settings.shadow?.enabled) {
        const shadow = settings.shadow;
        context.shadowColor = shadow.color + Math.round(shadow.opacity / 100 * 255).toString(16).padStart(2, '0');
        context.shadowBlur = shadow.blur;
        context.shadowOffsetX = shadow.x;
        context.shadowOffsetY = shadow.y;
        context.fillStyle = '#000000';
        context.beginPath();
        context.roundRect(0, 0, width, height, spec.bodyRadius * unit);
        context.fill();
        context.shadowColor = 'transparent';
        context.shadowBlur = 0;
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 0;
    }

    // Action, volume, power, and Camera Control buttons.
    context.fillStyle = color.materials.buttons;
    [[-0.65, 25, 7], [-0.65, 43, 11], [-0.65, 58, 11], [spec.width - 0.2, 42, 15], [spec.width - 0.2, 104, 13]]
        .forEach(([buttonX, buttonY, buttonHeight]) => {
            context.beginPath();
            context.roundRect(buttonX * unit, buttonY * unit, 0.85 * unit, buttonHeight * unit, 0.4 * unit);
            context.fill();
        });

    const finish = context.createLinearGradient(0, 0, width, height * 0.3);
    finish.addColorStop(0, color.materials.buttons);
    finish.addColorStop(0.22, color.swatch);
    finish.addColorStop(0.5, color.materials.backpanel);
    finish.addColorStop(1, color.materials.buttons);
    context.fillStyle = finish;
    context.beginPath();
    context.roundRect(0, 0, width, height, spec.bodyRadius * unit);
    context.fill();
    context.strokeStyle = color.materials.backpanel;
    context.lineWidth = unit * 0.25;
    context.stroke();

    // Black glass/bezel inset into the aluminum body.
    const inset = 0.65 * unit;
    context.fillStyle = '#090909';
    context.beginPath();
    context.roundRect(inset, inset, width - inset * 2, height - inset * 2, (spec.bodyRadius - 0.65) * unit);
    context.fill();
    const screenWidth = spec.screenWidth * unit;
    const screenHeight = spec.screenHeight * unit;
    drawIPhone17Screen(context, image, (width - screenWidth) / 2, (height - screenHeight) / 2, screenWidth, screenHeight);
    context.restore();
}

// The model is built in the same 4.3-unit coordinate space as the GLB screen overlays.
// No network request or third-party model license is needed for this mockup.
function createIPhone17ProMaxModel() {
    const spec = iPhone17ProMax;
    const unit = 4.3 / spec.height;
    const model = new THREE.Group();
    model.name = 'iPhone 17 Pro Max';
    const materials = {};
    const material = (name, color, metalness = 0.6, roughness = 0.3) => {
        if (!materials[name]) {
            materials[name] = new THREE.MeshStandardMaterial({ name, color, metalness, roughness });
            materials[name].color.convertSRGBToLinear();
        }
        return materials[name];
    };
    const silver = spec.colors[0].materials;
    const bodyMaterial = material('metalframe', silver.metalframe, 0.65, 0.32);
    const backMaterial = material('backpanel', silver.backpanel, 0.15, 0.25);
    const cameraMaterial = material('camera_plateau', silver.camera_plateau, 0.6, 0.3);
    const buttonMaterial = material('buttons', silver.buttons, 0.7, 0.25);
    const blackMaterial = material('black_glass', '#08090b', 0.1, 0.16);

    function roundedShape(width, height, radius) {
        const w = width * unit;
        const h = height * unit;
        const r = radius * unit;
        const shape = new THREE.Shape();
        shape.moveTo(-w / 2 + r, -h / 2);
        shape.lineTo(w / 2 - r, -h / 2);
        shape.absarc(w / 2 - r, -h / 2 + r, r, -Math.PI / 2, 0, false);
        shape.lineTo(w / 2, h / 2 - r);
        shape.absarc(w / 2 - r, h / 2 - r, r, 0, Math.PI / 2, false);
        shape.lineTo(-w / 2 + r, h / 2);
        shape.absarc(-w / 2 + r, h / 2 - r, r, Math.PI / 2, Math.PI, false);
        shape.lineTo(-w / 2, -h / 2 + r);
        shape.absarc(-w / 2 + r, -h / 2 + r, r, Math.PI, Math.PI * 1.5, false);
        return shape;
    }

    function plate(name, width, height, radius, depth, bevel, mat, x, y, z) {
        const geometry = new THREE.ExtrudeGeometry(roundedShape(width - bevel * 2, height - bevel * 2, radius - bevel), {
            depth: (depth - bevel * 2) * unit,
            bevelEnabled: bevel > 0,
            bevelThickness: bevel * unit,
            bevelSize: bevel * unit,
            bevelSegments: 3,
            curveSegments: 16,
            steps: 1
        });
        const mesh = new THREE.Mesh(geometry, mat);
        mesh.name = name;
        mesh.position.set(x * unit, y * unit, (z + bevel) * unit);
        model.add(mesh);
        return mesh;
    }

    plate('Aluminum unibody', spec.width, spec.height, spec.bodyRadius, spec.depth, 0.65,
        bodyMaterial, 0, 0, -spec.depth / 2);
    plate('Front glass', spec.width - 1.3, spec.height - 1.3, spec.bodyRadius - 0.65, 0.12, 0,
        blackMaterial, 0, 0, spec.depth / 2);
    plate('Ceramic back inset', 65, 108, 8, 0.15, 0,
        backMaterial, 0, -17, -spec.depth / 2 - 0.15);
    plate('Full-width camera plateau', 75.5, 37, 8, 2.8, 0.5,
        cameraMaterial, 0, 58, -spec.depth / 2 - 2.8);

    const lensMetal = material('lens_rings', '#404246', 0.85, 0.18);
    const lensGlass = material('lens_glass', '#111b2b', 0.3, 0.12);
    function rearDisc(name, x, y, radius, depth, z, mat) {
        const geometry = new THREE.CylinderGeometry(radius * unit, radius * unit, depth * unit, 48);
        const mesh = new THREE.Mesh(geometry, mat);
        mesh.name = name;
        mesh.rotation.x = Math.PI / 2;
        mesh.position.set(x * unit, y * unit, z * unit);
        model.add(mesh);
    }
    const backZ = -spec.depth / 2 - 2.8;
    [[-24, 68], [-24, 48], [-4, 58]].forEach(([x, y], index) => {
        rearDisc('Camera ring ' + index, x, y, 8.5, 1.5, backZ - 0.75, lensMetal);
        rearDisc('Camera surround ' + index, x, y, 7.6, 0.15, backZ - 1.55, blackMaterial);
        rearDisc('Camera lens ' + index, x, y, 5.4, 0.15, backZ - 1.7, lensGlass);
    });
    rearDisc('Flash', 22, 67, 3.1, 0.15, backZ - 0.1, material('flash', '#eee9db', 0, 0.4));
    rearDisc('LiDAR', 22, 49, 3.2, 0.15, backZ - 0.1, blackMaterial);

    [[-1, 53, 7], [-1, 33, 11], [-1, 18, 11], [1, 32, 15], [1, -29, 13]].forEach(([side, y, height], index) => {
        const button = new THREE.Mesh(new THREE.BoxGeometry(0.8 * unit, height * unit, 3.2 * unit), buttonMaterial);
        button.name = 'Side button ' + index;
        button.position.set(side * (spec.width / 2 + 0.15) * unit, y * unit, 0);
        model.add(button);
    });

    // USB-C recess and speaker openings on the bottom edge.
    const port = new THREE.Mesh(new THREE.BoxGeometry(9 * unit, 0.08 * unit, 2.8 * unit), blackMaterial);
    port.name = 'USB-C port';
    port.position.y = -spec.height / 2 * unit - 0.01 * unit;
    model.add(port);
    for (const side of [-1, 1]) {
        for (let i = 0; i < 5; i++) {
            const hole = new THREE.Mesh(new THREE.CircleGeometry(0.65 * unit, 12), blackMaterial);
            hole.name = 'Speaker opening';
            hole.rotation.x = Math.PI / 2;
            hole.position.set(side * (14 + i * 2.5) * unit, -spec.height / 2 * unit - 0.01 * unit, 0);
            model.add(hole);
        }
    }
    return model;
}
