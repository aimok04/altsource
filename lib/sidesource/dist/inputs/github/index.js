import get from "lodash/get.js";
import { invalidLambdaReturn, invalidPropertyPath, invalidPropertyPathResult, functionNotFound, noAsset } from "../../errors.js";
import { copyToLegacyProperties } from "../../legacyProperties.js";
import { info } from "../../logging.js";
import { merge } from "../../util/index.js";
import { getLatestRelease, getReleaseByTag } from "./api.js";
export async function makeAppFromGitHubInput({ repo, tag, allowPrereleases, assetRegex, appMetadata, ...input }, functions) {
    const release = tag == "latest" ? await getLatestRelease(repo, allowPrereleases) : await getReleaseByTag(repo, tag);
    let ipaAsset;
    for (const asset of release.assets) {
        const match = asset.name.match(assetRegex);
        if (match && match.length > 0) {
            ipaAsset = asset;
            continue;
        }
    }
    if (!ipaAsset)
        throw noAsset(assetRegex);
    info(`Found release asset (${ipaAsset.name})`);
    async function runLambda(name) {
        let lambda = input[name];
        if (lambda.startsWith("function:")) {
            lambda = lambda.replace("function:", "");
            if (!(lambda in functions))
                throw functionNotFound(lambda);
            const result = await functions[lambda](release, ipaAsset);
            if (!result || typeof result !== "string")
                throw invalidLambdaReturn(lambda, result);
            return result;
        }
        let value;
        if (lambda.startsWith("release."))
            value = get(release, lambda.replace("release.", ""));
        else if (lambda.startsWith("ipaAsset."))
            value = get(ipaAsset, lambda.replace("ipaAsset.", ""));
        else
            throw invalidPropertyPath(lambda, name);
        if (!value)
            throw invalidPropertyPathResult(lambda, name, value);
        return value.toString() || JSON.stringify(value);
    }
    const app = merge(appMetadata, {
        versions: [
            {
                version: await runLambda("versionLambda"),
                date: await runLambda("dateLambda"),
                localizedDescription: await runLambda("changelogLambda"),
                downloadURL: ipaAsset.browser_download_url,
                size: ipaAsset.size,
            },
        ],
    });
    copyToLegacyProperties(app);
    return app;
}
