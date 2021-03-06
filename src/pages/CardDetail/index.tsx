import React, { useCallback, useMemo, useState } from 'react'
import { CurrencyAmount, JSBI, TokenAmount } from '@uniswap/sdk'
import { useWeb3React } from '@web3-react/core'
import { RouteComponentProps, useHistory } from 'react-router-dom'
import styled from 'styled-components'
import BigNumber from 'bignumber.js'
import { ButtonBlack, ButtonEmpty, ButtonWhite } from 'components/Button'
import { RowBetween, RowFixed } from 'components/Row'
import { StyledTabItem, StyledTabs } from 'components/Tabs'
import { AnimatedImg, AnimatedWrapper, HideMedium, HideSmall, TYPE } from 'theme'
import { ReactComponent as ArrowLeftCircle } from 'assets/svg/arrow_left_circle.svg'
import useTheme from 'hooks/useTheme'
import { Hr, Paragraph } from './Paragraph'
import NFTCard, { CardColor, NFTCardProps } from 'components/NFTCard'
import { AutoColumn, ColumnCenter } from 'components/Column'
import {
  NFTCreatorInfo,
  NFTIndexInfoProps,
  useAssetsTokens,
  useNFTBalance,
  useNFTCreatorInfo,
  useNFTIndexInfo,
  useNFTTransactionRecords
} from 'hooks/useIndexDetail'
import NumericalInput from 'components/NumericalInput'
import Loader from 'assets/svg/antimatter_background_logo.svg'
import AntimatterLogo from 'assets/svg/antimatter_logo_nft.svg'
import { WrappedTokenInfo } from 'state/lists/hooks'
import { useAmountInMins, useCalcBuyFee, useIndexBuyCall } from '../../hooks/useIndexBuyCallback'
import TransactionConfirmationModal from 'components/TransactionConfirmationModal'
import { CurrencyNFTInputPanel } from 'components/CurrencyInputPanel'
import { useCurrency } from 'hooks/Tokens'
import CurrencyLogo from 'components/CurrencyLogo'
import { NumberNFTInputPanel } from 'components/NumberInputPanel'
import { BuyComfirmModel, BuyComfirmNoticeModel, SellComfirmModel } from '../../components/NFTSpotDetail/ComfirmModel'
import { AssetsParameter } from '../../components/Creation'
import { PriceState, useNFTETHPrice } from '../../data/Reserves'
import { useCurrencyBalance } from 'state/wallet/hooks'
import { useAmountOutMins, useIndexSellCall } from 'hooks/useIndexSellCallback'
import { INDEX_NFT_ADDRESS, INDEX_NFT_BUY_FEE } from '../../constants'
import SettingsTab from 'components/Settings'
import { useUserSlippageTolerance } from 'state/user/hooks'
import TransactionsTable from './TransactionsTable'

const Wrapper = styled.div`
  min-height: calc(100vh - ${({ theme }) => theme.headerHeight});
  width: 1192px;
  margin: auto;
  color: ${({ theme }) => theme.black};
  ${({ theme }) => theme.mediaWidth.upToLarge`
    width: 94%
  `}
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
    padding:0 24px;
  `}
`
const TabButton = styled(ButtonWhite)<{ current?: string | boolean }>`
  width: 152px;
  color: ${({ theme, current }) => (current ? theme.black : theme.white)};
  background-color: ${({ theme, current }) => (current ? theme.white : 'transparent')};
  border-color: ${({ theme }) => theme.white};
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 108px;
  `}
`
const TabWrapper = styled(RowBetween)`
  width: 320px
    ${({ theme }) => theme.mediaWidth.upToSmall`
  width: auto;
  grid-gap: 8px;
`};
`
const InfoPanel = styled.div`
  background: #ffffff;
  border-radius: 40px;
  width: 69%;
  padding: 26px 52px;
  min-height: 490px;
  max-height: 490px;
  ${({ theme }) => theme.mediaWidth.upToLarge`
    padding: 26px 24px;
    max-height: unset;
  `}
  ${({ theme }) => theme.mediaWidth.upToMedium`
  padding: 26px 52px;
  width: 80%;
  `}
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
    min-width: 312px;
  `}
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
  padding: 16px;
  border-radius: 30px;
`}
`
const StyledNFTCard = styled.div`
  transform-origin: 0 0;
  transform: scale(1.29);
  width: 361.2px;
  height: 490.2px;
  flex-shrink: 0;
  ${({ theme }) => theme.mediaWidth.upToSmall`
  transform: unset;
  width: 100%;
  height: auto;
  `}
`

const StyledAvatar = styled.div<{ wh?: string }>`
  width: ${({ wh }) => (wh ? wh : '36px')};
  height: ${({ wh }) => (wh ? wh : '36px')};
  flex-shrink: 0;
  margin-right: 12px;
  > * {
    border-radius: 50%;
    width: 100%;
    height: 100%;
  }
`
// const TokenButtonDropdown = styled(ButtonDropdown)`
//   background: linear-gradient(0deg, #ffffff, #ffffff);
//   border: 1px solid rgba(0, 0, 0, 0.1);
//   border-radius: 10px;
//   font-weight: normal;
// `

const CustomNumericalInput = styled(NumericalInput)`
  background: transparent;
  font-size: 16px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  padding: 20px;
  color: ${({ theme }) => theme.black};
`

const BuyPannel = styled(ColumnCenter)`
  color: ${({ theme }) => theme.black};
  padding-top: 20px;
  padding-right: 40px;
  height: 360px;
  align-items: flex-start;
  justify-content: space-between;
  ${({ theme }) => theme.mediaWidth.upToLarge`
  padding-right: 0;
  `}
`
const MarketPrice = styled(RowBetween)`
  border: 1px solid #000000;
  border-radius: 14px;
  height: 52px;
  margin: 24px 0;
  padding: 10px 20px;
`

const TokenWrapper = styled.div`
  width: 320px;
  padding: 22px 0;
  display: flex;
  align-items: center;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width; 100%;
  `}
`
const AssetsWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-column-gap: 40px;
  grid-template-rows: repeat(4, 1fr);
  height: 388px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
  grid-template-columns: 1fr;
  `}
`
const TradeWrapper = styled(AutoColumn)`
  grid-template-columns: 1fr 1fr;
  ${({ theme }) => theme.mediaWidth.upToLarge`
  grid-template-columns: auto;
  `}
`
const BackButton = styled(ButtonEmpty)`
  color: rgba(255, 255, 255, 0.6);
  :hover {
    color: rgba(255, 255, 255, 1);
  }
`

const StyledArrowLeftCircle = styled(ArrowLeftCircle)`
  margin-right: 12px;
  flex-shrink: 0;
  circle {
    fill: #ffffff;
  }
  path {
    stroke: #000000;
  }
  ${({ theme }) => theme.mediaWidth.upToSmall`
  circle {
    fill: none;
    stroke: #ffffff
  }  
  path {
    stroke: #ffffff;
  }
  `}
`

const ContentWrapper = styled(RowBetween)`
  margin-top: 70px;
  align-items: flex-start;
  grid-gap: 8px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
  flex-direction: column;
  align-items: center;
  margin-top: 40px;
  min-width: 312px;
  `}
`

export enum TabType {
  'Information' = 'Information',
  'Trade' = 'Trade'
}

export enum SubTabType {
  'Creater' = 'creater',
  'Index' = 'index',
  'Underlying' = 'underlying'
}

export enum TradeTabType {
  'Buy' = 'buy',
  'Sell' = 'sell'
}

const defaultCardData = {
  id: '',
  name: '',
  indexId: '',
  color: CardColor.RED,
  address: '',
  icons: [],
  creator: ''
}

export default function CardDetail({
  match: {
    params: { nftid }
  }
}: RouteComponentProps<{ nftid?: string }>) {
  const { account } = useWeb3React()
  const theme = useTheme()
  const history = useHistory()
  const [transactionModalOpen, setTransactionModalOpen] = useState(false)
  const [attemptingTxn, setAttemptingTxn] = useState(false)
  const [hash, setHash] = useState('')
  const [error, setError] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const ETHCurrency = useCurrency('ETH')

  const transactionOnDismiss = () => {
    setError(false)
    setErrorMsg('')
    setTransactionModalOpen(false)
  }

  const { loading: NFTIndexLoading, data: NFTIndexInfo } = useNFTIndexInfo(nftid)

  const creatorInfo = useNFTCreatorInfo(NFTIndexInfo?.creator)
  const NFTTransactionRecords = useNFTTransactionRecords(nftid)

  const { data: NFTbalance } = useNFTBalance(nftid)

  const ETHbalance = useCurrencyBalance(account ?? undefined, ETHCurrency ?? undefined)

  const tokens: AssetsParameter[] = useAssetsTokens(NFTIndexInfo?.assetsParameters)
  const {
    ethAmount: [priceState, price],
    eths
  } = useNFTETHPrice(tokens)

  const tokenFluiditys: (TokenAmount | null)[] = useMemo(() => {
    return eths.map(val => val[3])
  }, [eths])

  const thisNFTethAmount = CurrencyAmount.ether(JSBI.BigInt(price ?? '0'))

  const [currentSubTab, setCurrentSubTab] = useState<SubTabType>(SubTabType.Creater)
  const [currentTab, setCurrentTab] = useState<TabType>(TabType.Information)
  const [currentTradeTab, setCurrentTradeTab] = useState<TradeTabType>(TradeTabType.Buy)
  const [buyAmount, setBuyAmount] = useState('')
  const [sellAmount, setSellAmount] = useState('')
  const [buyConfirmNoticeModal, setBuyConfirmNoticeModal] = useState<boolean>(false)

  const [buyConfirmModal, setBuyConfirmModal] = useState(false)
  const [sellConfirmModal, setSellConfirmModal] = useState(false)

  const userSlippage = useUserSlippageTolerance()
  const slippage = useMemo(() => {
    return new BigNumber(userSlippage[0])
      .dividedBy(10000)
      .toFixed(3)
      .toString()
  }, [userSlippage])
  const buyFee = useCalcBuyFee(thisNFTethAmount?.raw.toString(), buyAmount, slippage)
  const amountInMins = useAmountInMins(eths, buyAmount, slippage)
  const amountOutMins = useAmountOutMins(eths, sellAmount, slippage)

  const currentCard = useMemo((): NFTCardProps => {
    if (!NFTIndexInfo) return defaultCardData
    const _icons = tokens.map((val, idx) => {
      return <CurrencyLogo currency={val.currencyToken} key={idx} />
    })
    return {
      id: NFTIndexInfo.creatorId,
      name: NFTIndexInfo.name,
      indexId: NFTIndexInfo.creatorId,
      color: NFTIndexInfo.color,
      address: NFTIndexInfo.creator,
      icons: _icons,
      creator: creatorInfo ? creatorInfo.username : ''
    }
  }, [NFTIndexInfo, tokens, creatorInfo])

  const { callback: toBuyCall } = useIndexBuyCall()
  const toBuy = useCallback(() => {
    if (!buyAmount || !toBuyCall || !nftid || !buyFee || !amountInMins) return

    setTransactionModalOpen(true)
    setAttemptingTxn(true)
    setBuyConfirmModal(false)
    toBuyCall(nftid, buyAmount, amountInMins, buyFee)
      .then(hash => {
        setAttemptingTxn(false)
        setHash(hash)
        setBuyAmount('')
      })
      .catch(err => {
        // setTransactionModalOpen(false)
        setAttemptingTxn(false)
        setError(true)
        setErrorMsg(err?.message)
        console.error('toBuyCall commit', err)
      })
  }, [buyAmount, toBuyCall, nftid, buyFee, amountInMins])

  const { callback: toSellCallback } = useIndexSellCall()
  const toSell = useCallback(() => {
    if (!toSellCallback || !sellAmount || !nftid || !amountOutMins) return
    setTransactionModalOpen(true)
    setAttemptingTxn(true)
    setSellConfirmModal(false)
    toSellCallback(nftid, sellAmount, amountOutMins)
      .then(hash => {
        setAttemptingTxn(false)
        setHash(hash)
        setSellAmount('')
      })
      .catch(err => {
        // setTransactionModalOpen(false)
        setAttemptingTxn(false)
        setError(true)
        setErrorMsg(err?.message)
        console.error('toSellCall commit', err)
      })
  }, [toSellCallback, nftid, sellAmount, amountOutMins])

  if (NFTIndexLoading || !NFTIndexInfo) {
    return (
      <AnimatedWrapper>
        <AnimatedImg>
          <img src={Loader} alt="loading-icon" />
        </AnimatedImg>
      </AnimatedWrapper>
    )
  }
  return (
    <>
      <RowBetween style={{ padding: '27px 20px' }}>
        <BackButton width="auto" color={theme.text1}>
          <RowFixed onClick={() => history.goBack()}>
            <StyledArrowLeftCircle />
            <HideSmall>Go Back</HideSmall>
          </RowFixed>
        </BackButton>
        <TabWrapper>
          <TabButton current={currentTab === TabType.Information} onClick={() => setCurrentTab(TabType.Information)}>
            Information
          </TabButton>
          <TabButton current={currentTab === TabType.Trade} onClick={() => setCurrentTab(TabType.Trade)}>
            Trade
          </TabButton>
        </TabWrapper>
        <HideMedium>
          <div style={{ width: 110 }} />
        </HideMedium>
      </RowBetween>
      <Wrapper>
        <ContentWrapper>
          <StyledNFTCard>
            <NFTCard {...currentCard} />
          </StyledNFTCard>
          {currentTab === TabType.Information ? (
            <InfoPanel>
              <StyledTabs>
                <StyledTabItem
                  current={currentSubTab === SubTabType.Creater}
                  onClick={() => setCurrentSubTab(SubTabType.Creater)}
                >
                  Creator info
                </StyledTabItem>
                <StyledTabItem
                  current={currentSubTab === SubTabType.Index}
                  onClick={() => setCurrentSubTab(SubTabType.Index)}
                >
                  Index info
                </StyledTabItem>
                <StyledTabItem
                  current={currentSubTab === SubTabType.Underlying}
                  onClick={() => setCurrentSubTab(SubTabType.Underlying)}
                >
                  Underlying asset
                </StyledTabItem>
              </StyledTabs>
              {currentSubTab === SubTabType.Creater ? (
                <CreaterInfo nftInfo={NFTIndexInfo} creatorInfo={creatorInfo} />
              ) : currentSubTab === SubTabType.Index ? (
                <IndexInfo nftInfo={NFTIndexInfo} />
              ) : (
                <AssetsWrapper>
                  {tokens.map(({ amount, currencyToken }, index) => {
                    return <AssetItem amount={amount} currencyToken={currencyToken} key={index} />
                  })}
                </AssetsWrapper>
              )}
            </InfoPanel>
          ) : (
            <InfoPanel>
              <TradeWrapper>
                <div>
                  <StyledTabs>
                    <StyledTabItem
                      current={currentTradeTab === TradeTabType.Buy}
                      onClick={() => setCurrentTradeTab(TradeTabType.Buy)}
                    >
                      Buy
                    </StyledTabItem>
                    <StyledTabItem
                      current={currentTradeTab === TradeTabType.Sell}
                      onClick={() => setCurrentTradeTab(TradeTabType.Sell)}
                    >
                      Sell
                    </StyledTabItem>
                  </StyledTabs>

                  {currentTradeTab === TradeTabType.Buy && (
                    <BuyPannel>
                      <AutoColumn gap="8px" style={{ width: '100%' }}>
                        <TYPE.black color="black">Amount </TYPE.black>
                        <CustomNumericalInput
                          style={{
                            width: 'unset',
                            height: '60px'
                          }}
                          maxLength={6}
                          isInt={true}
                          placeholder="0"
                          value={buyAmount}
                          onUserInput={val => {
                            setBuyAmount(val)
                          }}
                        />
                      </AutoColumn>
                      <AutoColumn gap="8px" style={{ width: '100%' }}>
                        <RowBetween>
                          <TYPE.black color="black">Payment Currency </TYPE.black>
                          <SettingsTab onlySlippage={true} />
                        </RowBetween>
                        <CurrencyETHShow />
                      </AutoColumn>
                      <ButtonBlack
                        onClick={() => {
                          setBuyConfirmModal(true)
                          setTimeout(() => {
                            setBuyConfirmNoticeModal(true)
                          }, 500)
                        }}
                        height={60}
                        disabled={!Number(buyAmount) || !thisNFTethAmount}
                      >
                        Buy
                      </ButtonBlack>
                    </BuyPannel>
                  )}

                  {currentTradeTab === TradeTabType.Sell && (
                    <BuyPannel>
                      <AutoColumn gap="8px" style={{ width: '100%' }}>
                        <NumberNFTInputPanel
                          value={sellAmount}
                          onUserInput={val => {
                            setSellAmount(val)
                          }}
                          intOnly={true}
                          label="Amount"
                          onMax={() => {
                            setSellAmount(NFTbalance?.toString() ?? '0')
                          }}
                          balance={NFTbalance?.toString()}
                          error={Number(sellAmount) > Number(NFTbalance?.toString()) ? 'Insufficient balance' : ''}
                          showMaxButton={true}
                          id="sell_id"
                        />
                      </AutoColumn>
                      <AutoColumn gap="8px" style={{ width: '100%' }}>
                        <RowBetween>
                          <TYPE.black color="black">Payment Currency </TYPE.black>
                          <SettingsTab onlySlippage={true} />
                        </RowBetween>
                        <CurrencyETHShow />
                      </AutoColumn>
                      <ButtonBlack
                        onClick={() => {
                          setSellConfirmModal(true)
                        }}
                        height={60}
                        disabled={!Number(sellAmount) || Number(sellAmount) > Number(NFTbalance?.toString())}
                      >
                        Sell
                      </ButtonBlack>
                    </BuyPannel>
                  )}
                </div>

                <div>
                  <MarketPrice>
                    <span>Market price per unit</span>
                    <span>{priceState === PriceState.VALID ? thisNFTethAmount.toSignificant(6) : '--'} ETH</span>
                  </MarketPrice>
                  <div>
                    <TransactionsTable transactionRecords={NFTTransactionRecords} />
                    {!NFTTransactionRecords?.length && (
                      <TYPE.darkGray textAlign="center" padding="10px">
                        No transaction record
                      </TYPE.darkGray>
                    )}
                  </div>
                </div>
              </TradeWrapper>
            </InfoPanel>
          )}
        </ContentWrapper>
      </Wrapper>

      <TransactionConfirmationModal
        isOpen={transactionModalOpen}
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        onDismiss={transactionOnDismiss}
        hash={hash}
        attemptingTxn={attemptingTxn}
        error={error}
        errorMsg={errorMsg}
      />

      <BuyComfirmModel
        isOpen={buyConfirmModal}
        onDismiss={() => {
          setBuyConfirmModal(false)
        }}
        fee={INDEX_NFT_BUY_FEE}
        slippage={slippage}
        tokenFluiditys={tokenFluiditys}
        ethAmount={thisNFTethAmount}
        ETHbalance={ETHbalance ?? undefined}
        number={buyAmount}
        assetsParameters={tokens}
        onConfirm={toBuy}
      />

      <BuyComfirmNoticeModel
        onDismiss={() => {
          setBuyConfirmNoticeModal(false)
        }}
        isOpen={buyConfirmNoticeModal}
      />

      <SellComfirmModel
        isOpen={sellConfirmModal}
        onDismiss={() => {
          setSellConfirmModal(false)
        }}
        tokenFluiditys={tokenFluiditys}
        ethAmount={thisNFTethAmount}
        ETHbalance={ETHbalance ?? undefined}
        slippage={slippage}
        number={sellAmount}
        assetsParameters={tokens}
        onConfirm={toSell}
      />
    </>
  )
}

function CreaterInfo({
  nftInfo,
  creatorInfo
}: {
  nftInfo: NFTIndexInfoProps
  creatorInfo: NFTCreatorInfo | undefined
}) {
  return (
    <div>
      <RowFixed>
        <StyledAvatar>
          <img src={AntimatterLogo} alt="" />
        </StyledAvatar>
        <Paragraph header="Creator">{creatorInfo?.username}</Paragraph>
      </RowFixed>
      <Hr />
      <Paragraph header="Creator Wallet Address">{nftInfo.creator}</Paragraph>
      <Hr />
      <Paragraph header="Creator ID">#{nftInfo.creatorId}</Paragraph>
      <Hr />
      <Paragraph header="Bio">{creatorInfo?.bio}</Paragraph>
    </div>
  )
}

function IndexInfo({ nftInfo }: { nftInfo: NFTIndexInfoProps }) {
  return (
    <div>
      <Paragraph header="Token contract address">{INDEX_NFT_ADDRESS}</Paragraph>
      <Hr />
      {/* <Paragraph header="Current issuance">123</Paragraph>
      <Hr /> */}
      <Paragraph header="Description">{nftInfo.description}</Paragraph>
    </div>
  )
}

function AssetItem({ amount, currencyToken }: { amount: string; currencyToken: WrappedTokenInfo | undefined }) {
  return (
    <TokenWrapper>
      <RowFixed style={{ width: '100%' }}>
        <StyledAvatar wh="32px">
          <CurrencyLogo currency={currencyToken} />
        </StyledAvatar>
        <RowBetween>
          <TYPE.subHeader>{currencyToken?.symbol}</TYPE.subHeader>
          <TYPE.black color={'black'} fontWeight={400}>
            {amount}
          </TYPE.black>
        </RowBetween>
      </RowFixed>
    </TokenWrapper>
  )
}

function CurrencyETHShow() {
  const ETHCurrency = useCurrency('ETH')

  return (
    <CurrencyNFTInputPanel
      hiddenLabel={true}
      value={''}
      onUserInput={() => {}}
      // onMax={handleMax}
      currency={ETHCurrency}
      // pair={dummyPair}
      showMaxButton={false}
      // label="Amount"
      disableCurrencySelect={true}
      id="stake-liquidity-token"
      hideSelect={false}
      hideInput={true}
    />
  )
}
