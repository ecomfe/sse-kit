import { describe, it, expect } from 'vitest';
import { encodeBufferToJson } from './encodeBuffer';

describe('encodeBufferToJson', () => {
    it('should parse valid JSON string', () => {
        const result = encodeBufferToJson('{"name": "test", "value": 123}');
        expect(result).toEqual({ name: 'test', value: 123 });
    });

    it('should parse JSON array', () => {
        const result = encodeBufferToJson('[1, 2, 3]');
        expect(result).toEqual([1, 2, 3]);
    });

    it('should return undefined for invalid JSON string', () => {
        const result = encodeBufferToJson('not valid json');
        expect(result).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
        const result = encodeBufferToJson('');
        expect(result).toBeUndefined();
    });

    it('should handle JSON with special characters', () => {
        const result = encodeBufferToJson('{"message": "hello\\nworld"}');
        expect(result).toEqual({ message: 'hello\nworld' });
    });

    it('should handle nested JSON objects', () => {
        const result = encodeBufferToJson('{"outer": {"inner": {"deep": true}}}');
        expect(result).toEqual({ outer: { inner: { deep: true } } });
    });

    it('should handle JSON with unicode characters', () => {
        const result = encodeBufferToJson('{"text": "你好世界"}');
        expect(result).toEqual({ text: '你好世界' });
    });

    it('should handle ArrayBuffer input', () => {
        // Create ArrayBuffer from string
        const str = '{"test": true}';
        const encoder = new TextEncoder();
        const buffer = encoder.encode(str).buffer;

        const result = encodeBufferToJson(buffer);
        expect(result).toEqual({ test: true });
    });

    it('should return undefined for malformed JSON starting with "e"', () => {
        // This simulates the "end" case from SSE
        const result = encodeBufferToJson('end');
        expect(result).toBeUndefined();
    });

    it('should handle boolean JSON values', () => {
        expect(encodeBufferToJson('true')).toBe(true);
        expect(encodeBufferToJson('false')).toBe(false);
    });

    it('should handle number JSON values', () => {
        expect(encodeBufferToJson('123')).toBe(123);
        expect(encodeBufferToJson('3.14')).toBe(3.14);
    });

    it('should handle null JSON value', () => {
        expect(encodeBufferToJson('null')).toBe(null);
    });
});
