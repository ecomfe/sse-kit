# sse-kit

## 2.0.0

### Major Changes

- ## Breaking Changes

  - **`preprocessDataCallback` parameter format changed**: The callback now receives pure data content without the `data:` prefix. If your callback previously checked for or stripped the `data:` prefix, you need to update it.

    ```typescript
    // Before (v1.x)
    preprocessDataCallback: (data) => {
      if (data.startsWith("data:")) {
        return processData(data.slice(5));
      }
      return data;
    };

    // After (v2.0)
    preprocessDataCallback: (data) => {
      return processData(data); // data is already the pure content
    };
    ```

  ## Bug Fixes

  - **Baidu Mini Program (swan)**: Fixed SSE parsing issue where `onChunkReceived` rewrite was not supported. Now uses wrapper pattern with event buffering mechanism.
  - **WeChat Mini Program (weapp)**: Applied same wrapper pattern to avoid potential compatibility issues.
  - **Error handling**: Fixed error masking in `encodeBufferToJson` - now returns `undefined` instead of throwing masked JSON errors.

  ## New Features

  - **Unit testing**: Added Vitest testing infrastructure with 45 tests covering core modules.
  - **Version management**: Added Changesets for automated version management and changelog generation.

  ## Documentation

  - Added bilingual documentation (English `README.md` and Chinese `README.zh-CN.md`) for open source community.
