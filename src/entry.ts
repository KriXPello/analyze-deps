#!/usr/bin/env node
``
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { processPackages } from "./processPackages";

yargs()
  .usage("$0 <pkg1> [<pkg2> ...]")
  .command(
    "$0 <packages...>",
    "Analyze package dependencies",
    (y) =>
      y.positional("packages", {
        type: "string",
        array: true,
        demandOption: true,
        description: "Package specifiers like name or name@version",
      }),
    (argv) => {
      processPackages({ labels: argv.packages, cwd: process.cwd() });
    },
  )
  .help()
  .version()
  .parse(hideBin(process.argv));
