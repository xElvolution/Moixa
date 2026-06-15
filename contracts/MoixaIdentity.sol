// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC721 {
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    function balanceOf(address owner) external view returns (uint256);
    function ownerOf(uint256 tokenId) external view returns (address);
    function transferFrom(address from, address to, uint256 tokenId) external;
    function approve(address to, uint256 tokenId) external;
    function getApproved(uint256 tokenId) external view returns (address);
    function setApprovalForAll(address operator, bool approved) external;
    function isApprovedForAll(address owner, address operator) external view returns (bool);
}

interface IERC721Metadata is IERC721 {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function tokenURI(uint256 tokenId) external view returns (string memory);
}

library Base64 {
    string internal constant TABLE =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

    function encode(bytes memory data) internal pure returns (string memory) {
        if (data.length == 0) return "";
        string memory table = TABLE;
        uint256 encodedLen = 4 * ((data.length + 2) / 3);
        string memory result = new string(encodedLen + 32);

        assembly {
            mstore(result, encodedLen)
            let tablePtr := add(table, 1)
            let dataPtr := data
            let endPtr := add(dataPtr, mload(data))
            let resultPtr := add(result, 32)

            for {} lt(dataPtr, endPtr) {} {
                dataPtr := add(dataPtr, 3)
                let input := mload(dataPtr)

                mstore8(resultPtr, mload(add(tablePtr, and(shr(18, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(shr(12, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(shr(6, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(input, 0x3F))))
                resultPtr := add(resultPtr, 1)
            }

            switch mod(mload(data), 3)
            case 1 {
                mstore8(sub(resultPtr, 2), 0x3d)
                mstore8(sub(resultPtr, 1), 0x3d)
            }
            case 2 {
                mstore8(sub(resultPtr, 1), 0x3d)
            }
        }

        return result;
    }
}

library Strings {
    function toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}

contract MoixaIdentity is IERC721Metadata {
    using Strings for uint256;

    struct AgentProfile {
        uint256 agentId;
        string name;
        uint256 birthTimestamp;
        uint256 birthBlock;
        uint256 totalTrades;
        uint256 totalVolume;
        uint256 winRate;
        uint256 sharpeRatio;
        uint256 maxDrawdown;
        uint256 reputationScore;
        uint256 lastUpdated;
    }

    string private constant _NAME = "MOIXA Agent Identity";
    string private constant _SYMBOL = "MOIXA-ID";

    address public owner;
    address public moixaAgent;
    uint256 public nextTokenId;

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    mapping(uint256 => AgentProfile) public profiles;
    mapping(uint256 => uint256[]) private _reputationHistoryScores;
    mapping(uint256 => uint256[]) private _reputationHistoryTimes;

    event AgentMinted(uint256 indexed agentId, address indexed to, string name);
    event ReputationUpdated(uint256 indexed agentId, uint256 reputationScore);

    modifier onlyOwner() {
        require(msg.sender == owner, "MoixaIdentity: not owner");
        _;
    }

    modifier onlyMoixa() {
        require(msg.sender == moixaAgent, "MoixaIdentity: not agent");
        _;
    }

    constructor(address _moixaAgent) {
        owner = msg.sender;
        moixaAgent = _moixaAgent;
        nextTokenId = 1;
    }

    function setMoixaAgent(address _agent) external onlyOwner {
        moixaAgent = _agent;
    }

    function name() external pure returns (string memory) {
        return _NAME;
    }

    function symbol() external pure returns (string memory) {
        return _SYMBOL;
    }

    function balanceOf(address _owner) external view returns (uint256) {
        require(_owner != address(0), "MoixaIdentity: zero address");
        return _balances[_owner];
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        address o = _owners[tokenId];
        require(o != address(0), "MoixaIdentity: nonexistent");
        return o;
    }

    function approve(address to, uint256 tokenId) external {
        address o = ownerOf(tokenId);
        require(
            msg.sender == o || _operatorApprovals[o][msg.sender],
            "MoixaIdentity: not authorized"
        );
        _tokenApprovals[tokenId] = to;
        emit Approval(o, to, tokenId);
    }

    function getApproved(uint256 tokenId) external view returns (address) {
        require(_owners[tokenId] != address(0), "MoixaIdentity: nonexistent");
        return _tokenApprovals[tokenId];
    }

    function setApprovalForAll(address operator, bool approved) external {
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address _owner, address operator)
        external
        view
        returns (bool)
    {
        return _operatorApprovals[_owner][operator];
    }

    function transferFrom(address from, address to, uint256 tokenId) external {
        require(ownerOf(tokenId) == from, "MoixaIdentity: wrong from");
        require(to != address(0), "MoixaIdentity: zero to");
        require(
            msg.sender == from ||
                _tokenApprovals[tokenId] == msg.sender ||
                _operatorApprovals[from][msg.sender],
            "MoixaIdentity: not authorized"
        );

        delete _tokenApprovals[tokenId];
        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;
        emit Transfer(from, to, tokenId);
    }

    function mintAgentIdentity(string calldata agentName)
        external
        onlyOwner
        returns (uint256)
    {
        uint256 tokenId = nextTokenId++;
        _owners[tokenId] = msg.sender;
        _balances[msg.sender] += 1;

        profiles[tokenId] = AgentProfile({
            agentId: tokenId,
            name: agentName,
            birthTimestamp: block.timestamp,
            birthBlock: block.number,
            totalTrades: 0,
            totalVolume: 0,
            winRate: 0,
            sharpeRatio: 0,
            maxDrawdown: 0,
            reputationScore: 500,
            lastUpdated: block.timestamp
        });

        _reputationHistoryScores[tokenId].push(500);
        _reputationHistoryTimes[tokenId].push(block.timestamp);

        emit Transfer(address(0), msg.sender, tokenId);
        emit AgentMinted(tokenId, msg.sender, agentName);
        return tokenId;
    }

    function updateReputation(
        uint256 agentId,
        uint256 totalTrades,
        uint256 totalVolume,
        uint256 winRate,
        uint256 sharpeRatio,
        uint256 maxDrawdown,
        uint256 reputationScore
    ) external onlyMoixa {
        require(_owners[agentId] != address(0), "MoixaIdentity: nonexistent");
        AgentProfile storage p = profiles[agentId];
        p.totalTrades = totalTrades;
        p.totalVolume = totalVolume;
        p.winRate = winRate;
        p.sharpeRatio = sharpeRatio;
        p.maxDrawdown = maxDrawdown;
        p.reputationScore = reputationScore;
        p.lastUpdated = block.timestamp;

        _reputationHistoryScores[agentId].push(reputationScore);
        _reputationHistoryTimes[agentId].push(block.timestamp);

        emit ReputationUpdated(agentId, reputationScore);
    }

    function getProfile(uint256 agentId)
        external
        view
        returns (AgentProfile memory)
    {
        require(_owners[agentId] != address(0), "MoixaIdentity: nonexistent");
        return profiles[agentId];
    }

    function getReputationHistory(uint256 agentId)
        external
        view
        returns (uint256[] memory scores, uint256[] memory timestamps)
    {
        return (
            _reputationHistoryScores[agentId],
            _reputationHistoryTimes[agentId]
        );
    }

    function tokenURI(uint256 tokenId) external view returns (string memory) {
        require(_owners[tokenId] != address(0), "MoixaIdentity: nonexistent");
        AgentProfile memory p = profiles[tokenId];

        string memory svg = string(
            abi.encodePacked(
                "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'>",
                "<rect width='400' height='400' fill='#0A0A0F'/>",
                "<text x='50%' y='60' text-anchor='middle' fill='#00FFD1' font-family='monospace' font-size='28' font-weight='700'>MOIXA</text>",
                "<text x='50%' y='95' text-anchor='middle' fill='#6B7280' font-family='monospace' font-size='14'>Agent #",
                p.agentId.toString(),
                "</text>",
                "<circle cx='200' cy='210' r='90' fill='none' stroke='#16161F' stroke-width='14'/>",
                "<circle cx='200' cy='210' r='90' fill='none' stroke='#00FFD1' stroke-width='14' stroke-dasharray='565.48' stroke-dashoffset='",
                ((1000 - p.reputationScore) * 56548 / 100000).toString(),
                "' transform='rotate(-90 200 210)' stroke-linecap='round'/>",
                "<text x='50%' y='215' text-anchor='middle' fill='#FFFFFF' font-family='monospace' font-size='44' font-weight='700'>",
                p.reputationScore.toString(),
                "</text>",
                "<text x='50%' y='240' text-anchor='middle' fill='#6B7280' font-family='monospace' font-size='12'>/ 1000 REPUTATION</text>",
                "<text x='50%' y='340' text-anchor='middle' fill='#6B7280' font-family='monospace' font-size='12'>Trades: ",
                p.totalTrades.toString(),
                "  Win Rate: ",
                (p.winRate / 100).toString(),
                "%</text>",
                "<text x='50%' y='360' text-anchor='middle' fill='#6B7280' font-family='monospace' font-size='12'>Born Block #",
                p.birthBlock.toString(),
                "</text>",
                "</svg>"
            )
        );

        string memory json = string(
            abi.encodePacked(
                '{"name":"MOIXA Agent #',
                p.agentId.toString(),
                '","description":"Autonomous AI trading agent on Mantle. Every decision recorded on-chain.","attributes":[',
                '{"trait_type":"Reputation","value":',
                p.reputationScore.toString(),
                '},{"trait_type":"Total Trades","value":',
                p.totalTrades.toString(),
                '},{"trait_type":"Win Rate","value":',
                p.winRate.toString(),
                '},{"trait_type":"Birth Block","value":',
                p.birthBlock.toString(),
                '}],"image":"data:image/svg+xml;base64,',
                Base64.encode(bytes(svg)),
                '"}'
            )
        );

        return
            string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    Base64.encode(bytes(json))
                )
            );
    }
}
