import React, { useEffect } from 'react';

export const ConnectWallet = ({connectWallet}) => {
    useEffect( async () => {
        if (window.ethereum) { //check if Metamask is installed
            try {
                connectWallet();
                 
            } catch (error) {
                return {
                    connectedStatus: false,
                    status: "🦊 Connect to Metamask using the button on the top right."
                }
            }
            
        } else {
            return {
                connectedStatus: false,
                status: "🦊 You must install Metamask into your browser: https://metamask.io/download.html"
            }
        } 
    }, [])
};