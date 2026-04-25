import { defineStore } from 'pinia';
import { genId } from '../utils/idgen.js';

const API = '/api/transactions';

/**
 * @typedef {Object} Transaction
 * @property {string} id - Unique ID
 * @property {'buy'|'sell'} type
 * @property {string} date - ISO date string
 * @property {number} priceCents - Price per gram in cents
 * @property {number} grams
 * @property {number} totalCents - total cost / value
 * @property {string} note
 * @property {number|null} sellProfitCents - Profit for sell transactions
 * @property {string|null} sellBatchData - JSON string of SellBatchInfo[]
 * @property {string} createdAt - ISO timestamp
 */

/**
 * @typedef {Object} SellBatchInfo
 * @property {string} buyTransactionId
 * @property {number} grams
 * @property {number} costCents
 */

/**
 * @typedef {Object} HeldBatch
 * @property {string} id - buy transaction id
 * @property {Transaction} transaction - the buy transaction
 * @property {number} heldGrams - remaining held grams
 * @property {number} heldTotalCents - proportional remaining cost
 */

export const useTransactionStore = defineStore('transaction', {
  state: () => ({
    /** @type {Transaction[]} */
    transactions: []
  }),

  getters: {
    /**
     * Compute held batches from all buy transactions minus consumed amounts from sells.
     * @returns {HeldBatch[]}
     */
    heldBatches: (state) => {
      // 1. Sort all buy transactions by date ascending
      const buys = state.transactions
        .filter((t) => t.type === 'buy')
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date));

      // 2. Build consumption map from sell transactions
      /** @type {Record<string, number>} */
      const consumedMap = {};
      const sells = state.transactions.filter((t) => t.type === 'sell');
      for (const sell of sells) {
        if (sell.sellBatchData) {
          try {
            /** @type {SellBatchInfo[]} */
            const batches = JSON.parse(sell.sellBatchData);
            for (const b of batches) {
              consumedMap[b.buyTransactionId] =
                (consumedMap[b.buyTransactionId] || 0) + b.grams;
            }
          } catch {
            // Ignore malformed data
          }
        }
      }

      // 3. Compute held batches
      /** @type {HeldBatch[]} */
      const result = [];
      for (const buy of buys) {
        const consumed = consumedMap[buy.id] || 0;
        const held = buy.grams - consumed;
        if (held > 0.001) {
          result.push({
            id: buy.id,
            transaction: buy,
            heldGrams: held,
            heldTotalCents: Math.round(buy.totalCents * (held / buy.grams))
          });
        }
      }
      return result;
    },

    /**
     * Sum of all buy totalCents
     * @returns {number}
     */
    totalInvestmentCents: (state) => {
      return state.transactions
        .filter((t) => t.type === 'buy')
        .reduce((sum, t) => sum + t.totalCents, 0);
    },

    /**
     * Sum of all buy grams
     * @returns {number}
     */
    totalBuyGrams: (state) => {
      return state.transactions
        .filter((t) => t.type === 'buy')
        .reduce((sum, t) => sum + t.grams, 0);
    },

    /**
     * Sum of all sell grams
     * @returns {number}
     */
    totalSellGrams: (state) => {
      return state.transactions
        .filter((t) => t.type === 'sell')
        .reduce((sum, t) => sum + t.grams, 0);
    },

    /**
     * Total held grams
     * @returns {number}
     */
    heldGrams() {
      return this.heldBatches.reduce((sum, b) => sum + b.heldGrams, 0);
    },

    /**
     * Average cost per gram in cents
     * @returns {number|null}
     */
    averageCostCents() {
      const totalBuyGrams = this.totalBuyGrams;
      if (totalBuyGrams === 0) return null;
      return Math.round(this.totalInvestmentCents / totalBuyGrams);
    },

    /**
     * Sum of all sell profits
     * @returns {number}
     */
    realizedProfitCents: (state) => {
      return state.transactions
        .filter((t) => t.type === 'sell' && t.sellProfitCents !== null)
        .reduce((sum, t) => sum + t.sellProfitCents, 0);
    },

    /**
     * Latest transaction price (by date descending)
     * @returns {number|null}
     */
    latestPriceCents: (state) => {
      if (state.transactions.length === 0) return null;
      const sorted = state.transactions
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date));
      return sorted[0].priceCents;
    },

    /**
     * Current market value based on latest price
     * @returns {number|null}
     */
    currentMarketValueCents() {
      const heldGrams = this.heldGrams;
      const latestPrice = this.latestPriceCents;
      if (heldGrams <= 0 || latestPrice === null) return null;
      return Math.round(latestPrice * heldGrams);
    },

    /**
     * Floating (unrealized) profit
     * @returns {number|null}
     */
    floatingProfitCents() {
      const marketValue = this.currentMarketValueCents;
      const avgCost = this.averageCostCents;
      const held = this.heldGrams;
      if (marketValue === null || avgCost === null || held <= 0) return null;
      return marketValue - avgCost * held;
    },

    /**
     * Total return rate (percentage)
     * @returns {number|null}
     */
    totalReturnRate() {
      const totalInvestment = this.totalInvestmentCents;
      if (totalInvestment === 0) return null;
      const realized = this.realizedProfitCents;
      const floating = this.floatingProfitCents || 0;
      return ((realized + floating) / totalInvestment) * 100;
    }
  },

  actions: {
    /**
     * Load transactions from server
     */
    async loadTransactions() {
      try {
        const res = await fetch(API)
        if (res.ok) {
          this.transactions = await res.json()
        } else {
          this.transactions = []
        }
      } catch {
        this.transactions = []
      }
    },

    /**
     * Save transactions to server
     */
    async saveTransactions() {
      try {
        await fetch(API + '/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.transactions)
        })
      } catch (e) {
        console.error('Failed to save transactions:', e)
      }
    },

    /**
     * Add a buy transaction
     * @param {string} date
     * @param {number} priceCents
     * @param {number} grams
     * @param {number} totalCents
     * @param {string} note
     */
    async addBuyTransaction(date, priceCents, grams, totalCents, note) {
      /** @type {Transaction} */
      const transaction = {
        id: genId(),
        type: 'buy',
        date,
        priceCents,
        grams,
        totalCents,
        note: note || '',
        sellProfitCents: null,
        sellBatchData: null,
        createdAt: new Date().toISOString()
      };
      this.transactions.push(transaction);
      await this.saveTransactions();
    },

    /**
     * Add a sell transaction
     * @param {string} date
     * @param {number} priceCents
     * @param {number} grams
     * @param {number} totalCents
     * @param {string} note
     * @param {SellBatchInfo[]} selectedBatches
     * @returns {boolean} success
     */
    async addSellTransaction(date, priceCents, grams, totalCents, note, selectedBatches) {
      // Validate total grams match
      const batchesTotalGrams = selectedBatches.reduce((sum, b) => sum + b.grams, 0);
      if (Math.abs(batchesTotalGrams - grams) > 0.001) {
        console.error('Sell grams mismatch: batch total', batchesTotalGrams, '≠ sell grams', grams);
        return false;
      }

      // Validate each batch does not exceed held grams
      for (const batch of selectedBatches) {
        const held = this.batchHeldGrams(batch.buyTransactionId);
        if (held < batch.grams - 0.001) {
          console.error(
            `Batch ${batch.buyTransactionId} insufficient: held ${held}, trying to sell ${batch.grams}`
          );
          return false;
        }
      }

      // Calculate profit
      const totalCost = selectedBatches.reduce((sum, b) => sum + b.costCents, 0);
      const profitCents = totalCents - totalCost;

      /** @type {Transaction} */
      const transaction = {
        id: genId(),
        type: 'sell',
        date,
        priceCents,
        grams,
        totalCents,
        note: note || '',
        sellProfitCents: profitCents,
        sellBatchData: JSON.stringify(selectedBatches),
        createdAt: new Date().toISOString()
      };
      this.transactions.push(transaction);
      await this.saveTransactions();
      return true;
    },

    /**
     * Delete a transaction
     * @param {Transaction} transaction
     */
    async deleteTransaction(transaction) {
      const index = this.transactions.findIndex((t) => t.id === transaction.id);
      if (index !== -1) {
        this.transactions.splice(index, 1);
        await this.saveTransactions();
      }
    },

    /**
     * Update a transaction's fields
     * @param {Transaction} transaction
     * @param {string} date
     * @param {number} priceCents
     * @param {number} grams
     * @param {number} totalCents
     * @param {string} note
     */
    async updateTransaction(transaction, date, priceCents, grams, totalCents, note) {
      const found = this.transactions.find((t) => t.id === transaction.id);
      if (found) {
        found.date = date;
        found.priceCents = priceCents;
        found.grams = grams;
        found.totalCents = totalCents;
        found.note = note || '';
        await this.saveTransactions();
      }
    },

    /**
     * Calculate total grams sold for a specific buy transaction
     * @param {string} buyTransactionId
     * @returns {number}
     */
    soldGrams(buyTransactionId) {
      let total = 0;
      const sells = this.transactions.filter((t) => t.type === 'sell');
      for (const sell of sells) {
        if (sell.sellBatchData) {
          try {
            /** @type {SellBatchInfo[]} */
            const batches = JSON.parse(sell.sellBatchData);
            for (const b of batches) {
              if (b.buyTransactionId === buyTransactionId) {
                total += b.grams;
              }
            }
          } catch {
            // Ignore malformed data
          }
        }
      }
      return total;
    },

    /**
     * Calculate remaining held grams for a specific buy transaction
     * @param {string} buyTransactionId
     * @returns {number}
     */
    batchHeldGrams(buyTransactionId) {
      const buy = this.transactions.find(
        (t) => t.id === buyTransactionId && t.type === 'buy'
      );
      if (!buy) return 0;
      const consumed = this.soldGrams(buyTransactionId);
      const held = buy.grams - consumed;
      return held > 0.001 ? held : 0;
    }
  }
});
