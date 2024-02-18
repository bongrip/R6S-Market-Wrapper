const unirest = require('unirest');
const config = require('./config.json');

async function getRequestHeaders() {
  try {
    const authTicket = await performLoginForAuthTicket(config["r6s-market"]["email"], config["r6s-market"]["password"]);
    return {
      "authority": "public-ubiservices.ubi.com",
      "accept": "*/*",
      "accept-language": "en-US,en;q=0.9",
      "apollographql-client-version": "1.5.0",
      "authorization": `ubi_v1 t=${authTicket}`,
      "content-type": "application/json",
      "origin": "https://overlay.cdn.ubisoft.com",
      "sec-ch-ua": "^\\^Not_A",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "^\\^Windows^^",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
      "ubi-appid": "80a4a0e8-8797-440f-8f4c-eaba87d0fdda",
      "ubi-localecode": "en-US",
      "ubi-profileid": "49cca1b8-1f27-4785-b5be-8417ac78da79",
      "ubi-regionid": "WW",
      "ubi-sessionid": "7a1dc93a-217e-4d3e-8e9c-129587a5b324",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0"
    };
  } catch (error) {
    console.error('(r6s-market-wrapper.js) failed to get auth-ticket:', error);
    return {};
  }
}

function getGraphQLQuery(weapon, skinName) {
    return `
      query GetMarketableItems($spaceId: String!, $limit: Int!, $offset: Int, $filterBy: MarketableItemFilter, $withOwnership: Boolean = true, $sortBy: MarketableItemSort) {
        game(spaceId: $spaceId) {
          id
          marketableItems(
            limit: $limit
            offset: $offset
            filterBy: $filterBy
            sortBy: $sortBy
            withMarketData: true
          ) {
            nodes {
              ...MarketableItemFragment
              __typename
            }
            totalCount
            __typename
          }
          __typename
        }
      }
  
      fragment MarketableItemFragment on MarketableItem {
        item {
          ...SecondaryStoreItemFragment
          ...SecondaryStoreItemOwnershipFragment @include(if: $withOwnership)
          __typename
        }
        marketData {
          ...MarketDataFragment
          __typename
        }
        viewer {
          meta {
            id
            activeTrade {
              ...TradeFragment
              __typename
            }
            __typename
          }
          __typename
        }
        __typename
      }
  
      fragment SecondaryStoreItemFragment on SecondaryStoreItem {
        id
        assetUrl
        itemId
        name
        tags
        type
        viewer {
          meta {
            id
            isReserved
            __typename
          }
          __typename
        }
        __typename
      }
  
      fragment SecondaryStoreItemOwnershipFragment on SecondaryStoreItem {
        viewer {
          meta {
            id
            isOwned
            quantity
            __typename
          }
          __typename
        }
        __typename
      }
  
      fragment MarketDataFragment on MarketableItemMarketData {
        id
        sellStats {
          id
          paymentItemId
          lowestPrice
          highestPrice
          activeCount
          __typename
        }
        buyStats {
          id
          paymentItemId
          lowestPrice
          highestPrice
          activeCount
          __typename
        }
        lastSoldAt {
          id
          paymentItemId
          price
          performedAt
          __typename
        }
        __typename
      }
  
      fragment TradeFragment on Trade {
        id
        tradeId
        state
        category
        createdAt
        expiresAt
        lastModifiedAt
        failures
        tradeItems {
          id
          item {
            ...SecondaryStoreItemFragment
            ...SecondaryStoreItemOwnershipFragment
            __typename
          }
          __typename
        }
        payment {
          id
          item {
            ...SecondaryStoreItemQuantityFragment
            __typename
          }
          price
          transactionFee
          __typename
        }
        paymentOptions {
          id
          item {
            ...SecondaryStoreItemQuantityFragment
            __typename
          }
          price
          transactionFee
          __typename
        }
        paymentProposal {
          id
          item {
            ...SecondaryStoreItemQuantityFragment
            __typename
          }
          price
          __typename
        }
        viewer {
          meta {
            id
            tradesLimitations {
              ...TradesLimitationsFragment
              __typename
            }
            __typename
          }
          __typename
        }
        __typename
      }
  
      fragment SecondaryStoreItemQuantityFragment on SecondaryStoreItem {
        viewer {
          meta {
            id
            quantity
            __typename
          }
          __typename
        }
        __typename
      }
  
      fragment TradesLimitationsFragment on UserGameTradesLimitations {
        id
        buy {
          resolvedTransactionCount
          resolvedTransactionPeriodInMinutes
          activeTransactionCount
          __typename
        }
        sell {
          resolvedTransactionCount
          resolvedTransactionPeriodInMinutes
          activeTransactionCount
          resaleLocks {
            itemId
            expiresAt
            __typename
          }
          __typename
        }
        __typename
      }
    `;
  }

async function getSkinForSpecificWeaponType(weapon, skinName) {
  const graphqlQuery = getGraphQLQuery(weapon, skinName);

  try {
    const headers = await getRequestHeaders();
    const response = await unirest.post("https://public-ubiservices.ubi.com/v1/profiles/me/uplay/graphql")
      .headers(headers)
      .type("json")
      .send({
        "operationName": "GetMarketableItems",
        "variables": {
          "withOwnership": true,
          "spaceId": "0d2ae42d-4c27-4cb7-af6c-2099062302bb",
          "limit": 50,
          "offset": 0,
          "filterBy": {
            "types": ["WeaponSkin"],
            "tags": [weapon],
            "text": skinName
          },
          "sortBy": {
            "field": "ACTIVE_COUNT",
            "orderType": "Sell",
            "direction": "DESC",
            "paymentItemId": "9ef71262-515b-46e8-b9a8-b6b6ad456c67"
          }
        },
        "query": graphqlQuery
      });

    if (response.error) {
      throw new Error(response.error);
    }

    return response.body;
  } catch (error) {
    console.error('(r6s-market-wrapper.js) failed to get skin for specific weapon type:', error);
    throw error;
  }
}

async function performLoginForAuthTicket(username, password) {
  try {
    const response = await unirest.post("https://public-ubiservices.ubi.com/v3/profiles/sessions")
      .headers({
        "Content-Type": "application/json",
        "Authorization": "Basic "+ Buffer.from(username + ":" + password).toString('base64'),
        "Ubi-AppId": "685a3038-2b04-47ee-9c5a-6403381a46aa"
      })
      .type("json")
      .send({
        "rememberMe": true
      });

    if (response.error) {
      throw new Error(response.error);
    }

    return response.body.ticket;
  } catch (error) {
    console.error('(r6s-market-wrapper.js) failed to perform login for auth ticket:', error);
    throw error;
  }
}

module.exports = { 
  getSkinForSpecificWeaponType
};
