const fs = require("fs");
const path = require("path");
const { exec } = require("child_process"); // will help us create a child instance of our terminal

// since these codes are a static part of the program, we do not store them in our database (we can but it is not the best practice), we can store them in storages like S3 bucket and firebase storage or rightnow, we are just storing them in a separate folder
const outputPath = path.join(__dirname, "compiled_outputs"); // will add '/compiled_outputs' to the path of the current file's directory (executeCpp.js jis directory me hai)
// if the above path does not exist, then create a directory with this particular path
if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true }); // find on your own why we write recursive : true
}

const executeCpp = async (filePath, inputFilePath) => {
    // filepath = /Users/vatsal/Desktop/Algo Camp/Dev Season/Compiler/compiler_backend/codes/6a395a5c-a830-48ad-95b3-2b5bbf0ba992.cpp
    const jobId = path.basename(filePath).split(".")[0]; // 6a395a5c-a830-48ad-95b3-2b5 (split will split the filename into two parts with '.' as the breaking point, so : [filename,cpp])
    const outputFileName = `${jobId}.out`;
    const outPath = path.join(outputPath, outputFileName); // this is because by default the compiled output is a.out or a.exe, instead we want file_name.out/exe

    return new Promise((resolve, reject) => {
        // + know about this using chatgpt
        exec(
            `g++ "${filePath}" -o "${outPath}" && cd "${outputPath}" && "./${outputFileName}" < "${inputFilePath}"`, // "" around ${} will help us avoid breakage dure to space in folder names in path
            (error, stdout, stderr) => {
                if (error) {
                    // hamare code me breakage ki wajah se error
                    reject({ error, stderr });
                }
                if (stderr) {
                    // "cmd" ko execute karne me koi error
                    reject({ stderr });
                }
                resolve(stdout); // everything working as expected (no err)
            }
        );
    });
};

module.exports = executeCpp;
