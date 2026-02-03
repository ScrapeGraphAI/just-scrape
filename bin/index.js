#!/usr/bin/env node

const chalk = require('chalk');
const figlet = require('figlet');

// Clear screen and display banner
console.clear();

// Display ASCII art banner on startup with orange-brown color
// Using 'Small' font which uses _ and | characters for a blocky ASCII art style
const banner = figlet.textSync('SCRAPEGRAPH CLI', {
  font: 'Small',
  horizontalLayout: 'default',
  verticalLayout: 'default'
});

// Use orange-brown color similar to the image (light brown/orange)
const bannerColor = '#DB895F';

// Color the banner with orange-brown color
const bannerLines = banner.split('\n');
const coloredBanner = bannerLines.map(line => chalk.hex(bannerColor)(line)).join('\n');

// Get version from package.json
const packageJson = require('../package.json');
const version = `ScrapeGraph AI v${packageJson.version}`;
const author = 'Created by ScrapeGraph Team';

// Display banner with orange-brown color, version and author
console.log('\n' + coloredBanner);
console.log(chalk.hex(bannerColor)(version));
console.log(chalk.hex('#E0E0E0')(author) + '\n');
