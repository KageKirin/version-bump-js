#!/usr/bin/env node

'use strict';

const fs = require('fs');
const glob = require("glob");
const { ArgumentParser } = require('argparse');
const { version } = require('./package.json');

const parent_parser = new ArgumentParser({
  description: 'Version bump tool',
  add_help: false,
});

const parser = new ArgumentParser({
  description: 'Version bump tool',
  add_help: true,
  parents: [parent_parser]
});

let subparsers = parser.add_subparsers({dest: 'action', help: 'action to execute'});
subparsers.required = true

parent_parser.add_argument('file',   { help: 'file to modify', type: String, default: "package.json"})
parent_parser.add_argument('-r', '--regex', { help: 'ECMAScript Regular Expression to parse the version string', type: String, default: "^(?<major>[0-9]+)\.(?<minor>[0-9]+)\.(?<patch>[0-9]+)$" })

const get_parser = subparsers.add_parser('get', { parents: [parent_parser], help: 'get version number'});
const set_parser = subparsers.add_parser('set', { parents: [parent_parser], help: 'set version number'});
set_parser.add_argument('version',   { help: 'version to set', type: String});

const bump_parser = subparsers.add_parser('bump', { parents: [parent_parser], help: 'bump version number'});
bump_parser.add_argument('-M', '--major', { help: 'bump version major', action: 'store_true' });
bump_parser.add_argument('-m', '--minor', { help: 'bump version minor', action: 'store_true' });
bump_parser.add_argument('-p', '--patch', { help: 'bump version patch', action: 'store_true' });

const args = parser.parse_args();
main();

function main()
{
    //console.dir(parser);
    //console.dir(args);
    const fnMap = {
      "get": get_version,
      "set": set_version,
      "bump": bump_version
    };

    if (fnMap[args.action])
    {
      fnMap[args.action]();
    }
}

function get_version()
{
  let pkg = read_package_json(args.file);
  let ver = pkg.version
  let [major, minor, patch] = parse_version(ver);
  console.log(`${major}.${minor}.${patch}`);
  //console.dir({'major': major, 'minor': minor, 'patch': patch});
}

function set_version()
{
  let verTpl = parse_version(args.version);
  if (verTpl)
  {
    let [major, minor, patch] = verTpl;
    let pkg = read_package_json(args.file);
    pkg.version = args.version;
    write_package_json(args.file, pkg);
  }

  return get_version();
}

function bump_version()
{
  let pkg = read_package_json(args.file);
  let verTpl = parse_version(pkg.version);
  if (verTpl)
  {
    let [major, minor, patch] = verTpl;

    if (args.major)
    {
      major++;
    }

    if (args.minor)
    {
      minor++;
    }

    if (args.patch)
    {
      patch++;
    }

    pkg.version = `${major}.${minor}.${patch}`;
    write_package_json(args.file, pkg);
  }

  return get_version();
}

function read_package_json(file)
{
  return JSON.parse(fs.readFileSync(file));
}

function write_package_json(file, data)
{
  fs.writeFileSync(file, JSON.stringify(data, null, '  ') + '\n');
}

function parse_version(version)
{
  let match = version.match(args.regex);
  if (match)
  {
    return [match.groups.major, match.groups.minor, match.groups.patch];
  }
  return null
}
