import chalk from "chalk";
export function info(msg) {
    console.log(`${chalk.greenBright.bgGray(`[${chalk.blueBright `info `}]`)} ${chalk.bold(msg)}`);
}
export function error(msg) {
    console.log(`${chalk.yellowBright.bgGray(`[${chalk.redBright `error`}]`)} ${chalk.bold(msg)}`);
}
