import { View, Text } from '@tarojs/components'
import { useLoad, request } from '@tarojs/taro'
import './index.less'

import {encodeBufferToJson} from '../../utils/encodeBuffer'
import { createAsyncQueue } from '../../utils/createAsyncQueue';


export default function Index() {
  useLoad(() => {
    console.log('Page loaded.')
  })

  const testReq = async () => {
    try {
      for await (const chunk of asyncReq()) {
        console.info('获取到新的 chunk----------:', chunk);
      }
      console.info('请求结束已获取到全部数据');
    } catch(e) {
      console.error('testReq出错:', e);
    }
  }

  async function* asyncReq() {
    const queue = createAsyncQueue<any>();

    const r = request({
      url: `http://localhost:3000/stream/numbers`,
      method: 'POST',
      enableChunked: true,
      data: {},
      header: {},
      success: (res) => {
        console.info('请求success:', res);
        queue.end();
      },
      fail: (err) => {
        console.error('请求fail:', err);
        queue.end();
      }
    })

    r.onChunkReceived((chunk) => {
      const parsed = encodeBufferToJson(chunk?.data);
      console.info('onChunkReceived:', parsed);
      queue.push(parsed);
    });
  
    r.onHeadersReceived((chunk) => {
      console.info('onHeadersReceived:', chunk);
      queue.push(chunk);
    });


    while (true) {
      console.info('开始等待下一个数据');
      const { value, done } = await queue.next();
      if (done) {
        return;
      }
      yield value;
    }
  }

  return (
    <View className='index'>
      <Text>Hello world!</Text>
      <View className='testBtn' onClick={testReq}>测试 SSE 发送</View>
    </View>
  )
}
