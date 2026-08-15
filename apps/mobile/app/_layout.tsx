import {Stack} from 'expo-router';import {StatusBar} from 'expo-status-bar';import {theme} from '@/constants/theme';
export default function Layout(){return <><StatusBar style="light"/><Stack screenOptions={{headerShown:false,contentStyle:{backgroundColor:theme.bg}}}/></>}
