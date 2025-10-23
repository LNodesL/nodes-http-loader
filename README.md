# nodes-http-loader

A Node.js package to download, decrypt, and run a program from a URL using XOR encryption.

## Features

- Download any executable program from a URL
- Decrypt and run the program directly (no intermediate files)
- **Direct execution**: Downloads, decrypts, and runs programs in one command
- **Silent by default**: No console output unless using `--debug` flag
- **Cross-platform**: Works on Windows, macOS, and Linux
- **Argument passing**: Pass command-line arguments to the downloaded program
- **Automatic cleanup**: Temporary files are automatically removed after execution
- **Prepare workflow**: Encrypt local binaries for secure distribution to upload elsewhere, and download to your other machines using the same package.

## Installation

Install the package globally or locally using npm:

```
npm install -g nodes-http-loader
```

or

```
npm install nodes-http-loader
```

## Quick Start

### Basic Usage

1. **Download and run a program directly:**
   ```bash
   nodes-http-loader https://example.com/program mysecretkey
   ```

2. **Prepare a local binary:**
   ```bash
   nodes-http-loader prepare ./myapp mysecretkey
   # Upload prepared.bin to your server
   nodes-http-loader https://yourserver.com/prepared.bin mysecretkey
   ```

3. **Run with arguments:**
   ```bash
   nodes-http-loader https://example.com/program mysecretkey arg1 arg2
   ```

## Usage

### Method 1: Direct Download and Execution

To download a program from a URL, decrypt it, and run it directly, use the following command:

If you installed globally (-g flag) you do not need to use 'npx' in front.

```
npx nodes-http-loader <url> <key> [args...]
npx nodes-http-loader --debug <url> <key> [args...]  # With debug output
```

or if you installed globally (-g flag) you do not need to use 'npx' in front.

```
nodes-http-loader <url> <key> [args...]
nodes-http-loader --debug <url> <key> [args...]  # With debug output
```

**Examples:**

```
nodes-http-loader https://github.com/user/repo/releases/download/v1.0.0/app mysecretkey
nodes-http-loader https://example.com/program mykey
nodes-http-loader https://example.com/program mykey arg1 arg2 "argument with spaces"
nodes-http-loader --debug https://example.com/program mykey  # Show debug output
```

This command downloads the program from the URL, decrypts it, and runs it directly without creating any intermediate files.

**Note:** All downloaded files are expected to be encrypted. Use the `prepare` command to encrypt local binaries before uploading them.

### Method 2: Preparing a Binary for Upload

To prepare a local binary file for HTTP distribution, use the `prepare` command:

```
nodes-http-loader prepare <binary> <key> [output]
```

**Examples:**

```
nodes-http-loader prepare ./myapp mysecretkey
nodes-http-loader prepare ./myapp mysecretkey encrypted-app.bin
```

This command encrypts your local binary file and creates an encrypted version that you can upload to your web server. The output file is ready for HTTP distribution.

**Workflow:**
1. Prepare your binary: `nodes-http-loader prepare ./myapp mysecretkey`
2. Upload the generated `prepared.bin` to your web server
3. Run directly: `nodes-http-loader https://yourserver.com/prepared.bin mysecretkey`

### Direct Execution

The program is downloaded, decrypted, and executed directly without creating any intermediate files. You can pass arguments to the downloaded program:

```
nodes-http-loader https://example.com/program mysecretkey arg1 arg2
```

The execution is completely self-contained and requires only Node.js to run.

## Use Cases

- **Direct execution**: Download and run programs from GitHub releases in one command
- **CDN distribution**: Execute programs from CDNs or file hosting services
- **Secure distribution**: Control access to your programs through encryption keys
- **Offline preparation**: Encrypt your binaries locally and upload them to your server
- **Version management**: Easily update programs by uploading new encrypted versions
- **Remote deployment**: Deploy and run programs without local installation
- **Argument passing**: Pass command-line arguments to remote programs

## Security Notes

- **Encryption**: The downloaded program is encrypted using XOR encryption with your provided key
- **Key Security**: The key is provided at runtime - no persistent files are created
- **Trust**: Only use this tool with trusted URLs and programs
- **Cleanup**: The temporary decrypted file is automatically cleaned up after execution
- **Zero dependencies**: Uses only native Node.js modules
- **Cross-platform**: Works on Windows, macOS, and Linux with proper file permissions

## Troubleshooting

### Common Issues

**"spawn ENOEXEC" Error:**
- This usually means the downloaded file is not executable or corrupted
- Ensure you're using the correct key for the encrypted file.
- Make sure the file was properly encrypted with the `prepare` command

**File Not Found:**
- Check that the URL is accessible and returns the correct file
- Verify the file exists on the server

**Permission Denied:**
- On Unix-like systems, the script automatically sets execute permissions
- On Windows, ensure the file is a valid executable

**Network Issues:**
- The tool has a 360-second (6 minutes) timeout for downloads
- Check your internet connection and firewall settings

### Testing Your Setup

1. **Test with a simple file:**
   ```bash
   # Create a test file
   echo '#!/bin/bash\necho "Hello World!"' > test.sh
   chmod +x test.sh
   
   # Prepare it
   nodes-http-loader prepare test.sh mykey
   
   # Test locally (upload prepared.bin to a server first)
   nodes-http-loader https://yourserver.com/prepared.bin mykey
   ```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

LNodesL
