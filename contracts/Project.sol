// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Project
 * @notice Represents a single crowdfunding project.
 *         Contributors can fund the project, vote on withdrawal requests,
 *         and the creator can request/complete withdrawals after the project succeeds.
 *
 * Rules:
 *  - Anyone can contribute while state is Fundraising and deadline has not passed.
 *  - Project moves to Successful when raisedAmount >= targetContribution.
 *  - Project moves to Expired when deadline passes without hitting the target.
 *  - Contributors can claim a refund if the project is Expired.
 *  - Creator can create withdrawal requests once Successful.
 *  - At least 50% of contributors must vote before a withdrawal can execute.
 */
contract Project {

    // Project state
    enum State {
        Fundraising,
        Expired,
        Successful
    }

    struct WithdrawRequest {
        string description;
        uint256 amount;
        uint256 noOfVotes;
        mapping(address => bool) voters;
        bool isCompleted;
        address payable recipient;
    }

    // State variables
    address payable public creator;
    uint256 public minimumContribution;
    uint256 public deadline;
    uint256 public targetContribution;
    uint public completeAt;
    uint256 public raisedAmount;
    uint256 public noOfContributors;
    string public projectTitle;
    string public projectDes;
    State public state = State.Fundraising;

    mapping(address => uint) public contributors;
    mapping(uint256 => WithdrawRequest) public withdrawRequests;

    uint256 public numOfWithdrawRequests = 0;

    // ─── Modifiers ─────────────────────────────────────────────────────

    modifier isCreator() {
        require(msg.sender == creator, "You dont have access to perform this operation!");
        _;
    }

    modifier validateExpiry(State _state) {
        require(state == _state, "Invalid state");
        require(block.timestamp < deadline, "Deadline has passed!");
        _;
    }

    // ─── Events ────────────────────────────────────────────────────────

    event FundingReceived(address contributor, uint amount, uint currentTotal);
    event WithdrawRequestCreated(
        uint256 requestId,
        string description,
        uint256 amount,
        uint256 noOfVotes,
        bool isCompleted,
        address recipient
    );
    event WithdrawVote(address voter, uint totalVote);
    event AmountWithdrawSuccessful(
        uint256 requestId,
        string description,
        uint256 amount,
        uint256 noOfVotes,
        bool isCompleted,
        address recipient
    );

    // ─── Constructor ───────────────────────────────────────────────────

    constructor(
        address _creator,
        uint256 _minimumContribution,
        uint256 _deadline,
        uint256 _targetContribution,
        string memory _projectTitle,
        string memory _projectDes
    ) {
        creator = payable(_creator);
        minimumContribution = _minimumContribution;
        deadline = _deadline;
        targetContribution = _targetContribution;
        projectTitle = _projectTitle;
        projectDes = _projectDes;
        raisedAmount = 0;
    }

    // ─── External / Public Functions ───────────────────────────────────

    /**
     * @dev Called by Crowdfunding.contribute — contributes ETH to this project.
     * @param _contributor Address of the actual contributor (forwarded from parent).
     */
    function contribute(address _contributor) public validateExpiry(State.Fundraising) payable {
        require(msg.value >= minimumContribution, "Contribution amount is too low!");
        if (contributors[_contributor] == 0) {
            noOfContributors++;
        }
        contributors[_contributor] += msg.value;
        raisedAmount += msg.value;
        emit FundingReceived(_contributor, msg.value, raisedAmount);
        checkFundingCompleteOrExpire();
    }

    /**
     * @dev Returns the current ETH balance held by this contract.
     */
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Contributors can claim a refund if the project expired without meeting its goal.
     */
    function requestRefund() public returns (bool) {
        require(state == State.Expired, "Invalid state");
        require(contributors[msg.sender] > 0, "You dont have any contributed amount!");
        address payable user = payable(msg.sender);
        uint256 refundAmount = contributors[msg.sender];
        contributors[msg.sender] = 0;
        (bool success, ) = user.call{value: refundAmount}("");
        require(success, "Refund transfer failed");
        return true;
    }

    /**
     * @dev Creator requests to withdraw an amount. Requires project to be Successful.
     */
    function createWithdrawRequest(
        string memory _description,
        uint256 _amount,
        address payable _recipient
    ) public isCreator() validateExpiry(State.Successful) {
        require(_amount <= address(this).balance, "Insufficient contract balance");

        WithdrawRequest storage newRequest = withdrawRequests[numOfWithdrawRequests];
        numOfWithdrawRequests++;

        newRequest.description = _description;
        newRequest.amount = _amount;
        newRequest.noOfVotes = 0;
        newRequest.isCompleted = false;
        newRequest.recipient = _recipient;

        emit WithdrawRequestCreated(numOfWithdrawRequests, _description, _amount, 0, false, _recipient);
    }

    /**
     * @dev A contributor can vote on a pending withdrawal request.
     */
    function voteWithdrawRequest(uint256 _requestId) public {
        require(contributors[msg.sender] > 0, "Only contributor can vote!");
        WithdrawRequest storage requestDetails = withdrawRequests[_requestId];
        require(!requestDetails.voters[msg.sender], "You already voted!");
        requestDetails.voters[msg.sender] = true;
        requestDetails.noOfVotes += 1;
        emit WithdrawVote(msg.sender, requestDetails.noOfVotes);
    }

    /**
     * @dev Creator executes the withdrawal once at least 50% of contributors have voted.
     */
    function withdrawRequestedAmount(uint256 _requestId) public isCreator() validateExpiry(State.Successful) {
        WithdrawRequest storage requestDetails = withdrawRequests[_requestId];
        require(!requestDetails.isCompleted, "Request already completed");
        require(
            requestDetails.noOfVotes >= noOfContributors / 2,
            "At least 50% contributor need to vote for this request"
        );

        (bool success, ) = requestDetails.recipient.call{value: requestDetails.amount}("");
        require(success, "Withdrawal transfer failed");
        requestDetails.isCompleted = true;

        emit AmountWithdrawSuccessful(
            _requestId,
            requestDetails.description,
            requestDetails.amount,
            requestDetails.noOfVotes,
            true,
            requestDetails.recipient
        );
    }

    /**
     * @dev Returns all key details about this project in a single call.
     */
    function getProjectDetails() public view returns (
        address payable projectStarter,
        uint256 minContribution,
        uint256 projectDeadline,
        uint256 goalAmount,
        uint completedTime,
        uint256 currentAmount,
        string memory title,
        string memory desc,
        State currentState,
        uint256 balance
    ) {
        projectStarter = creator;
        minContribution = minimumContribution;
        projectDeadline = deadline;
        goalAmount = targetContribution;
        completedTime = completeAt;
        currentAmount = raisedAmount;
        title = projectTitle;
        desc = projectDes;
        currentState = state;
        balance = address(this).balance;
    }

    // ─── Internal Functions ────────────────────────────────────────────

    function checkFundingCompleteOrExpire() internal {
        if (raisedAmount >= targetContribution) {
            state = State.Successful;
        } else if (block.timestamp > deadline) {
            state = State.Expired;
        }
        completeAt = block.timestamp;
    }
}