import { Chef, PairType } from '../../features/onsen/enum'
import { useActiveWeb3React, useFuse } from '../../hooks'
import {
  useAverageBlockTime,
  useEthPrice,
  useFarmPairAddresses,
  useFarms,
  useMasterChefV1SushiPerBlock,
  useMasterChefV1TotalAllocPoint,
  useSushiPairs,
  useSushiPrice,
} from '../../services/graph'

import { BigNumber } from '@ethersproject/bignumber'
import { ChainId, WNATIVE, Token, WBCH, MASTERCHEF_ADDRESS } from '@fogofwar/sdk'
import { FOG, FLEXUSD } from '../../config/tokens'
import Container from '../../components/Container'
import FarmList from '../../features/onsen/FarmList'
import Head from 'next/head'
import Image from 'next/image'
import Menu from '../../features/onsen/FarmMenu'
import React, { useEffect } from 'react'
import Search from '../../components/Search'
import { classNames } from '../../functions'
import dynamic from 'next/dynamic'
import { getAddress } from '@ethersproject/address'
import useFarmRewards from '../../hooks/useFarmRewards'
import usePool from '../../hooks/usePool'
import { useTokenBalancesWithLoadingIndicator } from '../../state/wallet/hooks'
import { usePositions, usePendingFOG } from '../../features/onsen/hooks'
import { useRouter } from 'next/router'
import { updateUserFarmFilter } from '../../state/user/actions'
import { getFarmFilter, useUpdateFarmFilter } from '../../state/user/hooks'
import { useWeb3React } from '@web3-react/core'
import Web3Connect from '../../components/Web3Connect'
import Web3Network from '../../components/Web3Network'
import { EtherscanProvider } from '@ethersproject/providers'
import Web3Status from '../../components/Web3Status'

export default function Farm(): JSX.Element {
  const { chainId } = useActiveWeb3React()
  const router = useRouter()

  const type = router.query.filter as string

  const savedFilter = getFarmFilter()

  if (!type && savedFilter) {
    router.push(`/farm?filter=${savedFilter}`)
  }

  const updateFarmFilter = useUpdateFarmFilter()
  updateFarmFilter(type)

  const hardcodedPairs = {
    [ChainId.SMARTBCH]: {
      '0x674A71E69fe8D5cCff6fdcF9F1Fa4262Aa14b154': {
        farmId: 7,
        allocPoint: 100000,
        mistallocPoint: 0,
        token0: FOG[ChainId.SMARTBCH],
        token1: WBCH[ChainId.SMARTBCH],
      },
      '0x437E444365aD9ed788e8f255c908bceAd5AEA645': {
        farmId: 8,
        allocPoint: 100000,
        mistallocPoint: 0,
        token0: FOG[ChainId.SMARTBCH],
        token1: FLEXUSD,
      },
      '0xEA5038043364830c489D7fd8F95eFE35eaE6f4Ff': {
        farmId: 0,
        allocPoint: 100000,
        mistallocPoint: 8511556,
        token0: new Token(
          ChainId.SMARTBCH,
          '0x2b591190FF951F60CB9424664155e57A402c1AdE',
          18,
          '🌙🌙🌙🌙',
          'MoonMoonMoonMoon'
        ),
        token1: WBCH[ChainId.SMARTBCH],
      },
      '0x24f011f12Ea45AfaDb1D4245bA15dCAB38B43D13': {
        farmId: 1,
        allocPoint: 100000,
        mistallocPoint: 243043661,
        token0: FLEXUSD,
        token1: WBCH[ChainId.SMARTBCH],
      },
      '0x4fF52e9D7824EC9b4e0189F11B5aA0F02b459b03': {
        farmId: 2,
        allocPoint: 100000,
        mistallocPoint: 14875963,
        token0: new Token(ChainId.SMARTBCH, '0x98Dd7eC28FB43b3C4c770AE532417015fa939Dd3', 18, 'FLEX', 'FLEX Coin'),
        token1: FLEXUSD,
      },
      '0xc47B0B4B51EE06De0daF02517D78f0473B776633': {
        farmId: 9,
        allocPoint: 100000,
        mistallocPoint: 77570410,
        token0: new Token(ChainId.SMARTBCH, '0x265bD28d79400D55a1665707Fa14A72978FA6043', 2, 'CATS', 'CashCats'),
        token1: WBCH[ChainId.SMARTBCH],
      },
    },
    [ChainId.SMARTBCH_AMBER]: {
      '0x07DE6fc05597E0E4c92C83637A8a0CA411f3a769': {
        farmId: 666,
        allocPoint: 0,
        token0: WBCH[ChainId.SMARTBCH_AMBER],
        token1: new Token(ChainId.SMARTBCH_AMBER, '0xC6F80cF669Ab9e4BE07B78032b4821ed5612A9ce', 18, 'sc', 'testcoin2'),
      },
    },
  }

  const kashiPairs = [] // unused
  const swapPairs = []
  let farms = []

  for (const [pairAddress, pair] of Object.entries(hardcodedPairs[chainId])) {
    swapPairs.push({
      id: pairAddress,
      reserveUSD: '100000',
      totalSupply: '1000',
      timestamp: '1599830986',
      token0: {
        id: pair.token0.address,
        name: pair.token0.name,
        symbol: pair.token0.symbol,
        decimals: pair.token0.decimals,
      },
      token1: {
        id: pair.token1.address,
        name: pair.token1.name,
        symbol: pair.token1.symbol,
        decimals: pair.token1.decimals,
      },
    })

    const f = {
      pair: pairAddress,
      symbol: `${hardcodedPairs[chainId][pairAddress].token0.symbol}-${hardcodedPairs[chainId][pairAddress].token1.symbol}`,
      // eslint-disable-next-line react-hooks/rules-of-hooks
      pool: usePool(pairAddress),
      allocPoint: pair.allocPoint,
      mistallocPoint: pair.mistallocPoint,
      balance: '1000000000000000000',
      chef: 0,
      id: pair.farmId,
      pendingSushi: undefined,
      pending: 0,
      owner: {
        id: MASTERCHEF_ADDRESS[chainId],
        sushiPerBlock: '100000000000000000000',
        totalAllocPoint: '999949643',
      },
      userCount: 1,
    }
    // eslint-disable-next-line react-hooks/rules-of-hooks
    f.pendingSushi = usePendingFOG(f)
    f.pending = Number.parseFloat(f.pendingSushi?.toFixed())

    farms.push(f)
  }

  farms = farms.sort((a, b) => b.allocPoint - a.allocPoint)

  const flexUSDMISTPool = farms.find((v) => v.pair === '0x437E444365aD9ed788e8f255c908bceAd5AEA645').pool
  const flexUSDFOGPool = farms.find((v) => v.pair === '0x437E444365aD9ed788e8f255c908bceAd5AEA645').pool
  const bchFlexUSDPool = farms.find((v) => v.pair === '0x24f011f12Ea45AfaDb1D4245bA15dCAB38B43D13').pool
  let bchPriceUSD = 0
  let MISTPriceUSD = 0
  let FOGPriceUSD = 0

  if (bchFlexUSDPool.reserves) {
    bchPriceUSD =
      Number.parseFloat(bchFlexUSDPool.reserves[1].toFixed()) / Number.parseFloat(bchFlexUSDPool.reserves[0].toFixed())
  }
  if (flexUSDMISTPool.reserves) {
    MISTPriceUSD =
      1 /
      (Number.parseFloat(flexUSDMISTPool.reserves[0].toFixed()) /
        Number.parseFloat(flexUSDMISTPool.reserves[1].toFixed()))
  }
  if (flexUSDFOGPool.reserves) {
    FOGPriceUSD =
      1 /
      (Number.parseFloat(flexUSDFOGPool.reserves[0].toFixed()) /
        Number.parseFloat(flexUSDFOGPool.reserves[1].toFixed()))
  }

  const [v2PairsBalances, fetchingV2PairBalances] = useTokenBalancesWithLoadingIndicator(
    MASTERCHEF_ADDRESS[chainId],
    farms.map((farm) => new Token(chainId, farm.pair, 18, 'LP', 'LP Token'))
  )

  if (!fetchingV2PairBalances) {
    for (let i = 0; i < farms.length; ++i) {
      if (v2PairsBalances.hasOwnProperty(farms[i].pair) && farms[i].pool.totalSupply) {
        const totalSupply = Number.parseFloat(farms[i].pool.totalSupply.toFixed())
        const chefBalance = Number.parseFloat(v2PairsBalances[farms[i].pair].toFixed())

        let tvl = 0
        if (farms[i].pool.token0 === FOG[chainId].address) {
          const reserve = Number.parseFloat(farms[i].pool.reserves[0].toFixed())
          tvl = (reserve / totalSupply) * chefBalance * FOGPriceUSD * 2
        } else if (farms[i].pool.token1 === FOG[chainId].address) {
          const reserve = Number.parseFloat(farms[i].pool.reserves[1].toFixed())
          tvl = (reserve / totalSupply) * chefBalance * FOGPriceUSD * 2
        } else if (farms[i].pool.token0 === FLEXUSD.address) {
          const reserve = Number.parseFloat(farms[i].pool.reserves[0].toFixed())
          tvl = (reserve / totalSupply) * chefBalance * 2
        } else if (farms[i].pool.token1 === FLEXUSD.address) {
          const reserve = Number.parseFloat(farms[i].pool.reserves[1].toFixed())
          tvl = (reserve / totalSupply) * chefBalance * 2
        } else if (farms[i].pool.token0 === WBCH[chainId].address) {
          const reserve = Number.parseFloat(farms[i].pool.reserves[0].toFixed())
          tvl = (reserve / totalSupply) * chefBalance * bchPriceUSD * 2
        } else if (farms[i].pool.token1 === WBCH[chainId].address) {
          const reserve = Number.parseFloat(farms[i].pool.reserves[1].toFixed())
          tvl = (reserve / totalSupply) * chefBalance * bchPriceUSD * 2
        }
        farms[i].tvl = tvl
        farms[i].chefBalance = chefBalance
      } else {
        farms[i].tvl = '0'
        farms[i].chefBalance = 0
      }
    }
  }

  const positions = usePositions(chainId)

  // const averageBlockTime = useAverageBlockTime()
  const averageBlockTime = 6

  // const masterChefV1TotalAllocPoint = useMasterChefV1TotalAllocPoint()

  const masterChefV1SushiPerBlock = useMasterChefV1SushiPerBlock()

  const blocksPerDay = 86400 / Number(averageBlockTime)

  const map = (pool) => {
    // TODO: Account for fees generated in case of swap pairs, and use standard compounding
    // algorithm with the same intervals acrosss chains to account for consistency.
    // For lending pairs, what should the equivilent for fees generated? Interest gained?
    // How can we include this?

    // TODO: Deal with inconsistencies between properties on subgraph
    pool.owner = pool?.owner || pool?.masterChef
    pool.balance = pool?.balance || pool?.slpBalance

    const swapPair = swapPairs?.find((pair) => pair.id === pool.pair)
    const kashiPair = kashiPairs?.find((pair) => pair.id === pool.pair)

    const type = swapPair ? PairType.SWAP : PairType.KASHI

    const pair = swapPair || kashiPair

    const blocksPerDay = 15684 // calculated empirically

    function getRewards() {
      // TODO: Some subgraphs give sushiPerBlock & sushiPerSecond, and mcv2 gives nothing
      const sushiPerBlock =
        pool?.owner?.sushiPerBlock / 1e18 ||
        (pool?.owner?.sushiPerSecond / 1e18) * averageBlockTime ||
        masterChefV1SushiPerBlock

      const rewardPerBlock = (pool.allocPoint / pool.owner.totalAllocPoint) * sushiPerBlock
      const mistrewardPerBlock = (pool.mistallocPoint / pool.owner.totalAllocPoint) * sushiPerBlock

      const defaultReward = {
        token: 'FOG',
        icon: 'https://raw.githubusercontent.com/SayoshiNakamario/assets/master/blockchains/smartbch/assets/0xd6589e311D297604884B47c93a93bc05dbfc1Ef7/logo.png',
        rewardPerBlock,
        rewardPerDay: rewardPerBlock * blocksPerDay,
        rewardPrice: +MISTPriceUSD,
        misttoken: 'MIST',
        misticon:
          'https://raw.githubusercontent.com/SayoshiNakamario/assets/master/blockchains/smartbch/assets/0x5fA664f69c2A4A3ec94FaC3cBf7049BD9CA73129/logo.png',
        mistrewardPerBlock,
        mistrewardPerDay: mistrewardPerBlock * blocksPerDay,
        mistrewardPrice: +MISTPriceUSD,
      }

      const defaultRewards = [defaultReward]

      return defaultRewards
    }

    const rewards = getRewards()

    const balance = Number(pool.balance / 1e18)

    const roiPerBlock =
      rewards.reduce((previousValue, currentValue) => {
        return previousValue + currentValue.rewardPerBlock * currentValue.rewardPrice
      }, 0) / pool.tvl

    const mistroiPerBlock =
      rewards.reduce((previousValue, currentValue) => {
        return previousValue + currentValue.mistrewardPerBlock * currentValue.mistrewardPrice
      }, 0) / pool.tvl

    const roiPerDay = roiPerBlock * blocksPerDay + mistroiPerBlock * blocksPerDay

    const roiPerYear = roiPerDay * 365

    const position = positions.find((position) => position.id === pool.id && position.chef === pool.chef)

    return {
      ...pool,
      ...position,
      pair: {
        ...pair,
        decimals: pair.type === PairType.KASHI ? Number(pair.asset.tokenInfo.decimals) : 18,
        type,
      },
      balance,
      roiPerYear,
      rewards,
    }
  }

  const FILTER = {
    all: (farm) => farm.allocPoint !== 0,
    portfolio: (farm) => farm.pending !== 0,
    past: (farm) => farm.allocPoint === 0,
    // sushi: (farm) => farm.pair.type === PairType.SWAP && farm.allocPoint !== '0',
    // kashi: (farm) => farm.pair.type === PairType.KASHI && farm.allocPoint !== '0',
    // '2x': (farm) => (farm.chef === Chef.MASTERCHEF_V2) && farm.allocPoint !== '0',
  }

  const data = farms
    .filter((farm) => {
      return (
        (swapPairs && swapPairs.find((pair) => pair.id === farm.pair)) ||
        (kashiPairs && kashiPairs.find((pair) => pair.id === farm.pair))
      )
    })
    .map(map)
    .filter((farm) => {
      return type in FILTER ? FILTER[type](farm) : true
    })

  const options = {
    keys: ['pair.id', 'pair.token0.symbol', 'pair.token1.symbol'],
    threshold: 0.4,
  }

  const { result, term, search } = useFuse({
    data,
    options,
  })

  return (
    <Container
      id="farm-page"
      className="h-full py-4 mx-auto lg:grid lg:grid-cols-4 md:py-8 lg:py-12 gap-9"
      maxWidth="7xl"
    >
      <Head>
        <title>Farm | FOG</title>
        <meta key="description" name="description" content="Farm FOG" />
      </Head>
      <div className={classNames('px-3 md:px-0 lg:block md:col-span-1')}>
        <Menu positionsLength={positions.length} />
        <div className="relative hidden h-80 lg:block">
          <Image layout="fill" objectFit="contain" objectPosition="bottom" src="/mist-machine.png" alt="" />
        </div>
      </div>
      <div className={classNames('space-y-6 col-span-4 lg:col-span-3')}>
        <Search
          search={search}
          term={term}
          className={classNames('px-3 md:px-0 ')}
          inputProps={{
            className:
              'relative w-full bg-transparent border border-transparent focus:border-gradient-r-blue-pink-dark-900 rounded placeholder-secondary focus:placeholder-primary font-bold text-base px-6 py-3.5',
          }}
        />

        <div className="flex items-center hidden text-lg font-bold md:block text-high-emphesis whitespace-nowrap">
          Farms{' '}
          <div className="w-full h-0 ml-4 font-bold bg-transparent border border-b-0 border-transparent rounded text-high-emphesis md:border-gradient-r-blue-pink-dark-800 opacity-20"></div>
        </div>

        <FarmList farms={result} term={term} />
      </div>
    </Container>
  )
}
