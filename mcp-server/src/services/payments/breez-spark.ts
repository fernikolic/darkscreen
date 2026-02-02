/**
 * Breez Spark SDK Service
 *
 * Self-custodial Lightning wallet for agents using Breez SDK Spark.
 * Each agent gets their own wallet with their own mnemonic.
 *
 * Benefits over Cashu:
 * - Self-custodial: agents own their keys
 * - More reliable: no quote ID issues
 * - Spark addresses: cleaner than LNURL-pay
 * - Lightning addresses: agent@breez-domain
 *
 * @see https://breez.technology/sdk/
 * @see https://github.com/onesandzeros-nz/BreezClaw
 */

import { createRequire } from 'module';
import * as bip39 from 'bip39';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

// Use createRequire for CommonJS module
const require = createRequire(import.meta.url);
const breezSdk = require('@breeztech/breez-sdk-spark/nodejs');

// Types from Breez SDK
type BreezSdk = any;
type ReceivePaymentResponse = { paymentRequest: string; fee: bigint };
type GetInfoResponse = { balanceSats: number };
type SendPaymentResponse = any;
type ReceivePaymentRequest = { paymentMethod: any };
type PrepareSendPaymentRequest = { paymentRequest: string; amount?: bigint };
type ConnectRequest = { config: any; seed: any; storageDir: string };
type PrepareSendPaymentResponse = { paymentMethod: any; amount: bigint };
type Network = 'mainnet' | 'testnet';
type Seed = { type: string; mnemonic: string };
type ReceivePaymentMethod = any;

const { connect, defaultConfig } = breezSdk;

// Connected SDK instances per agent
const sdkInstances: Map<string, BreezSdk> = new Map();

// API Key from environment
const BREEZ_API_KEY = process.env.BREEZ_API_KEY;

// Storage directory for wallet data
const WALLETS_DIR = process.env.BREEZ_WALLETS_DIR || path.join(process.cwd(), '.breez-wallets');

/**
 * Configuration status
 */
export const config = {
  get configured(): boolean {
    return !!BREEZ_API_KEY;
  },
  get apiKey(): string | undefined {
    return BREEZ_API_KEY;
  },
};

/**
 * Encrypt mnemonic for storage
 */
function encryptMnemonic(mnemonic: string, agentId: string): string {
  const key = crypto.scryptSync(agentId + (process.env.BREEZ_ENCRYPTION_KEY || 'clawdentials'), 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(mnemonic, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt mnemonic from storage
 */
function decryptMnemonic(encrypted: string, agentId: string): string {
  const [ivHex, authTagHex, data] = encrypted.split(':');
  const key = crypto.scryptSync(agentId + (process.env.BREEZ_ENCRYPTION_KEY || 'clawdentials'), 'salt', 32);
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Get wallet storage path for an agent
 */
function getWalletPath(agentId: string): string {
  return path.join(WALLETS_DIR, agentId);
}

/**
 * Check if agent has a wallet
 */
export function hasWallet(agentId: string): boolean {
  const walletPath = getWalletPath(agentId);
  return fs.existsSync(path.join(walletPath, 'wallet.json'));
}

/**
 * Create a new wallet for an agent
 */
export async function createWallet(agentId: string): Promise<{
  success: boolean;
  mnemonic?: string;
  error?: string;
}> {
  if (!config.configured) {
    return { success: false, error: 'Breez API key not configured' };
  }

  if (hasWallet(agentId)) {
    return { success: false, error: 'Wallet already exists for this agent' };
  }

  try {
    // Generate new mnemonic
    const mnemonic = bip39.generateMnemonic(128); // 12 words

    // Create wallet directory
    const walletPath = getWalletPath(agentId);
    fs.mkdirSync(walletPath, { recursive: true });

    // Store encrypted mnemonic
    const encrypted = encryptMnemonic(mnemonic, agentId);
    fs.writeFileSync(
      path.join(walletPath, 'wallet.json'),
      JSON.stringify({
        encryptedMnemonic: encrypted,
        createdAt: new Date().toISOString(),
        network: 'mainnet',
      })
    );

    return { success: true, mnemonic };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create wallet',
    };
  }
}

/**
 * Connect to an agent's wallet
 */
export async function connectWallet(agentId: string): Promise<{
  success: boolean;
  sdk?: BreezSdk;
  error?: string;
}> {
  if (!config.configured) {
    return { success: false, error: 'Breez API key not configured' };
  }

  // Check if already connected
  if (sdkInstances.has(agentId)) {
    return { success: true, sdk: sdkInstances.get(agentId)! };
  }

  const walletPath = getWalletPath(agentId);
  const walletFile = path.join(walletPath, 'wallet.json');

  if (!fs.existsSync(walletFile)) {
    return { success: false, error: 'No wallet found for this agent' };
  }

  try {
    const walletData = JSON.parse(fs.readFileSync(walletFile, 'utf8'));
    const mnemonic = decryptMnemonic(walletData.encryptedMnemonic, agentId);

    const networkConfig = defaultConfig('mainnet' as Network);
    networkConfig.apiKey = BREEZ_API_KEY!;

    const seed: Seed = {
      type: 'mnemonic',
      mnemonic,
    };

    const storageDir = path.join(walletPath, 'spark-data');
    fs.mkdirSync(storageDir, { recursive: true });

    const connectRequest: ConnectRequest = {
      config: networkConfig,
      seed,
      storageDir,
    };

    const sdk = await connect(connectRequest);
    sdkInstances.set(agentId, sdk);

    return { success: true, sdk };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect wallet',
    };
  }
}

/**
 * Disconnect an agent's wallet
 */
export async function disconnectWallet(agentId: string): Promise<void> {
  const sdk = sdkInstances.get(agentId);
  if (sdk) {
    await sdk.disconnect();
    sdkInstances.delete(agentId);
  }
}

/**
 * Get wallet balance
 */
export async function getBalance(agentId: string): Promise<{
  success: boolean;
  balanceSats?: number;
  balanceUsd?: number;
  error?: string;
}> {
  const connection = await connectWallet(agentId);
  if (!connection.success || !connection.sdk) {
    return { success: false, error: connection.error };
  }

  try {
    const info = await connection.sdk.getInfo({});
    const balanceSats = info.balanceSats;
    // Rough USD conversion (should fetch real rate in production)
    const balanceUsd = balanceSats / 1030; // ~$97k/BTC

    return { success: true, balanceSats, balanceUsd };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get balance',
    };
  }
}

/**
 * Get wallet info
 */
export async function getWalletInfo(agentId: string): Promise<{
  success: boolean;
  info?: GetInfoResponse;
  error?: string;
}> {
  const connection = await connectWallet(agentId);
  if (!connection.success || !connection.sdk) {
    return { success: false, error: connection.error };
  }

  try {
    const info = await connection.sdk.getInfo({});
    return { success: true, info };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get wallet info',
    };
  }
}

export type ReceiveMethod = 'spark' | 'spark_invoice' | 'lightning' | 'bitcoin';

/**
 * Create a receive request (invoice or address)
 */
export async function receivePayment(
  agentId: string,
  method: ReceiveMethod = 'spark',
  amountSats?: number,
  description?: string
): Promise<{
  success: boolean;
  response?: ReceivePaymentResponse;
  address?: string;
  invoice?: string;
  error?: string;
}> {
  const connection = await connectWallet(agentId);
  if (!connection.success || !connection.sdk) {
    return { success: false, error: connection.error };
  }

  try {
    let paymentMethod: ReceivePaymentMethod;

    switch (method) {
      case 'spark':
        paymentMethod = { type: 'sparkAddress' };
        break;
      case 'spark_invoice':
        paymentMethod = {
          type: 'sparkInvoice',
          amount: amountSats?.toString(),
          description,
        };
        break;
      case 'lightning':
        paymentMethod = {
          type: 'bolt11Invoice',
          description: description ?? '',
          amountSats,
          expirySecs: 3600,
        };
        break;
      case 'bitcoin':
        paymentMethod = { type: 'bitcoinAddress' };
        break;
      default:
        paymentMethod = { type: 'sparkAddress' };
    }

    const request: ReceivePaymentRequest = { paymentMethod };
    const response = await connection.sdk.receivePayment(request);

    return {
      success: true,
      response,
      address: response.paymentRequest,
      invoice: method === 'lightning' || method === 'spark_invoice' ? response.paymentRequest : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create receive request',
    };
  }
}

/**
 * Prepare a payment (get fee estimate)
 */
export async function prepareSendPayment(
  agentId: string,
  destination: string,
  amountSats?: number
): Promise<{
  success: boolean;
  prepareResponse?: PrepareSendPaymentResponse;
  feeSats?: number;
  error?: string;
}> {
  const connection = await connectWallet(agentId);
  if (!connection.success || !connection.sdk) {
    return { success: false, error: connection.error };
  }

  try {
    // If it's a Lightning address, resolve it first
    let finalDestination = destination;
    if (destination.includes('@') && !destination.startsWith('lnbc')) {
      finalDestination = await resolveLightningAddress(destination, amountSats!);
    }

    const request: PrepareSendPaymentRequest = {
      paymentRequest: finalDestination,
      amount: amountSats !== undefined ? BigInt(amountSats) : undefined,
    };

    const prepareResponse = await connection.sdk.prepareSendPayment(request);

    return {
      success: true,
      prepareResponse,
      feeSats: Number(prepareResponse.amount), // Fee is included in amount
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to prepare payment',
    };
  }
}

/**
 * Send a payment (after preparing)
 */
export async function sendPayment(
  agentId: string,
  prepareResponse: PrepareSendPaymentResponse
): Promise<{
  success: boolean;
  response?: SendPaymentResponse;
  error?: string;
}> {
  const connection = await connectWallet(agentId);
  if (!connection.success || !connection.sdk) {
    return { success: false, error: connection.error };
  }

  try {
    const response = await connection.sdk.sendPayment({ prepareResponse });
    return { success: true, response };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send payment',
    };
  }
}

/**
 * Resolve Lightning address to BOLT11 invoice
 */
async function resolveLightningAddress(address: string, amountSats: number): Promise<string> {
  const [username, domain] = address.split('@');
  const lnurlEndpoint = `https://${domain}/.well-known/lnurlp/${username}`;

  const metadataResponse = await fetch(lnurlEndpoint);
  if (!metadataResponse.ok) {
    throw new Error(`Failed to fetch Lightning address: ${metadataResponse.status}`);
  }

  const metadata = (await metadataResponse.json()) as {
    callback: string;
    minSendable: number;
    maxSendable: number;
    tag: string;
    status?: string;
    reason?: string;
  };

  if (metadata.status === 'ERROR') {
    throw new Error(`Lightning address error: ${metadata.reason}`);
  }

  const amountMsats = amountSats * 1000;
  if (amountMsats < metadata.minSendable || amountMsats > metadata.maxSendable) {
    throw new Error(`Amount out of range: ${metadata.minSendable / 1000} - ${metadata.maxSendable / 1000} sats`);
  }

  const callbackUrl = new URL(metadata.callback);
  callbackUrl.searchParams.set('amount', amountMsats.toString());

  const invoiceResponse = await fetch(callbackUrl.toString());
  const invoiceData = (await invoiceResponse.json()) as { pr: string; status?: string; reason?: string };

  if (invoiceData.status === 'ERROR' || !invoiceData.pr) {
    throw new Error(invoiceData.reason || 'Failed to get invoice');
  }

  return invoiceData.pr;
}

/**
 * Register a Lightning address for the agent
 */
export async function registerLightningAddress(
  agentId: string,
  username: string,
  description?: string
): Promise<{
  success: boolean;
  lightningAddress?: string;
  lnurl?: string;
  error?: string;
}> {
  const connection = await connectWallet(agentId);
  if (!connection.success || !connection.sdk) {
    return { success: false, error: connection.error };
  }

  try {
    const result = await connection.sdk.registerLightningAddress({
      username,
      description: description ?? `Pay to ${username}`,
    });

    return {
      success: true,
      lightningAddress: result.lightningAddress,
      lnurl: result.lnurl,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to register Lightning address',
    };
  }
}

/**
 * Get agent's Lightning address
 */
export async function getLightningAddress(agentId: string): Promise<{
  success: boolean;
  lightningAddress?: string;
  lnurl?: string;
  error?: string;
}> {
  const connection = await connectWallet(agentId);
  if (!connection.success || !connection.sdk) {
    return { success: false, error: connection.error };
  }

  try {
    const result = await connection.sdk.getLightningAddress();
    if (!result) {
      return { success: true }; // No address registered yet
    }

    return {
      success: true,
      lightningAddress: result.lightningAddress,
      lnurl: result.lnurl,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get Lightning address',
    };
  }
}

export const breezSparkService = {
  config,
  hasWallet,
  createWallet,
  connectWallet,
  disconnectWallet,
  getBalance,
  getWalletInfo,
  receivePayment,
  prepareSendPayment,
  sendPayment,
  registerLightningAddress,
  getLightningAddress,
};
