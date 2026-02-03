# ScrapeGraph CLI

A basic command-line interface (CLI) tool built with Node.js, following best practices for CLI development.

## Features

- 🎨 Beautiful terminal output with colors and boxes using `chalk` and `boxen`
- 📝 Command-line argument parsing with `yargs`
- 🚀 Easy to install and use globally
- 🔧 Extensible architecture

## Installation

### Local Development

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd scrapegraph-cli
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Install globally (from the project root):
   ```bash
   npm install -g .
   ```

## Usage

After installation, you can use the CLI from anywhere in your terminal:

```bash
# Run the CLI
scrapegraphai

# Show help
scrapegraphai --help
```

### Command Options

- `--help`: Show help message
- `--version`: Show version number

## Project Structure

```
scrapegraph-cli/
├── bin/
│   └── index.js          # CLI entry point
├── package.json          # Project configuration
└── README.md            # This file
```

## Development

The CLI is built using:

- **[yargs](https://www.npmjs.com/package/yargs)** - Command-line argument parsing
- **[chalk](https://www.npmjs.com/package/chalk)** - Terminal string styling
- **[boxen](https://www.npmjs.com/package/boxen)** - Create boxes in terminal

## Customization

To customize the CLI:

1. **Change the command name**: Edit the `bin` field in `package.json`
2. **Add new options**: Modify the `yargs` configuration in `bin/index.js`
3. **Update functionality**: Extend the main CLI logic in `bin/index.js`

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
