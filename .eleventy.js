const {DateTime} = require('luxon')
const navigationPlugin = require('@11ty/eleventy-navigation')
const rssPlugin = require('@11ty/eleventy-plugin-rss')
const metagen = require("eleventy-plugin-metagen")
const {createInlineCss} = require("eleventy-google-fonts/eleventy-google-fonts");

module.exports = (config) => {
    config.addPlugin(navigationPlugin);
    config.addPlugin(rssPlugin);
    config.addPlugin(metagen);
    config.addAsyncShortcode('eleventyGoogleFonts',async value => {
        return await createInlineCss(value)
    });
    config.addNunjucksAsyncShortcode('eleventyGoogleFonts',async value => {
        return await createInlineCss(value)
    });

    config.addPassthroughCopy('css');
    config.addPassthroughCopy('static');

    config.setDataDeepMerge(true);

    config.addFilter('htmlDateString', (dateObj) => {
        return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat('yyyy-LL-dd');
    });

    config.addFilter("readableDate", (dateObj) => {
        if(Object.prototype.toString.call(dateObj) === "[object Date]"){
            return DateTime.fromJSDate(dateObj, {zone: 'asia/tokyo'}).toFormat("yyyy/LL/dd");
        }
        return DateTime.fromFormat(dateObj, "yyyy-LL-dd HH:mm").toFormat("yyyy/LL/dd HH:mm");
    });

    config.addFilter("readableJaDate", (dateObj) => {
        if(Object.prototype.toString.call(dateObj) === "[object Date]"){
            return DateTime.fromJSDate(dateObj, {zone: 'asia/tokyo'}).setLocale('ja').toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY);
        }
        return DateTime.fromFormat(dateObj, "yyyy-LL-dd HH:mm").setLocale('ja').toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY);
    });

    config.addCollection("tagList", collection => {
        const tagsObject = {}
        collection.getAll().forEach(item => {
            if (!item.data.tags) return;
            item.data.tags
                .filter(tag => !['post', 'all'].includes(tag))
                .forEach(tag => {
                    if (typeof tagsObject[tag] === 'undefined') {
                        tagsObject[tag] = 1
                    } else {
                        tagsObject[tag] += 1
                    }
                });
        });

        const tagList = []
        Object.keys(tagsObject).forEach(tag => {
            tagList.push({tagName: tag, tagCount: tagsObject[tag]})
        })
        return tagList.sort((a, b) => b.tagCount - a.tagCount)
    });

}