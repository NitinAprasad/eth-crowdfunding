// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import './Project.sol';

/**
 * @title Crowdfunding
 * @notice Factory contract for creating and managing crowdfunding projects.
 *         Anyone can start a funding project, contribute to one, or retrieve all projects.
 */
contract Crowdfunding {

    event ProjectStarted(
        address projectContractAddress,
        address creator,
        uint256 minContribution,
        uint256 projectDeadline,
        uint256 goalAmount,
        uint256 currentAmount,
        uint256 noOfContributors,
        string title,
        string desc,
        uint256 currentState
    );

    event ContributionReceived(
        address projectAddress,
        uint256 contributedAmount,
        address indexed contributor
    );

    Project[] private projects;

    /**
     * @dev Anyone can start a fund raising project.
     * @param minimumContribution Minimum amount (in wei) a contributor must send.
     * @param deadline Unix timestamp after which contributions are no longer accepted.
     * @param targetContribution Target amount (in wei) to be raised.
     * @param projectTitle Short title for the project.
     * @param projectDesc Description of the project.
     */
    function createProject(
        uint256 minimumContribution,
        uint256 deadline,
        uint256 targetContribution,
        string memory projectTitle,
        string memory projectDesc
    ) public {
        require(deadline > block.timestamp, "Deadline must be in the future");
        require(targetContribution > 0, "Target must be greater than 0");
        require(minimumContribution > 0, "Minimum contribution must be greater than 0");

        Project newProject = new Project(
            msg.sender,
            minimumContribution,
            deadline,
            targetContribution,
            projectTitle,
            projectDesc
        );
        projects.push(newProject);

        emit ProjectStarted(
            address(newProject),
            msg.sender,
            minimumContribution,
            deadline,
            targetContribution,
            0,
            0,
            projectTitle,
            projectDesc,
            0
        );
    }

    /**
     * @dev Returns the full list of all created project contract addresses.
     */
    function returnAllProjects() external view returns (Project[] memory) {
        return projects;
    }

    /**
     * @dev Allows a user to contribute to a specific project.
     * @param _projectAddress Address of the project contract to contribute to.
     */
    function contribute(address _projectAddress) public payable {
        uint256 minContributionAmount = Project(_projectAddress).minimumContribution();
        Project.State projectState = Project(_projectAddress).state();
        require(projectState == Project.State.Fundraising, "Project is not in Fundraising state");
        require(msg.value >= minContributionAmount, "Contribution amount is too low!");

        Project(_projectAddress).contribute{value: msg.value}(msg.sender);
        emit ContributionReceived(_projectAddress, msg.value, msg.sender);
    }
}
