import Web3 from 'web3';
import SubscriptionSubprovider from 'web3-provider-engine/subproviders/subscriptions';
import ProviderEngine from 'web3-provider-engine';
import RpcSubprovider from 'web3-provider-engine/subproviders/rpc';
import getWallectConnector from './walletConnect';
import RemoteLoginSubprovider from './dappSdkProvider';
import StaticProvider from './staticProvider';
import { version } from '../package.json';
import config from './config';

import '../static/css/bootstrap-iso.css'; // version: 4.3.1

// eslint-disable-next-line no-underscore-dangle
let _defaultAddress;

const { rpcUrl } = config;

const getDefaultAddress = () => {
    if (_defaultAddress !== undefined) {
        return _defaultAddress;
    }
    return '';
};

const getNetVersion = () => 1;

// Create new web3 and set default account
const defaultEnableCallback = (err, res) => {
    const { result } = res;

    // Create new web3
    const web3 = new Web3(window.ethereum);

    // Set default account
    [_defaultAddress] = result;
    web3.eth.defaultAccount = _defaultAddress;

    window.web3 = web3;
};

const isMobile = (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase()));

const initEngine = () => {
    const eng = new ProviderEngine();

    // Do not move this subprovider, it should always be the first one

    // static results
    const staticProvider = new StaticProvider(getDefaultAddress, getNetVersion);

    eng.addProvider(staticProvider);

    // Remote login
    eng.addProvider(new RemoteLoginSubprovider());

    // filters
    eng.addProvider(new SubscriptionSubprovider());

    // Add rpc data source
    eng.addProvider(new RpcSubprovider({ rpcUrl }));

    eng.connected = true;

    eng.isConnected = () => true;

    // Create wallet connector
    const walletConnector = getWallectConnector();

    // Set properties of Dapp SDK
    eng.isDappSdk = true;
    eng.dappSdk = { version };

    eng.enable = async (cb = () => { }) => {
        const p = new Promise((resolve, reject) => {
            const rpcData = {
                method: 'eth_requestAccounts',
                payload: {
                    walletConnector,
                },
            };
            eng.sendAsync(rpcData, (err, res) => {
                if (err) {
                    reject(err);
                }
                defaultEnableCallback(err, res);
                cb(err, res);
                resolve(res);
            });
        });
        return p;
    };

    /**
     * Log out from wallet connect
     * Return Promise
     */
    eng.logout = async (cb = () => { }) => {
        const p = new Promise((resolve, reject) => {
            if (!walletConnector.connected) {
                const err = new Error('User does not log in with wallet connect.');
                cb(err, null);
                reject(err);
            } else {
                walletConnector.killSession();
                const res = {
                    message: 'Logout successfully.',
                };
                cb(null, res);
                resolve(res);
            }
        });
        return p;
    };

    // start polling for blocks
    eng.start();

    return eng;
};

// Set isMobile
window.isMobile = isMobile;

// Create engine of Dapp SDK
const engine = initEngine();

// Set engine and web3
window.ethereum = engine;
window.dappSdkProvider = engine;
web3 = new Web3(engine);
window.web3 = web3;
