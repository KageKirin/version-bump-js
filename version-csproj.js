#!/usr/bin/env node

'use strict';

const fs = require('fs');
const glob = require("glob");
const xpath = require('xpath')
const { ArgumentParser } = require('argparse');
const { DOMParser, XMLSerializer } = require('@xmldom/xmldom')

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
subparsers.required = true;

parent_parser.add_argument('file',   { help: 'file to modify', type: String, default: "*.csproj"});
parent_parser.add_argument('-r', '--regex', { help: 'ECMAScript Regular Expression to parse the version string', type: String,
  default: raw`^(?<major>0|[1-9]\d*)\.(?<minor>0|[1-9]\d*)\.(?<patch>0|[1-9]\d*)(?:-(?<prerelease>(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+(?<buildmetadata>[0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$` });
parent_parser.add_argument('-x', '--xpath', { help: 'XPath to locate version element', type: String, default: "//PropertyGroup/Version" });


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
  const doc = read_csproj(args.file);
  const verElement = get_csproj_version(doc);
  if (verElement)
  {
    let ver = verElement.data
    let [major, minor, patch] = parse_version(ver);
    console.log(`${major}.${minor}.${patch}`);
  }
}

function set_version()
{
  let verTpl = parse_version(args.version);
  if (verTpl)
  {
    let [major, minor, patch] = verTpl;
    let doc = read_csproj(args.file);
    const verElement = get_csproj_version(doc);

    if (verElement)
    {
      verElement.data = args.version;
    }
    write_csproj(args.file, doc);
  }

  return get_version();
}

function bump_version()
{
  let doc = read_csproj(args.file);
  const verElement = get_csproj_version(doc);

  if (verElement)
  {
    let verTpl = parse_version(verElement.data);
    if (verTpl)
    {
      let [major, minor, patch, prerelease, buildmetadata] = verTpl;

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

      verElement.data = `${major}.${minor}.${patch}`;

      if (prerelease)
      {
          verElement.data += "-" + prerelease;
      }
      if (buildmetadata)
      {
          verElement.data += "+" + buildmetadata;
      }

      write_csproj(args.file, doc);
    }
  }

  return get_version();
}

function read_csproj(file)
{
  const files = glob.sync(file);
  if (files.length)
  {
    let xml = fs.readFileSync(files[0], 'utf8');

    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "application/xml");

    if (doc == null)
    {
      throw Error("error while parsing");
    }

    return doc;
  }

  return null;
}


function write_csproj(file, doc)
{
  const serializer = new XMLSerializer();
  const xml = serializer.serializeToString(doc);
  fs.writeFileSync(file, xml + '\n');
}

function get_csproj_version(doc)
{
  const verElement = xpath.select(args.xpath, doc);
  if (verElement)
  {
    return verElement[0].firstChild;
  }
  return null;
}

function parse_version(version)
{
  let match = version.match(args.regex);
  if (match)
  {
    return [match.groups.major, match.groups.minor, match.groups.patch, match.groups.prerelease, match.groups.buildmetadata];
  }
  return null;
}

function raw(str)
{
  return str.raw[0];
}
