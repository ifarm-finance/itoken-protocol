pragma solidity 0.5.17;

import "../lib/SafeMath.sol";

// Storage for a iToken
contract iElasticTokenStorage {

    using SafeMath for uint256;

    /**
     * @dev Guard variable for re-entrancy checks. Not currently used
     */
    bool internal _notEntered;

    /**
     * @notice EIP-20 token name for this token
     */
    string public name;

    /**
     * @notice EIP-20 token symbol for this token
     */
    string public symbol;

    /**
     * @notice EIP-20 token decimals for this token
     */
    uint8 public decimals;

    /**
     * @notice Governor for this contract
     */
    address public gov;

    /**
     * @notice Pending governance for this contract
     */
    address public pendingGov;

    /**
     * @notice Approved rebaser for this contract
     */
    address public rebaser;

    /**
     * @notice Reserve address of iToken protocol
     */
    address public incentivizer;

    /**
    * @notice IFABank address of ifarm protocol
    */
    address public banker;

    /**
     * @notice Total supply of iTokens
     */
    uint256 public totalSupply;

    /**
     * @notice Internal decimals used to handle scaling factor
     */
    uint256 public constant internalDecimals = 10 ** 24;

    /**
     * @notice Used for percentage maths
     */
    uint256 public constant BASE = 10 ** 18;

    /**
     * @notice Scaling factor that adjusts everyone's balances
     */
    uint256 public itokensScalingFactor;

    mapping(address => uint256) internal _itokenBalances;

    mapping(address => mapping(address => uint256)) internal _allowedFragments;

    uint256 public initSupply;

    // keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");
    bytes32 public constant PERMIT_TYPEHASH = 0x6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9;
    bytes32 public DOMAIN_SEPARATOR;

}
