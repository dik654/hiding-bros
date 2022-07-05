import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter, Routes } from "react-router-dom";
import { ConnectWallet } from "./components/ConnectWallet";
import Scripts from "./components/scripts";
import Web3 from 'web3';

function App() {
  const [web3, setWeb3] = useState();
  const [account, setAccount] = useState("");
  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const web = new Web3(window.ethereum);
        setWeb3(web);
      } catch (err) {
        console.log(err);
      }
    }
  }, []);

  const connectWallet = async () => {
    const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
    });
      setAccount(accounts[0]);
  };
  connectWallet();
  return (
    <div className="App">
      <BrowserRouter>
        <Scripts account={account}/>
        <Routes>
          {/*<Route path>*/}
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;