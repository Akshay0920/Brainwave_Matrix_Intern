import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import Voting from "./abi/Voting.json";
import "./App.css";

const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

function App() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [inputIndex, setInputIndex] = useState("");
  const [timeLeft, setTimeLeft] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);

  const connectWallet = async () => {
    if (window.ethereum) {
      const [selectedAccount] = await window.ethereum.request({ method: "eth_requestAccounts" });
      const newProvider = new ethers.BrowserProvider(window.ethereum);
      const signer = await newProvider.getSigner();
      const votingContract = new ethers.Contract(contractAddress, Voting.abi, signer);

      setAccount(selectedAccount);
      setProvider(newProvider);
      setContract(votingContract);
    } else {
      alert("Please install MetaMask");
    }
  };


  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", async ([newAccount]) => {
        const newProvider = new ethers.BrowserProvider(window.ethereum);
        const signer = await newProvider.getSigner();
        const votingContract = new ethers.Contract(contractAddress, Voting.abi, signer);

        setAccount(newAccount);
        setProvider(newProvider);
        setContract(votingContract);
      });
    }
  }, []);

  const fetchCandidates = async () => {
    if (!contract) return;
    try {
      const fetched = await contract.getCandidates();
      setCandidates(fetched);
    } catch (err) {
      console.error("fetchCandidates error:", err);
    }
  };

  const fetchRemainingTime = async () => {
    if (!contract) return;
    try {
      const remaining = await contract.getRemainingTime();
      setTimeLeft(remaining.toString());
    } catch (err) {
      console.error("fetchRemainingTime error:", err);
    }
  };

  const checkIfVoted = async () => {
    if (!contract || !account) return;
    try {
      const voted = await contract.hasVoted(account);
      setHasVoted(voted);
    } catch (err) {
      console.error("checkIfVoted error:", err);
    }
  };

  const vote = async () => {
    if (!contract || inputIndex === "") return;
    try {
      const tx = await contract.vote(Number(inputIndex));
      await tx.wait();
      await checkIfVoted();
      await fetchCandidates();
    } catch (err) {
      console.error("Voting failed:", err);
      alert(err?.reason || "Voting failed.");
    }
  };

  useEffect(() => {
    if (contract && account) {
      setLoading(true);
      Promise.all([fetchCandidates(), fetchRemainingTime(), checkIfVoted()]).finally(() =>
        setLoading(false)
      );
    }
  }, [contract, account]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchRemainingTime();
    }, 1000);
    return () => clearInterval(interval);
  }, [contract]);

  return (
    <div className="container">
      {!account ? (
        <>
          <h1 style={{ color: "white" }}>Welcome to Decentralized Voting Application</h1>
          <button onClick={connectWallet}>Login</button>
        </>
      ) : loading ? (
        <p style={{ color: "white" }}>Loading contract data...</p>
      ) : (
        <>
          <h1 style={{ color: "white" }}>Cast Your Vote!</h1>
          <p style={{ color: "white" }}>Account: {account}</p>
          <p style={{ color: "white" }}>Remaining Time: {timeLeft} seconds</p>

          {hasVoted ? (
            <p style={{ color: "white" }}><strong>You have already voted!</strong></p>
          ) : (
            <>
              <input
                type="number"
                placeholder="Enter Candidate Index"
                value={inputIndex}
                onChange={(e) => setInputIndex(e.target.value)}
              />
              <button onClick={vote}>Vote</button>
            </>
          )}

          <table>
            <thead>
              <tr>
                <th>Index</th>
                <th>Candidate Name</th>
                <th>Vote Count</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c, idx) => (
                <tr key={idx}>
                  <td>{idx}</td>
                  <td>{c.name}</td>
                  <td>{c.voteCount.toString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

export default App;
