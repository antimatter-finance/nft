import React from 'react'
import styled, { css } from 'styled-components'
import { animated, useTransition, useSpring } from 'react-spring'
import { DialogOverlay, DialogContent } from '@reach/dialog'
import { isMobile } from 'react-device-detect'
import '@reach/dialog/styles.css'
import { useGesture } from 'react-use-gesture'
import { transparentize } from 'polished'
import { Marginer } from '../../pages/App'
import gradient from 'assets/svg/overlay_gradient.svg'
// import { headerHeightDisplacement } from '../Header'

const AnimatedDialogOverlay = animated(DialogOverlay)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const StyledDialogOverlay = styled(AnimatedDialogOverlay)<{
  color?: string
  overflow?: string
  alignitems?: string
  zindex?: number
}>`
  &[data-reach-dialog-overlay] {
    z-index: ${({ zindex }) => zindex ?? 2};
    overflow: ${({ overflow }) => overflow ?? 'hidden'};

    display: flex;
    align-items: ${({ alignitems }) => alignitems ?? 'center'};
    justify-content: center;

    background: #000000 url(${gradient}) no-repeat left bottom;

    height: calc(100vh - ${({ theme }) => theme.headerHeight});
    top: ${({ theme }) => theme.headerHeight};
    ${({ theme }) => theme.mediaWidth.upToLarge`
      height: calc(100vh - ${({ theme }) => theme.headerHeight + ' - ' + theme.mobileHeaderHeight});
      top: ${theme.mobileHeaderHeight};
    `}
    ${({ theme }) => theme.mediaWidth.upToSmall`
      height: 100vh;
      top: 0;
      bottom: ${({ theme }) => theme.headerHeight};
      background: #000000;
      justify-content: flex-end;
      z-index: 12;
    `}
  }
`
export const Wrapper = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  ${({ theme }) => theme.mediaWidth.upToSmall`          
    overflow-y: auto;
    margin-bottom: auto;
  `}
`

// export const Filler = styled.div`
//   width: 212px;
//   ${({ theme }) => theme.desktop}
// `

export const AnimatedDialogContent = animated(DialogContent)
// destructure to not pass custom props to Dialog DOM element
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const StyledDialogContent = styled(
  ({ minHeight, maxHeight, mobile, isOpen, maxWidth, minWidth, width, ...rest }) => <AnimatedDialogContent {...rest} />
).attrs({
  'aria-label': 'dialog'
})`
  overflow-y: ${({ mobile }) => (mobile ? 'auto' : 'hidden')};

  &[data-reach-dialog-content] {
    box-shadow: 0 4px 8px 0 ${({ theme }) => transparentize(0.95, theme.shadow1)};
    padding: 0px;
    width: ${({ width }) => width ?? '42vw'};
    ${({ minWidth }) =>
      minWidth &&
      css`
        min-width: ${minWidth}px;
      `}
    overflow-y: ${({ mobile }) => (mobile ? 'auto' : 'hidden')};
    overflow-x: hidden;
    background-color: ${({ theme }) => theme.white};

    align-self: center;

    max-width: 480px;
        ${({ maxWidth }) =>
          maxWidth &&
          css`
            max-width: ${maxWidth}px;
          `}
    ${({ maxHeight }) =>
      maxHeight &&
      css`
        max-height: ${maxHeight}vh;
      `}
    ${({ minHeight }) =>
      minHeight &&
      css`
        min-height: ${minHeight}vh;
      `}
    display: flex;
    border-radius: 42px;
    ${({ theme }) => theme.mediaWidth.upToMedium`
      width: 65vw;
      margin: 0;
    `}
    ${({ theme }) => theme.mediaWidth.upToSmall`
      width: 100vw;
      max-width:unset;
      min-height:unset;
      max-height:unset;
      height: 100vh;
      overflow-y: auto;
      border-radius: 0;
      background-color: #000000;
    `}
  }
`

interface ModalProps {
  isOpen: boolean
  onDismiss: () => void
  minHeight?: number | false
  maxHeight?: number
  initialFocusRef?: React.RefObject<any>
  children?: React.ReactNode
  maxWidth?: number
  width?: string
  zIndex?: number
  alignitems?: string
}

export default function Modal({
  isOpen,
  onDismiss,
  minHeight = false,
  maxHeight = 90,
  maxWidth = 480,
  width,
  initialFocusRef,
  zIndex,
  children,
  alignitems
}: ModalProps) {
  const fadeTransition = useTransition(isOpen, null, {
    config: { duration: 200 },
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 }
  })

  const [{ y }, set] = useSpring(() => ({ y: 0, config: { mass: 1, tension: 210, friction: 20 } }))
  const bind = useGesture({
    onDrag: state => {
      set({
        y: state.down ? state.movement[1] : 0
      })
      if (state.movement[1] > 300 || (state.velocity > 3 && state.direction[1] > 0)) {
        onDismiss()
      }
    }
  })

  return (
    <>
      {fadeTransition.map(
        ({ item, key, props }) =>
          item && (
            <StyledDialogOverlay
              key={key}
              style={props}
              onDismiss={onDismiss}
              initialFocusRef={initialFocusRef}
              unstable_lockFocusAcrossFrames={false}
              zindex={zIndex}
              alignitems={alignitems}
            >
              {/* <Filler /> */}
              <Wrapper>
                <StyledDialogContent
                  {...(isMobile
                    ? {
                        ...bind(),
                        style: { transform: y.interpolate(y => `translateY(${y > 0 ? y : 0}px)`) }
                      }
                    : {})}
                  aria-label="dialog content"
                  minHeight={minHeight}
                  maxHeight={maxHeight}
                  mobile={isMobile}
                  maxWidth={maxWidth}
                  width={width}
                >
                  {/* prevents the automatic focusing of inputs on mobile by the reach dialog */}
                  {!initialFocusRef && isMobile ? <div tabIndex={1} /> : null}
                  {children}
                </StyledDialogContent>
                <Marginer />
              </Wrapper>
            </StyledDialogOverlay>
          )
      )}
    </>
  )
}
