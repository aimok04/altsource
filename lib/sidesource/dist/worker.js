import { makeSource } from ".";
import { keyNotSet } from "./errors.js";
import { error, info } from "./logging.js";
export function makeSourceHandler(config, functions = {}) {
    return {
        fetch(req, env, ctx) {
            const { pathname } = new URL(req.url);
            if (pathname == "" || pathname == "/" || pathname.includes("preview") || pathname.includes("reset-cache"))
                return this.handle(req, env, ctx);
            return new Response("404 Not Found", { status: 404 });
        },
        async handle(req, env, ctx) {
            let shouldCache = true;
            const { pathname } = new URL(req.url);
            if ("KEY" in env) {
                if (pathname.includes("preview") && pathname.includes(env.KEY))
                    shouldCache = false;
                if (pathname.includes("reset-cache") && pathname.includes(env.KEY))
                    return this.resetCache([""])(req, env, ctx);
            }
            else
                error(keyNotSet);
            if (shouldCache) {
                const matched = await caches.default.match(req);
                if (matched) {
                    info(`Cache found for ${req.url}`);
                    return matched;
                }
                info(`No cache for ${req.url}`);
            }
            else
                info("Skipping cache");
            const { source, newConfig } = await makeSource(config, functions);
            const res = new Response(JSON.stringify(source, null, "    "), {
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                    "Access-Control-Allow-Origin": "*",
                },
            });
            if (newConfig.cacheTime > 0 && shouldCache) {
                res.headers.set("Cache-Control", `max-age=${newConfig.cacheTime * 60}`);
                ctx.waitUntil(caches.default.put(req, res.clone()));
            }
            else if (!shouldCache) {
                res.headers.set("X-Skipping-Cache", "true");
            }
            return res;
        },
        resetCache(origRoutes) {
            return (req, env, ctx) => {
                if ("KEY" in env) {
                    const url = new URL(req.url);
                    if (url.pathname.includes(env.KEY)) {
                        const routes = [];
                        for (let route of [...origRoutes]) {
                            const checks = [`/${route.replace(/^\//g, "")}`, `/${route.replace(/^\//g, "").replace(/\/$/g, "")}/`];
                            if (route.startsWith("/"))
                                checks.push(`${route.replace(/\/$/g, "")}/`);
                            else
                                checks.push(`/${route.replace(/\/$/g, "")}`);
                            for (const check of checks)
                                if (!routes.includes(check))
                                    routes.push(check);
                        }
                        for (const route of routes) {
                            const routeUrl = url.origin + route;
                            console.log(`reset cache for url: ${routeUrl}`);
                            ctx.waitUntil(caches.default.delete(routeUrl, { ignoreMethod: true }));
                        }
                        return new Response(`Success! Reset cache for ${routes.filter((val) => val.length > 0).join(", ")}`);
                    }
                    else
                        return new Response("Wrong key. Make sure to include it in the URL!");
                }
                error(keyNotSet);
                return new Response(`The \`KEY\` secret is not set. Please see https://sidestore.io/SideSource/#4-setting-up-a-key-for-preview-and-caching-resetting-functionality for more info`);
            };
        },
    };
}
