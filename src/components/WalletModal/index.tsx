import { AbstractConnector } from '@web3-react/abstract-connector'
import { UnsupportedChainIdError, useWeb3React } from '@web3-react/core'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
import { ButtonOutlinedBlack } from 'components/Button'
import React, { useEffect, useState } from 'react'
import { isMobile } from 'react-device-detect'
import ReactGA from 'react-ga'
import styled from 'styled-components'
import MetamaskIcon from '../../assets/images/metamask.png'
import { ReactComponent as Close } from '../../assets/images/x.svg'
import { fortmatic, injected, portis } from '../../connectors'
import { OVERLAY_READY } from '../../connectors/Fortmatic'
import { SUPPORTED_WALLETS } from '../../constants'
import usePrevious from '../../hooks/usePrevious'
import { ApplicationModal } from '../../state/application/actions'
import { useModalOpen, useWalletModalToggle } from '../../state/application/hooks'
// import { ExternalLink } from '../../theme'
import AccountDetails from '../AccountDetails'

import Modal from '../Modal'
import Option from './Option'
import PendingView from './PendingView'

const CloseIcon = styled.div`
  position: absolute;
  right: 2rem;
  top: 2rem;
  color: ${({ theme }) => theme.bg1};
  &:hover {
    cursor: pointer;
    opacity: 0.6;
  }
  ${({ theme }) => theme.mediaWidth.upToSmall`
  color: ${({ theme }) => theme.text1};
  `}
`

const CloseColor = styled(Close)``

const Wrapper = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  margin: 0;
  padding: 0;
  width: 100%;
  background-color: ${({ theme }) => theme.text1};
  overflow: hidden;
  position: relative;
  :after {
    z-index: 0;
    content: '';
    position: absolute;
    width: 800px;
    height: 180px;
    left: -50px;
    top: 500px;
    background: rgba(178, 243, 85, 0.5);
    filter: blur(120px);
    border-radius: 120px;
  }
  ${({ theme }) => theme.mediaWidth.upToSmall`
    background-color: #000000;
    :after {
      background: transparent;
    }
  `}
`

const HeaderRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  font-weight: 500;
  font-size: 40px;
  color: ${({ theme }) => theme.bg1};
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 1rem;
  `};
  display: flex;
  justify-content: center;
  ${({ theme }) => theme.mediaWidth.upToSmall`
  justify-content: flex-start;
  margin-bottom: 15px
  `}
`

const ContentWrapper = styled.div`
  padding: 2rem 3rem 52px;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;

  ${({ theme }) => theme.mediaWidth.upToMedium`padding: 1rem 1rem 3rem`};
`

const UpperSection = styled.div`
  position: relative;
  padding-top: 52px
  overflow: hidden;

  h5 {
    margin: 0;
    margin-bottom: 0.5rem;
    font-size: 1rem;
    font-weight: 400;
  }

  h5:last-child {
    margin-bottom: 0px;
  }

  h4 {
    margin-top: 0;
    font-weight: 500;
  }
`

// const Blurb = styled.div`
//   ${({ theme }) => theme.flexRowNoWrap}
//   align-items: center;
//   justify-content: center;
//   flex-wrap: wrap;
//   margin-top: 2rem;
//   ${({ theme }) => theme.mediaWidth.upToMedium`
//     margin: 1rem;
//     font-size: 12px;
//   `};
// `

const OptionGrid = styled.div`
  display: grid;
  grid-gap: 10px;
  width: 360px;
  margin: 0 auto;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: 1fr;
    grid-gap: 10px;
    width:auto;
  `};
`

const HoverText = styled.div`
  :hover {
    cursor: pointer;
  }
  ${({ theme }) => theme.mediaWidth.upToSmall`
    color: #ffffff
  `}
`

const WALLET_VIEWS = {
  OPTIONS: 'options',
  OPTIONS_SECONDARY: 'options_secondary',
  ACCOUNT: 'account',
  PENDING: 'pending'
}

export default function WalletModal({
  pendingTransactions,
  confirmedTransactions,
  ENSName
}: {
  pendingTransactions: string[] // hashes of pending
  confirmedTransactions: string[] // hashes of confirmed
  ENSName?: string
}) {
  // important that these are destructed from the account-specific web3-react context
  const { active, account, connector, activate, error } = useWeb3React()

  const [walletView, setWalletView] = useState(WALLET_VIEWS.ACCOUNT)

  const [pendingWallet, setPendingWallet] = useState<AbstractConnector | undefined>()

  const [pendingError, setPendingError] = useState<boolean>()

  const walletModalOpen = useModalOpen(ApplicationModal.WALLET)
  const toggleWalletModal = useWalletModalToggle()

  const previousAccount = usePrevious(account)

  // close on connection, when logged out before
  useEffect(() => {
    if (account && !previousAccount && walletModalOpen) {
      toggleWalletModal()
    }
  }, [account, previousAccount, toggleWalletModal, walletModalOpen])

  // always reset to account view
  useEffect(() => {
    if (walletModalOpen) {
      setPendingError(false)
      setWalletView(WALLET_VIEWS.ACCOUNT)
    }
  }, [walletModalOpen])

  // close modal when a connection is successful
  const activePrevious = usePrevious(active)
  const connectorPrevious = usePrevious(connector)
  useEffect(() => {
    if (walletModalOpen && ((active && !activePrevious) || (connector && connector !== connectorPrevious && !error))) {
      setWalletView(WALLET_VIEWS.ACCOUNT)
    }
  }, [setWalletView, active, error, connector, walletModalOpen, activePrevious, connectorPrevious])

  const tryActivation = async (connector: AbstractConnector | undefined) => {
    let name = ''
    Object.keys(SUPPORTED_WALLETS).map(key => {
      if (connector === SUPPORTED_WALLETS[key].connector) {
        return (name = SUPPORTED_WALLETS[key].name)
      }
      return true
    })
    // log selected wallet
    ReactGA.event({
      category: 'Wallet',
      action: 'Change Wallet',
      label: name
    })
    setPendingWallet(connector) // set wallet for pending view
    setWalletView(WALLET_VIEWS.PENDING)

    // if the connector is walletconnect and the user has already tried to connect, manually reset the connector
    if (connector instanceof WalletConnectConnector && connector.walletConnectProvider?.wc?.uri) {
      connector.walletConnectProvider = undefined
    }

    connector &&
      activate(connector, undefined, true).catch(error => {
        if (error instanceof UnsupportedChainIdError) {
          activate(connector) // a little janky...can't use setError because the connector isn't set
        } else {
          setPendingError(true)
        }
      })
  }

  // close wallet modal if fortmatic modal is active
  useEffect(() => {
    fortmatic.on(OVERLAY_READY, () => {
      toggleWalletModal()
    })
  }, [toggleWalletModal])

  // get wallets user can switch too, depending on device/browser
  function getOptions() {
    const isMetamask = window.ethereum && window.ethereum.isMetaMask
    return Object.keys(SUPPORTED_WALLETS).map(key => {
      const option = SUPPORTED_WALLETS[key]
      // check for mobile options
      if (isMobile) {
        //disable portis on mobile for now
        if (option.connector === portis) {
          return null
        }

        if (!window.web3 && !window.ethereum && option.mobile) {
          return (
            <Option
              onClick={() => {
                option.connector !== connector && !option.href && tryActivation(option.connector)
              }}
              id={`connect-${key}`}
              key={key}
              active={option.connector && option.connector === connector}
              color={option.color}
              link={option.href}
              header={option.name}
              subheader={null}
              icon={require('../../assets/images/' + option.iconName)}
            />
          )
        }
        return null
      }

      // overwrite injected when needed
      if (option.connector === injected) {
        // don't show injected if there's no injected provider
        if (!(window.web3 || window.ethereum)) {
          if (option.name === 'MetaMask') {
            return (
              <Option
                id={`connect-${key}`}
                key={key}
                color={'#E8831D'}
                header={'Install Metamask'}
                subheader={null}
                link={'https://metamask.io/'}
                icon={MetamaskIcon}
              />
            )
          } else {
            return null //dont want to return install twice
          }
        }
        // don't return metamask if injected provider isn't metamask
        else if (option.name === 'MetaMask' && !isMetamask) {
          return null
        }
        // likewise for generic
        else if (option.name === 'Injected' && isMetamask) {
          return null
        }
      }

      // return rest of options
      return (
        !isMobile &&
        !option.mobileOnly && (
          <Option
            id={`connect-${key}`}
            onClick={() => {
              option.connector === connector
                ? setWalletView(WALLET_VIEWS.ACCOUNT)
                : !option.href && tryActivation(option.connector)
            }}
            key={key}
            active={option.connector === connector}
            color={option.color}
            link={option.href}
            header={option.name}
            subheader={null} //use OptionCard.descriptio to bring back multi-line
            icon={require('../../assets/images/' + option.iconName)}
            size={24}
          />
        )
      )
    })
  }

  function getModalContent() {
    if (error) {
      return (
        <UpperSection>
          <CloseIcon onClick={toggleWalletModal}>
            <CloseColor />
          </CloseIcon>
          <HeaderRow>{error instanceof UnsupportedChainIdError ? 'Wrong Network' : 'Error connecting'}</HeaderRow>
          <ContentWrapper>
            {error instanceof UnsupportedChainIdError ? (
              <h5>Please connect to the appropriate Ethereum network.</h5>
            ) : (
              'Error connecting. Try refreshing the page.'
            )}
          </ContentWrapper>
        </UpperSection>
      )
    }
    if (account && walletView === WALLET_VIEWS.ACCOUNT) {
      return (
        <AccountDetails
          toggleWalletModal={toggleWalletModal}
          pendingTransactions={pendingTransactions}
          confirmedTransactions={confirmedTransactions}
          ENSName={ENSName}
          openOptions={() => setWalletView(WALLET_VIEWS.OPTIONS)}
        />
      )
    }
    return (
      <UpperSection>
        <CloseIcon onClick={toggleWalletModal}>
          <CloseColor />
        </CloseIcon>
        {walletView === WALLET_VIEWS.ACCOUNT && (
          <HeaderRow>
            <HoverText>Connect your wallet</HoverText>
          </HeaderRow>
        )}
        <ContentWrapper>
          {walletView === WALLET_VIEWS.PENDING ? (
            <PendingView
              connector={pendingWallet}
              error={pendingError}
              setPendingError={setPendingError}
              tryActivation={tryActivation}
            >
              <ButtonOutlinedBlack
                onClick={() => {
                  setPendingError(false)
                  setWalletView(WALLET_VIEWS.ACCOUNT)
                }}
              >
                <span style={{ whiteSpace: 'nowrap' }}>Change Wallet</span>
              </ButtonOutlinedBlack>
            </PendingView>
          ) : (
            <OptionGrid>{getOptions()}</OptionGrid>
          )}
          {/* {walletView !== WALLET_VIEWS.PENDING && (
            <Blurb>
              <span>New to Ethereum? &nbsp;</span>{' '}
              <ExternalLink href="https://ethereum.org/wallets/">Learn more about wallets</ExternalLink>
            </Blurb>
          )} */}
        </ContentWrapper>
      </UpperSection>
    )
  }

  return (
    <Modal
      isOpen={walletModalOpen}
      onDismiss={toggleWalletModal}
      minHeight={false}
      maxHeight={90}
      maxWidth={640}
      width="100%"
      zIndex={5}
    >
      <Wrapper>{getModalContent()}</Wrapper>
    </Modal>
  )
}
