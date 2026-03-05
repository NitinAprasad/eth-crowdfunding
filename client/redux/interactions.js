import Web3 from "web3";
import * as actions from "./actions";
import CrowdFunding from '../artifacts/contracts/Crowdfunding.sol/Crowdfunding.json';
import Project from '../artifacts/contracts/Project.sol/Project.json';
import {
  groupContributionByProject,
  groupContributors,
  projectDataFormatter,
  withdrawRequestDataFormatter,
} from "../helper/helper";

// IMPORTANT: Update this address every time you redeploy the contract locally.
// Run: npx hardhat run scripts/deploy.js --network localhost
// and paste the printed address here.
const crowdFundingContractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// ─── Web3 / Wallet ──────────────────────────────────────────────────────────

export const loadWeb3 = async (dispatch) => {
  // web3 v4: Web3.givenProvider was removed; use window.ethereum directly
  const provider = (typeof window !== 'undefined' && window.ethereum)
    ? window.ethereum
    : "http://localhost:8545";
  const web3 = new Web3(provider);
  dispatch(actions.web3Loaded(web3));
  return web3;
};

export const loadAccount = async (web3, dispatch) => {
  const account = await web3.eth.getAccounts();
  dispatch(actions.walletAddressLoaded(account[0]));
  if (account[0]) {
    localStorage.setItem("ADDRESS", account[0]);
  }
  return account;
};

// ─── Contract ────────────────────────────────────────────────────────────────

export const loadCrowdFundingContract = async (web3, dispatch) => {
  const crowdFunding = new web3.eth.Contract(CrowdFunding.abi, crowdFundingContractAddress);
  dispatch(actions.crowdFundingContractLoaded(crowdFunding));
  return crowdFunding;
};

/**
 * Subscribe to live contract events so the UI updates automatically
 * when new projects are created or contributions are received.
 * Previously imported in _app.js but never implemented — now fixed.
 */
export const subscribeCrowdFundingEvents = (crowdFundingContract, dispatch) => {
  if (!crowdFundingContract) return;

  try {
    crowdFundingContract.events.ProjectStarted({}, (error, event) => {
      if (error) {
        console.error("ProjectStarted event error:", error);
        return;
      }
      const projectsReceipt = event.returnValues;
      const formattedProjectData = projectDataFormatter(projectsReceipt, projectsReceipt.projectContractAddress);
      dispatch(actions.newProjectsLoaded(formattedProjectData));
    });

    crowdFundingContract.events.ContributionReceived({}, (error, event) => {
      if (error) {
        console.error("ContributionReceived event error:", error);
        return;
      }
      const { projectAddress, contributedAmount } = event.returnValues;
      dispatch(actions.amountContributor({ projectId: projectAddress, amount: contributedAmount }));
    });
  } catch (error) {
    // Subscriptions may fail in environments without a WebSocket provider (e.g., MetaMask HTTP)
    console.warn("Event subscription not available:", error.message);
  }
};

// ─── Projects ────────────────────────────────────────────────────────────────

export const startFundRaising = async (web3, CrowdFundingContract, data, onSuccess, onError, dispatch) => {
  const { minimumContribution, deadline, targetContribution, projectTitle, projectDesc, account } = data;

  await CrowdFundingContract.methods
    .createProject(minimumContribution, deadline, targetContribution, projectTitle, projectDesc)
    .send({ from: account })
    .on('receipt', function (receipt) {
      const projectsReceipt = receipt.events.ProjectStarted.returnValues;
      const contractAddress = projectsReceipt.projectContractAddress;
      const formattedProjectData = projectDataFormatter(projectsReceipt, contractAddress);
      const projectConnector = new web3.eth.Contract(Project.abi, contractAddress);

      dispatch(actions.newProjectContractsLoaded(projectConnector));
      dispatch(actions.newProjectsLoaded(formattedProjectData));
      onSuccess();
    })
    .on('error', function (error) {
      onError(error.message);
    });
};

export const getAllFunding = async (CrowdFundingContract, web3, dispatch) => {
  try {
    const fundingProjectList = await CrowdFundingContract.methods.returnAllProjects().call();

    if (!fundingProjectList || fundingProjectList.length === 0) {
      dispatch(actions.projectContractsLoaded([]));
      dispatch(actions.projectsLoaded([]));
      return;
    }

    const projectContracts = [];
    const projects = [];

    await Promise.all(
      fundingProjectList.map(async (data) => {
        const projectConnector = new web3.eth.Contract(Project.abi, data);
        const details = await projectConnector.methods.getProjectDetails().call();
        projectContracts.push(projectConnector);
        projects.push(projectDataFormatter(details, data));
      })
    );

    dispatch(actions.projectContractsLoaded(projectContracts));
    dispatch(actions.projectsLoaded(projects));
  } catch (error) {
    console.error("Error loading projects:", error);
    dispatch(actions.projectContractsLoaded([]));
    dispatch(actions.projectsLoaded([]));
  }
};

// ─── Contributions ───────────────────────────────────────────────────────────

export const contribute = async (crowdFundingContract, data, dispatch, onSuccess, onError) => {
  const { contractAddress, amount, account } = data;
  await crowdFundingContract.methods
    .contribute(contractAddress)
    .send({ from: account, value: amount })
    .on('receipt', function () {
      dispatch(actions.amountContributor({ projectId: contractAddress, amount }));
      onSuccess();
    })
    .on('error', function (error) {
      onError(error.message);
    });
};

export const getContributors = async (web3, contractAddress, onSuccess, onError) => {
  try {
    const projectConnector = new web3.eth.Contract(Project.abi, contractAddress);
    const getContributions = await projectConnector.getPastEvents("FundingReceived", {
      fromBlock: 0,
      toBlock: 'latest',
    });
    onSuccess(groupContributors(getContributions));
  } catch (error) {
    onError(error);
  }
};

export const getMyContributionList = async (crowdFundingContract, account) => {
  const getContributions = await crowdFundingContract.getPastEvents("ContributionReceived", {
    filter: { contributor: account },
    fromBlock: 0,
    toBlock: 'latest',
  });
  return groupContributionByProject(getContributions);
};

// ─── Withdraw Requests ───────────────────────────────────────────────────────

export const createWithdrawRequest = async (web3, contractAddress, data, onSuccess, onError) => {
  const { description, amount, recipient, account } = data;
  const projectConnector = new web3.eth.Contract(Project.abi, contractAddress);
  await projectConnector.methods
    .createWithdrawRequest(description, amount, recipient)
    .send({ from: account })
    .on('receipt', function (receipt) {
      const withdrawReqReceipt = receipt.events.WithdrawRequestCreated.returnValues;
      const formattedReqData = withdrawRequestDataFormatter({
        ...withdrawReqReceipt,
        requestId: withdrawReqReceipt.requestId,
      });
      onSuccess(formattedReqData);
    })
    .on('error', function (error) {
      onError(error.message);
    });
};

export const getAllWithdrawRequest = async (web3, contractAddress, onLoadRequest) => {
  const projectConnector = new web3.eth.Contract(Project.abi, contractAddress);
  const withdrawRequestCount = await projectConnector.methods.numOfWithdrawRequests().call();
  const withdrawRequests = [];

  if (Number(withdrawRequestCount) <= 0) {
    onLoadRequest(withdrawRequests);
    return;
  }

  for (let i = 0; i < Number(withdrawRequestCount); i++) {
    const req = await projectConnector.methods.withdrawRequests(i).call();
    withdrawRequests.push(withdrawRequestDataFormatter({ ...req, requestId: i }));
  }
  onLoadRequest(withdrawRequests);
};

export const voteWithdrawRequest = async (web3, data, onSuccess, onError) => {
  const { contractAddress, reqId, account } = data;
  const projectConnector = new web3.eth.Contract(Project.abi, contractAddress);
  await projectConnector.methods
    .voteWithdrawRequest(reqId)
    .send({ from: account })
    .on('receipt', function () {
      onSuccess();
    })
    .on('error', function (error) {
      onError(error.message);
    });
};

export const withdrawAmount = async (web3, dispatch, data, onSuccess, onError) => {
  const { contractAddress, reqId, account, amount } = data;
  const projectConnector = new web3.eth.Contract(Project.abi, contractAddress);
  await projectConnector.methods
    .withdrawRequestedAmount(reqId)
    .send({ from: account })
    .on('receipt', function () {
      dispatch(actions.withdrawContractBalance({ contractAddress, withdrawAmount: amount }));
      onSuccess();
    })
    .on('error', function (error) {
      onError(error.message);
    });
};