// settings.js
import fs from 'fs';
const filePath = './settings.json';

export function getSettings() {
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

export function saveSettings(newSettings) {
  fs.writeFileSync(filePath, JSON.stringify(newSettings, null, 2), 'utf-8');
}
