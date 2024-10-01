import { toast } from 'react-toastify';
import { ethers } from 'ethers';
import { create } from 'ipfs-http-client';
import axios from 'axios'
import { createContext } from 'react';
const ethSigUtil = require('eth-sig-util');

export const createProvider = async ({ RPCURL, chainId }) => {
  return new ethers.providers.JsonRpcProvider(RPCURL, chainId);
}

export const createWeb3Provider = async (instance) => {
  const provider = new ethers.providers.Web3Provider(instance);
  const signer = provider.getSigner();
  return { provider, signer };
}

let rpcDefault = {
  50: "https://rpc.xinfin.network",
  51: "https://rpc.apothem.network"
}


export const EthereumContext = createContext({});

export const createContractInstance = async (contractaddress, abi, provider) => {
  return new ethers.Contract(contractaddress, abi, provider);
}

export const executeTransaction = async (contract, provider, functionname, input, price,eventname) => {
  log("executeTransaction::::", "Input Value", functionname, input)
  const feeData = await provider.getFeeData();
  console.log("feeData",feeData);
  if (!input) throw new Error(`Input cannot be empty`);
  const { balance, signer } = await signAndBalance(provider);
  if (price == 0) {
    return sendTx(provider,contract['connect'](signer), functionname, [...input],eventname)
  } else {
    return sendEtherTx(contract['connect'](signer), functionname, [...input], price,eventname)
  }
}

//queryEvents to pull the event details and bring the return value from smart contract
export const queryEvents = async (contract, provider, eventname, blocknumber) => {
  console.log("queryevents::::",blocknumber,eventname,provider)
  const { signer } = await signAndBalance(provider);
  return qryEvents(contract['connect'](signer), eventname, blocknumber);
}

//showToasts to just show the toast message with Txn Hash
export const showToasts = async (txHash) => {
  const onClick = txHash
    ? () => window.open(`${process.env.REACT_APP_EXPLORER}${txHash}`)
    : undefined;
  toast('Transaction Result!', { type: 'info', onClick });
}

//showToasts to just show the toast message with Txn Hash
export const showError = async (result) => {
  toast('Transaction Error!', { type: 'error', result });
}

//queryEvents to pull the event details and bring the return value from smart contract
export const queryData = async (contract, provider, functionname, input) => {
  const { signer } = await signAndBalance(provider);
  return queryReports(contract['connect'](signer), functionname, [...input]);
}

export const log = async (functioname, content, value) => {
  console.log(`${functioname} :::: ${content} ::::`, value);
}

// Helper function to parse events
function parseEvents(contract, logs) {
  const parsedEvents = logs.map((log) => {
    const parsedLog = contract.interface.parseLog(log);
    return { ...parsedLog, address: log.address };
  });

  return parsedEvents;
}

// Helper function to extract error message
function extractErrorMessage(receipt) {
  if (receipt.status === 0) {
    // Transaction failed
    if (receipt.logs && receipt.logs.length > 0) {
      const errorEvent = receipt.logs.find((log) => log.topics.includes(/* Error event topic */));
      if (errorEvent) {
        // Extract error message from the event
        const errorMessage = errorEvent.data;
        return errorMessage;
      }
    }

    // If no error event found, provide a generic error message
    return "Transaction failed with unknown error";
  }

  // Transaction succeeded
  return null;
}

//Transaction.js
export const sendTx = async (provider,contract, functionname, input,eventName) => {
  log("sendTx", "Sending tx to set", input);
  const tx = await contract[functionname](...input,{gasLimit: "3000000"});
  // const tx = await contract[functionname](...input);
  console.log("tx value is:::::",tx);
  console.log("tx value is:::::",tx.hash);

  let receipt = null;

  while (receipt === null) {
    try {
      receipt = await provider.getTransactionReceipt(tx.hash);
  
      if (receipt) {
        console.log("Receipt is:", receipt);
        const blkno = receipt.blockNumber ? receipt.blockNumber : 0;
        const txnevnts = receipt.logs ? receipt.logs : [];
        let obj = { txHash: receipt.transactionHash, blockNumber: blkno, events: txnevnts };

        log("sendTx", "Responses", obj);
        // Extract events and error messages  
        let errorMessage = null;
        if(receipt.status===0){
          errorMessage = await queryEvents(contract,provider,eventName,receipt.blockNumber);
          console.log("errormessage",errorMessage)
          return { ...obj,errorMessage };
        }else{
          return { ...obj,errorMessage };
        }
      } else {
        console.log("Receipt is not available yet. Waiting...");
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second
      }
    } catch (error) {
      console.error("Error retrieving transaction receipt:", error);
      // Handle the error if needed
      break; // Break the loop on error
    }
  }
}

export const sendEtherTx = async (contract, functionname, input, price,eventName) => {
  log("sendEtherTx", "Sending tx to set", input);
  const tx = await contract[functionname](...input, { value: price });
  const txresponse = await tx.wait();
  const blkno = txresponse.blockNumber ? txresponse.blockNumber : 0;
  const txnevnts = txresponse.events ? txresponse.events : "";
  let obj = { txHash: txresponse.transactionHash, blockNumber: blkno, event: txnevnts }
  log("sendEtherTx", "Responses", obj);
  return obj;
}

export const queryReports = async (contract, functionname, input) => {
  const result = await contract[functionname](...input);
  return result;
}

export const qryEvents = async (contract, eventname, blockNumber) => {
  log("qryEvents", "inputs are", contract, eventname, blockNumber);
  const events = await contract.queryFilter(contract.filters[`${eventname}`](), blockNumber, blockNumber);
  log("qryEvents", "event value", events, events[0].args)
  return events[0].args;
}

export const sendMetaTx = async (contract, provider, signer, functionname, input) => {
  log("sendMetaTx", "Sending meta-tx to set", input);

  let url = '';
  if (process.env.REACT_APP_DEBUGMODE === "INTEGRATION") {
    url = process.env.REACT_APP_WEBHOOK_URL_INTEGRATION;
  } else {
    url = process.env.REACT_APP_WEBHOOK_URL_TEST;
  }
  log("sendMetaTx", "Defender URL", url);

  if (!url) throw new Error(`Missing relayer url`);
  // const forwarder = createInstance(provider);
  let forwarder = "";
  const from = await signer.getAddress();
  const data = contract.interface.encodeFunctionData(functionname, [...input]);
  const to = contract.address;

  const request = await signMetaTxRequest(signer.provider, forwarder, { to, from, data });
  const responses = await axios.post(url, request)
  log("sendMetaTx", "responses", responses);
  const finalresult = JSON.parse(responses.data.result);
  let obj = { txHash: finalresult.txHash, blockNumber: finalresult.blockNumber, event: "" }
  log("sendMetaTx", "Responses", obj);
  return obj;
}

export const signAndBalance = async (provider) => {
  const userProvider = provider;
  const userNetwork = await userProvider.getNetwork();
  log("signAndBalance", "userNetwork", userNetwork)
  const signer = userProvider.getSigner();
  const from = await signer.getAddress();
  const balance = await provider.getBalance(from);
  return { balance, signer };
};

export const convertPriceToEth = async (n, tokenType) => {
  var convertedprice;
  if (tokenType === 'USDT' || tokenType === 'USDC') {
    convertedprice = ethers.utils.parseUnits(n, 6);
  } else {
    convertedprice = ethers.utils.parseUnits(n, 'ether');
  }
  return convertedprice;
}

export const convertPricefromEth = async (n, tokenType) => {
  var convertedprice;
  if (tokenType === 'USDT' || tokenType === 'USDC') {
    convertedprice = ethers.utils.formatUnits(n, 6);
  } else {
    convertedprice = ethers.utils.formatUnits(n, 'ether');
  }
  return convertedprice;
}

export const convertListingFee = async (n) => {
  const convertedprice = ethers.utils.formatUnits(n, 4);
  return convertedprice;
}

export const upload = async ({ file, from, authorization }) => {
  const ipfs = create({
    host: 'ipfs.infura.io', port: 5001, protocol: 'https', headers: {
      authorization
    }
  })
  log("IPFS", "Object", ipfs)
  try {
    const added = await ipfs.add(file)
    const url = `https://ipfs.infura.io/ipfs/${added.path}`
    log("IPFS", `Upload initiated for ${from}`, url)
    return url;
  } catch (error) {
    log('IPFS', 'Error', error)
  }
}

export const checkCurrencyBalanceForUser = async (token, provider, account, actualprice, _symbol) => {
  let data = await queryData(token, provider, 'balanceOf', [account]);
  var actualBalance;
  if (_symbol === 'USDT' || _symbol === 'USDC') {
    actualBalance = parseInt(ethers.utils.formatUnits(data, 6));
  } else {
    actualBalance = await convertPricefromEth(data);
  }
  log("checkUserBalance", "actualBalance", actualBalance)
  log("checkUserBalance", "actualprice", actualprice)
  if ((actualBalance === 0) || (actualBalance < actualprice)) {
    log("buyNFT", "Balance of required currency is either 0 or lower than expected price", actualBalance);
    return false;
  } else {
    return true;
  }
}

export const checkCurrencyBalanceForUserAccount = async (token, provider, account, _symbol) => {
  let data = await queryData(token, provider, 'balanceOf', [account]);
  var actualBalance;
  console.log("data,", data)
  if (_symbol === 'USDT') {
    actualBalance = (ethers.utils.formatUnits(data, 6));
  } else {
    actualBalance = await convertPricefromEth(data);
  }

  log("checkUserBalance", "actualBalance", actualBalance)
  return actualBalance;
}

export const getTransactionReceiptMined = async (txHash, interval, provider) => {
  console.log("txhahs is", txHash)
  const self = this;
  const transactionReceiptAsync = async function (resolve, reject) {
    await provider.getTransactionReceipt(txHash, (error, receipt) => {
      if (error) {
        reject(error);
      } else if (receipt == null) {
        console.log("receipt is", receipt)
        setTimeout(
          () => transactionReceiptAsync(resolve, reject),
          interval ? interval : 100);
      } else {
        console.log("receipt is", receipt)

        resolve(receipt);
      }
    });
  };
  if (Array.isArray(txHash)) {
    console.log("i am here in Array check", txHash)
    return Promise.all(txHash.map(
      oneTxHash => self.getTransactionReceiptMined(oneTxHash, interval)));
  } else if (typeof txHash === "string") {
    console.log("i am here in string check", txHash)
    return new Promise(await transactionReceiptAsync);
  } else {
    throw new Error("Invalid Type: " + txHash);
  }
};

const EIP712Domain = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' }
];

const ForwardRequest = [
  { name: 'from', type: 'address' },
  { name: 'to', type: 'address' },
  { name: 'value', type: 'uint256' },
  { name: 'gas', type: 'uint256' },
  { name: 'nonce', type: 'uint256' },
  { name: 'data', type: 'bytes' },
];

function getMetaTxTypeData(chainId, verifyingContract) {
  return {
    types: {
      EIP712Domain,
      ForwardRequest,
    },
    domain: {
      name: 'MinimalForwarder',
      version: '0.0.1',
      chainId,
      verifyingContract,
    },
    primaryType: 'ForwardRequest',
  }
};

export const signTypedData = async (signer, from, data) => {
  // If signer is a private key, use it to sign
  if (typeof (signer) === 'string') {
    const privateKey = Buffer.from(signer.replace(/^0x/, ''), 'hex');
    return ethSigUtil.signTypedMessage(privateKey, { data });
  }
  const isHardhat = data.domain.chainId === 31337;
  const [method, argData] = isHardhat
    ? ['eth_signTypedData', data]
    : ['eth_signTypedData_v4', JSON.stringify(data)]
  return await signer.send(method, [from, argData]);
}

export const buildRequest = async (forwarder, input) => {
  const nonce = await forwarder.getNonce(input.from).then(nonce => nonce.toString());
  return { value: 0, gas: 1e6, nonce, ...input };
}

export const buildTypedData = async (forwarder, request) => {
  const chainId = await forwarder.provider.getNetwork().then(n => n.chainId);
  const typeData = getMetaTxTypeData(chainId, forwarder.address);
  return { ...typeData, message: request };
}

export const signMetaTxRequest = async (signer, forwarder, input) => {
  const request = await buildRequest(forwarder, input);
  const toSign = await buildTypedData(forwarder, request);
  const signature = await signTypedData(signer, input.from, toSign);
  return { signature, request };
}

