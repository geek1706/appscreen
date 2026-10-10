const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const frames = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'device-frames.js'), 'utf8'), frames);

function recordingContext() {
    const calls = [];
    const stack = [];
    const context = { calls, globalAlpha: 0.6, fillStyle: '#123456' };
    const methods = ['beginPath', 'roundRect', 'clip', 'fillRect', 'drawImage', 'fill', 'stroke', 'arc', 'translate', 'rotate', 'transform'];
    methods.forEach(method => {
        context[method] = (...args) => calls.push({ method, args });
    });
    context.save = () => stack.push({ globalAlpha: context.globalAlpha, fillStyle: context.fillStyle });
    context.restore = () => Object.assign(context, stack.pop());
    context.createLinearGradient = () => ({ addColorStop() {} });
    context.assertBalanced = () => assert.equal(stack.length, 0);
    return context;
}

const settings = {
    scale: 70, x: 50, y: 60, rotation: 0, perspective: 0, frameColor: 'silver',
    shadow: { enabled: true, color: '#000000', opacity: 30, blur: 40, x: 0, y: 20 }
};

test('native display and body dimensions agree between the two rendering modes', () => {
    const spec = frames.iPhone17ProMax;
    assert.equal(spec.width, 78);
    assert.equal(spec.height, 163.4);
    assert.equal(spec.depth, 8.75);
    assert.equal(spec.pixelWidth, 1320);
    assert.equal(spec.pixelHeight, 2868);
    assert.ok(Math.abs(spec.screenWidth / spec.screenHeight - 1320 / 2868) < 1e-12);
    assert.ok(spec.screenWidth < spec.width && spec.screenHeight < spec.height);
    assert.ok(spec.screenRadius < spec.screenWidth / 2);
});

test('offers only the three current finishes and maps legacy finishes safely', () => {
    assert.equal(JSON.stringify(frames.iPhone17ProMax.colors.map(color => color.id)),
        JSON.stringify(['silver', 'cosmic-orange', 'deep-blue']));
    for (const [oldId, newId] of Object.entries({
        natural: 'silver', white: 'silver', blue: 'deep-blue', black: 'deep-blue',
        desert: 'cosmic-orange', gold: 'cosmic-orange', red: 'cosmic-orange', 'deep-purple': 'deep-blue'
    })) {
        assert.equal(frames.getIPhone17FrameColor(oldId).id, newId);
    }
    assert.equal(frames.getIPhone17FrameColor(undefined).id, 'silver');
    assert.equal(frames.getIPhone17FrameColor('unknown').id, 'silver');
});

for (const image of [{ width: 1290, height: 2796 }, { width: 1200, height: 800 }, { width: 800, height: 3000 }]) {
    test(`cover-crops ${image.width}×${image.height} without stretching`, () => {
        const context = recordingContext();
        frames.drawIPhone17Screen(context, image, 10, 20, 1320, 2868);
        const draw = context.calls.find(call => call.method === 'drawImage').args;
        const [, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height] = draw;
        assert.ok(sourceX >= 0 && sourceY >= 0);
        assert.ok(sourceX + sourceWidth <= image.width + 1e-8);
        assert.ok(sourceY + sourceHeight <= image.height + 1e-8);
        assert.ok(Math.abs(sourceWidth / sourceHeight - width / height) < 1e-12);
        assert.equal(x, 10);
        assert.equal(y, 20);
        assert.equal(context.globalAlpha, 0.6);
        context.assertBalanced();
        const island = context.calls.filter(call => call.method === 'roundRect')[1].args;
        assert.ok(island[0] > x && island[0] + island[2] < x + width);
        assert.ok(island[1] > y && island[1] + island[3] < y + height);
    });
}

test('frame remains proportional on portrait, landscape, and tablet exports', () => {
    for (const dims of [{ width: 1320, height: 2868 }, { width: 2868, height: 1320 }, { width: 2048, height: 2732 }]) {
        const context = recordingContext();
        frames.drawIPhone17FrameToContext(context, dims, { width: 1320, height: 2868 }, settings);
        const body = context.calls.find(call => call.method === 'roundRect').args;
        assert.ok(Math.abs(body[2] / body[3] - 78 / 163.4) < 1e-12);
        assert.ok(body[2] <= dims.width * 0.7 + 1e-8);
        assert.ok(body[3] <= dims.height * 0.7 + 1e-8);
        assert.equal(context.globalAlpha, 0.6);
        assert.equal(context.fillStyle, '#123456');
        context.assertBalanced();
    }
});

test('tilt, perspective, bleed, and shadow-free frames use the same canvas path', () => {
    const context = recordingContext();
    frames.drawIPhone17FrameToContext(context, { width: 1320, height: 2868 }, { width: 1320, height: 2868 }, {
        ...settings, scale: 100, x: -80, y: 180, rotation: -22, perspective: 15, shadow: { enabled: false }
    });
    assert.equal(context.calls.find(call => call.method === 'rotate').args[0], -22 * Math.PI / 180);
    assert.deepEqual(context.calls.find(call => call.method === 'transform').args, [1, 0.15, 0, 1, 0, 0]);
    for (const call of context.calls) {
        assert.ok(call.args.filter(arg => typeof arg === 'number').every(Number.isFinite));
    }
    context.assertBalanced();
});
