# R6S Market Wrapper

## Introduction
R6S Market Wrapper is a NodeJS library designed to facilitate interaction with the Rainbow Six Siege marketplace. It allows users to retrieve data about posted skins, listings, and more, making it easier to analyze market trends and make informed decisions.

## Features
- Retrieve data about posted skins in the Rainbow Six Siege marketplace.
- Get information about listings such as price, seller, and item details.
- Filter and sort listings based on various criteria.
- Integrate market data into your own applications or scripts.

## Installation
You can install the R6S Market wrapper by dragging in into your project files, and including it,
Example useage:

```bash
  const r6swrapper = require('../wrappers/r6s-market/r6sMarketWrapper');
  try {
    const skinData = await r6swrapper.getSkinForSpecificWeaponType(weaponType.toUpperCase(), skinName.toUpperCase());

    const marketData = skinData?.data?.game?.marketableItems?.nodes[0]?.marketData;

    if (!marketData || !marketData.sellStats || marketData.sellStats.length === 0) {
      return message.channel.send(`:x: No market data available for ${weaponType}, ${skinName}`);
    }

    const sellStatsArray = marketData.sellStats;
    const sellStats = sellStatsArray[0] || { lowestPrice: 0, highestPrice: 0, activeCount: 0 };
    
    const buyStatsArray = marketData.buyStats || [];
    const buyStats = buyStatsArray[0] || { activeCount: 0 };

    const lowestPrice = sellStats.lowestPrice;
    const highestPrice = sellStats.highestPrice;

    const formattedLowestPrice = (lowestPrice / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
    const formattedHighestPrice = (highestPrice / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
```
