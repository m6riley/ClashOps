import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.join(__dirname, 'src', 'config.js');
const examplePath = path.join(__dirname, 'src', 'config.example.js');

// Always regenerate config.js from example to ensure env vars are applied
console.log('Generating config.js from config.example.js...');

let configContent = fs.readFileSync(examplePath, 'utf-8');

// Replace placeholder keys with environment variables if they exist
const envKeys = {
  'YOUR_ADD_ACCOUNT_FUNCTION_KEY': process.env.ADD_ACCOUNT_KEY,
  'YOUR_GET_ACCOUNT_FUNCTION_KEY': process.env.GET_ACCOUNT_KEY,
  'YOUR_EDIT_ACCOUNT_FUNCTION_KEY': process.env.EDIT_ACCOUNT_KEY,
  'YOUR_DELETE_ACCOUNT_FUNCTION_KEY': process.env.DELETE_ACCOUNT_KEY,
  'YOUR_GET_PLAYER_DECKS_FUNCTION_KEY': process.env.GET_PLAYER_DECKS_KEY,
  'YOUR_SAVE_PLAYER_DECK_FUNCTION_KEY': process.env.SAVE_PLAYER_DECK_KEY,
  'YOUR_EDIT_PLAYER_DECK_FUNCTION_KEY': process.env.EDIT_PLAYER_DECK_KEY,
  'YOUR_DELETE_PLAYER_DECK_FUNCTION_KEY': process.env.DELETE_PLAYER_DECK_KEY,
  'YOUR_GET_CATEGORIES_FUNCTION_KEY': process.env.GET_CATEGORIES_KEY,
  'YOUR_SAVE_CATEGORY_FUNCTION_KEY': process.env.SAVE_CATEGORY_KEY,
  'YOUR_EDIT_CATEGORY_FUNCTION_KEY': process.env.EDIT_CATEGORY_KEY,
  'YOUR_DELETE_CATEGORY_FUNCTION_KEY': process.env.DELETE_CATEGORY_KEY,
  'YOUR_GET_FEATURES_FUNCTION_KEY': process.env.GET_FEATURES_KEY,
  'YOUR_GET_DECKS_FUNCTION_KEY': process.env.GET_DECKS_KEY,
  'YOUR_GET_CARDS_FUNCTION_KEY': process.env.GET_CARDS_KEY,
  'YOUR_ANALYZE_DECK_FUNCTION_KEY': process.env.ANALYZE_DECK_KEY,
  'YOUR_CREATE_REPORT_FUNCTION_KEY': process.env.CREATE_REPORT_KEY,
  'YOUR_OPTIMIZE_DECK_FUNCTION_KEY': process.env.OPTIMIZE_DECK_KEY,
};

// Replace placeholders with environment variables
let replacedCount = 0;
for (const [placeholder, envValue] of Object.entries(envKeys)) {
  if (envValue) {
    configContent = configContent.replace(new RegExp(placeholder, 'g'), `'${envValue}'`);
    replacedCount++;
  }
}

// Warn if no environment variables were found
if (replacedCount === 0) {
  console.warn('⚠️  WARNING: No environment variables found. Azure Functions will NOT work with placeholder keys!');
  console.warn('⚠️  Please set function key environment variables in Cloudflare Pages settings.');
} else {
  console.log(`✓ Replaced ${replacedCount} placeholder(s) with environment variables`);
}

fs.writeFileSync(configPath, configContent);
console.log('✓ config.js generated successfully');
