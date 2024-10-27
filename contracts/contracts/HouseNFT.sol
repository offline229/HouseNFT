// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract HouseNFT is ERC721 {
    uint256 private _tokenIdCounter; // 用于生成NFT的唯一ID（替代 Counters 合约）

    address public platformOwner; // 平台的拥有者，收取交易手续费
    uint256 public platformFeeRate = 5; // 手续费比例，百分比表示 (5%)

    // 房屋的挂单信息结构体
    struct Listing {
        uint256 price;      // 房屋挂单价格
        address seller;     // 出售房屋的卖家
        uint256 timestamp;  // 挂单时间
        bool isForSale;     // 是否正在出售
    }

    // tokenID 映射到挂单信息
    mapping(uint256 => Listing) public listings;

    // 构造函数，设置合约名称和符号，初始化平台拥有者为第一个账户
    constructor() ERC721("HouseNFT", "HNFT") {
        platformOwner = msg.sender;
    }

    // 铸造新的房屋NFT，只有平台拥有者可以调用
    function mintHouse(address recipient) external {
        require(msg.sender == platformOwner, "Only platform owner can mint");
        
        uint256 tokenId = _tokenIdCounter; // 获取counter作为tokenId
        _mint(recipient, tokenId);          // 铸造新NFT
        _tokenIdCounter += 1;               
    }

    // 房屋挂单函数，允许房屋拥有者挂单出售房屋
    function listHouse(uint256 tokenId, uint256 price) external {
        require(ownerOf(tokenId) == msg.sender, "Only the owner can list the house");
        require(!listings[tokenId].isForSale, "House is already listed for sale"); // 检查是否已经挂单

        listings[tokenId] = Listing(price, msg.sender, block.timestamp, true);
    }

    // 撤销房屋挂单，只有卖家可以撤销
    function delistHouse(uint256 tokenId) external {
        require(listings[tokenId].seller == msg.sender, "Only the seller can delist the house");
        listings[tokenId].isForSale = false;
    }

    // 购买房屋函数，买家支付挂单价格，房屋所有权转移，同时扣除手续费，转入平台拥有者
    function buyHouse(uint256 tokenId) external payable {
        Listing memory listing = listings[tokenId];
        require(listing.isForSale, "House is not for sale");
        require(msg.value >= listing.price, "Insufficient funds to buy the house");

        // 计算平台手续费
        uint256 timeListed = block.timestamp - listing.timestamp;
        uint256 fee = (timeListed * platformFeeRate * listing.price) / 100 / (1 days);

        // 将房屋转给买家
        address seller = listing.seller;
        _transfer(seller, msg.sender, tokenId);

        // 支付卖家（扣除手续费后）
        uint256 sellerPayment = listing.price - fee;
        payable(seller).transfer(sellerPayment);

        // 手续费转给平台拥有者
        payable(platformOwner).transfer(fee);

        // 更新挂单状态
        listings[tokenId].isForSale = false;
    }

    // 获取用户所拥有的房屋列表
    function getHousesByOwner(address owner) external view returns (uint256[] memory) {
        uint256 count = balanceOf(owner);
        uint256[] memory tokens = new uint256[](count);
        uint256 index = 0;

        for (uint256 i = 0; i < _tokenIdCounter; i++) {
            if (ownerOf(i) == owner) {
                tokens[index] = i;
                index++;
            }
        }
        return tokens;
    }

    // 查询所有正在出售的房屋信息
    function getAllListings() external view returns (uint256[] memory, uint256[] memory, address[] memory) {
        uint256 total = _tokenIdCounter;
        uint256 count = 0;

        // 统计正在出售的房屋数量
        for (uint256 i = 0; i < total; i++) {
            if (listings[i].isForSale) {
                count++;
            }
        }

        uint256[] memory tokenIds = new uint256[](count);
        uint256[] memory prices = new uint256[](count);
        address[] memory sellers = new address[](count);
        uint256 index = 0;

        for (uint256 i = 0; i < total; i++) {
            if (listings[i].isForSale) {
                tokenIds[index] = i;
                prices[index] = listings[i].price;
                sellers[index] = listings[i].seller;
                index++;
            }
        }

        return (tokenIds, prices, sellers);
    }

    // 查询单栋房产的拥有者
    function getHouseOwner(uint256 tokenId) external view returns (address) {
        return ownerOf(tokenId);
    }

    // 更新平台手续费比例（仅平台拥有者可调用），后台测试用了一下
    function setPlatformFeeRate(uint256 newRate) external {
        require(msg.sender == platformOwner, "Only platform owner can set fee rate");
        platformFeeRate = newRate;
    }
}
