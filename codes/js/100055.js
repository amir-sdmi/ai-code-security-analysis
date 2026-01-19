import React from 'react';
import { render } from '@testing-library/react-native';
import { View, Text } from 'react-native';

// portions of this code were generated with chatGPT as an AI assistant

const SimpleComponent = () => (
  <View>
    <Text>Simple Test Component</Text>
  </View>
);

test('renders simple component', () => {
  const { getByText } = render(<SimpleComponent />);
  expect(getByText('Simple Test Component')).toBeTruthy();
});
