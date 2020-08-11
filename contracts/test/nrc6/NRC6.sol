pragma solidity =0.6.6;

import "./INRC6.sol";
import "../../libraries/SafeMath.sol";

/**
 * @dev Implementation of the {INRC6} interface.
 * NEP6: https://github.com/newtonproject/NEPs/blob/c5f360f6b97284169272000de1746d94c5a8413d/NEPS/nep-6.md
 * TODO modify nep
 */
contract NRC6 is INRC6 {
    using SafeMath for uint256;

    address public owner;
    uint256 public totalSupply;
    string public name;
    string public symbol;
    uint8 public decimals;

    bool public running = true;
    mapping (address => bool) public isBlackListed;

    mapping(address => uint256) public balances;
    mapping(address => mapping(address => uint256)) public allowances;

    bytes32 public DOMAIN_SEPARATOR;
    // keccak256("Permit(address sender,address recipient,uint256 amount,uint256 nonce,uint256 deadline)");
    bytes32 public constant PERMIT_TYPEHASH = 0xf4f6c58659e4dccb7fbb45aeafb930bfcea4e8e59ea2a40312e3835bbd41e234;                                           
    mapping(address => uint) public nonces;

    constructor (string memory _name, string memory _symbol, uint8 _decimals, uint256 _totalSupply, address _owner) public {
        require(_owner != address(0), "_owner == address(0)");

        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        totalSupply = _totalSupply;
        owner = _owner;
        // all tokens transfer to _owner
        balances[_owner] = totalSupply;

        string memory version = "1";
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256('EIP712Domain(string name,string version,address verifyingContract)'),
                keccak256(bytes(name)),
                keccak256(bytes(version)),
                address(this)
            )
        );

        emit Transfer(address(0), _owner, totalSupply);
    }
    
    modifier isRunning {
        require(running);
        _;
    }

    modifier onlyOwner {
        require(msg.sender == owner, "only owner");
        _;
    }

    event ChangedOwner(address _newOwner);

    function changeOwner(address _newOwner) public onlyOwner {
        owner = _newOwner;
        emit ChangedOwner(owner);
    }

    event SetRunning(bool _running);
    
    function setRunning(bool _running) public onlyOwner {
        running = _running;
        emit SetRunning(running);
    }

    event AddedBlackList(address _user);

    function addBlackList (address _evilUser) public onlyOwner {
        isBlackListed[_evilUser] = true;
        emit AddedBlackList(_evilUser);
    }

    event RemovedBlackList(address _user);

    function removeBlackList (address _clearedUser) public onlyOwner {
        isBlackListed[_clearedUser] = false;
        emit RemovedBlackList(_clearedUser);
    }

    function permit(address _sender, address _recipient, uint _amount, uint _deadline, uint8 _v, bytes32 _r, bytes32 _s) public {
        require(_deadline >= block.timestamp, 'EXPIRED');
        bytes32 digest = keccak256(
            abi.encodePacked(
                '\x19\x01',
                DOMAIN_SEPARATOR,
                keccak256(abi.encode(PERMIT_TYPEHASH, _sender, _recipient, _amount, nonces[_sender]++, _deadline))
            )
        );
        address recoveredAddress = ecrecover(digest, _v, _r, _s);
        require(recoveredAddress != address(0) && recoveredAddress == _sender, 'INVALID_SIGNATURE');
        _transfer(_sender, _recipient, _amount);
    }

    ///////////////////////////////////////////////////
    //       function for INRC6                      //
    ///////////////////////////////////////////////////
 
    /**
     * NOTE: token MinUnit， 1 token = 10**decimals MinUnit
     */
    function balanceOf(address _account) public view override returns (uint256) {
        return balances[_account];
    }

    /**
     * @dev See {INRC6-transfer}.
     *
     * Requirements:
     *
     * - `recipient` cannot be the zero address.
     * - the caller must have a balance of at least `amount`.
     */
    function transfer(address _recipient, uint256 _amount) public override returns (bool) {
        _transfer(msg.sender, _recipient, _amount);
        return true;
    }

    /**
     * @dev See {INRC6-allowance}.
     */
    function allowance(address _owner, address _spender) public view override returns (uint256) {
        return allowances[_owner][_spender];
    }

    /**
     * @dev See {INRC6-approve}.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     */
    function approve(address _spender, uint256 _amount) public override returns (bool) {
        _approve(msg.sender, _spender, _amount);
        return true;
    }

    /**
     * @dev See {INRC6-transferFrom}.
     *
     * Emits an {Approval} event indicating the updated allowance. This is not
     * required by the EIP. See the note at the beginning of {NRC6};
     *
     * Requirements:
     * - `sender` and `recipient` cannot be the zero address.
     * - `sender` must have a balance of at least `amount`.
     * - the caller must have allowance for ``sender``'s tokens of at least
     * `amount`.
     */
    function transferFrom(address _sender, address _recipient, uint256 _amount) public override returns (bool) {
        _approve(_sender, msg.sender, allowances[_sender][msg.sender].sub(_amount));
        _transfer(_sender, _recipient, _amount);
        return true;
    }

    /**
     * @dev Moves tokens `amount` from `sender` to `recipient`.
     *
     * This is internal function is equivalent to {transfer}, and can be used to
     * e.g. implement automatic token fees, slashing mechanisms, etc.
     *
     * Emits a {Transfer} event.
     *
     * Requirements:
     *
     * - `sender` cannot be the zero address.
     * - `recipient` cannot be the zero address.
     * - `sender` must have a balance of at least `amount`.
     */
    function _transfer(address _sender, address _recipient, uint256 _amount) internal isRunning {
        require(_sender != address(0), "transfer from the zero address");
        require(_recipient != address(0), "transfer to the zero address");
        require(!isBlackListed[_sender], "transfer from the BlackList");

        balances[_sender] = balances[_sender].sub(_amount);
        balances[_recipient] = balances[_recipient].add(_amount);
        emit Transfer(_sender, _recipient, _amount);
    }

    /**
     * @dev Sets `amount` as the allowance of `spender` over the `owner`s tokens.
     *
     * This is internal function is equivalent to `approve`, and can be used to
     * e.g. set automatic allowances for certain subsystems, etc.
     *
     * Emits an {Approval} event.
     *
     * Requirements:
     *
     * - `owner` cannot be the zero address.
     * - `spender` cannot be the zero address.
     */
    function _approve(address _owner, address _spender, uint256 _amount) internal {
        require(_owner != address(0), "approve from the zero address");
        require(_spender != address(0), "approve to the zero address");

        allowances[_owner][_spender] = _amount;
        emit Approval(_owner, _spender, _amount);
    }

}
