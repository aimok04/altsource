import { err } from "./errors.js";
import { merge } from "./util/index.js";
export function configDefaults(config, skipRemoteConfigCheck = false) {
    config = merge({
        remoteConfig: true,
        cacheTime: 240,
        inputs: [],
    }, config);
    if (!skipRemoteConfigCheck && config.remoteConfig && !config.configURL)
        throw err `\`remoteConfig\` requires a \`configURL\` to be specified`;
    return config;
}
export function githubInputDefaults(input) {
    return merge({
        allowPrereleases: false,
        assetRegex: "(.*).ipa",
        dateLambda: "function:ipaAssetUpdatedAtToSourceDate",
        versionLambda: "release.tag_name",
        changelogLambda: "release.body",
    }, input);
}
export function sourceInputDefaults(input) {
    return merge({
        allApps: false,
        allNews: false,
        appBundleIds: [],
        newsIds: [],
    }, input);
}
