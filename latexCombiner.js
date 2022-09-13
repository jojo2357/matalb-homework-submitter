#!/bin/node

const {execSync, exec, spawn} = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * @type string
 */
let coverFile;

//Parse Args. By default we get two meaningless args so we discard them
let args = process.argv.slice(2);
if (args.length === 0) {
    console.log("No arguments provided. Please provide the homework number and make sure that your m files are in HW<homework number>");
    process.exit(0);
} else if (args.length === 1) {
    console.log("You may want to include another argument as your tex coverpage. this file goes before \\begin{document} so you can customize it however you like ");
} else if (args.length === 2) {
    coverFile = path.join(process.cwd(), args[1]);
} else {
    coverFile = path.join(process.cwd(), args[1]);
    console.log("too many args, you may have done something wrong");
}
const homeworkNumber = args[0];

if (!(coverFile && fs.existsSync(coverFile)))
    console.log("no cover provided. if the second argument is a .tex file, then it will be included before the document begins");

let outfile = path.join(process.cwd(), `HW${homeworkNumber}.tex`);

//Get all .m files in the HW dir (readdir().filter()), but take their fully qualified directory (map)
let fyles = fs.readdirSync(`HW${homeworkNumber}`).filter(fyle => fyle.endsWith('.m')).map(fyle => path.join(process.cwd(), `HW${homeworkNumber}`, fyle));

/**
 * This returns all the HW folders our files are in. This is mostly for future-proofing purposes.
 *
 * @type {string[]}
 */
let uniqueFolders = fyles.reduce((outArray, currentValue) => {
    if (!outArray.includes(path.dirname(currentValue)))
        outArray.push(path.dirname(currentValue));
    return outArray;
}, []);

/**
 * Create a 2d array. Every nested array will have files in the same folder. ex
 *
 * ```
 * src
 *   HW1
 *     foo.m
 *   HW2
 *     bar.m
 * ```
 *
 * results in `[['/fully/qualified/src/HW1/foo.m'], ['/fully/qualified/src/HW2/bar.m']]`
 *
 * We need this so that we can chdir into a required folder, and then handle all files in that folder in one go.
 * @type {string[][]}
 */
let allSources = uniqueFolders.map(folder => fs.readdirSync(folder).filter(fyle => fyle.endsWith(".m")).map(fyle => path.join(folder, fyle)));

//generate all source tex files
for (let i = 0; i < allSources.length; i++) {
    process.chdir(path.dirname(allSources[i][0]));
    //This line will republish all files regardless of age
    //let execCall = `matlab -nodisplay -nosplash -nodesktop -r "${allSources[i].map(source => `publish('${source}','latex');`).join("")}exit;"`;
    let updatedSources = allSources[i].reduce((collector, source) => {
        let gendTex = path.join(path.dirname(source), "html", path.basename(source, ".m") + ".tex");
        //if the generated file exists and the m file was edited after previous generation, we add it to the list
        if (!fs.existsSync(gendTex) || fs.statSync(source).mtime > fs.statSync(gendTex).mtime)
            collector.push(`publish('${source}','latex');`);
        //otherwise we will just notify the user we are skipping
        else
            console.log("Skipping ", source);
        return collector;
    }, []);
    if (!updatedSources.length) {
        console.log("No new sources in ", allSources[i][0]);
        continue;
    }
    let execCall = `matlab -nodisplay -nosplash -nodesktop -r "${updatedSources.join("")}exit;"`;
    process.stdout.write(`${i + 1} / ${allSources.length} Currently Running ${execCall}   \r`);
    execSync(execCall) || console.log("\nSOMETHING WENT WRONG");
}

console.log();

/**
 * @type {string[][]}
 */
let allFiles = uniqueFolders.map(folder => fs.readdirSync(path.join(folder, 'html')).filter(fyle => fyle.endsWith(".tex")).map(fyle => path.join(folder, 'html', fyle)));

let allPackages = allFiles.reduce((allpankages, texFile) => {
    for (const texMex of texFile) {
        let lines = fs.readFileSync(texMex).toString().split(/\r?\n/g);
        lines.splice(lines.findIndex(line => line.includes('\\begin{document}')));
        lines.forEach(line => {
            if (line.match(/(?:^\s*\\usepackage{)(.*)(?:}\s*$)/m) && !allpankages.includes(line.match(/(?:^\s*\\usepackage{)(.*)(?:}\s*$)/m)[1]))
                allpankages.push(line.match(/(?:^\s*\\usepackage{)(.*)(?:}\s*$)/m)[1]);
        });
    }

    return allpankages;
}, []);

fs.writeFileSync(outfile, "");
fs.appendFileSync(outfile, "\\documentclass{article}\n");
fs.appendFileSync(outfile, allPackages.map(pack => `\\usepackage{${pack}}`).join('\n') + '\n\\usepackage[outputdir=./build]{minted}\n\\usepackage[colorlinks = true,\n' +
    '            linkcolor = black,\n' +
    '            urlcolor  = cyan,\n' +
    '            citecolor = cyan,\n' +
    '            anchorcolor = cyan\n]{hyperref}\n');

fs.appendFileSync(outfile, `\\newcommand{\\HWVersion}{${homeworkNumber}}\n`);

fs.appendFileSync(outfile, "\\sloppy\n" +
    "\\definecolor{lightgray}{gray}{0.5}\n" +
    "\\setlength{\\parindent}{0pt}\n");

if (coverFile && fs.existsSync(coverFile))
    fs.appendFileSync(outfile, fs.readFileSync(coverFile));

fs.appendFileSync(outfile, "\\begin{document}\n");

fs.appendFileSync(outfile, "\\maketitle\n\\pagebreak[4]\n" +
    "\\tableofcontents\n" +
    "\\pagebreak[4]\n");

allFiles.forEach((texFile) => {
    for (const texMex of texFile) {
        let lines = fs.readFileSync(texMex).toString().split(/\r?\n/g);
        lines.splice(0, lines.findIndex(line => line.includes('\\begin{document}')) + 1);
        lines.splice(lines.findIndex(line => line.includes('\\end{document}')));
        fs.appendFileSync(outfile, lines.join('\n')
                .trim()
                //remove the contents section
                .replace(/^\\subsection\*{Contents}\s+\\begin{itemize}\s+\\setlength{\\itemsep}{[^}]+}\s+(^\s+\\item.*$\s)+^\\end{itemize}/gm, "")
                //now go line by line
                .split('\n')
                //make section, subsection, subsubsection invisible and use addcontentstoline directly after
                .map(line => (line.match(/^\\((?:sub){0,2}section)\*(\{[\w ]+\})$/) ? line.replace(/\\((?:sub){0,2}section)\*(\{[\w ]+\})/, "\\$1\*$2\n\\addcontentsline{toc}{$1}$2") : line))
                .map(line => (line.startsWith('\\includegraphics') ? line.replace(/(?<=\{).*(?=\})/, "." + path.join(path.dirname(texMex).replace(path.dirname(outfile), ""), line.match(/(?<=\{).*(?=\})/)[0])) : line))
                //IF YOU CANNOT GET MINTED TO WORK, REMOVE THESE LINES
                .map(line => (line === "\\begin{verbatim}" ? "\\begin{minted}{matlab}" : line))
                .map(line => (line === "\\end{verbatim}" ? "\\end{minted}" : line))
                .join('\n')
            + "\n");
    }
});

fs.appendFileSync(outfile, "\\end{document}");

console.log("Compiling tex");
process.chdir(path.dirname(outfile));

if (!fs.existsSync('build')) fs.mkdirSync('build');
console.log(execSync(`pdflatex -shell-escape -synctex=1 -interaction=nonstopmode -output-directory=build '${outfile}'`).toString());

fs.copyFileSync(path.join(path.dirname(outfile), 'build', path.basename(outfile.replace(/\.tex$/, ".pdf"))), outfile.replace(/\.tex$/, ".pdf"));

// open the pdf
try {
    spawn('evince', [`${outfile.replace(/\.tex$/, ".pdf")}`], {detached: true}).unref();
} catch (e) {
    console.log("Could not open the pdf");
    //fail silently, probably not on GNOME desktop
}

process.exit(0);
