import * as fs from "fs"
import * as SideSource from "./lib/sidesource/dist/source.js"

function collectJsonFilesAsArray(folder) {
    if(!fs.existsSync(folder)) return []

    const jsonFiles = fs.readdirSync(folder)
        .filter(filename => filename.endsWith(".json"))

    return [
        ... jsonFiles.map(filename => JSON.parse(fs.readFileSync(`${folder}/${filename}`)))
    ]
}

(async()=>{
    const inputs = collectJsonFilesAsArray("src/inputs")
    const news = collectJsonFilesAsArray("src/news")

    const { source } = await SideSource.makeSource(
        {
            remoteConfig: false,
            "source": {
                "name": "aimok04's Altsource",
                "identifier": "de.aimok04.altsource"
            },
            "inputs": inputs,
            "news": news
        },
        {
            async versionRemoveStartingV(release) {
                return release.name.startsWith("v")
                    ? release.name.substring(1)
                    : release.name
            }
        }
    )

    fs.writeFileSync("dist/index.json", JSON.stringify(source, null, 4))
    console.log("Wrote source to", "dist/index.json", ".")
})()
