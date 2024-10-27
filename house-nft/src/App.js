import React, { useState, useEffect } from 'react';
import { web3, houseNFTContract } from './web3';

function App() {
    const [account, setAccount] = useState(null);
    const [platformOwner, setPlatformOwner] = useState(null);
    const [tokenId, setTokenId] = useState('');
    const [price, setPrice] = useState('');
    const [listedHouses, setListedHouses] = useState([]);
    const [ownedHouses, setOwnedHouses] = useState([]);
    const [balance, setBalance] = useState('');

    useEffect(() => {
        loadAccountAndOwner();

        // 监听 MetaMask 账户变化
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', () => {
                loadAccountAndOwner(); // 重新加载账户和数据
            });
            window.ethereum.on('chainChanged', () => {
                window.location.reload(); // 切换网络时刷新页面
            });
        }

        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', loadAccountAndOwner);
                window.ethereum.removeListener('chainChanged', () => window.location.reload());
            }
        };
    }, []);

    const loadAccountAndOwner = async () => {
        try {
            const accounts = await web3.eth.getAccounts();
            if (accounts.length > 0) {
                setAccount(accounts[0]);

                const owner = await houseNFTContract.methods.platformOwner().call();
                setPlatformOwner(owner);

                const balanceInWei = await web3.eth.getBalance(accounts[0]);
                setBalance(web3.utils.fromWei(balanceInWei, 'ether'));

                await loadOwnedHouses(accounts[0]);
                await loadListedHouses();
            } else {
                setAccount(null);
            }
        } catch (error) {
            console.error("Failed to load data:", error);
        }
    };

    // 断开连接功能，清空账户状态并移除 MetaMask 连接
    const disconnect = () => {
        setAccount(null);
        setBalance('');
        setOwnedHouses([]);
        setListedHouses([]);
        window.ethereum.request({
            method: 'wallet_requestPermissions',
            params: [{ eth_accounts: {} }]
        });
    };

    // 重新连接功能，触发 MetaMask 账户连接窗口
    const reconnect = async () => {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            if (accounts.length > 0) {
                setAccount(accounts[0]);
                await loadAccountAndOwner();
            }
        } catch (error) {
            console.error("连接 MetaMask 失败:", error);
        }
    };

  // 获取用户所拥有的房屋列表
  const loadOwnedHouses = async (userAddress) => {
      try {
          const houseIds = await houseNFTContract.methods.getHousesByOwner(userAddress).call();
          const normalizedHouseIds = houseIds.map(id => id.toString());
          setOwnedHouses(normalizedHouseIds);
      } catch (error) {
          console.error("加载用户房屋列表失败：", error);
      }
  };

  // 加载房屋的挂单列表
  const loadListedHouses = async () => {
      try {
          const { 0: ids, 1: prices, 2: sellers } = await houseNFTContract.methods.getAllListings().call();
          const houses = ids.map((id, index) => ({
              id: id.toString(),
              price: web3.utils.fromWei(prices[index], 'ether'),
              seller: sellers[index],
          }));
          setListedHouses(houses);
      } catch (error) {
          console.error("加载挂单列表失败：", error);
      }
  };

    const mintHouse = async () => {
        if (account) {
            try {
                await houseNFTContract.methods.mintHouse(account).send({ from: account });
                alert('成功铸造一栋房屋！');
                await loadOwnedHouses(account);
            } catch (error) {
                console.error("铸造失败：", error);
            }
        } else {
            alert('请连接账户');
        }
    };

    const listHouseForSale = async () => {
        try {
            await houseNFTContract.methods.listHouse(tokenId, web3.utils.toWei(price, 'ether')).send({ from: account });
            alert('房屋挂单成功');
            await loadListedHouses();
        } catch (error) {
            console.error("挂单失败：", error);
        }
    };

    // 添加购买房屋功能
    const buyHouse = async (houseId, housePrice) => {
        try {
            await houseNFTContract.methods.buyHouse(houseId).send({
                from: account,
                value: web3.utils.toWei(housePrice, 'ether'), // 使用传入的 housePrice
            });
            alert('房屋购买成功！');
            await loadListedHouses();
            await loadOwnedHouses(account);
        } catch (error) {
            console.error("购买失败：", error);
        }
    };

    const delistHouse = async (houseId) => {
        try {
            await houseNFTContract.methods.delistHouse(houseId).send({ from: account });
            alert('成功撤销房屋挂单！');
            await loadListedHouses();
        } catch (error) {
            console.error("撤销失败：", error);
        }
    };

    return (
      <div>
          <h1>去中心化房屋市场</h1>
          <p>连接的账户: {account || "未连接"}</p>
          <p>平台拥有者: {platformOwner}</p>
          <p>当前账户余额: {balance} ETH</p>

          <button onClick={disconnect}>退出</button>
           <button onClick={reconnect}>重新连接</button>

          <h2>铸造新房屋-只有平台拥有者可以铸造</h2>
          <button onClick={mintHouse}>铸造房屋</button>

          <h2>挂单出售房屋</h2>
          <input
              type="number"
              placeholder="房屋ID"
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
          />
          <input
              type="number"
              placeholder="价格 (ETH)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
          />
          <button onClick={listHouseForSale}>挂单出售</button>

          <h2>出售中的房屋列表</h2>
          <ul>
              {listedHouses.map((house) => (
                  <li key={house.id}>
                      房屋 ID: {house.id}, 价格: {house.price} ETH, 卖家: {house.seller}
                      {house.seller !== account && (
                          <button onClick={() => buyHouse(house.id, house.price)}>购买</button>
                      )}
                      {house.seller === account && (
                          <button onClick={() => delistHouse(house.id)}>撤销卖单</button>
                      )}
                  </li>
              ))}
          </ul>

          <h2>我的房屋列表</h2>
          <ul>
              {ownedHouses.map((houseId) => (
                  <li key={houseId}>房屋 ID: {houseId}</li>
              ))}
          </ul>
      </div>
  );
}

export default App;