import json5 from "json5";
import { failedToParseSource } from "../errors.js";
import { copyToLegacyProperties } from "../legacyProperties.js";
export async function makeAppFromSourceInput({ url, allApps, allNews, appBundleIds, newsIds }) {
    const text = await (await fetch(url)).text();
    let source;
    try {
        source = json5.parse(text);
    }
    catch {
        throw failedToParseSource(text);
    }
    const apps = [];
    const news = [];
    for (const app of source.apps)
        if (allApps || appBundleIds.includes(app.bundleIdentifier))
            apps.push(app);
    if (source.news)
        for (const newsEntry of source.news)
            if (allNews || newsIds.includes(newsEntry.identifier))
                news.push(newsEntry);
    for (const app of apps) {
        copyToLegacyProperties(app);
    }
    return { apps, news };
}
