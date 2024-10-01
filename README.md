# react-solidity-xdc3 Npm Package
It works like a boilerplate package, which assist developer to just use the function and integrate their contracts at ease.

## 1 Installation
Install react-solidity-xdc3 with npm
```bash
  npm install react-solidity-xdc3
```
## 2 IMPLEMENTATION SAMPLE
- Go to https://github.com/GoPlugin/dapp-react-solidity-xdc3

## 3 How it works?
```
const { connectWallet,createWeb3Provider,createContractInstance, executeTransaction,queryData, queryEvents } = require('react-solidity-xdc3');

var connectOptions = {
  rpcObj: {
    50: "https://rpc.xinfin.network",
    51: "https://rpc.apothem.network"
  },
  network: "mainnet",
  toDisableInjectedProvider: true
}

const instance = await connectWallet(connectOptions);
const {provider,signer} = await createWeb3Provider(instance);
const sample = await createContractInstance(address, abi, provider);
```
## How to write data

Consider you have 3 parameters to pass in registerFlights function in the smart contract, then

```
let _flightAddress = "0xA9e6835929f32DD440290b4c81466ff554b82667";
let _careerFlightNo = "ING695";
let _serviceProviderName = "Indigo Airlines";
let response1 = await executeTransaction(sample, provider, 'registerFlights', [_flightAddress, _careerFlightNo, _serviceProviderName]);

```
## How to Read data from Blockchain with parameters overriden

Consider you have 2 parameters to pass in flights(mapping variable) in the smart contract to read

```
let _flightId = "1";
let _flightAddress = "0xA9e6835929f32DD440290b4c81466ff554b82667";
let response1 = await queryData(sample, provider, 'flights', [_flightId, _flightAddress]);
```
## How to Read data from Blockchain without params
```
let response1 = await queryData(sample, provider, 'readAllFlight', []);
```
## How to Read mapping variable
```
let response1 = await queryData(sample, provider, 'claims', ["asdgasdgsgsd"]);
```
## How to Read Events
```
let returnvalue = await queryEvents(sample, provider, "InsuranceEvents", response1.blockNumber);
```

## Parms & it's functionalities
| Parms             | Descriptions                                                                |
| ----------------- | ------------------------------------------------------------------ |
| connectOptions| Object contains rpcObj, network & toDisableInjectedProvider Parms|
| rpcObj | by default it overrides Xinfin Mainnet & Apothem, if you want to override your evem compatible RPC, override it with ChainID:rpc url|
| network| default value mainnet, you can override to Apothem, Rinkeby etc |
| toDisableInjectedProvider|default value true, set to false if you want Metamask to be shown|

## Function & Description
| Functions             | Descriptions                                                                |
| ----------------- | ------------------------------------------------------------------ |
| executeTransaction| It calls the send Transaction and writes the data onto Blockchain|
| queryData | It queries the data from Blockchain for a given function, you can read mapping variable, view function, public variable using this function|
| queryEvents| It enables you to read event details by passing block Number |
| createWeb3Provider|It connects with web3 with chosen wallet and results provider & signer details|
| connectWallet |It enables you to connect with your wallet (metamask, XDCPay, Torus, WalletConnect) |
| createContractInstance |It enables you to create a instance for your contract |
| EthereumContext | it enables you to setup in main app.js file and Read thoes in other components|
| showToasts | it enables you to show toast msg after successful execution|
| showError | It enables you to show error message when there is a failure |
| log | it enables you to print detailed log by passing three parms |
| convertPriceToEth |It enables you to convert price to Wei |
| convertPricefromEth | It enables you to convert wei to actual price|
| upload | It enables you to upload image to IPFS |
| checkCurrencyBalanceForUser | It enables to fetch balance for user |
| getTransactionReceiptMined | IN PROGRESS |
| MetaTxn | IN PROGRESS |

## executeTransaction

```
let response1 = await executeTransaction(sample, provider, 'registerFlights', [_flightAddress, _careerFlightNo, _serviceProviderName]);

```
### Function & Description
| Functions             | Params                                                                |
| ----------------- | ------------------------------------------------------------------ |
| executeTransaction| It calls the send Transaction and writes the data onto Blockchain|
| queryData | It queries the data from Blockchain for a given function, you can read mapping variable, view function, public variable using this function|
| queryEvents| It enables you to read event details by passing block Number |
| createWeb3Provider|It connects with web3 with chosen wallet and results provider & signer details|


### executeTransaction

```
let response1 = await executeTransaction(contractInstance, provider, "functionName", [parm1, Parm2...]);
```
### executeTransaction Params
| Functions             | Params                                                                |
| ----------------- | ------------------------------------------------------------------ |
| contractInstance | Contract that you want to interact with|
| provider | web3 provider|
| functionName| Function you want to interact with |
| Parm1, Parm2|List of params that function should expect, leave this array empty if no params required to pass|

### queryData

```
let response1 = await queryData(contractInstance, provider, "functionName", [parm1, Parm2...]);
```
### queryData Params
| Functions             | Params                                                                |
| ----------------- | ------------------------------------------------------------------ |
| contractInstance | Contract that you want to interact with|
| provider | web3 provider|
| functionName| Function you want to interact with |
| Parm1, Parm2|List of params that function should expect, leave this array empty if no params required to pass|

### queryEvents

```
let response1 = await queryEvents(contractInstance, provider, eventName,blockNumber);
```
### queryEvents Params
| Functions             | Params                                                                |
| ----------------- | ------------------------------------------------------------------ |
| contractInstance | Contract that you want to interact with|
| provider | web3 provider|
| eventName| Event you want to access  |
| blockNumber|BlockNumber(latest)|

### connectWallet
```

var connectOptions = {
  rpcObj: {
    50: "https://rpc.xinfin.network",
    51: "https://rpc.apothem.network"
  },
  network: "mainnet",
  toDisableInjectedProvider: true
}
const walletinstance = await connectWallet(connectOptions);
```
### connectWallet Params
| Functions             | Params                                                                |
| ----------------- | ------------------------------------------------------------------ |
| connectOptions | Object to override the rpcObj, network & metamask injection|

### createWeb3Provider

```
    const {provider,signer} = await createWeb3Provider(walletinstance);
```
### createWeb3Provider Params
| Functions             | Params                                                                |
| ----------------- | ------------------------------------------------------------------ |
| walletinstance | Result of connectWallet should be passed as input here|

### createContractInstance

```
 const contractInstance = await createContractInstance(contractAddress, abi, provider);
```
### createContractInstance Params
| Functions             | Params                                                                |
| ----------------- | ------------------------------------------------------------------ |
| contractAddress | your smart contract address |
| abi | Abi of your smart contract|
| provider | Provider you obtained from createWeb3Provider|

### upload

```
const projectId = "<YOUR PROJECT ID>";
const projectSecret = "<YOUR PROJECT SECRET>";
const authorization = "Basic " + btoa(projectId + ":" + projectSecret);
const file = files[0];
const result = await upload({file,from,authorization});
```
### upload Params
| Functions             | Params                                                                |
| ----------------- | ------------------------------------------------------------------ |
| file | file you want to upload to IPFS|
| from | wallet addresss who is uploading this file|
| authorization | authorization is required now to upload a file in IPFS. Projectid & Secret, you can get from your IPFS Infura account|

More detailed information for other functions will be updated soon..
