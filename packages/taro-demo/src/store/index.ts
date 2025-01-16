import { atom, createStore } from 'jotai';

export const jotaiStore = createStore();

export const testAtom = atom<number>(0);