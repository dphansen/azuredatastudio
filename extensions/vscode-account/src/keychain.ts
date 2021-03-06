/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// keytar depends on a native module shipped in vscode, so this is
// how we load it
import * as keytarType from 'keytar';
import * as vscode from 'vscode';
import Logger from './logger';
import * as nls from 'vscode-nls';

const localize = nls.loadMessageBundle();

function getKeytar(): Keytar | undefined {
	try {
		return require('keytar');
	} catch (err) {
		console.log(err);
	}

	return undefined;
}

export type Keytar = {
	getPassword: typeof keytarType['getPassword'];
	setPassword: typeof keytarType['setPassword'];
	deletePassword: typeof keytarType['deletePassword'];
};

const SERVICE_ID = `${vscode.env.uriScheme}-microsoft.login`;
const ACCOUNT_ID = 'account';

export class Keychain {
	private keytar: Keytar;

	constructor() {
		const keytar = getKeytar();
		if (!keytar) {
			throw new Error('System keychain unavailable');
		}

		this.keytar = keytar;
	}

	// TODO remove, temporary migration
	async migrateToken(): Promise<void> {
		const oldServiceId = `${vscode.env.uriScheme}-vscode.login`;
		try {
			const data = await this.keytar.getPassword(oldServiceId, ACCOUNT_ID);
			if (data) {
				Logger.info('Migrating token...');
				this.setToken(data);
				await this.keytar.deletePassword(oldServiceId, ACCOUNT_ID);
				Logger.info('Migration successful');
			}
		} catch (e) {
			Logger.error(`Migrating token failed: ${e}`);
		}
	}


	async setToken(token: string): Promise<void> {
		try {
			Logger.trace('Writing to keychain', token);
			return await this.keytar.setPassword(SERVICE_ID, ACCOUNT_ID, token);
		} catch (e) {
			Logger.error(`Setting token failed: ${e}`);

			// Temporary fix for #94005
			// This happens when processes write simulatenously to the keychain, most
			// likely when trying to refresh the token. Ignore the error since additional
			// writes after the first one do not matter. Should actually be fixed upstream.
			if (e.message === 'The specified item already exists in the keychain.') {
				return;
			}

			const troubleshooting = localize('troubleshooting', "Troubleshooting Guide");
			const result = await vscode.window.showErrorMessage(localize('keychainWriteError', "Writing login information to the keychain failed with error '{0}'.", e.message), troubleshooting);
			if (result === troubleshooting) {
				vscode.env.openExternal(vscode.Uri.parse('https://code.visualstudio.com/docs/editor/settings-sync#_troubleshooting-keychain-issues'));
			}
		}
	}

	async getToken(): Promise<string | null | undefined> {
		try {
			const result = await this.keytar.getPassword(SERVICE_ID, ACCOUNT_ID);
			Logger.trace('Reading from keychain', result);
			return result;
		} catch (e) {
			// Ignore
			Logger.error(`Getting token failed: ${e}`);
			return Promise.resolve(undefined);
		}
	}

	async deleteToken(): Promise<boolean | undefined> {
		try {
			return await this.keytar.deletePassword(SERVICE_ID, ACCOUNT_ID);
		} catch (e) {
			// Ignore
			Logger.error(`Deleting token failed: ${e}`);
			return Promise.resolve(undefined);
		}
	}
}

export const keychain = new Keychain();
