#!/usr/bin/env node
'use strict';

const package_info = require('./package.json');
const SessionStore = require('blockstack/lib/auth/sessionStore');
const blockstack = require('blockstack');
const fs = require('fs');

console.log("Blockstack Thief, version "+package_info.version);
console.log(package_info.description);
console.log("Type 'help' for commands.");

const vorpal = require('vorpal')();

var state = {
	apk: null,
	app_url: null,
	gaia_hub_url: 'https://hub.blockstack.org',
	scopes: ['store_write','publish_data'],
	data_store: null,
	session: null
};

function show_error(error)
	{
	vorpal.log(error.name+': '+error.message);
	}

var session_started = () => {if(!state.session) return 'Start a session first using session'};

vorpal.delimiter('> ').show();

vorpal.command('session <app url> <app private key>','Initiate a session for given app private key.')
	.alias('s')
	.option('-g, --gaia-hub <hub url>','Use alternate Gaia hub')
	.action(function(args,next)
		{
		state.apk = args['app private key'];
		state.app_url = args['app url'];
		if (args.options['gaia-hub'])
			state.gaia_hub_url = args.options['gaia-hub'];

		state.data_store = new SessionStore.InstanceDataStore(
			{
			userData:
				{
				appPrivateKey: state.apk,
				hubUrl: state.gaia_hub_url
				}
			});

		state.session = new blockstack.UserSession(
			{
			sessionStore: state.data_store,
			appConfig: new blockstack.AppConfig(state.scopes,state.app_url)
			});

		if (state.session.isUserSignedIn())
			{
			this.log('OK');
			vorpal.delimiter(state.app_url+'>').show();
			}
		else
			this.log('Failed');

		next();
		});

vorpal.command('listfiles')
	.alias('ls')
	.validate(session_started)
	.action(function(args,next)
		{
		state.session.listFiles(file => {this.log(file);return true})
			.finally(next);
		});

vorpal.command('getfile <file>')
	.option('-d, --decrypt [private key]','Attempt to decrypt the file')
	.option('-v, --verify','Attempt to verify the signature')
	.option('-p, --print','Print file to screen')
	.alias('r')
	.validate(session_started)
	.action(function(args,next)
		{
		var options = {decrypt:args.options.decrypt || false,verify:!!args.options.verify};
		state.session.getFile(args['file'],options)
			.then(data => 
				{
				if (args.options['print'])
					this.log(data);
				else
					fs.writeFileSync('files/'+args['file'],data instanceof ArrayBuffer ? Buffer.from(data) : data,'binary');
				})
			.catch(show_error)
			.finally(next)
		});

vorpal.command('putfile <file>')
	.option('-e, --encrypt [public key]','Encrypt the file')
	.option('-s, --sign','Sign the file')
	.option('-c, --content <content>','Write specified content to file')
	.alias('w')
	.validate(session_started)
	.action(function(args,next)
		{
		var content = args.options['content'] || fs.readFileSync('files/'+args['file'],'utf8');
		var options = {encrypt:args.options.encrypt || false,sign:!!args.options.sign};
		state.session.putFile(args['file'],content,options)
			.then(data => this.log(data))
			.catch(show_error)
			.finally(next)
		});

vorpal.command('deletefile <file>')
	.alias('d')
	.validate(session_started)
	.action(function(args,next)
		{
		state.session.deleteFile(args['file'])
			.then(data => data && this.log(data))
			.catch(show_error)
			.finally(next)
		});
