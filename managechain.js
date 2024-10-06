/*
 * MIT License
 * 
 * Copyright (c) 2024 Rianda Dalimunthe
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
const { utility, displayHeader, loadingAnimation } = require('./src/utils/utils');
utility('managechain.js');
const fs = require('fs');
const readlineSync = require('readline-sync');
const path = require('path');
const addChain = async () => {
    while (true) {
        utility('managechain.js');
        displayHeader();
        await loadingAnimation('Prepare to add new chain...', 3600);

        const networkOptions = ['testnet', 'mainnet', 'Exit'];
        const networkIndex = readlineSync.keyInSelect(networkOptions, 'Choose a network to add the chain to:', { cancel: 'Return to main menu' });

        if (networkIndex === -1) {
            return;
        }

        if (networkOptions[networkIndex] === 'Exit') {
            console.log('Exiting...');
            process.exit(0);
        }

        const network = networkOptions[networkIndex];

        process.stdout.write('Enter the name of the new chain (e.g ethereum): ');
        const chainName = readlineSync.question('', { hideEchoBack: false, mask: '' });

        process.stdout.write('Enter the RPC URL for the new chain (e.g https://mainnet.infura.io/v3): ');
        const rpcUrl = readlineSync.question('', { hideEchoBack: false, mask: '' });

        process.stdout.write('Enter the explorer base URL for the new chain without "/" (e.g https://etherscan.io ✅ and https://etherscan.io/ ❌): ');
        const explorerUrl = readlineSync.question('', { hideEchoBack: false, mask: '' });

        const templateFilePath = path.join(__dirname, 'src/utils/chainTemplate.js');
        const templateContent = fs.readFileSync(templateFilePath, 'utf-8');

        const chainContent = templateContent
            .replace('{{RPC_URL}}', rpcUrl)
            .replace('{{EXPLORER_URL}}', explorerUrl);

        const chainFilePath = path.join(__dirname, `chains/${network}/${chainName}.js`);
        fs.writeFileSync(chainFilePath, chainContent.trim());
        await loadingAnimation(`Add new chain ${network}: ${chainName}....`, 7200);
        console.log(`New chain added to ${network}: ${chainName}`);
        console.log('');
        await loadingAnimation(`Return to add chain`, 3600);
    }
};

const readChainsFromFolder = (network) => {
    const chainsPath = path.join(__dirname, `chains/${network}`);
    if (fs.existsSync(chainsPath)) {
        return fs.readdirSync(chainsPath)
            .filter(file => file.endsWith('.js'))
            .map(file => file.replace('.js', ''));
    }
    return [];
};

const displayChainsInColumns = (chains) => {
    const columns = 4;
    const rows = Math.ceil(chains.length / columns);

    const output = Array.from({ length: rows }, () => Array(columns).fill(''));
    for (let i = 0; i < chains.length; i++) {
        const column = i % columns;
        const row = Math.floor(i / columns);
        output[row][column] = chains[i];
    }

    const maxColumnWidth = Math.max(...output.flat().map(chain => chain.length)) + 2;

    output.forEach(row => {
        console.log(row.map(chain => chain.padEnd(maxColumnWidth)).join(''));
    });
};

const displayAvailableChains = async (network) => {
    const availableChains = readChainsFromFolder(network);

    if (availableChains.length === 0) {
        console.log(`No chains available for ${network}`);
        return;
    }
    await loadingAnimation(`Checking available chain from ${network}...`, 3600);
    console.log('');
    console.log(`Available chains for ${network}:`);
    displayChainsInColumns(availableChains);
};

const deleteChain = async () => {
    while (true) {
        try {
            displayHeader();
            utility('managechain.js');
            await loadingAnimation('Prepare to delete chain...', 3600);

            const networkOptions = ['testnet', 'mainnet', 'Exit'];
            const networkIndex = readlineSync.keyInSelect(networkOptions, 'Choose a network to delete the chain from:', { cancel: 'Return to main menu' });
            if (networkIndex === -1) {
                return;
            }

            if (networkOptions[networkIndex] === 'Exit') {
                console.log('Exiting...');
                process.exit(0);
            }

            const network = networkOptions[networkIndex];

            const availableChains = readChainsFromFolder(network);
            if (availableChains.length === 0) {
                console.log(`No chains available to delete in ${network}. Exiting...`);
                console.log('');
                process.exit(0);
            }
            await loadingAnimation('Checking available chain to delete...', 3600);
            console.log(`\nAvailable chains on ${network}:`);
            displayChainsInColumns(availableChains);
            console.log('');
            const chainToDelete = readlineSync.question('Enter the name of the chain to delete: ');

            if (!availableChains.includes(chainToDelete)) {
                console.log(`Chain "${chainToDelete}" does not exist in ${network}. Exiting...`);
                console.log('');
                process.exit(0);
            }

            const chainFilePath = path.join(__dirname, `chains/${network}/${chainToDelete}.js`);

            const confirmDelete = readlineSync.keyInYNStrict(`Are you sure you want to delete the chain ${chainToDelete}?`);
            if (!confirmDelete) {
                console.log('Deletion cancelled. Exiting...');
                console.log('');
                process.exit(0);
            }

            fs.unlinkSync(chainFilePath);
            await loadingAnimation(`Deleting chain ${chainToDelete} from ${network}...`, 3600);
            console.log(`Chain ${chainToDelete} deleted from ${network}`);
            await loadingAnimation(`Return to delete chain`, 3600);
            console.log('');
        } catch (error) {
            console.error('An error occurred during chain deletion:', error.message || error);
        }
    }
};

const manageChains = async () => {
    while (true) {
        try {
            utility('managechain.js');
            displayHeader();
            await loadingAnimation('Welcome to manage chain...', 3600);
            const options = ['Add Chain', 'Delete Chain', 'Display Available Chains'];
            const choice = readlineSync.keyInSelect(options, 'What would you like to do?', { cancel: 'Exit' });

            if (choice === -1) {
                console.log('Exiting...');
                console.log('');
                return;
            }

            if (choice === 0) {
                await addChain();
            } else if (choice === 1) {
                await deleteChain();
            } else if (choice === 2) {
                const networkOptions = ['testnet', 'mainnet'];
                const networkIndex = readlineSync.keyInSelect(networkOptions, 'Choose a network to display chains:', { cancel: 'Exit' });
                if (networkIndex === -1) {
                    return;
                }
                const network = networkOptions[networkIndex];
                displayAvailableChains(network);
            }
        } catch (error) {
            console.error('An error occurred while managing chains:', error.message);
        }
    }
};

manageChains();
