// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function approve(address spender, uint256 value) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface ISwapRouter {
    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        bytes calldata data
    ) external returns (uint256 amountOut);
}

interface IPerpProtocol {
    function openPosition(
        bool isLong,
        uint256 size,
        uint256 leverage,
        address collateral,
        uint256 collateralAmount
    ) external returns (bytes32 positionId);

    function closePosition(bytes32 positionId) external returns (int256 pnl);
}

interface ILiquidityPool {
    function addLiquidity(
        address token0,
        address token1,
        uint256 amount0,
        uint256 amount1
    ) external returns (uint256 liquidity);

    function removeLiquidity(uint256 liquidity) external returns (uint256 amount0, uint256 amount1);
}

contract MoixaExecutor {
    address public owner;
    address public moixaAgent;

    event TradeExecuted(
        address indexed protocol,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );
    event PositionOpened(
        address indexed protocol,
        bytes32 indexed positionId,
        bool isLong,
        uint256 size,
        uint256 leverage
    );
    event PositionClosed(
        address indexed protocol,
        bytes32 indexed positionId,
        int256 pnl
    );
    event LiquidityAdded(address indexed pool, uint256 liquidity);
    event LiquidityRemoved(address indexed pool, uint256 liquidity);
    event EmergencyWithdraw(address indexed token, address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "MoixaExecutor: not owner");
        _;
    }

    modifier onlyMoixa() {
        require(msg.sender == moixaAgent, "MoixaExecutor: not agent");
        _;
    }

    constructor(address _moixaAgent) {
        owner = msg.sender;
        moixaAgent = _moixaAgent;
    }

    function setMoixaAgent(address _agent) external onlyOwner {
        moixaAgent = _agent;
    }

    function executeTrade(
        address protocol,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        bytes calldata swapData
    ) external onlyMoixa returns (uint256 amountOut) {
        require(protocol != address(0), "MoixaExecutor: zero protocol");
        IERC20(tokenIn).approve(protocol, amountIn);
        amountOut = ISwapRouter(protocol).swap(
            tokenIn,
            tokenOut,
            amountIn,
            minAmountOut,
            swapData
        );
        emit TradeExecuted(protocol, tokenIn, tokenOut, amountIn, amountOut);
    }

    function openPerpPosition(
        address perpProtocol,
        bool isLong,
        uint256 size,
        uint256 leverage,
        address collateralToken,
        uint256 collateralAmount
    ) external onlyMoixa returns (bytes32 positionId) {
        IERC20(collateralToken).approve(perpProtocol, collateralAmount);
        positionId = IPerpProtocol(perpProtocol).openPosition(
            isLong,
            size,
            leverage,
            collateralToken,
            collateralAmount
        );
        emit PositionOpened(perpProtocol, positionId, isLong, size, leverage);
    }

    function closePerpPosition(address perpProtocol, bytes32 positionId)
        external
        onlyMoixa
        returns (int256 pnl)
    {
        pnl = IPerpProtocol(perpProtocol).closePosition(positionId);
        emit PositionClosed(perpProtocol, positionId, pnl);
    }

    function addLiquidity(
        address pool,
        address token0,
        address token1,
        uint256 amount0,
        uint256 amount1
    ) external onlyMoixa {
        IERC20(token0).approve(pool, amount0);
        IERC20(token1).approve(pool, amount1);
        uint256 liquidity = ILiquidityPool(pool).addLiquidity(
            token0,
            token1,
            amount0,
            amount1
        );
        emit LiquidityAdded(pool, liquidity);
    }

    function removeLiquidity(address pool, uint256 liquidity) external onlyMoixa {
        ILiquidityPool(pool).removeLiquidity(liquidity);
        emit LiquidityRemoved(pool, liquidity);
    }

    function emergencyWithdraw(address token, address to) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance > 0, "MoixaExecutor: nothing to withdraw");
        IERC20(token).transfer(to, balance);
        emit EmergencyWithdraw(token, to, balance);
    }

    receive() external payable {}
}
