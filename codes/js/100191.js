import React from 'react';
import styled from 'styled-components';

const FooterContainer = styled.footer`
  background-color: rgb(243, 244, 245);
  padding: 0.5rem 0;
  text-align: center;
  margin-top: 2rem;
  border-top: 1px solid #e9ecef;
`;

const FooterText = styled.p`
  margin: 0;
  color: rgb(119, 117, 116);
  font-size: 0.8rem;
  font-family: 'Pangolin', cursive !important; /* Override global font */
`;

const Footer = () => {
  return (
    <FooterContainer>
      <FooterText>
        Vibe coded with Amazon Q Developer and GitHub Copilot
      </FooterText>
    </FooterContainer>
  );
};

export default Footer;
