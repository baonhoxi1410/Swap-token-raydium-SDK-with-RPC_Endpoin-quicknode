import * as dotenv from 'dotenv';
import * as https from 'https';
dotenv.config();

if (!process.env.QUICKNODE_URL) {
  throw new Error('URL endpoin err');
}

if (!process.env.WALLET_SECRET_KEY) {
  throw new Error('wallet err');
}

interface PriorityFeeResponse {
  jsonrpc: string;
  result: {
    per_compute_unit: {
      extreme: number;
      medium: number;
    };
  };
  id: number;
}

function httpsRequest(url: string, options: https.RequestOptions, data: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk.toString());
      res.on('end', () => resolve(body));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function fetchPriorityFee(): Promise<number> {
  if (!process.env.QUICKNODE_URL) {
    throw new Error('URL endpoin err');
  }

  const url = new URL(process.env.QUICKNODE_URL);
  const options: https.RequestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const requestBody = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'qn_estimatePriorityFees',
    params: {
      last_n_blocks: 100,
      account: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
      api_version: 2,
      
    }
    
  });

  const response = await httpsRequest(url.href, options, requestBody);
  const data: unknown = JSON.parse(response);
  
  if (!isPriorityFeeResponse(data)) {
    throw new Error('Unexpected response format from priority fee API');
  }
  
  const extremePriorityFeePerCU = data.result.per_compute_unit.extreme;
  
  const estimatedComputeUnits = 10000000000; 
  
  const totalPriorityFeeInMicroLamports = extremePriorityFeePerCU * estimatedComputeUnits;
  
  const priorityFeeInSOL = totalPriorityFeeInMicroLamports / 1e15;
  
  return Math.max(priorityFeeInSOL, 0.000001);
}

function isPriorityFeeResponse(data: unknown): data is PriorityFeeResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'jsonrpc' in data &&
    'result' in data &&
    typeof data.result === 'object' &&
    data.result !== null &&
    'per_compute_unit' in data.result &&
    typeof data.result.per_compute_unit === 'object' &&
    data.result.per_compute_unit !== null &&
    'extreme' in data.result.per_compute_unit &&
    typeof data.result.per_compute_unit.extreme === 'number'
  );
}

export const CONFIG = {
  RPC_URL: process.env.QUICKNODE_URL,
  WALLET_SECRET_KEY: process.env.WALLET_SECRET_KEY,
  BASE_MINT: 'So11111111111111111111111111111111111111112', 
  QUOTE_MINT: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', 
  TOKEN_A_AMOUNT: 0.001,
  EXECUTE_SWAP: true,
  USE_VERSIONED_TRANSACTION: false,
  SLIPPAGE: 10,
  getPriorityFee: fetchPriorityFee,
  
};
