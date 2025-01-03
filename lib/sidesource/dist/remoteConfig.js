import json5 from "json5";
import { invalidGitHubConfigURL, failedToParseRemoteConfig } from "./errors.js";
import { getFileContents } from "./inputs/github/api.js";
import { info } from "./logging.js";
export async function resolveRemoteConfig(url, name = "config") {
    let config;
    info(`Getting remote ${name} from ${url}`);
    if (url.startsWith("github:")) {
        url = url.replace("github:", "");
        let repoMatches = url.match(/[^\/]*\/{1}[^\/]*/g);
        if (!repoMatches)
            throw invalidGitHubConfigURL(url);
        const repo = repoMatches[0];
        const file = url.replace(repo + "/", "").split("?")[0];
        const branch = url.split("?")[1] || undefined;
        info(`    from GitHub repo \`${repo}\` and file path \`${file}\`${branch ? ` and branch \`${branch}\`` : ""}`);
        const text = await getFileContents(repo, file, branch);
        try {
            config = json5.parse(text);
        }
        catch {
            throw failedToParseRemoteConfig(text);
        }
    }
    else {
        const text = await (await fetch(url)).text();
        try {
            config = json5.parse(text);
        }
        catch {
            throw failedToParseRemoteConfig(text);
        }
    }
    return config;
}
