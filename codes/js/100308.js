/**
 * Script to run Jest tests and save the output to a file.
 * Created with help using ChatGPT.
 */

import { exec } from 'child_process'
import { writeFile, mkdir } from 'fs/promises'

const timestamp = new Date().toISOString().replace(/:/g, '-')
const reportPath = `./test/reports/testreport_${timestamp}.txt`

// Check if the report directory exists and create it if it doesn't.
const reportDir = './test/reports'

async function generateReport() {
  try {
    await mkdir(reportDir, { recursive: true })

    exec(`npx --node-options=--experimental-vm-modules jest --verbose`, { shell: true }, (err, stdout, stderr) => {
      if (err) {
        console.error(`Error: ${stderr}`)
        return; // Abort if there's an error.
      }

      const reportContent = `${stdout}\n${stderr}` // Combine stdout and stderr.

      writeFile(reportPath, reportContent)
        .then(() => console.log(`Test report saved to ${reportPath}`))
        .catch(console.error)
    });
  } catch (error) {
    console.error('Failed to create reports directory:', error)
  }
}

generateReport()
