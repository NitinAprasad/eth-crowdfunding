// Replace moment with dayjs — lightweight (2KB vs 67KB for moment)
import dayjs from "dayjs";
import web3 from "web3";
import _ from 'lodash';

export const weiToEther = (num) => {
  return web3.utils.fromWei(num.toString(), 'ether');
};

export const etherToWei = (num) => {
  const weiBigNumber = web3.utils.toWei(num.toString(), 'ether');
  return weiBigNumber.toString();
};

// dayjs replacement for moment
export const unixToDate = (unixDate) => {
  // unixDate from Solidity is in seconds; dayjs expects milliseconds
  return dayjs(Number(unixDate) * 1000).format("DD/MM/YYYY");
};

export const state = ["Fundraising", "Expired", "Successful"];

export const projectDataFormatter = (data, contractAddress) => {
  const formattedData = {
    address: contractAddress,
    creator: data?.projectStarter,
    contractBalance: data.balance ? weiToEther(data.balance) : 0,
    title: data.title,
    description: data.desc,
    minContribution: weiToEther(data.minContribution),
    goalAmount: weiToEther(data.goalAmount),
    currentAmount: weiToEther(data.currentAmount),
    state: state[Number(data.currentState)],
    deadline: unixToDate(Number(data.projectDeadline)),
    progress: Math.round(
      (Number(weiToEther(data.currentAmount)) / Number(weiToEther(data.goalAmount))) * 100
    ),
  };
  return formattedData;
};

const formatProjectContributions = (contributions) => {
  return contributions.map((data) => ({
    projectAddress: data.returnValues.projectAddress,
    contributor: data.returnValues.contributor,
    amount: Number(weiToEther(data.returnValues.contributedAmount)),
  }));
};

export const groupContributionByProject = (contributions) => {
  return formatProjectContributions(contributions);
};

const formatContribution = (contributions) => {
  return contributions.map((data) => ({
    contributor: data.returnValues.contributor,
    amount: Number(weiToEther(data.returnValues.amount)),
  }));
};

export const groupContributors = (contributions) => {
  const contributorList = formatContribution(contributions);
  return _.map(
    _.groupBy(contributorList, 'contributor'),
    (o, address) => ({ contributor: address, amount: _.sumBy(o, 'amount') })
  );
};

export const withdrawRequestDataFormatter = (data) => ({
  requestId: data.requestId,
  totalVote: data.noOfVotes,
  amount: weiToEther(data.amount),
  status: data.isCompleted ? "Completed" : "Pending",
  desc: data.description,
  // Updated field name: recipient (was reciptent typo)
  recipient: data.recipient ?? data.reciptent,
});

export const connectWithWallet = async (onSuccess) => {
  if (typeof window === 'undefined') return;

  if (window.ethereum) {
    window.ethereum
      .request({ method: "eth_requestAccounts" })
      .then(() => {
        onSuccess();
      })
      .catch((error) => {
        alert(error.message);
      });
  } else {
    window.alert(
      "No Ethereum wallet detected. Please install MetaMask to continue."
    );
  }
};

export const chainOrAccountChangedHandler = () => {
  // Reload the page to avoid stale state after chain or account change
  window.location.reload();
};
