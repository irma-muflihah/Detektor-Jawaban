import { defineConfig, type Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';
import obfuscator from 'rollup-plugin-javascript-obfuscator';
import { handleOmrScan } from './src/server/omrHandler';

function geminiApiPlugin(): Plugin {
  return {
    name: 'gemini-api-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/api/gemini/health' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify({
            status: 'ok',
            hasGeminiKey: Boolean(process.env.GEMINI_API_KEY)
          }));
          return;
        }

        if (req.url === '/api/gemini/omr-scan' && req.method === 'POST') {
          handleOmrScan(req, res);
          return;
        }

        next();
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    geminiApiPlugin(),
    {
      ...obfuscator({
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.75,
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 0.4,
        debugProtection: false,
        disableConsoleOutput: true,
        identifierNamesGenerator: 'hexadecimal',
        log: false,
        numbersToExpressions: true,
        renameGlobals: false,
        selfDefending: true,
        simplify: true,
        splitStrings: true,
        splitStringsChunkLength: 10,
        stringArray: true,
        stringArrayCallsTransform: true,
        stringArrayEncoding: ['base64'],
        stringArrayIndexShift: true,
        stringArrayRotate: true,
        stringArrayShuffle: true,
        stringArrayWrappersCount: 1,
        stringArrayWrappersChainedCalls: true,
        stringArrayWrappersParametersMaxCount: 2,
        stringArrayWrappersType: 'variable',
        stringArrayThreshold: 0.75,
        unicodeEscapeSequence: false
      }),
      apply: 'build'
    }
  ],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true
  }
});
