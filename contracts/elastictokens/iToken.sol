pragma solidity 0.5.17;

/* import "./iElasticTokenInterface.sol"; */
import "./iTokenGovernance.sol";
import "../lib/SafeERC20.sol";

contract iElasticToken is iTokenGovernanceToken {
    // Modifiers
    modifier onlyGov() {
        require(msg.sender == gov);
        _;
    }

    modifier onlyRebaser() {
        require(msg.sender == rebaser);
        _;
    }

    modifier onlyMinter() {
        require(msg.sender == rebaser
        || msg.sender == incentivizer
        || msg.sender == gov, "not minter");
        _;
    }

    modifier validRecipient(address to) {
        require(to != address(0x0));
        require(to != address(this));
        _;
    }

    function initialize(
        string memory name_,
        string memory symbol_,
        uint8 decimals_
    )
    public
    {
        require(itokensScalingFactor == 0, "already initialized");
        name = name_;
        symbol = symbol_;
        decimals = decimals_;
    }


    /**
    * @notice Computes the current max scaling factor
    */
    function maxScalingFactor()
    external
    view
    returns (uint256)
    {
        return _maxScalingFactor();
    }

    function _maxScalingFactor()
    internal
    view
    returns (uint256)
    {
        // scaling factor can only go up to 2**256-1 = initSupply * itokensScalingFactor
        // this is used to check if itokensScalingFactor will be too high to compute balances when rebasing.
        return uint256(- 1) / initSupply;
    }

    /**
    * @notice Mints new tokens, increasing totalSupply, initSupply, and a users balance.
    * @dev Limited to onlyMinter modifier
    */
    function mint(address to, uint256 amount)
    external
    onlyMinter
    returns (bool)
    {
        _mint(to, amount);
        return true;
    }

    function _mint(address to, uint256 amount)
    internal
    {
        // increase totalSupply
        totalSupply = totalSupply.add(amount);

        // get underlying value
        uint256 itokenValue = _fragmentToiToken(amount);

        // increase initSupply
        initSupply = initSupply.add(itokenValue);

        // make sure the mint didnt push maxScalingFactor too low
        require(itokensScalingFactor <= _maxScalingFactor(), "max scaling factor too low");

        // add balance
        _itokenBalances[to] = _itokenBalances[to].add(itokenValue);

        // add delegates to the minter
        _moveDelegates(address(0), _delegates[to], itokenValue);
        emit Mint(to, amount);
        emit Transfer(address(0), to, amount);
    }


    function burn(uint256 amount) external returns (bool) {
        _burn(msg.sender, amount);
        return true;
    }

    /// @notice Burns `_amount` token in `account`. Must only be called by the gov (IFABank).
    function burnFrom(address account, uint256 amount) external onlyGov returns (bool) {
        // decreased  Allowance
        uint256 allowance = _allowedFragments[account][msg.sender];
        uint256 decreasedAllowance = allowance.sub(amount);

        // approve
        _allowedFragments[account][msg.sender] = decreasedAllowance;
        emit Approval(account, msg.sender, decreasedAllowance);

        // burn
        _burn(account, amount);
        return true;
    }

    function _burn(address account, uint256 amount) internal {
        require(account != address(0), "ERC20: burn from the zero address");

        // get underlying value
        uint256 itokenValue = _fragmentToiToken(amount);
        // sub balance
        _itokenBalances[account] = _itokenBalances[account].sub(itokenValue);

        // decrease initSupply
        initSupply = initSupply.sub(itokenValue);

        // decrease totalSupply
        totalSupply = totalSupply.sub(amount);

        //remove delegates from the account
        _moveDelegates(_delegates[account], address(0), itokenValue);
        emit Burn(account, amount);
        emit Transfer(account, address(0), amount);
    }

    /* - ERC20 functionality - */

    /**
    * @dev Transfer tokens to a specified address.
    * @param to The address to transfer to.
    * @param value The amount to be transferred.
    * @return True on success, false otherwise.
    */
    function transfer(address to, uint256 value)
    external
    validRecipient(to)
    returns (bool)
    {
        // underlying balance is stored in itokens, so divide by current scaling factor

        // note, this means as scaling factor grows, dust will be untransferrable.
        // minimum transfer value == itokensScalingFactor / 1e24;

        // get amount in underlying
        uint256 itokenValue = _fragmentToiToken(value);

        // sub from balance of sender
        _itokenBalances[msg.sender] = _itokenBalances[msg.sender].sub(itokenValue);

        // add to balance of receiver
        _itokenBalances[to] = _itokenBalances[to].add(itokenValue);
        emit Transfer(msg.sender, to, value);

        _moveDelegates(_delegates[msg.sender], _delegates[to], itokenValue);
        return true;
    }

    /**
    * @dev Transfer tokens from one address to another.
    * @param from The address you want to send tokens from.
    * @param to The address you want to transfer to.
    * @param value The amount of tokens to be transferred.
    */
    function transferFrom(address from, address to, uint256 value)
    external
    validRecipient(to)
    returns (bool)
    {
        // decrease allowance
        _allowedFragments[from][msg.sender] = _allowedFragments[from][msg.sender].sub(value);

        // get value in itokens
        uint256 itokenValue = _fragmentToiToken(value);

        // sub from from
        _itokenBalances[from] = _itokenBalances[from].sub(itokenValue);
        _itokenBalances[to] = _itokenBalances[to].add(itokenValue);
        emit Transfer(from, to, value);

        _moveDelegates(_delegates[from], _delegates[to], itokenValue);
        return true;
    }

    /**
    * @param who The address to query.
    * @return The balance of the specified address.
    */
    function balanceOf(address who)
    external
    view
    returns (uint256)
    {
        return _itokenToFragment(_itokenBalances[who]);
    }

    /** @notice Currently returns the internal storage amount
    * @param who The address to query.
    * @return The underlying balance of the specified address.
    */
    function balanceOfUnderlying(address who)
    external
    view
    returns (uint256)
    {
        return _itokenBalances[who];
    }

    /**
     * @dev Function to check the amount of tokens that an owner has allowed to a spender.
     * @param owner_ The address which owns the funds.
     * @param spender The address which will spend the funds.
     * @return The number of tokens still available for the spender.
     */
    function allowance(address owner_, address spender)
    external
    view
    returns (uint256)
    {
        return _allowedFragments[owner_][spender];
    }

    /**
     * @dev Approve the passed address to spend the specified amount of tokens on behalf of
     * msg.sender. This method is included for ERC20 compatibility.
     * increaseAllowance and decreaseAllowance should be used instead.
     * Changing an allowance with this method brings the risk that someone may transfer both
     * the old and the new allowance - if they are both greater than zero - if a transfer
     * transaction is mined before the later approve() call is mined.
     *
     * @param spender The address which will spend the funds.
     * @param value The amount of tokens to be spent.
     */
    function approve(address spender, uint256 value)
    external
    returns (bool)
    {
        _allowedFragments[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    /**
     * @dev Increase the amount of tokens that an owner has allowed to a spender.
     * This method should be used instead of approve() to avoid the double approval vulnerability
     * described above.
     * @param spender The address which will spend the funds.
     * @param addedValue The amount of tokens to increase the allowance by.
     */
    function increaseAllowance(address spender, uint256 addedValue)
    external
    returns (bool)
    {
        _allowedFragments[msg.sender][spender] =
        _allowedFragments[msg.sender][spender].add(addedValue);
        emit Approval(msg.sender, spender, _allowedFragments[msg.sender][spender]);
        return true;
    }

    /**
     * @dev Decrease the amount of tokens that an owner has allowed to a spender.
     *
     * @param spender The address which will spend the funds.
     * @param subtractedValue The amount of tokens to decrease the allowance by.
     */
    function decreaseAllowance(address spender, uint256 subtractedValue)
    external
    returns (bool)
    {
        uint256 oldValue = _allowedFragments[msg.sender][spender];
        if (subtractedValue >= oldValue) {
            _allowedFragments[msg.sender][spender] = 0;
        } else {
            _allowedFragments[msg.sender][spender] = oldValue.sub(subtractedValue);
        }
        emit Approval(msg.sender, spender, _allowedFragments[msg.sender][spender]);
        return true;
    }


    // --- Approve by signature ---
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    )
    external
    {
        require(now <= deadline, "iToken/permit-expired");
        bytes32 digest =
        keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(
                    abi.encode(
                        PERMIT_TYPEHASH,
                        owner,
                        spender,
                        value,
                        nonces[owner]++,
                        deadline
                    )
                )
            )
        );
        require(owner != address(0), "iToken/invalid-address-0");
        require(owner == ecrecover(digest, v, r, s), "iToken/invalid-permit");
        _allowedFragments[owner][spender] = value;
        emit Approval(owner, spender, value);
    }

    /* - Governance Functions - */

    /** @notice sets the rebaser
     * @param rebaser_ The address of the rebaser contract to use for authentication.
     */
    function _setRebaser(address rebaser_)
    external
    onlyGov
    {
        address oldRebaser = rebaser;
        rebaser = rebaser_;
        emit NewRebaser(oldRebaser, rebaser_);
    }

    /** @notice sets the incentivizer
     * @param incentivizer_ The address of the rebaser contract to use for authentication.
     */
    function _setIncentivizer(address incentivizer_)
    external
    onlyGov
    {
        address oldIncentivizer = incentivizer;
        incentivizer = incentivizer_;
        emit NewIncentivizer(oldIncentivizer, incentivizer_);
    }

    /** @notice sets the pendingGov
     * @param pendingGov_ The address of the rebaser contract to use for authentication.
     */
    function _setPendingGov(address pendingGov_)
    external
    onlyGov
    {
        address oldPendingGov = pendingGov;
        pendingGov = pendingGov_;
        emit NewPendingGov(oldPendingGov, pendingGov_);
    }

    /** @notice lets msg.sender accept governance
     *
     */
    function _acceptGov()
    external
    {
        require(msg.sender == pendingGov, "!pending");
        address oldGov = gov;
        gov = pendingGov;
        pendingGov = address(0);
        emit NewGov(oldGov, gov);
    }

    /* - Extras - */

    /**
    * @notice Initiates a new rebase operation, provided the minimum time period has elapsed.
    *
    * @dev The supply adjustment equals (totalSupply * DeviationFromTargetRate) / rebaseLag
    *      Where DeviationFromTargetRate is (MarketOracleRate - targetRate) / targetRate
    *      and targetRate is CpiOracleRate / baseCpi
    */
    function rebase(
        uint256 epoch,
        uint256 indexDelta,
        bool positive
    )
    external
    onlyRebaser
    returns (uint256)
    {
        // no change
        if (indexDelta == 0) {
            emit Rebase(epoch, itokensScalingFactor, itokensScalingFactor);
            return totalSupply;
        }
        // for events
        uint256 previTokensScalingFactor = itokensScalingFactor;

        if (!positive) {
            // negative rebase, decrease scaling factor
            itokensScalingFactor = itokensScalingFactor.mul(BASE.sub(indexDelta)).div(BASE);
        } else {
            // positive reabse, increase scaling factor
            uint256 newScalingFactor = itokensScalingFactor.mul(BASE.add(indexDelta)).div(BASE);
            if (newScalingFactor < _maxScalingFactor()) {
                itokensScalingFactor = newScalingFactor;
            } else {
                itokensScalingFactor = _maxScalingFactor();
            }
        }
        // update total supply, correctly
        totalSupply = _itokenToFragment(initSupply);
        emit Rebase(epoch, previTokensScalingFactor, itokensScalingFactor);
        return totalSupply;
    }


    function itokenToFragment(uint256 itoken)
    external
    view
    returns (uint256)
    {
        return _itokenToFragment(itoken);
    }


    function fragmentToiToken(uint256 value)
    external
    view
    returns (uint256)
    {
        return _fragmentToiToken(value);
    }


    function _itokenToFragment(uint256 itoken)
    internal
    view
    returns (uint256)
    {
        return itoken.mul(itokensScalingFactor).div(internalDecimals);
    }


    function _fragmentToiToken(uint256 value)
    internal
    view
    returns (uint256)
    {
        return value.mul(internalDecimals).div(itokensScalingFactor);
    }

    // Rescue tokens
    function rescueTokens(
        address token,
        address to,
        uint256 amount
    )
    external
    onlyGov
    returns (bool)
    {
        // transfer to
        SafeERC20.safeTransfer(IERC20(token), to, amount);
        return true;
    }

}

contract iToken is iElasticToken {
    /**
     * @notice Initialize the new money market
     * @param name_ ERC-20 name of this token
     * @param symbol_ ERC-20 symbol of this token
     * @param decimals_ ERC-20 decimal precision of this token
     */
    function initialize(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        address initial_owner,
        uint256 initTotalSupply_
    )
    public
    {
        super.initialize(name_, symbol_, decimals_);
        itokensScalingFactor = BASE;
        initSupply = _fragmentToiToken(initTotalSupply_);
        totalSupply = initTotalSupply_;
        _itokenBalances[initial_owner] = initSupply;
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                DOMAIN_TYPEHASH,
                keccak256(bytes(name)),
                getChainId(),
                address(this)
            )
        );
    }
}
