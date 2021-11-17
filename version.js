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

let subparsers = parser.add_subparsers({dest: 'action', help: 'action to execute'})
subparsers.required = true

parent_parser.add_argument('file',   { help: 'file to modify', type: String, default: "package.json"})
parent_parser.add_argument('-r', '--regex', { help: 'ECMAScript Regular Expression to parse the version string', type: String, default: "" })

const get_parser = subparsers.add_parser('get', { parents: [parent_parser], help: 'get version number'});
const set_parser = subparsers.add_parser('set', { parents: [parent_parser], help: 'set version number'});
set_parser.add_argument('version',   { help: 'version to set', type: String})

const bump_parser = subparsers.add_parser('bump', { parents: [parent_parser], help: 'bump version number'});
bump_parser.add_argument('-M', '--major', { help: 'bump version major', action: 'store_true' })
bump_parser.add_argument('-m', '--minor', { help: 'bump version minor', action: 'store_true' })
bump_parser.add_argument('-p', '--patch', { help: 'bump version patch', action: 'store_true' })

const args = parser.parse_args();
main();

function main()
{
    console.dir(parser);
    console.dir(args);
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
  console.log('get');
}

function set_version()
{
  console.log('set');
}

function bump_version()
{
  console.log('bump');
}
