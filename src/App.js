import logo from './logo.svg';
import './App.css';
import { useState } from 'react';
import Web3Modal from "web3modal";
import { ethers } from "ethers";
import { WalletLink } from 'walletlink';
import etherscan_api from 'etherscan-api';

// Both of these are free API keys
const INFURA_ID         = '';
const ETHERSCAN_API_KEY = '';

function App() {
  const etherscan = etherscan_api.init(ETHERSCAN_API_KEY);

  const [ isLoggedIn, setIsLoggedIn ]         = useState(false);
  const [ revokeContract, setRevokeContract ] = useState("");
  const [ revokeWallet, setRevokeWallet ]     = useState("");
  const [ provider, setProvider ]             = useState(null);
  const [ signer, setSigner ]                 = useState(null);
  const [ address, setAddress ]               = useState(null);

  const signIn = async () => {
    const providerOptions = {
      walletlink: {
        package: WalletLink,
        options: {
          appName: 'Revoke approval - app',
          infuraId: INFURA_ID,
          chainId: 1,
        },
      }
    };

    const web3Modal = new Web3Modal({
      network: 'mainnet',
      cacheProvider: false,
      providerOptions
    });

    web3Modal.clearCachedProvider();

    try {
      const instance         = await web3Modal.connect();
      const sign_in_provider = new ethers.providers.Web3Provider(instance);
      const sign_in_signer   = await sign_in_provider.getSigner();
      const sign_in_addr     = await sign_in_signer.getAddress();

      sign_in_provider.on("accountsChanged", (accounts) => {
        window.location.reload();
      });

      sign_in_provider.on("chainChanged", (chainId) => {
        window.location.reload();
      });

      sign_in_provider.on("connect", (info) => {
        console.log('connected', info);
      });

      sign_in_provider.on("disconnect", (error) => {
        window.location.reload();
      });

      setIsLoggedIn(true);
      setAddress(sign_in_addr);
      setProvider(sign_in_provider);
      setSigner(sign_in_signer)
    } catch(err) {
      console.log(err);
    }
  }

  const getRevokedContract = async () => {
    const { result: abi } = await etherscan.contract.getabi(revokeContract);

    return new ethers.Contract(revokeContract, abi, signer);
  }

  const revokeAccess = async () => {
    try {
      const contract = await getRevokedContract();
      await contract.approve(revokeWallet, 0);
    } catch(err) {
      window.alert(err);
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h1>Revoke Approval</h1>

        {isLoggedIn ?
          <div>
            <div>Connected with: {address}</div>
            <h4>Revoke from Contract address</h4>
            <input type="text" style={{width: '500px'}} value={revokeContract} onChange={(e) => setRevokeContract(e.target.value)}></input>
            <h4>Revoke Wallet</h4>
            <input type="text" style={{width: '500px'}} value={revokeWallet} onChange={(e) => setRevokeWallet(e.target.value)}></input>
            <br></br>
            <button onClick={revokeAccess}>Revoke access</button>
          </div>
            :
          <button onClick={signIn}>Sign in</button>
        }
      </header>
    </div>
  );
}

export default App;
