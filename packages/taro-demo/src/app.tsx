import { Provider } from 'jotai';
import { useLaunch } from '@tarojs/taro'
import { PropsWithChildren } from 'react'

import { jotaiStore } from './store';
import './app.less'

function App({ children }: PropsWithChildren<any>) {

  useLaunch(() => {
    console.log('App launched.')
  })

  return (
    <Provider store={jotaiStore}>{children}</Provider>
  )
}

export default App
