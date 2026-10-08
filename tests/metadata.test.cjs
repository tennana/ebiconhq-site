const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const site = require('../_data/site');

const output = path.join(__dirname, '../_site');

function readHead(file) {
    const html = fs.readFileSync(path.join(output, file), 'utf8');
    return html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1];
}

function meta(head, key) {
    const tags = [...head.matchAll(/<meta\b[^>]*>/gi)]
        .map(match => match[0])
        .filter(tag => tag.includes(`name="${key}"`) || tag.includes(`property="${key}"`));
    assert.equal(tags.length, 1, `${key} must occur exactly once`);
    const content = tags[0].match(/content="([^"]*)"/)?.[1];
    assert.ok(content?.trim(), `${key} must not be empty`);
    return content;
}

for (const [file, expected] of [
    ['index.html', site.meta.description],
    ['pages/about/index.html', '奈良県奈良市のTRPGコンベンション「Ebicon」とはなんぞや、が書かれています。'],
    ['pages/faq/index.html', '奈良県奈良市のTRPGコンベンション、Ebiconの寄せられてもいないQA集です。'],
    ['posts/ebicon015/index.html', '2024年7月14日(日) 10:00～に奈良県奈良市で開催予定のTRPGコンベンション「Ebicon 15th」の開催概要です。'],
    ['posts/ebicon016/index.html', '2027年3月6日(土)、奈良県コンベンションセンター 206会議室で開催するTRPGコンベンション「Ebicon 16bit ～寿卓司さん入局記念杯～」の開催概要です。'],
]) {
    test(`description precedence and social metadata: ${file}`, () => {
        const head = readHead(file);
        assert.ok(head, 'HTML head must exist');
        for (const key of ['description', 'og:description', 'twitter:description']) {
            assert.equal(meta(head, key), expected);
        }
        assert.equal([...head.matchAll(/<title>/g)].length, 1);
        assert.equal([...head.matchAll(/<meta\s+charset=/g)].length, 1);
        meta(head, 'viewport');
        assert.equal(meta(head, 'og:type'), file === 'index.html' ? 'website' : 'article');
        assert.equal(meta(head, 'og:locale'), 'ja_JP');
        assert.equal(meta(head, 'og:site_name'), site.meta.title);
        assert.equal(meta(head, 'twitter:title'), meta(head, 'og:title'));
        assert.equal(meta(head, 'twitter:card'), 'summary');
        assert.equal(meta(head, 'twitter:image'), `${site.meta.siteUrl}/static/img/twitter_card.jpg`);
        assert.equal(meta(head, 'twitter:url'), site.meta.siteUrl + '/' + file.replace(/index\.html$/, ''));
    });
}
