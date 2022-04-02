import { useEffect, useState } from 'react';
import './App.css';
import { ethers } from 'ethers';
import contract from './contract/GanNft.json';
import { Buffer } from 'buffer';


function App() {
  const abi = contract.abi;
  const contractAddress = '0xf7eCE44BA1af171df9601a9C4684F36Bcb3CE03c';
  const from = '0x7900d57715B9f49Fd3E406A976eBe584131bDC1c';
  const gasLimit = 20000000;
  const gasPrice = 1000000040;
  const [currentAccount, setCurrentAccount] = useState(null);
  const [nftContract, setNftContract] = useState(null);

  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;
    if (!ethereum) {
      console.log("Make sure you have MetaMask installed!");
      return;
    } else {
      console.log("Wallet exists! We're ready to go!")
    }
    
    try {
      const accounts = await ethereum.request({ method: 'eth_accounts' });
    
      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account: ", account);
        setCurrentAccount(account);
      } else {
        console.log("No authorized account found");
      }
    } catch (err) {
      console.log(err);
    }

  }
  const checkContract = async() => {
    const { ethereum } = window;
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);
    setNftContract(contract);
  }

  const mintNft = async () => {
    await checkContract();
    let txn = await nftContract.mintRequest();
    txn.wait();
  }


  const connectWallet = async() => {
    const { ethereum } = window;
    if (!ethereum) {
      console.log("Make sure you have MetaMask installed!");
      return;
    } else {
      console.log("Wallet exists! We're ready to go!")
    }
    
    try {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      const account = accounts[0];
      console.log("Found an authorized account: ", account);
      setCurrentAccount(account);
    } catch (err) {
      console.log(err);
    }
  }

  const py = async () => {
    console.log('pushed py button.');
    let output;
    const r = (await fetch('http://localhost:5000/get-image')).json()
    await r.then((result) => {output = result[0];});
    return output.img;

    
    /* 
    python-server からエンコードされたpngでーたが送られてくる
    ↓
    pngデータをIPFS化する
    ↓
    jsonファイルにIPFSデータを組み込む
    ↓
    encodeする(or ここもIPFS化する？)
    ↓
    返す
    */
  }

  const connectWalletButton = () => {
    return (
      <button onClick={connectWallet}>
        connect wallet
      </button>
    )

  }

  const mintNftButton = () => {
    return (
      <button onClick={mintNft}>
        mint
      </button>
    )
  }

  const pyButton = () => {
    return (
      <button onClick={py}>
        python
      </button>
    )
  }

  useEffect(() => {
    checkIfWalletIsConnected();
    checkContract();
  }, [])

  useEffect(() => {
    const onMintRequest = async () => {

      const serverProvider = ethers.getDefaultProvider('rinkeby',{'etherscan': process.env.REACT_APP_API_KEY});
      const txCount =  await serverProvider.getTransactionCount(from);
      const wallet = new ethers.Wallet(process.env.REACT_APP_PRIVATE_KEY, serverProvider);
  
      const nftContract = new ethers.Contract(contractAddress, abi, wallet);

      // TODO 動的にgas代を変えられるようにする
      const overrides = {
          nonce: ethers.utils.hexlify(txCount),
          gasLimit: ethers.utils.hexlify(gasLimit),
          gasPrice: ethers.utils.hexlify(gasPrice),
      }
      
      const imageURI = await py();
      const json = '{"name": "GANNFT #0","image": "data:image/png;base64,' + imageURI + '}'
      const baseJson = Buffer.from(json).toString('base64');
      const URI = 'data:application/json;base64,' + baseJson;
      console.log('URI: ', URI);
      const tx = await nftContract.setTokenURI(URI, overrides);
      tx.wait();
      console.log('set Token URI - done.');
    }

    if (nftContract){
      nftContract.on('MintRequest', onMintRequest);
    }    
    return () => {
      if (nftContract) {
        nftContract.off('MintRequest', onMintRequest);
      }
    }
  }, [nftContract])

  
  return (
    <div className="App">
      <header className="App-header">
      </header>
      <div className='main-container'>
        {currentAccount ? mintNftButton() : connectWalletButton()}
        {pyButton()}

      </div>
    </div>
  );
}

export default App;
