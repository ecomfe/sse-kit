import { View, Text } from '@tarojs/components'
import { useLoad, request } from '@tarojs/taro'
import './index.less'

import {encodeBufferToJson} from '../../utils/encodeBuffer'

export default function Index() {
  useLoad(() => {
    console.log('Page loaded.')
  })

  const testReq = async () => {
    const r = request({
      url: `http://localhost:3000/stream/numbers`,
      method: 'POST',
      enableChunked: true,
      data: {},
      header: {},
    })

    r.onChunkReceived((chunk) => {
      console.info('testReq  onChunkReceived  uint8ArrayToObject chunk:', encodeBufferToJson(chunk?.data))
    })

    r.onHeadersReceived((chunk) => {
      console.info('testReq  onHeadersReceived chunk:', chunk)
    })

    console.info('testReq--------', r)
  }

  return (
    <View className='index'>
      <Text>Hello world!</Text>
      <View className='testBtn' onClick={testReq}>测试 SSE 发送</View>
    </View>
  )
}
