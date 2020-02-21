# Blockstack Thief
A simple command-line utility to interact with Gaia buckets using app private keys. Created to aid in a security assessment as described in [this article](https://medium.com/@marvinjanssen/stealing-app-private-keys-on-blockstack-2cec9d606390).

## Set up

1. Clone this repository.
2. `npm install`
3. `node index.js`

## Usage

Extract an app private key and start a session:

```
> session "https://appdomain.co" "app private key"
OK
```

Then list all files in the Gaia bucket using:

```
> listfiles
file1.json
file2.json
```

Decrypt a file and print to screen:

```
> getfile --decrypt --print file1.json
{ title: "file", content: "file contents" }
```

Run `help` to see a list of all commands.

