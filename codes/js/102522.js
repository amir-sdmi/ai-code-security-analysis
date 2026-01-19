import * as lola from './Lola/lola.js';
import Blockly from 'blockly/core';
import Swal from 'sweetalert2';

import {
    ONLY_CLOSABLE_TOASTR_SETTINGS,
    toastError,
    toastInfo,
    toastSuccess,
    toastWarning,
} from "./userAlerts";
import {save} from "./util"

let currentLolaValidationErrors = ''

export let validLolaGeneratedCode = false
export let invalidLolaGeneratedCode = false
export let lastValidLolaGeneratedCode = ''
export let lastInvalidLolaGeneratedCode = ''


export function toggleValidCodeMethods(on) {

    const VALID_CODE_FUNCTIONS = ['Stimulate']
    const VALID_CODE_FOLDERS = ['Convert Lola']

    // remove or add valid code folders
    VALID_CODE_FOLDERS.forEach(validCodeFolder => {
        toggleFolder(validCodeFolder, on)
    })

    // remove or add valid code functions
    VALID_CODE_FUNCTIONS.forEach(validCodeFunction => {
        toggleFunction(validCodeFunction, on)
    })

    // save global variable if code is valid right now
    validLolaGeneratedCode = on

    // save last valid code, if code was invalidated => set 'none'
    lastValidLolaGeneratedCode = on ? lola.generator.workspaceToCode(Blockly.getMainWorkspace()) : 'none';
}

export function toggleInvalidCodeMethods(on) {

    const INVALID_CODE_FUNCTIONS = ['Ask ChatGPT about errors']
    // const INVALID_CODE_FOLDERS = ['Convert Lola']

    // remove or add invalid code folders
    // VALID_CODE_FOLDERS.forEach(validCodeFolder => {
    //     toggleFolder(validCodeFolder, on)
    // })

    // remove or add valid code functions
    INVALID_CODE_FUNCTIONS.forEach(invalidCodeFunction => {
        toggleFunction(invalidCodeFunction, on)
    })

    // save global variable if code is invalid right now
    invalidLolaGeneratedCode = on

    // save last invalid code, if code was invalidated => set 'none'
    lastInvalidLolaGeneratedCode = on ? lola.generator.workspaceToCode(Blockly.getMainWorkspace()) : 'none';
}

// toggleFunction('Stimulate', false)
function toggleFunction(functionName, on) {
    const functionElements = document.querySelectorAll('li.cr.function');
    for (let i = 0; i < functionElements.length; i++) {
        const functionElement = functionElements[i];
        const functionNameElement = functionElement.querySelector('div span.property-name');
        const name = functionNameElement.textContent.trim();

        if (name === functionName) {
            functionElement.style.display = on ? 'list-item' : 'none';
            break;
        }
    }
}

// toggleFolder('Lola', false)
function toggleFolder(folderName, on) {
    const folderElements = document.querySelectorAll('li.folder');
    for (let i = 0; i < folderElements.length; i++) {
        const folderElement = folderElements[i];
        const titleElement = folderElement.querySelector('div.dg ul li.title');
        const title = titleElement.textContent.trim();

        if (title === folderName) {
            folderElement.style.display = on ? 'list-item' : 'none';
            break;
        }
    }
}

// generate Lola to Verilog, then send that verilog code to /generate-verilog-testbench
async function generateTestbenchVerilog(useChatGPT = false) {

    const generatedCode = lola.generator.workspaceToCode(Blockly.getMainWorkspace());
    const moduleName = lola.getModuleNameLolaCode(generatedCode)

    try {
        const response = await fetch('/lola-to-verilog', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({code: generatedCode})
        });

        const content = await response.json();

        if (content.compiled) {
            try {
                const testbenchResponse = await fetch('/generate-verilog-testbench', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(
                        {"verilogCode": content.verilogCode, "useChatGPT": useChatGPT})
                });

                let testbenchContent = await testbenchResponse.json();
                testbenchContent.moduleName = moduleName
                return testbenchContent

            } catch (error) {
                console.error(error);
                toastError('An error occurred while processing your request. Please try again later.');
            }


        } else {
            let message = `Converting to Verilog failed.\nErrors:\n - ${content.compilationErrors.join('\n -')}`
            toastWarning(message, ONLY_CLOSABLE_TOASTR_SETTINGS);
        }
    } catch (error) {
        console.error(error);
        toastError('An error occurred while processing your request. Please try again later.');
    }
}

// generate Lola to Verilog, then send that verilog code to /stimulate-verilog
async function stimulateVerilog(testbenchCode) {

    const generatedCode = lola.generator.workspaceToCode(Blockly.getMainWorkspace());
    const moduleName = lola.getModuleNameLolaCode(generatedCode)

    try {
        const response = await fetch('/lola-to-verilog', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({code: generatedCode})
        });

        const content = await response.json();

        if (content.compiled) {
            try {
                const stimulatedResponse = await fetch('/stimulate-verilog', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        "verilogCode": content.verilogCode,
                        "moduleName": moduleName,
                        "testbenchCode": testbenchCode
                    })
                });

                return await stimulatedResponse.json()

            } catch (error) {
                console.error(error);
                toastError('An error occurred while processing your request. Please try again later.');
            }

        } else {
            let message = `Converting to Verilog failed.\nErrors:\n - ${content.compilationErrors.join('\n -')}`
            toastWarning(message, ONLY_CLOSABLE_TOASTR_SETTINGS);
        }
    } catch (error) {
        console.error(error);
        toastError('An error occurred while processing your request. Please try again later.');
    }
}

export async function checkLolaCodeValid() {

    // get generated code
    const generatedCode = lola.generator.workspaceToCode(Blockly.getMainWorkspace());

    try {
        const response = await fetch('/validate-lola', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({code: generatedCode})
        });

        const content = await response.json();

        if (content.valid) {
            toggleValidCodeMethods(true)
            toggleInvalidCodeMethods(false)
            toastSuccess(`Simulating & Converting Lola code is now available`);
            toastSuccess(`Lola code is valid.`)

        } else if (content.emptyCode) {

            currentLolaValidationErrors = content.compilationErrors.join('\n - ')
            let message = `Validation failed.\nErrors:\n - ${content.compilationErrors.join('\n - ')}`
            toggleValidCodeMethods(false)
            toastInfo(message);

        } else {
            currentLolaValidationErrors = content.compilationErrors.join('\n - ')
            let message = `Validation failed.\nErrors:\n - ${content.compilationErrors.join('\n - ')}`
            toggleValidCodeMethods(false)
            toggleInvalidCodeMethods(true)
            toastWarning(message, ONLY_CLOSABLE_TOASTR_SETTINGS);
        }

    } catch (error) {
        console.error(error);
        toggleValidCodeMethods(false)
        toastError('An error occurred while processing your request. Please try again later.');
    }
}

export async function convertLolaToVerilog() {

    const generatedCode = lola.generator.workspaceToCode(Blockly.getMainWorkspace());
    const moduleName = lola.getModuleNameLolaCode(generatedCode)

    try {
        const response = await fetch('/lola-to-verilog', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({code: generatedCode})
        });

        const content = await response.json();

        if (content.compiled) {
            toastSuccess(`Downloading ${moduleName} in Verilog`)
            save(`${moduleName}.v`, content.verilogCode);

        } else if (content.emptyCode) {
            let message = `Converting to Verilog failed.\nErrors:\n - ${content.compilationErrors.join('\n -')}`
            toastInfo(message);

        } else {
            let message = `Converting to Verilog failed.\nErrors:\n - ${content.compilationErrors.join('\n -')}`
            toastWarning(message, ONLY_CLOSABLE_TOASTR_SETTINGS);
        }
    } catch (error) {
        console.error(error);
        toastError('An error occurred while processing your request. Please try again later.');
    }
}

export async function convertLolaToVHDL() {
    const generatedCode = lola.generator.workspaceToCode(Blockly.getMainWorkspace());
    const moduleName = lola.getModuleNameLolaCode(generatedCode)

    try {
        const response = await fetch('/lola-to-vhdl', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({code: generatedCode})
        });

        const content = await response.json();

        if (content.converted) {
            toastSuccess(`Downloading ${moduleName} in VHDL`)
            save(`${moduleName}.vhdl`, content.code);

        } else {
            let message = `Converting ${moduleName} to VHDL failed.\nErrors:\n - ${content.conversionErrors.join('\n -')}`
            toastWarning(message, ONLY_CLOSABLE_TOASTR_SETTINGS);
        }
    } catch (error) {
        console.error(error);
        toastError('An error occurred while processing your request. Please try again later.');
    }
}

export async function convertLolaToC() {
    const generatedCode = lola.generator.workspaceToCode(Blockly.getMainWorkspace());
    const moduleName = lola.getModuleNameLolaCode(generatedCode)

    try {
        const response = await fetch('/lola-to-c', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({code: generatedCode, moduleName: moduleName})
        });

        const content = await response.json();

        if (content.converted) {
            toastSuccess(`Downloading ${moduleName} in C`)
            save(`${moduleName}.c`, content.code);

        } else {
            let message = `Converting to ${moduleName} C failed.\nErrors:\n - ${content.conversionErrors.join('\n -')}`
            toastWarning(message, ONLY_CLOSABLE_TOASTR_SETTINGS);
        }
    } catch (error) {
        console.error(error);
        toastError('An error occurred while processing your request. Please try again later.');
    }
}

export async function convertLolaToSystemC() {
    const generatedCode = lola.generator.workspaceToCode(Blockly.getMainWorkspace());
    const moduleName = lola.getModuleNameLolaCode(generatedCode)

    try {
        const response = await fetch('/lola-to-system-c', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({code: generatedCode, moduleName: moduleName})
        });

        const content = await response.json();

        if (content.converted) {
            toastSuccess(`Downloading ${moduleName} in systemC`)
            save(`${moduleName}.cpp`, content.codeCPP);
            save(`${moduleName}.h`, content.codeH);

        } else {
            let message = `Converting to ${moduleName} system C failed.\nErrors:\n - ${content.conversionErrors.join('\n -')}`
            toastWarning(message, ONLY_CLOSABLE_TOASTR_SETTINGS);
        }
    } catch (error) {
        console.error(error);
        toastError('An error occurred while processing your request. Please try again later.');
    }
}

export async function stimulateLolaCode() {
    let stimulateProcess = true;
    let fileUploaded = false;
    let fileUploadedName = ''
    let fileUploadedData = ''

    async function manualFileUpload() {
        const { value: file } = await Swal.fire({
            title: 'Select Verilog testbench file',
            input: 'file',
            inputAttributes: {
                'aria-label': 'Upload Verilog testbench',
                accept: '.v'
            },
            showCancelButton: true,
            confirmButtonText: 'Upload',
            cancelButtonText: 'Cancel',
            inputValidator: (file) => {
                if (!file || !file.name.endsWith('.v')) {
                    return 'Please select a valid Verilog testbench file.'
                }
            }
        });

        if (file) {
            const reader = new FileReader();
            return new Promise((resolve, reject) => {
                reader.onload = (e) => {
                    const fileData = e.target.result;
                    const fileName = `manual_upload_${file.name}`;
                    resolve({ fileData, fileName });
                };
                reader.readAsText(file);
            });
        } else {
            return null;
        }
    }

    // buttons => stimulate, upload, download, X
    async function mainMenu() {
        let choice = await Swal.fire({
            title: 'Code stimulation',
            icon: fileUploaded ? 'success' : 'info',
            // text: fileUploaded ? `${fileUploadedName}` : "",
            footer: fileUploaded ? `TB: ${fileUploadedName}` : "No testbench uploaded",

            // stimuli button
            confirmButtonText: 'Stimulate',
            showConfirmButton: fileUploaded,

            // TBM button
            denyButtonText: 'Testbench manager',
            denyButtonColor: '#136ecc',
            showDenyButton: true,

            // download button
            cancelButtonText: 'Download files',
            cancelButtonColor: '#4b9a1f',

            showCancelButton: true,

            showCloseButton: true,

        }).then(async (result) => {
            return result
        });

        if (choice.isConfirmed === true) {
            return "stimulate"
        } else if (choice.isDenied === true) {
            return "testbench"
        } else if (choice.dismiss === Swal.DismissReason.cancel) {
            return "download"
        } else {
            return "cancel"
        }
    }

    async function testbenchMenu() {
        let choiceTestbench = await Swal.fire({
            title: "Testbench manager",
            icon: fileUploaded ? 'success' : 'info',
            footer: fileUploaded ? `TB: ${fileUploadedName}` : "No testbench uploaded",

            // generate
            confirmButtonText: 'Generate',
            confirmButtonColor: '#136ecc',
            showConfirmButton: true,

            // upload
            denyButtonText: 'Upload',
            denyButtonColor: '#136ecc',
            showDenyButton: true,

            // return
            cancelButtonText: 'Return',
            cancelButtonColor: 'grey',
            showCancelButton: true,

            showCloseButton: true,

        }).then(async (resultTestbench) => {
            return resultTestbench
        });

        if (choiceTestbench.isConfirmed === true) {
            return "generate testbench"
        } else if (choiceTestbench.isDenied === true) {
            return "upload testbench"
        } else if (choiceTestbench.dismiss === Swal.DismissReason.cancel) {
            return "return"
        } else {
            return "cancel"
        }


    }

    async function generateMenu() {
        let choiceGenerate = await Swal.fire({
            title: "Testbench generator",
            icon: fileUploaded ? 'success' : 'info',
            footer: fileUploaded ? `TB: ${fileUploadedName}` : "No testbench uploaded",

            // generate auto jinja2
            confirmButtonText: 'Jinja2 generate',
            confirmButtonColor: 'rgb(19,71,204)',
            showConfirmButton: true,

            // generate chatgpt
            denyButtonText: 'ChatGPT generate',
            denyButtonColor: 'rgb(19,71,204)',
            showDenyButton: true,

            // return
            cancelButtonText: 'Return',
            cancelButtonColor: 'grey',
            showCancelButton: true,

            showCloseButton: true,

        }).then(async (resultGenerate) => {
            return resultGenerate
        });

        if (choiceGenerate.isConfirmed === true) {
            return "jinja2"
        } else if (choiceGenerate.isDenied === true) {
            return "chatgpt"
        } else if (choiceGenerate.dismiss === Swal.DismissReason.cancel) {
            return "return"
        } else {
            return "cancel"
        }
    }

    async function downloadMenu() {
        let choiceDownload = await Swal.fire({
            title: "Download manager",
            icon: fileUploaded ? 'success' : 'info',
            footer: fileUploaded ? `TB: ${fileUploadedName}` : "No testbench uploaded",

            // download as verilog
            confirmButtonText: 'Download code as Verilog',
            confirmButtonColor: '#54a12c',
            showConfirmButton: true,

            // download testbench
            denyButtonText: 'Download testbench',
            denyButtonColor: '#4b9a1f',
            showDenyButton: fileUploaded,

            // return
            cancelButtonText: 'Return',
            cancelButtonColor: 'grey',
            showCancelButton: true,

            showCloseButton: true,

        }).then(async (resultDownload) => {
            return resultDownload
        });

        if (choiceDownload.isConfirmed === true) {
            return "code"
        } else if (choiceDownload.isDenied === true) {
            return "testbench"
        } else if (choiceDownload.dismiss === Swal.DismissReason.cancel) {
            return "return"
        } else {
            return "cancel"
        }
    }

    async function resultMenu(stimulationResult) {

        let choiceDownload = await Swal.fire({
            title: "Stimulus result",
            html: stimulationResult.stimulatedOutput.join('<br>'),
            icon: stimulationResult.stimulated ? 'success' : 'error',
            footer: `TB: ${fileUploadedName}`,

            // only return
            confirmButtonText: 'Return',
            cancelButtonColor: 'grey',
            showConfirmButton: true,

            showDenyButton: false,
            showCancelButton: false,

            showCloseButton: true,

        }).then(async (choiceDownload) => {
            return choiceDownload
        });

        if (choiceDownload.isConfirmed === true) {
            return "return"
        } else {
            return "cancel"
        }

    }

    while (stimulateProcess) {

        let menuOption = await mainMenu()

        switch (menuOption) {

            // STIMULATE HERE
            case "stimulate":
                let stimulationResult = await stimulateVerilog(fileUploadedData)
                let resultChoice = await resultMenu(stimulationResult)

                if (resultChoice === "cancel") {stimulateProcess = false;}
                break;

            // TESTBENCH MENU below
            case "testbench":
                let testbenchProcess = true;
                while (testbenchProcess) {
                    let testbenchOption = await testbenchMenu()

                    switch (testbenchOption) {

                        // GENERATE MENU below
                        case "generate testbench":

                            let generatingTestbenchProcess = true;
                            while (generatingTestbenchProcess) {
                                let generateOption = await generateMenu()
                                switch (generateOption) {

                                    // jinja2 generate with template
                                    case "jinja2":
                                        toastInfo("Wait for Jinja2 to generate the testbench")
                                        let verilogTb = await generateTestbenchVerilog(false)

                                        if (verilogTb.generated) {

                                            fileUploaded = true
                                            fileUploadedName = `chatgpt_${verilogTb.moduleName}_tb.v`;
                                            fileUploadedData = verilogTb.testbenchCode;

                                            // leave generation menu & testbench manager
                                            generatingTestbenchProcess = false;
                                            testbenchProcess = false;
                                            toastSuccess(`Testbench generated with Jinja2 - ${fileUploadedName}`)

                                        } else {
                                            fileUploaded = false;
                                            fileUploadedName = '';
                                            fileUploadedData = '';
                                            toastWarning("Failed to generate testbench with Jinja2")
                                        }

                                        break;

                                    // generate with chatgpt
                                    case "chatgpt":
                                        toastInfo("Wait for ChatGPT to generate the testbench")
                                        let verilogTestbench = await generateTestbenchVerilog(true)

                                        if (verilogTestbench.generated) {

                                            fileUploaded = true
                                            fileUploadedName = `chatgpt_${verilogTestbench.moduleName}_tb.v`;
                                            fileUploadedData = verilogTestbench.testbenchCode;

                                            // leave generation menu & testbench manager
                                            generatingTestbenchProcess = false;
                                            testbenchProcess = false;
                                            toastSuccess(`Testbench generated with ChatGPT - ${fileUploadedName}`)

                                        } else {
                                            fileUploaded = false;
                                            fileUploadedName = '';
                                            fileUploadedData = '';
                                            let longerToastOptions = {timeOut: 10000}
                                            toastWarning("Failed to generate testbench with ChatGPT", longerToastOptions)
                                        }

                                        break;

                                    // return to testbench menu
                                    case "return":
                                        generatingTestbenchProcess = false;
                                        break;

                                    // cancel whole stimulation
                                    case "cancel":
                                        stimulateProcess = false;
                                        testbenchProcess = false;
                                        generatingTestbenchProcess = false;
                                        toastInfo("Stimulation exited")
                                        break;
                                }
                            }
                            break;
                        // upload stimulation manually
                        case "upload testbench":
                            const uploadedFile = await manualFileUpload();
                            if (uploadedFile) {
                                fileUploaded = true;
                                fileUploadedName = uploadedFile.fileName;
                                fileUploadedData = uploadedFile.fileData;
                                testbenchProcess = false;
                                toastSuccess(`Manually uploaded - ${fileUploadedName}`);
                            }
                            break;

                        // return to main menu
                        case "return":
                            testbenchProcess = false;
                            break;

                        // cancel whole stimulation
                        case "cancel":
                            stimulateProcess = false;
                            testbenchProcess = false;
                            toastInfo("Stimulation exited")
                            break;
                    }
                }
                break;


            // DOWNLOAD MENU below
            case "download":
                let downloadingProcess = true;
                while (downloadingProcess) {
                    let downloadOption = await downloadMenu()

                    switch (downloadOption) {

                        // download code as verilog
                        case "code":
                            await convertLolaToVerilog()
                            break;

                        case "testbench":
                            toastSuccess(`Downloading testbench ${fileUploadedName}`)
                            save(fileUploadedName, fileUploadedData)
                            break;

                        case "return":
                            downloadingProcess = false;
                            break;

                        case "cancel":
                            downloadingProcess = false;
                            stimulateProcess = false;
                            toastInfo("Stimulation exited")
                            break;
                    }
                }
                break;

            // one of the cancels
            case "cancel":
                stimulateProcess = false;
                toastInfo("Stimulation exited")
                break;

        }
    }

}

export async function consultChatGPT() {

    // get generated code
    const generatedCode = lola.generator.workspaceToCode(Blockly.getMainWorkspace());
    toastInfo("Question sent to ChatGPT. Waiting for answer...")
    try {
        const response = await fetch('/ask-chat-gpt-lola', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({lolaCode: generatedCode, lolaErrors: currentLolaValidationErrors})
        });

        const content = await response.json();

        if (content.status === 200) {
            await Swal.fire({
                title: 'ChatGPT:',
                icon: "info",
                position: "top-right",
                text: content.response
            })

        } else {
            await Swal.fire({
                icon: 'error',
                title: 'Oops...',
                position: "top-right",
                text: content.response
            })
        }
    } catch (error) {
        console.error(error);
        toastError('An error occurred while processing your request. Please try again later.');
    }

}

export function sendXmlToWorkspace(xml, addXml, filename) {

    if (addXml)
        xml = '<xml>' + xml + '</xml>';

    // confirm that xml is valid
    let dom = ''
    try {
        dom = Blockly.utils.xml.textToDom(xml);
    } catch (error) {
        let message = `Reading XML failed.\n${error}`
        toastWarning(message, ONLY_CLOSABLE_TOASTR_SETTINGS);
        return
    }

    const workspaceDom = Blockly.Xml.workspaceToDom(Blockly.getMainWorkspace())
    const workspacePrettyXml = Blockly.Xml.domToPrettyText(workspaceDom)

    const tagRegex = /<\/?xml[^>]*>/gm;
    const workspaceWithoutXMLTags = workspacePrettyXml.replace(tagRegex, '');


    // if empty current workspace, just instantly import
    if (workspaceWithoutXMLTags.trim().length === 0) {
        // clear variables
        Blockly.getMainWorkspace().clear()

        // write xml to workspace
        Blockly.Xml.domToWorkspace(dom, Blockly.getMainWorkspace());
        toastSuccess(`Workspace ${filename} imported successfully`)

    } else {

        Swal.fire({
            title: "Workspace XML import",
            text: "Importing new workspace will discard current one.\n" +
                "Do you want to export current workspace as XML?",
            showDenyButton: true,
            showCancelButton: true,
            confirmButtonText: "Save",
            denyButtonText: "Discard",
            cancelButtonText: "Cancel"
        }).then((result) => {
            if (result.isConfirmed || result.isDenied) {

                // save current workspace as XML
                if (result.isConfirmed) {
                    exportXml()
                }

                // clear variables
                Blockly.getMainWorkspace().clear()

                // write xml to workspace
                Blockly.Xml.domToWorkspace(dom, Blockly.getMainWorkspace());
                toastSuccess(`Workspace ${filename} imported successfully`)


            } else {
                toastInfo("Workspace XML import cancelled")
            }
        })
    }
}

export function importXml() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xml';

    // user selects a file
    input.onchange = () => {
        const file = input.files[0];

        // file extension = .xml only
        if (!file || !file.name.endsWith('.xml')) {
            toastWarning('Please select an XML file');
            return;
        }

        const reader = new FileReader();

        // when the file has been read
        reader.onload = (event) => {
            const xml = event.target.result;
            sendXmlToWorkspace(xml, false, file.name);
            toastSuccess(`Workspace ${file.name} loaded`);
        };

        // file => text
        reader.readAsText(file);

        // remove input
        document.body.removeChild(input);
    };

    // trigger input with pressing
    input.click();

    // Append the input element to the body
    document.body.appendChild(input);
}

export function exportXml() {
    const dom = Blockly.Xml.workspaceToDom(Blockly.getMainWorkspace())
    const prettyXml = Blockly.Xml.domToPrettyText(dom)
    const generatedCode = lola.generator.workspaceToCode(Blockly.getMainWorkspace());
    const moduleName = lola.getModuleNameLolaCode(generatedCode)


    const tagRegex = /<\/?xml[^>]*>/gm;
    const xmlWithoutXmlTags = prettyXml.replace(tagRegex, '');

    if (xmlWithoutXmlTags.trim().length === 0) {
        toastInfo("Empty workspace. Nothing to export")
    } else {
        toastSuccess("Workspace exported")
        save(`${moduleName}.xml`, prettyXml)
    }

}