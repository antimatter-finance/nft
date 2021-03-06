import React from 'react'
import styled from 'styled-components'
import useTheme from 'hooks/useTheme'
import { AutoColumn } from '../../components/Column'
import { TYPE } from '../../theme'

export const StyledParagraph = styled.div`
  margin: 26px 0;
`

export const Hr = styled.hr`
  height: 0;
  border: 0;
  opacity: 0.1;
  border-bottom: ${({ theme }) => `1px solid ${theme.black}`};
`

export function Paragraph({ header, children }: { header: string; children: any }) {
  const theme = useTheme()

  return (
    <StyledParagraph>
      <AutoColumn>
        <TYPE.subHeader color={theme.text4}>{header}</TYPE.subHeader>
        <TYPE.small
          fontSize={16}
          fontWeight={500}
          style={{
            wordBreak: 'break-all'
          }}
          color={theme.black}
        >
          {children}
        </TYPE.small>
      </AutoColumn>
    </StyledParagraph>
  )
}
