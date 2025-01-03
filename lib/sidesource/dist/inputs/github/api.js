import { err, githubApiError, noReleasesFound } from "../../errors.js";
async function apiReq(path, verifyPropertyName) {
    const res = await fetch(`https://api.github.com${path}`, { headers: { "User-Agent": "https://github.com/SideStore/SideSource" } });
    const json = (await res.json());
    if (verifyPropertyName && !(verifyPropertyName in json))
        throw githubApiError(json);
    return json;
}
/* Releases */
export async function getLatestRelease(repo, includePrereleases = false) {
    if (!includePrereleases)
        return apiReq(`/repos/${repo}/releases/latest`, "tag_name");
    const releases = await apiReq(`/repos/${repo}/releases`, null);
    if (!Array.isArray(releases))
        throw githubApiError(releases);
    if (releases.length < 1)
        throw noReleasesFound;
    for (const release of releases.sort((a, b) => {
        if (a == b)
            return 0;
        if (new Date(a.published_at) < new Date(b.published_at))
            return 1;
        else
            return -1;
    })) {
        return release;
    }
    throw err `Unknown error; it should be impossible to get here`;
}
export const getReleaseByTag = (repo, tag) => apiReq(`/repos/${repo}/releases/tags/${tag}`, "tag_name");
/* File contents */
export const getFileContents = async (repo, path, branch) => atob((await apiReq(`/repos/${repo}/contents/${path}${branch ? `?ref=${branch}` : ""}`, "content")).content);
