#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { spawn } = require('child_process');
const os = require('os');

// Debug logging function
let debugMode = false;
function debugLog(...args) {
    if (debugMode) {
        console.log(...args);
    }
}

// Debug error function
function debugError(message, error) {
    if (debugMode) {
        console.error(message, error);
    } else {
        console.error(message);
    }
}

// XOR encryption/decryption function
function xorEncrypt(data, key) {
    const keyBuffer = Buffer.from(key, 'utf8');
    const dataBuffer = Buffer.from(data);
    const result = Buffer.alloc(dataBuffer.length);
    
    for (let i = 0; i < dataBuffer.length; i++) {
        result[i] = dataBuffer[i] ^ keyBuffer[i % keyBuffer.length];
    }
    
    return result;
}

// XOR decryption function (same as encryption for XOR)
function xorDecrypt(encryptedData, key) {
    const keyBuffer = Buffer.from(key, 'utf8');
    const dataBuffer = Buffer.from(encryptedData);
    const result = Buffer.alloc(dataBuffer.length);
    
    for (let i = 0; i < dataBuffer.length; i++) {
        result[i] = dataBuffer[i] ^ keyBuffer[i % keyBuffer.length];
    }
    
    return result;
}

// Download file from URL
async function downloadFile(url) {
    return new Promise((resolve, reject) => {
        try {
            debugLog(`Downloading from: ${url}`);
            
            const urlObj = new URL(url);
            const isHttps = urlObj.protocol === 'https:';
            const client = isHttps ? https : http;
            
            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port || (isHttps ? 443 : 80),
                path: urlObj.pathname + urlObj.search,
                method: 'GET',
                headers: {
                    'User-Agent': 'nodes-http-loader/1.0.1'
                },
                timeout: 360000 // 360 second timeout
            };
            
            const req = client.request(options, (res) => {
                if (res.statusCode < 200 || res.statusCode >= 300) {
                    reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                    return;
                }
                
                const chunks = [];
                res.on('data', (chunk) => {
                    chunks.push(chunk);
                });
                
                res.on('end', () => {
                    const buffer = Buffer.concat(chunks);
                    resolve(buffer);
                });
                
                res.on('error', (error) => {
                    reject(error);
                });
            });
            
            req.on('error', (error) => {
                reject(error);
            });
            
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            
            req.end();
            
        } catch (error) {
            reject(error);
        }
    });
}


// Prepare function - encrypt a local binary file
function prepareBinary(inputFile, key, outputFile = 'prepared.bin') {
    try {
        debugLog(`Preparing binary: ${inputFile}`);
        
        // Check if input file exists
        if (!fs.existsSync(inputFile)) {
            console.error(`Error: Input file '${inputFile}' does not exist`);
            process.exit(1);
        }
        
        // Read the binary file
        const fileData = fs.readFileSync(inputFile);
        debugLog(`Read ${fileData.length} bytes from ${inputFile}`);
        
        // Encrypt the file data
        const encryptedData = xorEncrypt(fileData, key);
        debugLog('File encrypted successfully');
        
        // Write the encrypted data to output file
        fs.writeFileSync(outputFile, encryptedData);
        console.log(`Encrypted binary saved to: ${outputFile}`);
        
        console.log('');
        console.log('Upload this file to your web server and use:');
        console.log(`  nodes-http-loader <url-to-${outputFile}> ${key}`);
        console.log('');
        console.log('The prepared binary is encrypted and ready for HTTP distribution.');
        
    } catch (error) {
        console.error('Error preparing binary:', error.message);
        process.exit(1);
    }
}

// Main function
async function main() {
    const args = process.argv.slice(2);
    
    // Check for debug flag
    const debugIndex = args.indexOf('--debug');
    const isDebug = debugIndex !== -1;
    if (isDebug) {
        args.splice(debugIndex, 1); // Remove --debug from args
        debugMode = true;
    }
    
    
    if (args.length < 2) {
        console.log('Usage:');
        console.log('  nodes-http-loader <url> <key> [args...]           # Download, decrypt, and run program');
        console.log('  nodes-http-loader prepare <binary> <key> [output]  # Prepare binary for upload');
        console.log('  nodes-http-loader --debug <url> <key> [args...]   # Run with debug output');
        console.log('');
        console.log('Examples:');
        console.log('  nodes-http-loader https://example.com/program mysecretkey');
        console.log('  nodes-http-loader https://example.com/program mysecretkey arg1 arg2');
        console.log('  nodes-http-loader --debug https://example.com/program mysecretkey');
        console.log('  nodes-http-loader prepare ./myapp mysecretkey');
        console.log('  nodes-http-loader prepare ./myapp mysecretkey encrypted-app.bin');
        process.exit(1);
    }
    
    // Check if this is a prepare command
    if (args[0] === 'prepare') {
        if (args.length < 3) {
            console.log('Usage: nodes-http-loader prepare <binary> <key> [output]');
            console.log('');
            console.log('Examples:');
            console.log('  nodes-http-loader prepare ./myapp mysecretkey');
            console.log('  nodes-http-loader prepare ./myapp mysecretkey encrypted-app.bin');
            process.exit(1);
        }
        
        const inputFile = args[1];
        const key = args[2];
        const outputFile = args[3] || 'prepared.bin';
        
        prepareBinary(inputFile, key, outputFile);
        return;
    }
    
    // Regular URL download mode
    const url = args[0];
    const key = args[1];
    
    // Validate key is not empty
    if (!key || key.length === 0) {
        console.error('Error: Key cannot be empty');
        process.exit(1);
    }
    
    // Validate URL
    try {
        new URL(url);
    } catch (error) {
        console.error('Invalid URL:', url);
        process.exit(1);
    }
    
    debugLog('nodes-http-loader: Downloading program...');
    
    // Download the file
    let fileData;
    try {
        fileData = await downloadFile(url);
        debugLog(`Downloaded ${fileData.length} bytes`);
        debugLog('File downloaded successfully');
    } catch (error) {
        debugError('Download failed', error.message);
        process.exit(1);
    }
    
    debugLog('Decrypting program...');
    // Decrypt the data
    const decryptedData = xorDecrypt(fileData, key);
    debugLog('Program decrypted successfully');

    // Handle process termination
    process.on('SIGINT', () => {
        cleanup();
        process.exit(130);
    });
    
    process.on('SIGTERM', () => {
        cleanup();
        process.exit(143);
    });
    
    process.on('uncaughtException', (error) => {
        debugError('Fatal error', error.message);
        cleanup();
        process.exit(1);
    });
    
    try {
        // Create a temporary file with a unique name
        const tempDir = os.tmpdir();
        const tempFile = path.join(tempDir, `nodes-http-loader-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`);
        
        // Cleanup function
        function cleanup() {
            try {
                if (fs.existsSync(tempFile)) {
                    fs.unlinkSync(tempFile);
                }
            } catch (error) {
                // Silently ignore cleanup errors
            }
        }
        
        // Write decrypted data to temporary file
        fs.writeFileSync(tempFile, decryptedData);
        
        // Make the file executable (Unix-like systems)
        if (process.platform !== 'win32') {
            fs.chmodSync(tempFile, 0o755);
        }
        
        debugLog('Executing downloaded program...');
        
        // Execute the program with any additional arguments
        const programArgs = args.slice(2); // Skip: url, key
        const child = spawn(tempFile, programArgs, {
            stdio: 'inherit',
            detached: false
        });
        
        child.on('error', (error) => {
            debugError('Program execution failed', error.message);
            cleanup();
            process.exit(1);
        });
        
        child.on('exit', (code) => {
            cleanup();
            process.exit(code || 0);
        });
        
    } catch (error) {
        debugError('Execution failed', error.message);
        cleanup();
        process.exit(1);
    }
}

// Run the main function
main().catch(error => {
    debugError('Fatal error', error.message);
    process.exit(1);
});
