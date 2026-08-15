import {PropsWithChildren} from 'react';import {ScrollView,StyleSheet} from 'react-native';import {SafeAreaView} from 'react-native-safe-area-context';import {theme} from '@/constants/theme';
export function Screen({children}:PropsWithChildren){return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content}>{children}</ScrollView></SafeAreaView>}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:theme.bg},content:{padding:20,paddingBottom:110}});
