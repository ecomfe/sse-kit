import { useLoad } from '@tarojs/taro';
import { View, Text } from '@tarojs/components'
import { useAtomValue, useSetAtom } from 'jotai';
import { SSEProcessor } from 'sse-kit/lib/bundle.weapp.esm';

import './index.less'

import {testAtom} from '../../store';


export default function Index() {
  useLoad(() => {
    console.log('Page loaded.')
  })

  const atomValue = useAtomValue(testAtom);
  const setAtom = useSetAtom(testAtom);

  const testReq = async () => {
    try {
      const r = new SSEProcessor({
        url: `http://localhost:3000/stream/numbers`,
        method: 'POST',
        enableChunked: true,
        data: {},
        header: {},
        success: (res) => {
          console.info('请求success:', res);
        },
        fail: (err) => {
          console.error('请求fail:', err);
        }
      })

      for await (const chunk of r?.message()) {
        console.info('获取到新的 chunk----------:', chunk);
      }
      console.info('请求结束已获取到全部数据');
    } catch(e) {
      console.error('testReq出错:', e);
    }
  }

  const testAtomFn = () => {
    setAtom(atomValue + 1);
  }

  return (
    <View className='index'>
      <Text>Hello world!</Text>
      <View className='testBtn' onClick={testReq}>测试 SSE 发送</View>
      <Text>{atomValue}</Text>
      <View className='testAtomBtn' onClick={testAtomFn}>测试 Atom</View>
    </View>
  )
}
