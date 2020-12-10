/* eslint-disable no-control-regex */
const fs = require('fs');
const YAML = require('yaml');
const path = require('path');

/**
 * Generate router path
 * @param {string} name entity name
 * @returns {string} path
 */
function generateRouterPath(name, version = 'v1') {
  return `/api/${version}/${name}`;
}

/**
 * Parse the yaml to json object
 *
 * @param {string} file filepath
 * @returns {object} json
 */
function parseYaml(file) {
  return YAML.parse(fs.readFileSync(path.resolve(file), 'utf8'));
}

/**
 * Convert Windows backslash paths to slash paths: `foo\\bar` ➔ `foo/bar`.
 * @param {string} path - A Windows backslash path.
 * @returns {string} A path with forward slashes.
 */
function standarizePath(path) {
  const isExtendedLengthPath = /^\\\\\?\\/.test(path),
    hasNonAscii = /[^\u0000-\u0080]+/.test(path);

  if (isExtendedLengthPath || hasNonAscii) {
    return path;
  }

  return path.replace(/\\/g, '/');
}

/**
 * Extract entity name from folder
 * @param {string} file filepath
 * @returns {string}
 */
function getEntityName(file) {
  return standarizePath(file)
    .split('/')
    .reverse()[1];
}

/**
 * Parses Json in a secure way
 *
 * @param {string} string
 * @returns {object}
 */
function parseJson(string) {
  try {
    return JSON.parse(string);
  } catch (error) {
    return string;
  }
}

/**
 * Resolve file name by filepath
 * @param {string} file filepath
 * @returns {string}
 */
function getFilename(file) {
  return file
    .split('/')
    .pop()
    .split('.')[0];
}

/**
 * Validate UUID with a regex
 *
 * @param {string} uuid
 * @returns {boolean}
 */
function validUUID(uuid) {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  return uuid && regex.test(uuid);
}

exports.generateRouterPath = generateRouterPath;
exports.parseYaml = parseYaml;
exports.parseJson = parseJson;
exports.getEntityName = getEntityName;
exports.getFilename = getFilename;
exports.validUUID = validUUID;
