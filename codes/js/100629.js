// import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons'
import { Text } from "react-native"
import ResturantsScreen from '../../features/restaurants/screens/restaurants.screen';
import { SafeArea } from '../../components/utility/safe-area.component';

import { RestaurantsNavigator } from './resturants.navigator';
import { MapScreen } from '../../features/maps/screens/map.screen';

const Tab = createBottomTabNavigator()

const Settings = () =>{
  return <SafeArea>
    <Text>
      Settings
    </Text>
  </SafeArea>
}

export const AppNavigator = () => {
  return ( 
    <>
        {/* <NavigationContainer> */}
          <Tab.Navigator screenOptions={({ route }) => ({ // screenOptions was copied from documentation and changed it using chatgpt
              tabBarIcon: ({ focused, color, size }) => {
                let iconName;   
                
                if (route.name === 'Resturants') {
                  iconName = "restaurant"; 
                } else if (route.name === 'Map') {
                  iconName = "map";
                } else if (route.name === 'Settings') {
                  iconName = "settings";
                }
                
                return <Ionicons name={iconName} size={size} color={color} />;
              },
              tabBarActiveTintColor: 'tomato',
              tabBarInactiveTintColor: 'gray',
              headerShown : false
            })} > 
            <Tab.Screen name='Resturants' component={RestaurantsNavigator} />
            <Tab.Screen name='Map' component={MapScreen} />
            <Tab.Screen name='Settings' component={Settings} />
          </Tab.Navigator>
        {/* </NavigationContainer>  */}
    </>
  )
}
