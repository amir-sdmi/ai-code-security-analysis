import { MD3DarkTheme, useTheme, configureFonts } from 'react-native-paper';
import { Raleway_400Regular, Raleway_700Bold, Raleway_700Bold_Italic, Raleway_400Regular_Italic } from '@expo-google-fonts/raleway';

const baseFont = {
    fontFamily: 'Raleway-Regular',
  } as const;

const baseVariants = configureFonts({ config: baseFont });

const customVariants = {
    // Customize individual base variants:
    displayMedium: {
      ...baseVariants.displayMedium,
      fontFamily: 'Raleway-Bold',
    },

    // Add own tokens if required:
    bold: {
      ...baseVariants.bodyMedium,
      fontFamily: 'Raleway-Bold',
    },
    italic: {
      ...baseVariants.bodyMedium,
      fontFamily: 'Raleway-Italic',
    },
    boldItalic: {
      ...baseVariants.bodyMedium,
      fontFamily: 'Raleway-BoldItalic',
    },
  } as const;

const fonts = configureFonts({
  config: {
    ...baseVariants,
    ...customVariants,
  },
});

/*const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    // Modern dark theme with red accents - generated with ChatGPT
    primary: '#E53935',     // Vibrant red
    onPrimary: '#FFFFFF',   // White text on primary
    secondary: '#FF8A65',   // Coral/orange accent
    onSecondary: '#000000', // Black text on secondary
    background: '#1C1616',  // Dark reddish-black
    onSurface: '#F5F5F5',  // Off-white for text
    error: '#FFD700',      // Gold for errors (avoiding another red)
    onError: '#000000',    // Black text on error
    outline: '#382E2E',    // Subtle reddish border
  },
  fonts: fonts,
  roundness: 2
}*/
const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    // Customize colors - colours generated with ChatGPT :D
    primary: '#D32F2F',   
    onPrimary: '#FFFFFF', 
    secondary: '#FF6347', 
    onSecondary: '#000000',
    background: '#121212',
    onSurface: '#E0E0E0', 
    error: '#CF6679',     
    onError: '#FFFFFF',   
    outline: '#373737',   
  },
  fonts: fonts,
  roundness: 2
}

export default theme