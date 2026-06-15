// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MoixaBrain {
    struct Decision {
        uint256 timestamp;
        string marketContext;
        string signalDetected;
        uint256 confidenceScore;
        string tradeDirection;
        string token;
        uint256 positionSize;
        string riskLevel;
        string riskReasoning;
        int256 expectedReturn;
        int256 actualReturn;
        bool wasCorrect;
        bool isClosed;
        string learningNote;
    }

    mapping(uint256 => Decision) public decisions;
    uint256 public totalDecisions;
    uint256 public correctDecisions;
    uint256 public totalVolume;

    address public moixaAgent;
    address public owner;

    event DecisionRecorded(
        uint256 indexed id,
        string token,
        string direction,
        uint256 confidence,
        uint256 timestamp
    );
    event DecisionClosed(
        uint256 indexed id,
        int256 actualReturn,
        bool wasCorrect
    );
    event MoixaLearned(uint256 indexed id, string note);
    event AgentUpdated(address indexed newAgent);

    modifier onlyMoixa() {
        require(msg.sender == moixaAgent, "MoixaBrain: not agent");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "MoixaBrain: not owner");
        _;
    }

    constructor(address _moixaAgent) {
        owner = msg.sender;
        moixaAgent = _moixaAgent;
    }

    function setMoixaAgent(address _agent) external onlyOwner {
        moixaAgent = _agent;
        emit AgentUpdated(_agent);
    }

    function recordDecision(
        string calldata marketContext,
        string calldata signalDetected,
        uint256 confidenceScore,
        string calldata tradeDirection,
        string calldata token,
        uint256 positionSize,
        string calldata riskLevel,
        string calldata riskReasoning,
        int256 expectedReturn
    ) external onlyMoixa returns (uint256 decisionId) {
        decisionId = totalDecisions;
        decisions[decisionId] = Decision({
            timestamp: block.timestamp,
            marketContext: marketContext,
            signalDetected: signalDetected,
            confidenceScore: confidenceScore,
            tradeDirection: tradeDirection,
            token: token,
            positionSize: positionSize,
            riskLevel: riskLevel,
            riskReasoning: riskReasoning,
            expectedReturn: expectedReturn,
            actualReturn: 0,
            wasCorrect: false,
            isClosed: false,
            learningNote: ""
        });

        totalDecisions += 1;
        totalVolume += positionSize;

        emit DecisionRecorded(
            decisionId,
            token,
            tradeDirection,
            confidenceScore,
            block.timestamp
        );
    }

    function closeDecision(
        uint256 decisionId,
        int256 actualReturn,
        bool wasCorrect,
        string calldata learningNote
    ) external onlyMoixa {
        require(decisionId < totalDecisions, "MoixaBrain: invalid id");
        Decision storage d = decisions[decisionId];
        require(!d.isClosed, "MoixaBrain: already closed");

        d.actualReturn = actualReturn;
        d.wasCorrect = wasCorrect;
        d.isClosed = true;
        d.learningNote = learningNote;

        if (wasCorrect) {
            correctDecisions += 1;
        }

        emit DecisionClosed(decisionId, actualReturn, wasCorrect);
        if (bytes(learningNote).length > 0) {
            emit MoixaLearned(decisionId, learningNote);
        }
    }

    function getAccuracy() public view returns (uint256) {
        if (totalDecisions == 0) return 0;
        return (correctDecisions * 10000) / totalDecisions;
    }

    function getDecision(uint256 id) external view returns (Decision memory) {
        require(id < totalDecisions, "MoixaBrain: invalid id");
        return decisions[id];
    }

    function getRecentDecisions(uint256 count)
        external
        view
        returns (Decision[] memory)
    {
        uint256 n = count > totalDecisions ? totalDecisions : count;
        Decision[] memory out = new Decision[](n);
        for (uint256 i = 0; i < n; i++) {
            out[i] = decisions[totalDecisions - 1 - i];
        }
        return out;
    }

    function getTotalStats()
        external
        view
        returns (
            uint256 total,
            uint256 correct,
            uint256 accuracy,
            uint256 volume
        )
    {
        return (totalDecisions, correctDecisions, getAccuracy(), totalVolume);
    }
}
