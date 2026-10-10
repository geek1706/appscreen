const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const code = fs.readFileSync(require('node:path').join(__dirname, '..', 'app.js'), 'utf8');
const context = vm.createContext({ state: { currentLanguage: 'de', projectLanguages: ['en', 'de', 'fr'] } });
for (const name of ['cloneBackground', 'getTextLanguageSettings', 'getEffectiveLayout', 'copySelectedStyles']) {
    const start = code.indexOf(`function ${name}(`);
    const end = code.indexOf('\n}', start) + 2;
    vm.runInContext(code.slice(start, end), context);
}
function fixture() {
    return {
        background: { solid: '#123456', image: { liveImage: true }, gradient: { stops: [] } },
        screenshot: { scale: 70, shadow: { enabled: true } },
        text: { headlines: { en: 'Hello', fr: 'Bonjour' }, subheadlines: { fr: 'Subtitle' },
            headlineLanguages: ['en', 'fr'], currentHeadlineLang: 'fr', headlineFont: 'Original',
            headlineSize: 80, perLanguageLayout: true, languageSettings: { de: { headlineSize: 55 } } },
        localizedImages: { fr: { src: 'original.png' } }, elements: [{ text: 'Keep me' }],
        localizedElements: { fr: { graphics: [] } }, popouts: [{ x: 20 }]
    };
}
test('background and text default preserve content, languages, device, and overlays', () => {
    const source = fixture();
    source.text.headlineFont = 'New font';
    source.text.headlines.en = 'Do not copy';
    const target = fixture();
    const original = { ...target };
    context.copySelectedStyles(source, target, ['background', 'text']);
    for (const key of ['screenshot', 'localizedImages', 'elements', 'localizedElements', 'popouts']) assert.equal(target[key], original[key]);
    assert.equal(target.text.headlines, original.text.headlines);
    assert.equal(target.text.subheadlines, original.text.subheadlines);
    assert.equal(target.text.headlineLanguages, original.text.headlineLanguages);
    assert.equal(target.text.currentHeadlineLang, 'fr');
    assert.equal(target.text.headlineFont, 'New font');
    assert.equal(target.text.perLanguageLayout, false);
    assert.equal(target.text.headlineSize, 55);
    assert.equal(target.text.languageSettings.fr.headlineSize, 55);
    assert.equal(target.background.image, source.background.image);
    target.background.gradient.stops.push('new');
    assert.equal(source.background.gradient.stops.length, 0);
});
test('device only does not modify background or text and deep copies settings', () => {
    const source = fixture(), target = fixture(), original = { ...target };
    context.copySelectedStyles(source, target, ['device']);
    assert.equal(target.background, original.background);
    assert.equal(target.text, original.text);
    target.screenshot.shadow.enabled = false;
    assert.equal(source.screenshot.shadow.enabled, true);
});
test('no categories leaves all target settings unchanged', () => {
    const target = fixture(), original = { ...target };
    context.copySelectedStyles(fixture(), target, []);
    for (const key of Object.keys(original)) assert.equal(target[key], original[key]);
});
